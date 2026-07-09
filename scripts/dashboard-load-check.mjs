const apiBase = process.env.API_BASE_URL || 'http://localhost:4000/api';
const workflowApiKey = process.env.WORKFLOW_API_KEY || '';
const iterations = Number(process.env.ITERATIONS || 25);
const runId = process.env.RUN_ID || '';
const datasetId = process.env.DATASET_ID || '';

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

function buildQuery(extra = {}) {
  const params = new URLSearchParams();
  if (runId) params.set('runId', runId);
  if (datasetId) params.set('datasetId', datasetId);

  Object.entries(extra).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : '';
}

async function callEndpoint(path) {
  const start = Date.now();
  const response = await fetch(`${apiBase}${path}`, {
    headers: headers(),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${path} failed (${response.status}): ${JSON.stringify(body)}`);
  }

  return Date.now() - start;
}

async function main() {
  const metrics = {
    kpis: [],
    risks: [],
    recommendations: [],
    total: [],
  };

  for (let i = 0; i < iterations; i += 1) {
    const iterStart = Date.now();
    metrics.kpis.push(await callEndpoint(`/dashboard/kpis${buildQuery()}`));
    metrics.risks.push(await callEndpoint(`/dashboard/risks/top${buildQuery({ limit: 25 })}`));
    metrics.recommendations.push(await callEndpoint(`/dashboard/recommendations${buildQuery({ limit: 25 })}`));
    metrics.total.push(Date.now() - iterStart);
  }

  const report = {
    iterations,
    endpoints: {
      kpis: {
        p50_ms: percentile(metrics.kpis, 50),
        p95_ms: percentile(metrics.kpis, 95),
        min_ms: Math.min(...metrics.kpis),
        max_ms: Math.max(...metrics.kpis),
      },
      risks: {
        p50_ms: percentile(metrics.risks, 50),
        p95_ms: percentile(metrics.risks, 95),
        min_ms: Math.min(...metrics.risks),
        max_ms: Math.max(...metrics.risks),
      },
      recommendations: {
        p50_ms: percentile(metrics.recommendations, 50),
        p95_ms: percentile(metrics.recommendations, 95),
        min_ms: Math.min(...metrics.recommendations),
        max_ms: Math.max(...metrics.recommendations),
      },
    },
    combined_iteration: {
      p50_ms: percentile(metrics.total, 50),
      p95_ms: percentile(metrics.total, 95),
      min_ms: Math.min(...metrics.total),
      max_ms: Math.max(...metrics.total),
    },
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error));
  process.exit(1);
});
