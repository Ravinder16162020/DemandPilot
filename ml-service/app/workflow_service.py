from __future__ import annotations

from datetime import timedelta
from io import StringIO
import json
import os
from pathlib import Path
import time
import uuid

import pandas as pd
import psycopg

from app.pipeline.anomaly import detect_anomalies
from app.pipeline.forecasting import forecast_demand
from app.pipeline.recommendation import build_recommendations
from app.pipeline.risk import score_risk
from app.runtime_store import DatasetRecord, RunRecord, runtime_store


REQUIRED_COLUMNS = {
    "date",
    "store_id",
    "sku_id",
    "units_sold",
    "inventory_on_hand",
}


def _load_database_url() -> str | None:
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return database_url

    env_path = Path(__file__).resolve().parents[2] / "backend-api" / ".env"
    if not env_path.exists():
        return None

    for line in env_path.read_text(encoding="utf-8").splitlines():
        if line.startswith("DATABASE_URL="):
            return line.split("=", 1)[1].strip()

    return None


def _ensure_store_and_product(
    cursor,
    store_id: str,
    sku_id: str,
    region: str,
    category: str,
    price: float,
) -> None:
    cursor.execute(
        """
        INSERT INTO stores (store_id, name, region, city, store_type)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (store_id)
        DO UPDATE SET
          region = EXCLUDED.region;
        """,
        [store_id, f"Store {store_id}", region or "Unknown", "Unknown", "General"],
    )

    cursor.execute(
        """
        INSERT INTO products (sku_id, sku_name, category, brand, unit_price, shelf_life_days)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (sku_id)
        DO UPDATE SET
          category = EXCLUDED.category,
          unit_price = EXCLUDED.unit_price;
        """,
        [sku_id, f"Product {sku_id}", category or "General", "Unknown", max(price, 0.0), None],
    )


def _persist_run_outputs(run: RunRecord, dataset_frame: pd.DataFrame) -> tuple[bool, str | None]:
    database_url = _load_database_url()
    if not database_url:
        return False, "DATABASE_URL not configured"

    if not run.forecasts:
        return False, "No series trained"

    frame = dataset_frame.copy()
    if "date" in frame.columns:
        frame["date"] = pd.to_datetime(frame["date"], errors="coerce")

    risk_by_key = {(item["store_id"], item["sku_id"]): item for item in run.risks}
    rec_by_key = {(item["store_id"], item["sku_id"]): item for item in run.recommendations}

    try:
        with psycopg.connect(database_url) as connection:
            with connection.cursor() as cursor:
                for forecast_item in run.forecasts:
                    store_id = forecast_item["store_id"]
                    sku_id = forecast_item["sku_id"]
                    key = (store_id, sku_id)

                    subset = frame[(frame["store_id"] == store_id) & (frame["sku_id"] == sku_id)]
                    region = str(subset["region"].iloc[-1]) if "region" in subset.columns and not subset.empty else "Unknown"
                    category = str(subset["category"].iloc[-1]) if "category" in subset.columns and not subset.empty else "General"
                    price = float(pd.to_numeric(subset["price"], errors="coerce").fillna(0).iloc[-1]) if "price" in subset.columns and not subset.empty else 0.0

                    _ensure_store_and_product(cursor, store_id, sku_id, region, category, price)

                    forecast_date = pd.to_datetime(forecast_item["forecast_for_date"]).date()
                    cursor.execute(
                        """
                        INSERT INTO forecast_output (run_job_id, forecast_date, store_id, sku_id, forecast_qty, confidence_score, model_name)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (run_job_id, forecast_date, store_id, sku_id)
                        DO UPDATE SET
                          forecast_qty = EXCLUDED.forecast_qty,
                          confidence_score = EXCLUDED.confidence_score,
                          model_name = EXCLUDED.model_name;
                        """,
                        [
                            run.run_id,
                            forecast_date,
                            store_id,
                            sku_id,
                            int(forecast_item["projected_units"]),
                            None,
                            forecast_item["model_name"],
                        ],
                    )

                    risk_item = risk_by_key.get(key)
                    if risk_item:
                        cursor.execute(
                            """
                            INSERT INTO risk_output (run_job_id, risk_date, store_id, sku_id, stockout_risk, overstock_risk, anomaly_flag, priority_score)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                            ON CONFLICT (run_job_id, risk_date, store_id, sku_id)
                            DO UPDATE SET
                              stockout_risk = EXCLUDED.stockout_risk,
                              overstock_risk = EXCLUDED.overstock_risk,
                              anomaly_flag = EXCLUDED.anomaly_flag,
                              priority_score = EXCLUDED.priority_score;
                            """,
                            [
                                run.run_id,
                                forecast_date,
                                store_id,
                                sku_id,
                                float(risk_item["stockout_risk"]),
                                float(risk_item["overstock_risk"]),
                                bool(risk_item.get("anomaly_count", 0) > 0),
                                float(risk_item["priority_score"]),
                            ],
                        )

                    rec_item = rec_by_key.get(key)
                    if rec_item:
                        cursor.execute(
                            """
                            INSERT INTO recommendations (run_job_id, rec_date, store_id, sku_id, suggested_order_qty, urgency, reason_text, status)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, 'OPEN')
                            ON CONFLICT (run_job_id, rec_date, store_id, sku_id)
                            DO UPDATE SET
                              suggested_order_qty = EXCLUDED.suggested_order_qty,
                              urgency = EXCLUDED.urgency,
                              reason_text = EXCLUDED.reason_text;
                            """,
                            [
                                run.run_id,
                                forecast_date,
                                store_id,
                                sku_id,
                                int(rec_item["suggested_order_qty"]),
                                rec_item["urgency"],
                                rec_item["reason"],
                            ],
                        )

                top_risk_item = max(run.risks, key=lambda row: row["priority_score"], default=None)
                top_recommendation = run.recommendations[0] if run.recommendations else None

                cursor.execute(
                    """
                    INSERT INTO pipeline_runs (
                      job_id, dataset_id, forecast_days, status, forecast_model, horizon_days,
                      projected_units, anomaly_count, anomaly_method,
                      stockout_risk, overstock_risk, priority_score,
                      recommendations, raw_result, updated_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s::jsonb, NOW())
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
                    """,
                    [
                        run.run_id,
                        run.dataset_id,
                        run.horizon_days,
                        run.status,
                        run.model_name,
                        run.horizon_days,
                        int(sum(item["projected_units"] for item in run.forecasts)),
                        int(top_risk_item["anomaly_count"]) if top_risk_item else 0,
                        "z_score",
                        float(top_risk_item["stockout_risk"]) if top_risk_item else 0.0,
                        float(top_risk_item["overstock_risk"]) if top_risk_item else 0.0,
                        float(top_risk_item["priority_score"]) if top_risk_item else 0.0,
                        json.dumps([top_recommendation] if top_recommendation else []),
                        json.dumps(
                            {
                                "run_id": run.run_id,
                                "dataset_id": run.dataset_id,
                                "status": run.status,
                                "forecasts": run.forecasts,
                                "risks": run.risks,
                                "recommendations": run.recommendations,
                            }
                        ),
                    ],
                )

            connection.commit()
        return True, None
    except Exception as error:
        return False, str(error)


