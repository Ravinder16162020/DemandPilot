CREATE TABLE IF NOT EXISTS stores (
  store_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  city TEXT NOT NULL,
  store_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  sku_id TEXT PRIMARY KEY,
  sku_name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  shelf_life_days INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_daily (
  sale_id BIGSERIAL PRIMARY KEY,
  sale_date DATE NOT NULL,
  store_id TEXT NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
  sku_id TEXT NOT NULL REFERENCES products(sku_id) ON DELETE CASCADE,
  units_sold INTEGER NOT NULL CHECK (units_sold >= 0),
  revenue NUMERIC(14, 2) NOT NULL CHECK (revenue >= 0),
  promo_flag BOOLEAN NOT NULL DEFAULT FALSE,
  discount_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
  holiday_flag BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sale_date, store_id, sku_id)
);

CREATE TABLE IF NOT EXISTS inventory_daily (
  snapshot_id BIGSERIAL PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  store_id TEXT NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
  sku_id TEXT NOT NULL REFERENCES products(sku_id) ON DELETE CASCADE,
  stock_on_hand INTEGER NOT NULL CHECK (stock_on_hand >= 0),
  stock_in_transit INTEGER NOT NULL DEFAULT 0 CHECK (stock_in_transit >= 0),
  reorder_point INTEGER NOT NULL DEFAULT 0 CHECK (reorder_point >= 0),
  lead_time_days INTEGER NOT NULL DEFAULT 3 CHECK (lead_time_days >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (snapshot_date, store_id, sku_id)
);

CREATE TABLE IF NOT EXISTS forecast_output (
  id BIGSERIAL PRIMARY KEY,
  run_job_id TEXT NOT NULL,
  forecast_date DATE NOT NULL,
  store_id TEXT NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
  sku_id TEXT NOT NULL REFERENCES products(sku_id) ON DELETE CASCADE,
  forecast_qty INTEGER NOT NULL CHECK (forecast_qty >= 0),
  confidence_score NUMERIC(5, 3),
  model_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (run_job_id, forecast_date, store_id, sku_id)
);

CREATE TABLE IF NOT EXISTS risk_output (
  id BIGSERIAL PRIMARY KEY,
  run_job_id TEXT NOT NULL,
  risk_date DATE NOT NULL,
  store_id TEXT NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
  sku_id TEXT NOT NULL REFERENCES products(sku_id) ON DELETE CASCADE,
  stockout_risk NUMERIC(6, 3) NOT NULL,
  overstock_risk NUMERIC(6, 3) NOT NULL,
  anomaly_flag BOOLEAN NOT NULL DEFAULT FALSE,
  priority_score NUMERIC(6, 3) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (run_job_id, risk_date, store_id, sku_id)
);

CREATE TABLE IF NOT EXISTS recommendations (
  id BIGSERIAL PRIMARY KEY,
  run_job_id TEXT NOT NULL,
  rec_date DATE NOT NULL,
  store_id TEXT NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
  sku_id TEXT NOT NULL REFERENCES products(sku_id) ON DELETE CASCADE,
  suggested_order_qty INTEGER NOT NULL CHECK (suggested_order_qty >= 0),
  urgency TEXT NOT NULL,
  reason_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (run_job_id, rec_date, store_id, sku_id)
);

CREATE TABLE IF NOT EXISTS pipeline_runs (
  id BIGSERIAL PRIMARY KEY,
  job_id TEXT NOT NULL UNIQUE,
  dataset_id TEXT NOT NULL,
  forecast_days INTEGER NOT NULL,
  status TEXT NOT NULL,
  forecast_model TEXT,
  horizon_days INTEGER,
  projected_units INTEGER,
  anomaly_count INTEGER,
  anomaly_method TEXT,
  stockout_risk NUMERIC(6, 3),
  overstock_risk NUMERIC(6, 3),
  priority_score NUMERIC(6, 3),
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_daily_store_sku_date ON sales_daily(store_id, sku_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_daily_store_sku_date ON inventory_daily(store_id, sku_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_forecast_output_run_job_id ON forecast_output(run_job_id);
CREATE INDEX IF NOT EXISTS idx_risk_output_run_job_id ON risk_output(run_job_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_run_job_id ON recommendations(run_job_id);

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_dataset_id ON pipeline_runs(dataset_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_created_at ON pipeline_runs(created_at DESC);
