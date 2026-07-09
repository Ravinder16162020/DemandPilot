import { pool } from "../db/pool.js";

const SUPPORTED_PROMPTS = [
  "Explain this recommendation",
  "Show highest stockout risk items",
  "Compare with previous run",
  "Why is this urgent?",
  "What should I do next?"
];

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseProvenance(run) {
  const forecastSummary = run?.raw_result?.forecast_summary || {};
  const requestedModel = forecastSummary.requested_model || run?.forecast_model || null;
  const executedModel = forecastSummary.forecast_model || run?.forecast_model || null;
  const fallbackUsed = Boolean(forecastSummary.fallback_used);
  const fallbackReason = forecastSummary.fallback_reason || null;

  return {
    run_id: run?.job_id || null,
    requested_model: requestedModel,
    executed_model: executedModel,
    forecast_model: executedModel,
    fallback_used: fallbackUsed,
    fallback_reason: fallbackReason
  };
}

function detectIntent(question) {
  const text = normalizeText(question);

  if (!text) return "unsupported";
  if (text.includes("which model") || text.includes("actually ran") || text.includes("executed model")) return "model";
  if (text.includes("compare") || text.includes("previous run") || text.includes("what changed") || text.includes("changed")) return "changed";
  if (text.includes("highest stockout") || text.includes("top risk") || text.includes("stockout risk")) return "risk_top";
  if (text.includes("explain this recommendation") || text.includes("explain recommendation")) return "explain_recommendation";
  if (text.includes("why") || text.includes("urgent")) return "why";
  if (text.includes("what should i do") || text.includes("do next") || text.includes("next action") || text === "next") return "next";
  if (text.includes("what is happening") || text.includes("happening") || text.includes("status") || text.includes("overview")) return "happening";

  return "unsupported";
}

function buildWhereClause({ runId, filters }) {
  const clauses = ["run_job_id = $1"];
  const params = [runId];

  const storeId = filters?.store_id || filters?.storeId;
  const skuId = filters?.sku_id || filters?.skuId;
  const region = filters?.region;
  const category = filters?.category;

  if (storeId) {
    params.push(storeId);
    clauses.push(`base.store_id = $${params.length}`);
  }

  if (skuId) {
    params.push(skuId);
    clauses.push(`base.sku_id = $${params.length}`);
  }

  if (region) {
    params.push(region);
    clauses.push(`s.region = $${params.length}`);
  }

  if (category) {
    params.push(category);
    clauses.push(`p.category = $${params.length}`);
  }

  return {
    where: clauses.join(" AND "),
    params
  };
}

async function getCurrentRun({ runId, datasetId }) {
  const params = [];
  let whereClause = "WHERE status = 'COMPLETED'";

  if (runId) {
    params.push(runId);
    whereClause += ` AND job_id = $${params.length}`;
  }

  if (!runId && datasetId) {
    params.push(datasetId);
    whereClause += ` AND dataset_id = $${params.length}`;
  }

  const { rows } = await pool.query(
    `
      SELECT
        job_id,
        dataset_id,
        status,
        forecast_model,
        horizon_days,
        projected_units,
        anomaly_count,
        stockout_risk,
        overstock_risk,
        priority_score,
        recommendations,
        raw_result,
        created_at
      FROM pipeline_runs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 1;
    `,
    params
  );

  return rows[0] || null;
}

async function getPreviousRun(currentRun) {
  if (!currentRun?.dataset_id || !currentRun?.created_at) {
    return null;
  }

  const { rows } = await pool.query(
    `
      SELECT
        job_id,
        dataset_id,
        status,
        forecast_model,
        horizon_days,
        projected_units,
        anomaly_count,
        stockout_risk,
        overstock_risk,
        priority_score,
        recommendations,
        raw_result,
        created_at
      FROM pipeline_runs
      WHERE dataset_id = $1
        AND status = 'COMPLETED'
        AND created_at < $2
      ORDER BY created_at DESC
      LIMIT 1;
    `,
    [currentRun.dataset_id, currentRun.created_at]
  );

  return rows[0] || null;
}

async function getTopRisks(runId, filters) {
  const built = buildWhereClause({ runId, filters });
  const { rows } = await pool.query(
    `
      SELECT
        base.run_job_id,
        base.store_id,
        base.sku_id,
        base.stockout_risk,
        base.overstock_risk,
        base.priority_score,
        s.name AS store_name,
        s.region,
        p.sku_name,
        p.category
      FROM risk_output base
      JOIN stores s ON s.store_id = base.store_id
      JOIN products p ON p.sku_id = base.sku_id
      WHERE ${built.where}
      ORDER BY base.stockout_risk DESC, base.priority_score DESC
      LIMIT 5;
    `,
    built.params
  );

  return rows;
}

async function getTopRecommendations(runId, filters) {
  const built = buildWhereClause({ runId, filters });
  const { rows } = await pool.query(
    `
      SELECT
        base.run_job_id,
        base.store_id,
        base.sku_id,
        base.suggested_order_qty,
        base.urgency,
        base.reason_text,
        base.status,
        s.name AS store_name,
        s.region,
        p.sku_name,
        p.category
      FROM recommendations base
      JOIN stores s ON s.store_id = base.store_id
      JOIN products p ON p.sku_id = base.sku_id
      WHERE ${built.where}
      ORDER BY base.created_at DESC
      LIMIT 5;
    `,
    built.params
  );

  return rows;
}

