from __future__ import annotations

from pathlib import Path
import os
from typing import Any

import numpy as np
import pandas as pd
import psycopg


def _load_database_url() -> str | None:
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return database_url

    env_path = Path(__file__).resolve().parents[3] / "backend-api" / ".env"
    if not env_path.exists():
        return None

    for line in env_path.read_text(encoding="utf-8").splitlines():
        if line.startswith("DATABASE_URL="):
            return line.split("=", 1)[1].strip()

    return None


def _build_synthetic_features(dataset_id: str) -> pd.DataFrame:
    seed = abs(hash(dataset_id)) % 1000
    rng = np.random.default_rng(seed)

    df = pd.DataFrame(
        {
            "date": pd.date_range(end=pd.Timestamp.today().normalize(), periods=30, freq="D"),
            "store_id": ["S001"] * 30,
            "sku_id": ["SKU100"] * 30,
            "units_sold": rng.integers(18, 35, size=30),
            "inventory_level": rng.integers(90, 210, size=30),
            "promo_flag": rng.integers(0, 2, size=30),
            "holiday_flag": rng.integers(0, 2, size=30),
            "discount_pct": rng.uniform(0, 20, size=30),
            "stock_in_transit": rng.integers(0, 25, size=30),
            "reorder_point": rng.integers(40, 100, size=30),
            "lead_time_days": rng.integers(2, 8, size=30),
            "active_stores": rng.integers(1, 5, size=30),
            "active_skus": rng.integers(1, 8, size=30),
            "avg_unit_price": rng.uniform(10, 120, size=30),
        }
    )

    return _finalize_feature_frame(df)


def _load_real_feature_rows() -> list[dict[str, Any]]:
    database_url = _load_database_url()
    if not database_url:
        return []

    query = """
        SELECT
            s.sale_date AS date,
            SUM(s.units_sold)::int AS units_sold,
            COALESCE(SUM(i.stock_on_hand), 0)::int AS inventory_level,
            COALESCE(AVG(CASE WHEN s.promo_flag THEN 1 ELSE 0 END), 0)::float AS promo_flag,
            COALESCE(AVG(CASE WHEN s.holiday_flag THEN 1 ELSE 0 END), 0)::float AS holiday_flag,
            COALESCE(AVG(s.discount_pct), 0)::float AS discount_pct,
            COALESCE(SUM(i.stock_in_transit), 0)::int AS stock_in_transit,
            COALESCE(AVG(i.reorder_point), 0)::float AS reorder_point,
            COALESCE(AVG(i.lead_time_days), 0)::float AS lead_time_days,
            COUNT(DISTINCT s.store_id)::int AS active_stores,
            COUNT(DISTINCT s.sku_id)::int AS active_skus,
            COALESCE(AVG(p.unit_price), 0)::float AS avg_unit_price
        FROM sales_daily s
        LEFT JOIN inventory_daily i
            ON i.snapshot_date = s.sale_date
           AND i.store_id = s.store_id
           AND i.sku_id = s.sku_id
        LEFT JOIN products p
            ON p.sku_id = s.sku_id
        GROUP BY s.sale_date
        ORDER BY s.sale_date
    """

    try:
        with psycopg.connect(database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute(query)
                columns = [desc[0] for desc in cursor.description or []]
                return [dict(zip(columns, row)) for row in cursor.fetchall()]
    except Exception:
        return []


def _finalize_feature_frame(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    frame = df.copy()
    frame["date"] = pd.to_datetime(frame["date"])
    frame = frame.sort_values("date").reset_index(drop=True)

    numeric_columns = [
        "units_sold",
        "inventory_level",
        "promo_flag",
        "holiday_flag",
        "discount_pct",
        "stock_in_transit",
        "reorder_point",
        "lead_time_days",
        "active_stores",
        "active_skus",
        "avg_unit_price",
    ]
    for column in numeric_columns:
        if column in frame.columns:
            frame[column] = pd.to_numeric(frame[column], errors="coerce").fillna(0)

    frame["day_of_week"] = frame["date"].dt.dayofweek
    frame["month"] = frame["date"].dt.month
    frame["week_of_year"] = frame["date"].dt.isocalendar().week.astype(int)
    frame["lag_1"] = frame["units_sold"].shift(1).bfill()
    frame["lag_7"] = frame["units_sold"].shift(7).bfill()
    frame["lag_14"] = frame["units_sold"].shift(14).bfill()
    frame["rolling_7"] = frame["units_sold"].rolling(window=7, min_periods=1).mean()
    frame["rolling_28"] = frame["units_sold"].rolling(window=28, min_periods=1).mean()

    frame = frame.fillna(0)

    return frame


def build_features(dataset_id: str) -> pd.DataFrame:
    real_rows = _load_real_feature_rows()
    if real_rows:
        real_frame = pd.DataFrame(real_rows)
        if not real_frame.empty:
            return _finalize_feature_frame(real_frame)

    return _build_synthetic_features(dataset_id)
