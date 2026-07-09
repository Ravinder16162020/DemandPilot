const mlBase = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const workflowApiKey = process.env.WORKFLOW_API_KEY || '';
const datasetId = process.env.DATASET_ID || '';
const iterations = Number(process.env.ITERATIONS || 30);

function headers(extra = {}) {
  if (!workflowApiKey) return extra;
  return { ...extra, 'x-api-key': workflowApiKey };
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

async function callOnce() {
  const payload = {
    dataset_id: datasetId || undefined,
    store_id: 'S001',
    sku_id: 'SKU100',
    inventory_on_hand: 82,
    inventory_in_transit: 15,
    units_sold: 28,
    promo_flag: true,
    holiday_flag: false,
    discount_pct: 5,
    price: 35,
    lead_time_days: 4,
    forecast_days: 7,
    forecast_model: 'auto',
  };

  const start = Date.now();
  const response = await fetch(`${mlBase}/ml/realtime/score`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`realtime score failed (${response.status}): ${JSON.stringify(body)}`);
  }
  return Date.now() - start;
}

async function main() {
  const samples = [];
  for (let i = 0; i < iterations; i += 1) {
    const latency = await callOnce();
    samples.push(latency);
  }

  const report = {
    iterations,
    p50_ms: percentile(samples, 50),
    p95_ms: percentile(samples, 95),
    min_ms: Math.min(...samples),
    max_ms: Math.max(...samples),
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error));
  process.exit(1);
});
