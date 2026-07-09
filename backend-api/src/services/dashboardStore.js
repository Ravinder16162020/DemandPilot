import { pool } from "../db/pool.js";

const CACHE_TTL_MS = Number(process.env.DASHBOARD_CACHE_TTL_MS || 30_000);
const dashboardCache = new Map();

function getCached(key) {
  const entry = dashboardCache.get(key);
  if (!entry) return null;

  if (entry.expiresAt < Date.now()) {
    dashboardCache.delete(key);
    return null;
  }

  return entry.value;
}

function setCached(key, value) {
  dashboardCache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export function clearDashboardCache() {
  dashboardCache.clear();
}

async function resolveRunId(runId, datasetId) {
  if (runId) return runId;

  const params = [];
  let whereClause = "WHERE status = 'COMPLETED'";

  if (datasetId) {
    params.push(datasetId);
    whereClause += ` AND dataset_id = $${params.length}`;
  }

  const { rows } = await pool.query(
    `
      SELECT job_id
      FROM pipeline_runs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 1;
    `,
    params
  );

  return rows[0]?.job_id ?? null;
}

export async function getDashboardKpis({ runId, datasetId } = {}) {
  const effectiveRunId = await resolveRunId(runId, datasetId);

  if (!effectiveRunId) {
    return {
      total_skus: 0,
      high_risk_skus: 0,
      projected_stockouts: 0,
      projected_overstocks: 0,
      open_recommendations: 0,
      last_pipeline_at: null,
      run_job_id: null,
      data_source: "postgres",
    };
  }

  const cacheKey = `kpis:${effectiveRunId}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return cached;
  }

  const query = `
    SELECT
      (SELECT COUNT(*)::int FROM products) AS total_skus,
      (
        SELECT COUNT(DISTINCT sku_id)::int
        FROM risk_output
        WHERE run_job_id = $1 AND (stockout_risk >= 0.6 OR priority_score >= 0.6)
      ) AS high_risk_skus,
      (
        SELECT COUNT(*)::int
        FROM risk_output
        WHERE run_job_id = $1 AND stockout_risk >= 0.75
      ) AS projected_stockouts,
      (
        SELECT COUNT(*)::int
        FROM risk_output
        WHERE run_job_id = $1 AND overstock_risk >= 0.7
      ) AS projected_overstocks,
      (
        SELECT COUNT(*)::int
        FROM recommendations
        WHERE run_job_id = $1 AND status = 'OPEN'
      ) AS open_recommendations,
      (
        SELECT created_at
        FROM pipeline_runs
        WHERE job_id = $1
        LIMIT 1
      ) AS last_pipeline_at,
      (
        SELECT COALESCE(raw_result->'forecast_summary'->>'requested_model', forecast_model)
        FROM pipeline_runs
        WHERE job_id = $1
        LIMIT 1
      ) AS requested_model,
      (
        SELECT COALESCE(raw_result->'forecast_summary'->>'forecast_model', forecast_model)
        FROM pipeline_runs
        WHERE job_id = $1
        LIMIT 1
      ) AS forecast_model,
      (
        SELECT COALESCE((raw_result->'forecast_summary'->>'fallback_used')::boolean, FALSE)
        FROM pipeline_runs
        WHERE job_id = $1
        LIMIT 1
      ) AS fallback_used,
      (
        SELECT raw_result->'forecast_summary'->>'fallback_reason'
        FROM pipeline_runs
        WHERE job_id = $1
        LIMIT 1
      ) AS fallback_reason;
  `;

  const { rows } = await pool.query(query, [effectiveRunId]);
  const response = {
    ...rows[0],
    run_job_id: effectiveRunId,
    data_source: "postgres",
  };

  setCached(cacheKey, response);
  return response;
}

export async function getTopRisks(limit = 25, { runId, datasetId } = {}) {
  const effectiveRunId = await resolveRunId(runId, datasetId);
  if (!effectiveRunId) return [];

  const cacheKey = `risks:${effectiveRunId}:${limit}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return cached;
  }

  const { rows } = await pool.query(
    `
      SELECT
        r.run_job_id,
        r.risk_date,
        r.store_id,
        s.name AS store_name,
        r.sku_id,
        p.sku_name,
        r.stockout_risk,
        r.overstock_risk,
        r.anomaly_flag,
        r.priority_score
      FROM risk_output r
      JOIN stores s ON s.store_id = r.store_id
      JOIN products p ON p.sku_id = r.sku_id
      WHERE r.run_job_id = $1
      ORDER BY r.priority_score DESC, r.risk_date DESC
      LIMIT $2;
    `,
    [effectiveRunId, limit]
  );

  setCached(cacheKey, rows);
  return rows;
}

export async function getRecommendations(limit = 25, { runId, datasetId } = {}) {
  const effectiveRunId = await resolveRunId(runId, datasetId);
  if (!effectiveRunId) return [];

  const cacheKey = `recs:${effectiveRunId}:${limit}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return cached;
  }

  const { rows } = await pool.query(
    `
      SELECT
        rec.run_job_id,
        rec.rec_date,
        rec.store_id,
        s.name AS store_name,
        rec.sku_id,
        p.sku_name,
        rec.suggested_order_qty,
        rec.urgency,
        rec.reason_text,
        rec.status,
        rec.created_at
      FROM recommendations rec
      JOIN stores s ON s.store_id = rec.store_id
      JOIN products p ON p.sku_id = rec.sku_id
      WHERE rec.run_job_id = $1
      ORDER BY rec.created_at DESC
      LIMIT $2;
    `,
    [effectiveRunId, limit]
  );

  setCached(cacheKey, rows);
  return rows;
}