async function getForecastSummary(runId, filters) {
  const built = buildWhereClause({ runId, filters });
  const { rows } = await pool.query(
    `
      SELECT
        COUNT(*)::int AS forecast_points,
        COALESCE(SUM(base.forecast_qty), 0)::int AS total_forecast_qty,
        ROUND(AVG(base.confidence_score)::numeric, 3) AS avg_confidence_score
      FROM forecast_output base
      JOIN stores s ON s.store_id = base.store_id
      JOIN products p ON p.sku_id = base.sku_id
      WHERE ${built.where};
    `,
    built.params
  );

  return rows[0] || { forecast_points: 0, total_forecast_qty: 0, avg_confidence_score: null };
}

function getRealtimeSummary(run) {
  const raw = run?.raw_result || {};
  const realtimeData = raw.realtime_scoring || raw.realtime_score || raw.realtime || null;

  if (!realtimeData) {
    return {
      available: false,
      note: "Realtime scoring results are not persisted for this run."
    };
  }

  return {
    available: true,
    data: realtimeData
  };
}

function buildFollowups({ hasPreviousRun, hasRisks, hasRecommendations }) {
  const followups = [];

  if (hasRecommendations) followups.push("Explain this recommendation");
  if (hasRisks) followups.push("Show highest stockout risk items");
  if (hasPreviousRun) followups.push("Compare with previous run");

  followups.push("Why is this urgent?");
  followups.push("What should I do next?");

  return Array.from(new Set(followups)).slice(0, 5);
}

function appendFallbackNote(answer, provenance) {
  if (!provenance.fallback_used) {
    return answer;
  }

  const reason = provenance.fallback_reason ? ` Reason: ${provenance.fallback_reason}.` : "";
  return `${answer} Fallback was used (requested ${provenance.requested_model || "unknown"}, executed ${provenance.executed_model || "unknown"}).${reason}`;
}

function toFixedMaybe(value, digits = 3) {
  const num = toNumber(value);
  return num === null ? "N/A" : num.toFixed(digits);
}

function filterBySelectedContext(items, selectedContext) {
  if (!selectedContext || typeof selectedContext !== "object") {
    return items;
  }

  const storeId = selectedContext.store_id || selectedContext.storeId;
  const skuId = selectedContext.sku_id || selectedContext.skuId;

  if (!storeId && !skuId) {
    return items;
  }

  const filtered = items.filter((item) => {
    const storeMatch = storeId ? item.store_id === storeId : true;
    const skuMatch = skuId ? item.sku_id === skuId : true;
    return storeMatch && skuMatch;
  });

  return filtered.length > 0 ? filtered : items;
}