def _prepare_series_features(df: pd.DataFrame) -> pd.DataFrame:
    frame = df.copy()
    frame["date"] = pd.to_datetime(frame["date"])
    frame = frame.sort_values("date").reset_index(drop=True)

    if "inventory_level" not in frame.columns:
        frame["inventory_level"] = frame.get("inventory_on_hand", 0)
    if "stock_in_transit" not in frame.columns:
        frame["stock_in_transit"] = frame.get("inventory_in_transit", 0)

    for col in ["promo_flag", "holiday_flag", "discount_pct", "lead_time_days"]:
        if col not in frame.columns:
            frame[col] = 0

    frame["reorder_point"] = frame["inventory_level"].rolling(7, min_periods=1).mean() * 0.8
    frame["active_stores"] = 1
    frame["active_skus"] = 1
    frame["avg_unit_price"] = pd.to_numeric(frame.get("price", 0), errors="coerce").fillna(0)

    frame["day_of_week"] = frame["date"].dt.dayofweek
    frame["month"] = frame["date"].dt.month
    frame["week_of_year"] = frame["date"].dt.isocalendar().week.astype(int)

    frame["units_sold"] = pd.to_numeric(frame["units_sold"], errors="coerce").fillna(0)
    frame["lag_1"] = frame["units_sold"].shift(1).bfill()
    frame["lag_7"] = frame["units_sold"].shift(7).bfill()
    frame["lag_14"] = frame["units_sold"].shift(14).bfill()
    frame["rolling_7"] = frame["units_sold"].rolling(7, min_periods=1).mean()
    frame["rolling_28"] = frame["units_sold"].rolling(28, min_periods=1).mean()

    return frame.fillna(0)


