const backendBaseUrl = process.env.BACKEND_API_URL || 'http://localhost:4000';
const endpoint = `${backendBaseUrl}/api/pipeline/run`;

const models = ['moving_average', 'linear_regression', 'xgboost', 'prophet'];
const strictProphet = process.env.STRICT_PROPHET === 'true';
const requirePersistence = process.env.REQUIRE_PERSISTENCE !== 'false';

function pretty(obj) {
  return JSON.stringify(obj, null, 2);
}

async function runModelTest(model) {
  const payload = {
    datasetId: 'ds_model_test',
    forecastDays: 14,
    forecastModel: model,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));
  const summary = body?.forecast_summary || {};

  const baseChecks = {
    http202: response.status === 202,
    projectedUnitsNumber: Number.isFinite(summary?.projected_units),
    persisted: requirePersistence ? body?.persisted === true : true,
    noPersistenceError: requirePersistence ? body?.persistenceError == null : true,
  };

  let modelCheck;
  let note = '';

  if (model === 'prophet') {
    modelCheck = strictProphet
      ? summary?.forecast_model === 'prophet'
      : ['prophet', 'moving_average'].includes(summary?.forecast_model);
    if (summary?.forecast_model === 'moving_average') {
      note = 'Prophet fallback detected (moving_average returned).';
    }
  } else {
    modelCheck = summary?.forecast_model === model;
  }

  const pass = Object.values(baseChecks).every(Boolean) && modelCheck;

  return {
    requested: model,
    status: response.status,
    returnedModel: summary?.forecast_model,
    projectedUnits: summary?.projected_units,
    persisted: body?.persisted,
    persistenceError: body?.persistenceError,
    pass,
    note,
    checks: {
      ...baseChecks,
      modelRouting: modelCheck,
    },
  };
}

async function main() {
  console.log(`Testing ML model routing against: ${endpoint}`);
  console.log(`strictProphet=${strictProphet} requirePersistence=${requirePersistence}`);
  console.log('');

  const results = [];

  for (const model of models) {
    try {
      const result = await runModelTest(model);
      results.push(result);
      const marker = result.pass ? 'PASS' : 'FAIL';
      console.log(`[${marker}] ${model} -> returned=${result.returnedModel}, units=${result.projectedUnits}`);
      if (result.note) {
        console.log(`      Note: ${result.note}`);
      }
    } catch (error) {
      results.push({
        requested: model,
        pass: false,
        error: error?.message || String(error),
      });
      console.log(`[FAIL] ${model} -> ${error?.message || error}`);
    }
  }

  console.log('\nDetailed Results:');
  console.log(pretty(results));

  const failed = results.filter((r) => !r.pass);

  if (failed.length > 0) {
    console.error(`\n${failed.length} model test(s) failed.`);
    process.exit(1);
  }

  console.log('\nAll model tests passed.');
}

main().catch((error) => {
  console.error('Unexpected error while running model tests:', error);
  process.exit(1);
});