export async function answerGroundedCopilot({ question, route, filters, datasetId, runId, selectedContext, visibleContext }) {
  const intent = detectIntent(question);

  if (intent === "unsupported") {
    return {
      answer: "I can only answer grounded DemandPilot questions about current run status, causes, next actions, run-to-run changes, model execution, risk ranking, and recommendation explanations.",
      evidence: [
        {
          source: "capability_guardrail",
          detail: "Unsupported question outside grounded copilot scope"
        }
      ],
      provenance: {
        run_id: runId || null,
        requested_model: null,
        executed_model: null,
        forecast_model: null,
        fallback_used: false,
        fallback_reason: null
      },
      suggested_followups: SUPPORTED_PROMPTS,
      refusal: true,
      source_context: {
        route: route || null,
        filters: filters || {},
        selected_context: selectedContext || null,
        visible_context: visibleContext || null
      }
    };
  }

  const currentRun = await getCurrentRun({ runId, datasetId });

  if (!currentRun) {
    return {
      answer: "No live pipeline data is available for this page context yet. Run the pipeline and refresh this view before asking grounded questions.",
      evidence: [
        {
          source: "pipeline_runs",
          detail: "No completed persisted run found for requested context"
        }
      ],
      provenance: {
        run_id: null,
        requested_model: null,
        executed_model: null,
        forecast_model: null,
        fallback_used: false,
        fallback_reason: null
      },
      suggested_followups: ["Show highest stockout risk items", "What should I do next?"],
      refusal: false,
      source_context: {
        route: route || null,
        filters: filters || {},
        selected_context: selectedContext || null,
        visible_context: visibleContext || null
      }
    };
  }

  const [previousRun, topRisksRaw, topRecommendationsRaw, forecastSummary] = await Promise.all([
    getPreviousRun(currentRun),
    getTopRisks(currentRun.job_id, filters),
    getTopRecommendations(currentRun.job_id, filters),
    getForecastSummary(currentRun.job_id, filters)
  ]);

  const topRisks = filterBySelectedContext(topRisksRaw, selectedContext);
  const topRecommendations = filterBySelectedContext(topRecommendationsRaw, selectedContext);
  const realtimeSummary = getRealtimeSummary(currentRun);
  const provenance = parseProvenance(currentRun);

  const evidence = [
    {
      source: "pipeline_runs",
      run_id: currentRun.job_id,
      dataset_id: currentRun.dataset_id,
      created_at: currentRun.created_at
    },
    {
      source: "forecast_output",
      forecast_points: forecastSummary.forecast_points,
      total_forecast_qty: forecastSummary.total_forecast_qty,
      avg_confidence_score: forecastSummary.avg_confidence_score
    },
    {
      source: "risk_output",
      top_items: topRisks.slice(0, 3)
    },
    {
      source: "recommendations",
      top_items: topRecommendations.slice(0, 3)
    },
    {
      source: "realtime_scoring",
      available: realtimeSummary.available,
      detail: realtimeSummary.available ? realtimeSummary.data : realtimeSummary.note
    }
  ];

  let answer = "";

  if (intent === "happening") {
    const topRisk = topRisks[0];
    answer = `Run ${currentRun.job_id} is active for this view with ${forecastSummary.forecast_points} forecast points and ${topRecommendations.length} visible recommendations. Highest stockout risk is ${topRisk ? `${topRisk.sku_id} at ${toFixedMaybe(topRisk.stockout_risk)}` : "not available in current filters"}.`;
  }

  if (intent === "why") {
    const topRecommendation = topRecommendations[0];
    const topRisk = topRisks[0];

    if (topRecommendation) {
      answer = `This is urgent because ${topRecommendation.sku_id} in ${topRecommendation.store_name} is flagged ${topRecommendation.urgency} and the recommendation reason is: ${topRecommendation.reason_text}`;
    } else if (topRisk) {
      answer = `Urgency is driven by risk signals: ${topRisk.sku_id} has stockout risk ${toFixedMaybe(topRisk.stockout_risk)} and priority score ${toFixedMaybe(topRisk.priority_score)}.`;
    } else {
      answer = "I cannot explain urgency for the current filters because no risk or recommendation rows are available.";
    }
  }

  if (intent === "next") {
    if (topRecommendations.length === 0) {
      answer = "No open recommendation rows are available in the current view, so I cannot propose a grounded next action.";
    } else {
      const actions = topRecommendations.slice(0, 2).map((row) => `${row.sku_id} (${row.store_id}): order ${row.suggested_order_qty}, urgency ${row.urgency}`);
      answer = `Next grounded actions: ${actions.join("; ")}. Prioritize HIGH urgency items first.`;
    }
  }

  if (intent === "changed") {
    if (!previousRun) {
      answer = "Comparison with previous run is unavailable because there is no earlier completed run for this dataset.";
    } else {
      const projectedDiff = (toNumber(currentRun.projected_units) || 0) - (toNumber(previousRun.projected_units) || 0);
      const stockoutDiff = (toNumber(currentRun.stockout_risk) || 0) - (toNumber(previousRun.stockout_risk) || 0);
      const priorityDiff = (toNumber(currentRun.priority_score) || 0) - (toNumber(previousRun.priority_score) || 0);
      answer = `Compared with run ${previousRun.job_id}, projected units changed by ${projectedDiff}, stockout risk changed by ${stockoutDiff.toFixed(3)}, and priority score changed by ${priorityDiff.toFixed(3)}.`;
    }
  }

  if (intent === "model") {
    answer = `The executed model for run ${currentRun.job_id} was ${provenance.executed_model || "unknown"}. Requested model was ${provenance.requested_model || "unknown"}. Fallback used: ${provenance.fallback_used ? "yes" : "no"}${provenance.fallback_reason ? ` (${provenance.fallback_reason})` : ""}.`;
  }

  if (intent === "risk_top") {
    if (topRisks.length === 0) {
      answer = "No risk rows are available for current filters, so I cannot rank stockout risk items.";
    } else {
      const ranked = topRisks.slice(0, 3).map((row) => `${row.sku_id} (${row.store_id}) ${toFixedMaybe(row.stockout_risk)}`);
      answer = `Highest stockout risk items in current context: ${ranked.join(", ")}.`;
    }
  }

  if (intent === "explain_recommendation") {
    const topRecommendation = topRecommendations[0];

    if (!topRecommendation) {
      answer = "No recommendation record is visible for this context, so there is nothing to explain from persisted outputs.";
    } else {
      answer = `Recommendation ${topRecommendation.sku_id}/${topRecommendation.store_id}: order ${topRecommendation.suggested_order_qty} units. Urgency is ${topRecommendation.urgency}. Reason from persisted output: ${topRecommendation.reason_text}`;
    }
  }

  answer = appendFallbackNote(answer, provenance);

  if (!realtimeSummary.available) {
    answer += " Realtime scoring context is unavailable for this run.";
  }

  return {
    answer,
    evidence,
    provenance,
    suggested_followups: buildFollowups({
      hasPreviousRun: Boolean(previousRun),
      hasRisks: topRisks.length > 0,
      hasRecommendations: topRecommendations.length > 0
    }),
    refusal: false,
    source_context: {
      route: route || null,
      filters: filters || {},
      selected_context: selectedContext || null,
      visible_context: visibleContext || null
    }
  };
}