def ingest_csv(file_name: str, content: bytes) -> DatasetRecord:
    text = content.decode("utf-8")
    frame = pd.read_csv(StringIO(text))
    columns = {col.strip() for col in frame.columns}

    missing = REQUIRED_COLUMNS - columns
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(sorted(missing))}")

    frame.columns = [col.strip() for col in frame.columns]
    frame["date"] = pd.to_datetime(frame["date"], errors="coerce")
    frame = frame.dropna(subset=["date", "store_id", "sku_id"]) 

    frame = frame.drop_duplicates(subset=["date", "store_id", "sku_id"], keep="last")
    frame["units_sold"] = pd.to_numeric(frame["units_sold"], errors="coerce").fillna(0)
    frame["inventory_on_hand"] = pd.to_numeric(frame["inventory_on_hand"], errors="coerce").fillna(0)

    rows_total = len(frame)
    rows_valid = int((frame["units_sold"] >= 0).sum())
    rows_rejected = max(0, rows_total - rows_valid)

    dataset_id = f"ds_{uuid.uuid4().hex[:10]}"
    record = DatasetRecord(
        dataset_id=dataset_id,
        file_name=file_name,
        status="READY",
        rows_total=rows_total,
        rows_valid=rows_valid,
        rows_rejected=rows_rejected,
        frame=frame,
    )
    runtime_store.save_dataset(record)
    return record


def train_dataset(dataset_id: str, horizon_days: int, model_name: str) -> RunRecord:
    dataset = runtime_store.get_dataset(dataset_id)
    if dataset is None or dataset.frame is None:
        raise ValueError("dataset not found")

    run_id = f"run_{dataset_id}_{pd.Timestamp.utcnow().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}"

    run = RunRecord(
        run_id=run_id,
        dataset_id=dataset_id,
        horizon_days=horizon_days,
        model_name=model_name,
        status="STARTED",
    )

    for (store_id, sku_id), group in dataset.frame.groupby(["store_id", "sku_id"]):
        if len(group) < 7:
            continue

        features = _prepare_series_features(group)
        forecast = forecast_demand(features, horizon_days, model_name)
        anomalies = detect_anomalies(features)
        risk = score_risk(forecast, features, anomalies)

        available_stock = float(features["inventory_level"].iloc[-1] + features["stock_in_transit"].iloc[-1])
        avg_daily = max(1.0, forecast.projected_units / horizon_days)
        coverage_ratio = round(available_stock / avg_daily, 3)

        recs = build_recommendations(risk)
        rec = recs[0]

        run.forecasts.append(
            {
                "run_id": run.run_id,
                "store_id": store_id,
                "sku_id": sku_id,
                "model_name": forecast.forecast_model,
                "horizon_days": horizon_days,
                "projected_units": int(forecast.projected_units),
                "forecast_for_date": (features["date"].max() + timedelta(days=horizon_days)).date().isoformat(),
            }
        )

        risk_score = round(float(risk.priority_score) * 100.0, 2)
        risk_level = "HIGH" if risk_score >= 70 else "MEDIUM" if risk_score >= 40 else "LOW"

        run.risks.append(
            {
                "run_id": run.run_id,
                "store_id": store_id,
                "sku_id": sku_id,
                "risk_score": risk_score,
                "risk_level": risk_level,
                "coverage_ratio": coverage_ratio,
                "stockout_risk": float(risk.stockout_risk),
                "overstock_risk": float(risk.overstock_risk),
                "priority_score": float(risk.priority_score),
                "anomaly_count": int(anomalies.anomaly_count),
            }
        )

        run.recommendations.append(
            {
                "run_id": run.run_id,
                "store_id": store_id,
                "sku_id": sku_id,
                "suggested_order_qty": int(rec.order_qty),
                "urgency": rec.urgency,
                "reason": rec.reason,
            }
        )

    run.status = "COMPLETED"
    persisted, persistence_error = _persist_run_outputs(run, dataset.frame)
    run.persisted = persisted
    run.persistence_error = persistence_error
    runtime_store.save_run(run)
    return run


def get_dashboard_summary() -> dict[str, int | str | None]:
    latest = runtime_store.latest_run()
    if latest is None:
        return {
            "run_id": None,
            "datasets_loaded": len(runtime_store.datasets),
            "total_series_scored": 0,
            "high_risk_series": 0,
            "open_recommendations": 0,
        }

    high_risk = sum(1 for item in latest.risks if item["risk_level"] == "HIGH")

    return {
        "run_id": latest.run_id,
        "datasets_loaded": len(runtime_store.datasets),
        "total_series_scored": len(latest.risks),
        "high_risk_series": high_risk,
        "open_recommendations": len(latest.recommendations),
    }


def build_explanation(payload: dict[str, float | str | int]) -> dict[str, str]:
    risk_score = float(payload["risk_score"])
    available_stock = float(payload["available_stock"])
    forecast_units = float(payload["forecast_units"])

    if risk_score >= 70:
        severity_text = "high"
        action = "Reorder immediately and monitor sell-through daily until coverage stabilizes."
    elif risk_score >= 40:
        severity_text = "moderate"
        action = "Review replenishment within 24 hours and verify inbound shipment timing."
    else:
        severity_text = "low"
        action = "No urgent action needed; continue routine monitoring."

    summary = (
        f"{payload['sku_id']} at {payload['store_id']} is at {severity_text} risk. "
        f"Forecast demand for the next {payload['forecast_next_days']} days is {forecast_units:.0f} units "
        f"against available stock of {available_stock:.0f} units."
    )

    impact = (
        "Acting on this recommendation can reduce avoidable stockouts and protect short-term sales "
        "during demand volatility."
    )

    return {"summary": summary, "action": action, "business_impact": impact}


