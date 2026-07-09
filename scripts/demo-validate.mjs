import fs from 'node:fs/promises';

const backendBase = process.env.BACKEND_API_URL || 'http://localhost:4000';
const mlBase = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const workflowApiKey = process.env.WORKFLOW_API_KEY || '';

function authHeaders(extra = {}) {
  if (!workflowApiKey) return extra;
  return { ...extra, 'x-api-key': workflowApiKey };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${url} failed (${response.status}): ${JSON.stringify(body)}`);
  }
  return body;
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

async function main() {
  console.log('[demo-validate] checking health endpoints...');
  await fetchJson(`${backendBase}/api/health`);
  await fetchJson(`${mlBase}/health`);

  console.log('[demo-validate] uploading curated sample dataset...');
  const csv = await fs.readFile('ml-service/data/sample_retail.csv');
  const form = new FormData();
  form.append('file', new Blob([csv], { type: 'text/csv' }), 'sample_retail.csv');

  const uploadResponse = await fetchJson(`${mlBase}/datasets/upload`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });

  console.log('[demo-validate] training models...');
  const trainResponse = await fetchJson(
    `${mlBase}/ml/train/${encodeURIComponent(uploadResponse.dataset_id)}?horizon_days=7&model_name=xgboost`,
    { method: 'POST', headers: authHeaders() }
  );

  if (!trainResponse.persisted) {
    throw new Error(
      `Training completed but persistence failed. data_source=${trainResponse.data_source} error=${trainResponse.persistence_error || 'unknown'}`
    );
  }

  console.log('[demo-validate] realtime score check...');
  const scorePayload = {
    dataset_id: uploadResponse.dataset_id,
    store_id: 'S001',
    sku_id: 'SKU100',
    inventory_on_hand: 79,
    inventory_in_transit: 18,
    units_sold: 30,
    promo_flag: true,
    holiday_flag: false,
    discount_pct: 7,
    price: 35,
    lead_time_days: 4,
    forecast_days: 7,
    forecast_model: 'auto',
  };

  const scoreDurations = [];
  for (let i = 0; i < 6; i += 1) {
    const start = Date.now();
    await fetchJson(`${mlBase}/ml/realtime/score`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(scorePayload),
    });
    scoreDurations.push(Date.now() - start);
  }

  console.log('[demo-validate] backend latest run and dashboard checks...');
  const persistedRun = await fetchJson(`${backendBase}/api/pipeline/runs/${encodeURIComponent(trainResponse.run_id)}`, {
    headers: authHeaders(),
  });

  let latestRun = { job_id: trainResponse.run_id };
  try {
    latestRun = await fetchJson(`${backendBase}/api/pipeline/latest-run?datasetId=${encodeURIComponent(uploadResponse.dataset_id)}`, {
      headers: authHeaders(),
    });
  } catch {
    latestRun = { job_id: trainResponse.run_id };
  }

  await fetchJson(`${backendBase}/api/dashboard/kpis?runId=${encodeURIComponent(latestRun.job_id)}`);
  await fetchJson(`${backendBase}/api/dashboard/risks/top?limit=5&runId=${encodeURIComponent(latestRun.job_id)}`);
  await fetchJson(`${backendBase}/api/dashboard/recommendations?limit=5&runId=${encodeURIComponent(latestRun.job_id)}`);

  const summary = {
    dataset_id: uploadResponse.dataset_id,
    trained_series: trainResponse.series_trained,
    persisted: trainResponse.persisted,
    persistence_error: trainResponse.persistence_error,
    persisted_run_lookup: persistedRun.job_id,
    latest_run: latestRun.job_id,
    realtime_latency_ms: {
      p50: percentile(scoreDurations, 50),
      p95: percentile(scoreDurations, 95),
      samples: scoreDurations,
    },
  };

  console.log('[demo-validate] success');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error('[demo-validate] failed');
  console.error(error?.stack || error?.message || String(error));
  process.exit(1);
});
