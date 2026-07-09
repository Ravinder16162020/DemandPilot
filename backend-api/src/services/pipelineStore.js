import { pool } from "../db/pool.js";

const LATEST_RUN_CACHE_TTL_MS = Number(process.env.LATEST_RUN_CACHE_TTL_MS || 10_000);
const latestRunCache = new Map();

function getLatestRunCacheKey(datasetId) {
  return datasetId ? `dataset:${datasetId}` : "global";
}

function getCachedLatestRun(cacheKey) {
  const entry = latestRunCache.get(cacheKey);
  if (!entry) return null;

  if (entry.expiresAt < Date.now()) {
    latestRunCache.delete(cacheKey);
    return null;
  }

  return entry.value;
}

function setCachedLatestRun(cacheKey, value) {
  latestRunCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + LATEST_RUN_CACHE_TTL_MS,
  });
}

export function clearLatestRunCache(datasetId) {
  if (datasetId) {
    latestRunCache.delete(getLatestRunCacheKey(datasetId));
  }

  latestRunCache.delete(getLatestRunCacheKey());
}

export async function savePipelineRun({ datasetId, forecastDays, result }) {
  const query = `
    INSERT INTO pipeline_runs (
      job_id,
      dataset_id,
      forecast_days,
      status,
      forecast_model,
      horizon_days,
      projected_units,
      anomaly_count,
      anomaly_method,
      stockout_risk,
      overstock_risk,
      priority_score,
      recommendations,
      raw_result,
      updated_at
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14::jsonb, NOW()
    )
    ON CONFLICT (job_id)
    DO UPDATE SET
      dataset_id = EXCLUDED.dataset_id,
      forecast_days = EXCLUDED.forecast_days,
      status = EXCLUDED.status,
      forecast_model = EXCLUDED.forecast_model,
      horizon_days = EXCLUDED.horizon_days,
      projected_units = EXCLUDED.projected_units,
      anomaly_count = EXCLUDED.anomaly_count,
      anomaly_method = EXCLUDED.anomaly_method,
      stockout_risk = EXCLUDED.stockout_risk,
      overstock_risk = EXCLUDED.overstock_risk,
      priority_score = EXCLUDED.priority_score,
      recommendations = EXCLUDED.recommendations,
      raw_result = EXCLUDED.raw_result,
      updated_at = NOW();
  `;

  const values = [
    result.job_id,
    datasetId,
    forecastDays,
    result.status,
    result.forecast_summary?.forecast_model ?? null,
    result.forecast_summary?.horizon_days ?? null,
    result.forecast_summary?.projected_units ?? null,
    result.anomaly_summary?.anomaly_count ?? null,
    result.anomaly_summary?.method ?? null,
    result.risk_summary?.stockout_risk ?? null,
    result.risk_summary?.overstock_risk ?? null,
    result.risk_summary?.priority_score ?? null,
    JSON.stringify(result.recommendations ?? []),
    JSON.stringify(result)
  ];

  await pool.query(query, values);
}

export async function getPipelineRun(jobId) {
  const { rows } = await pool.query(
    `
      SELECT
        job_id,
        dataset_id,
        forecast_days,
        status,
        forecast_model,
        horizon_days,
        projected_units,
        anomaly_count,
        anomaly_method,
        stockout_risk,
        overstock_risk,
        priority_score,
        recommendations,
        raw_result,
        created_at,
        updated_at
      FROM pipeline_runs
      WHERE job_id = $1
      LIMIT 1;
    `,
    [jobId]
  );

  return rows[0] ?? null;
}

export async function getLatestPipelineRun(datasetId) {
  const cacheKey = getLatestRunCacheKey(datasetId);
  const cached = getCachedLatestRun(cacheKey);
  if (cached) {
    return cached;
  }

  const params = [];
  let whereClause = "";

  if (datasetId) {
    params.push(datasetId);
    whereClause = `WHERE dataset_id = $${params.length}`;
  }

  const { rows } = await pool.query(
    `
      SELECT
        job_id,
        dataset_id,
        forecast_days,
        status,
        forecast_model,
        horizon_days,
        projected_units,
        anomaly_count,
        anomaly_method,
        stockout_risk,
        overstock_risk,
        priority_score,
        recommendations,
        raw_result,
        created_at,
        updated_at
      FROM pipeline_runs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 1;
    `,
    params
  );

  const result = rows[0] ?? null;
  setCachedLatestRun(cacheKey, result);
  return result;
}