def _to_bool(value: object) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in {"1", "true", "yes", "y"}


def _auto_choose_model(history_rows: int, promo_ratio: float) -> str:
    if history_rows < 14:
        return "moving_average"
    if promo_ratio > 0.2:
        return "xgboost"
    if history_rows >= 45:
        return "prophet"
    return "linear_regression"


def get_realtime_readiness() -> dict[str, str | int | None]:
    latest_dataset = runtime_store.latest_dataset()
    if latest_dataset is None:
        return {
            "status": "NOT_READY",
            "datasets_loaded": 0,
            "latest_dataset_id": None,
        }

    return {
        "status": "READY",
        "datasets_loaded": len(runtime_store.datasets),
        "latest_dataset_id": latest_dataset.dataset_id,
    }


def realtime_score(payload: dict[str, object]) -> dict[str, object]:
    start = time.perf_counter()

    requested_dataset_id = payload.get("dataset_id")
    if requested_dataset_id:
        dataset = runtime_store.get_dataset(str(requested_dataset_id))
    else:
        dataset = runtime_store.latest_dataset()

    if dataset is None or dataset.frame is None or dataset.frame.empty:
        raise ValueError("no dataset loaded for realtime scoring")

    latest_dataset_run = runtime_store.latest_run_for_dataset(dataset.dataset_id)
    data_source = "postgres" if latest_dataset_run and latest_dataset_run.persisted else "memory_fallback"

    store_id = str(payload["store_id"])
    sku_id = str(payload["sku_id"])

    history = dataset.frame[(dataset.frame["store_id"] == store_id) & (dataset.frame["sku_id"] == sku_id)].copy()
    if history.empty:
        raise ValueError("no historical series found for the given store_id and sku_id")

    if payload.get("date"):
        current_date = pd.to_datetime(payload["date"], errors="coerce", utc=True)
        if not pd.isna(current_date):
            current_date = current_date.tz_localize(None)
    else:
        current_date = pd.Timestamp.now().normalize()

    if pd.isna(current_date):
        raise ValueError("invalid date format")

    realtime_row = {
        "date": current_date,
        "store_id": store_id,
        "sku_id": sku_id,
        "units_sold": float(payload.get("units_sold", 0) or 0),
        "inventory_on_hand": float(payload.get("inventory_on_hand", 0) or 0),
        "inventory_in_transit": float(payload.get("inventory_in_transit", 0) or 0),
        "promo_flag": _to_bool(payload.get("promo_flag", False)),
        "holiday_flag": _to_bool(payload.get("holiday_flag", False)),
        "discount_pct": float(payload.get("discount_pct", 0) or 0),
        "price": float(payload.get("price", 0) or 0),
        "lead_time_days": int(payload.get("lead_time_days", 3) or 3),
    }

    combined = pd.concat([history, pd.DataFrame([realtime_row])], ignore_index=True)
    combined = combined.drop_duplicates(subset=["date", "store_id", "sku_id"], keep="last")
    features = _prepare_series_features(combined)

    requested_model = str(payload.get("forecast_model", "auto"))
    if requested_model == "auto":
        promo_ratio = float(features["promo_flag"].astype(float).mean()) if "promo_flag" in features else 0.0
        model_name = _auto_choose_model(len(features), promo_ratio)
    else:
        model_name = requested_model

    forecast_days = int(payload.get("forecast_days", 7) or 7)
    forecast = forecast_demand(features, forecast_days, model_name)
    anomalies = detect_anomalies(features)
    risk = score_risk(forecast, features, anomalies)
    recommendation = build_recommendations(risk)[0]

    latency_ms = int((time.perf_counter() - start) * 1000)

    return {
        "dataset_id": dataset.dataset_id,
        "store_id": store_id,
        "sku_id": sku_id,
        "forecast_model": forecast.forecast_model,
        "forecast_days": forecast_days,
        "projected_units": int(forecast.projected_units),
        "stockout_risk": float(risk.stockout_risk),
        "overstock_risk": float(risk.overstock_risk),
        "priority_score": float(risk.priority_score),
        "suggested_order_qty": int(recommendation.order_qty),
        "urgency": recommendation.urgency,
        "reason": recommendation.reason,
        "latency_ms": latency_ms,
        "data_source": data_source,
    }
