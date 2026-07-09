INSERT INTO stores (store_id, name, region, city, store_type)
VALUES
  ('S001', 'Downtown Central', 'South', 'Bengaluru', 'Metro'),
  ('S002', 'Lakeside Retail', 'South', 'Mysuru', 'Urban')
ON CONFLICT (store_id) DO NOTHING;

INSERT INTO products (sku_id, sku_name, category, brand, unit_price, shelf_life_days)
VALUES
  ('SKU100', 'Spark Cola 500ml', 'Beverages', 'Spark', 35.00, 270),
  ('SKU101', 'Crunch Chips 100g', 'Snacks', 'CrunchCo', 20.00, 180)
ON CONFLICT (sku_id) DO NOTHING;

INSERT INTO sales_daily (
  sale_date,
  store_id,
  sku_id,
  units_sold,
  revenue,
  promo_flag,
  discount_pct,
  holiday_flag
)
VALUES
  ('2026-04-17', 'S001', 'SKU100', 24, 840.00, TRUE, 5.00, FALSE),
  ('2026-04-18', 'S001', 'SKU100', 27, 945.00, TRUE, 5.00, FALSE),
  ('2026-04-19', 'S001', 'SKU101', 18, 360.00, FALSE, 0.00, FALSE),
  ('2026-04-19', 'S002', 'SKU100', 19, 665.00, FALSE, 0.00, FALSE)
ON CONFLICT (sale_date, store_id, sku_id) DO NOTHING;

INSERT INTO inventory_daily (
  snapshot_date,
  store_id,
  sku_id,
  stock_on_hand,
  stock_in_transit,
  reorder_point,
  lead_time_days
)
VALUES
  ('2026-04-19', 'S001', 'SKU100', 110, 30, 90, 4),
  ('2026-04-19', 'S001', 'SKU101', 70, 0, 60, 3),
  ('2026-04-19', 'S002', 'SKU100', 95, 20, 80, 4)
ON CONFLICT (snapshot_date, store_id, sku_id) DO NOTHING;

INSERT INTO forecast_output (
  run_job_id,
  forecast_date,
  store_id,
  sku_id,
  forecast_qty,
  confidence_score,
  model_name
)
VALUES
  ('job_seed_001', '2026-04-20', 'S001', 'SKU100', 25, 0.910, 'moving_average'),
  ('job_seed_001', '2026-04-20', 'S001', 'SKU101', 17, 0.890, 'moving_average')
ON CONFLICT (run_job_id, forecast_date, store_id, sku_id) DO NOTHING;

INSERT INTO risk_output (
  run_job_id,
  risk_date,
  store_id,
  sku_id,
  stockout_risk,
  overstock_risk,
  anomaly_flag,
  priority_score
)
VALUES
  ('job_seed_001', '2026-04-20', 'S001', 'SKU100', 0.680, 0.120, TRUE, 0.620),
  ('job_seed_001', '2026-04-20', 'S001', 'SKU101', 0.310, 0.180, FALSE, 0.340)
ON CONFLICT (run_job_id, risk_date, store_id, sku_id) DO NOTHING;

INSERT INTO recommendations (
  run_job_id,
  rec_date,
  store_id,
  sku_id,
  suggested_order_qty,
  urgency,
  reason_text,
  status
)
VALUES
  (
    'job_seed_001',
    '2026-04-20',
    'S001',
    'SKU100',
    110,
    'HIGH',
    'Promotion uplift expected and current stock is near lead-time demand.',
    'OPEN'
  )
ON CONFLICT (run_job_id, rec_date, store_id, sku_id) DO NOTHING;

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
  raw_result
)
VALUES (
  'job_seed_001',
  'ds_seed_001',
  28,
  'COMPLETED',
  'moving_average',
  28,
  700,
  1,
  'z_score',
  0.680,
  0.120,
  0.620,
  '[{"sku_id":"SKU100","store_id":"S001","order_qty":110,"urgency":"HIGH","reason":"Seeded recommendation for demo"}]'::jsonb,
  '{"status":"COMPLETED","seeded":true}'::jsonb
)
ON CONFLICT (job_id) DO NOTHING;
