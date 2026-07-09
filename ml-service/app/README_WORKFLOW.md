# DemandPilot ML Workflow API (Starter)

This starter adds a hackathon-friendly workflow layer on top of the existing pipeline:

- `POST /datasets/upload`
- `GET /datasets/{dataset_id}/status`
- `POST /ml/train/{dataset_id}`
- `GET /forecasts`
- `GET /risks/high`
- `GET /recommendations`
- `GET /dashboard/summary`
- `POST /copilot/explain`
- `GET /ml/realtime/readiness`
- `POST /ml/realtime/score`

## Notes

- Uses in-memory runtime store for fast serving and also attempts PostgreSQL persistence on each training run.
- Existing `/ml/full-pipeline` endpoint remains unchanged.
- Upload requires CSV with columns:
  - `date`, `store_id`, `sku_id`, `units_sold`, `inventory_on_hand`
- `POST /ml/train/{dataset_id}` includes `persisted` and `persistence_error` fields in response.
- `POST /ml/train/{dataset_id}` and `POST /ml/realtime/score` include `data_source` (`postgres` or `memory_fallback`).
- Set `WORKFLOW_API_KEY` to protect sensitive endpoints (`/ml/train/*`, `/ml/realtime/score`, `/copilot/explain`).

## Model Status & Fallback Behavior

All models now explicitly report fallback behavior:

| Model | Status | Notes |
|-------|--------|-------|
| moving_average | ✅ Stable | Always works; used as demo baseline |
| linear_regression | ✅ Stable | Best accuracy on small datasets |
| xgboost | ✅ Stable | Requires larger historical data |
| prophet | ⚠️ Disabled by default | CmdStan backend issue on Windows |

**Explicit Fallback Metadata:**
Each forecast response now includes:
- `requested_model`: the model originally requested
- `forecast_model`: the model actually used (executed model)
- `fallback_used`: boolean flag
- `fallback_reason`: human-readable error message if fallback occurred

Example fallback response:
```json
{
  "forecast_model": "moving_average",
  "horizon_days": 28,
  "projected_units": 750,
  "requested_model": "prophet",
  "fallback_used": true,
  "fallback_reason": "Prophet disabled by default (cmdstanpy backend not available on Windows)"
}
```

### Prophet on Windows (Advanced)

Prophet requires CmdStan to be compiled. On Windows, this requires additional setup:

```powershell
# Install cmdstanpy explicitly
pip install cmdstanpy==1.2.4

# Let cmdstanpy auto-download and build CmdStan (may take 5-10 minutes first run)
python -c "from cmdstanpy import cmdstan_model; cmdstan_model.CmdStanModel" # Build on demand

# Or use Docker/WSL for a cleaner environment
```

If Prophet setup succeeds, enable it:
```powershell
$env:ENABLE_PROPHET="true"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend Demo Visibility

For demo clarity and trust, the frontend provenance panel now shows:
- `requested_model`
- `forecast_model` (actual executed model)
- `fallback_used`
- `fallback_reason`

If a fallback happens, the UI shows a non-alarming badge:
- `Fallback applied`
- `Requested Prophet, executed Moving Average`

Model availability in the Forecasts UI marks Prophet as:
- Experimental on Windows
- Disabled by default unless `ENABLE_PROPHET=true`

## Best plan for realtime ML

Build in this order to make realtime work reliably in a hackathon:

1. Load one valid dataset using `/datasets/upload`.
2. Train baseline run using `/ml/train/{dataset_id}`.
3. Verify dashboard endpoints (`/dashboard/summary`, `/risks/high`).
4. Check realtime readiness via `/ml/realtime/readiness`.
5. Call `/ml/realtime/score` from UI interactions (SKU, store, stock changes).
6. Use `/copilot/explain` to convert the score into business action text.

### Realtime behavior

- Realtime scoring uses the latest historical series for the requested `sku_id + store_id`.
- It appends incoming current-state payload, generates features, and runs forecast + anomaly + risk + recommendation in one request.
- If `forecast_model` is `auto`, the service picks a model using simple routing rules:
  - short history -> `moving_average`
  - high promo ratio -> `xgboost`
  - long history with stability -> `prophet` (if enabled) or `linear_regression` (fallback)
  - default -> `linear_regression`

### Sample realtime score payload

```json
{
  "store_id": "S001",
  "sku_id": "SKU100",
  "inventory_on_hand": 120,
  "inventory_in_transit": 25,
  "units_sold": 31,
  "promo_flag": true,
  "holiday_flag": false,
  "discount_pct": 10,
  "price": 34,
  "lead_time_days": 4,
  "forecast_days": 7,
  "forecast_model": "auto"
}
```

### Expected realtime response

- projected demand
- risk scores (stockout and overstock)
- priority score
- suggested reorder quantity and urgency
- latency in milliseconds
- fallback metadata (if applicable)

## Quick smoke test

Run this from `ml-service`:

```powershell
.\.venv\Scripts\python.exe scripts\realtime_smoke.py
```

Expected result:

- dataset is ingested
- training run completes
- DB persistence status is reported
- realtime score returns forecast, risk, recommendation, and latency

### Prophet Smoke Test

To diagnose Prophet initialization:

```powershell
.\.venv\Scripts\python.exe scripts\prophet_smoke_test.py
```

Exit codes:
- 0 = Prophet works
- 1 = Prophet import failed
- 2 = Prophet initialization failed (needs cmdstanpy setup)
- 3 = Fitting failed
- 4 = Forecasting failed

## Suggested next step

Persist workflow outputs to PostgreSQL tables once the demo flow is stable.
