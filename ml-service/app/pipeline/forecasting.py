import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

from app.schemas import ForecastSummary


MODEL_FEATURE_COLUMNS = [
    "day_of_week",
    "month",
    "week_of_year",
    "promo_flag",
    "holiday_flag",
    "discount_pct",
    "inventory_level",
    "stock_in_transit",
    "reorder_point",
    "lead_time_days",
    "active_stores",
    "active_skus",
    "avg_unit_price",
    "lag_1",
    "lag_7",
    "lag_14",
    "rolling_7",
    "rolling_28",
]


def _normalize_feature_frame(features: pd.DataFrame) -> pd.DataFrame:
    frame = features.copy()
    if "date" in frame.columns:
        frame["date"] = pd.to_datetime(frame["date"])

    for column in MODEL_FEATURE_COLUMNS:
        if column not in frame.columns:
            frame[column] = 0

    return frame


def _forecast_row_from_history(history: pd.DataFrame, step: int) -> pd.DataFrame:
    last_row = history.iloc[-1].copy()

    if "date" in history.columns:
        next_date = pd.to_datetime(last_row["date"]) + pd.Timedelta(days=step)
        day_of_week = next_date.dayofweek
        month = next_date.month
        week_of_year = int(next_date.isocalendar().week)
    else:
        day_of_week = int(last_row.get("day_of_week", 0))
        month = int(last_row.get("month", 0))
        week_of_year = int(last_row.get("week_of_year", 0))

    return pd.DataFrame(
        [
            {
                "day_of_week": day_of_week,
                "month": month,
                "week_of_year": week_of_year,
                "promo_flag": float(last_row.get("promo_flag", 0)),
                "holiday_flag": float(last_row.get("holiday_flag", 0)),
                "discount_pct": float(last_row.get("discount_pct", 0)),
                "inventory_level": float(last_row.get("inventory_level", 0)),
                "stock_in_transit": float(last_row.get("stock_in_transit", 0)),
                "reorder_point": float(last_row.get("reorder_point", 0)),
                "lead_time_days": float(last_row.get("lead_time_days", 0)),
                "active_stores": float(last_row.get("active_stores", 0)),
                "active_skus": float(last_row.get("active_skus", 0)),
                "avg_unit_price": float(last_row.get("avg_unit_price", 0)),
                "lag_1": float(last_row.get("units_sold", 0)),
                "lag_7": float(history["units_sold"].tail(7).mean()),
                "lag_14": float(history["units_sold"].tail(14).mean()),
                "rolling_7": float(history["units_sold"].tail(7).mean()),
                "rolling_28": float(history["units_sold"].tail(28).mean()),
            }
        ]
    )


def _moving_average_forecast(features: pd.DataFrame, horizon_days: int) -> int:
    recent_mean = float(features["units_sold"].tail(7).mean())
    return int(round(recent_mean * horizon_days))


def _linear_regression_forecast(features: pd.DataFrame, horizon_days: int) -> int:
    train = _normalize_feature_frame(features)
    x = train[MODEL_FEATURE_COLUMNS]
    y = train["units_sold"]

    model = LinearRegression()
    model.fit(x, y)

    preds = []

    for step in range(1, horizon_days + 1):
        row = _forecast_row_from_history(train, step)
        yhat = float(model.predict(row)[0])
        yhat = max(0.0, yhat)
        preds.append(yhat)

        next_row = train.iloc[-1].copy()
        next_row["units_sold"] = yhat
        if "date" in train.columns:
            next_row["date"] = pd.to_datetime(next_row["date"]) + pd.Timedelta(days=1)
        train = pd.concat([train, pd.DataFrame([next_row])], ignore_index=True)

    return int(round(sum(preds)))


def _xgboost_forecast(features: pd.DataFrame, horizon_days: int) -> int:
    from xgboost import XGBRegressor

    train = _normalize_feature_frame(features)
    x = train[MODEL_FEATURE_COLUMNS]
    y = train["units_sold"]

    model = XGBRegressor(
        n_estimators=120,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=42,
    )
    model.fit(x, y)

    preds = []

    for step in range(1, horizon_days + 1):
        row = _forecast_row_from_history(train, step)
        yhat = float(model.predict(row)[0])
        yhat = max(0.0, yhat)
        preds.append(yhat)

        next_row = train.iloc[-1].copy()
        next_row["units_sold"] = yhat
        if "date" in train.columns:
            next_row["date"] = pd.to_datetime(next_row["date"]) + pd.Timedelta(days=1)
        train = pd.concat([train, pd.DataFrame([next_row])], ignore_index=True)

    return int(round(sum(preds)))


def _prophet_forecast(features: pd.DataFrame, horizon_days: int) -> int:
    from prophet import Prophet

    df = features.copy()
    df["ds"] = pd.date_range(end=pd.Timestamp.today().normalize(), periods=len(df), freq="D")
    df["y"] = df["units_sold"].astype(float)

    model = Prophet(
        daily_seasonality=False,
        weekly_seasonality=True,
        yearly_seasonality=False,
    )
    model.fit(df[["ds", "y"]])

    future = model.make_future_dataframe(periods=horizon_days, freq="D")
    forecast = model.predict(future)
    future_slice = forecast.tail(horizon_days)
    projected_units = float(future_slice["yhat"].clip(lower=0).sum())
    return int(round(projected_units))


def forecast_demand(features: pd.DataFrame, horizon_days: int, model_name: str) -> ForecastSummary:
    import logging
    import sys
    
    logger = logging.getLogger(__name__)
    requested_model = model_name
    executed_model = model_name
    fallback_used = False
    fallback_reason = None

    # Prophet is disabled by default on Windows due to cmdstanpy backend issues
    # To enable: pip install cmdstanpy and set ENABLE_PROPHET=true environment variable
    if model_name == "prophet":
        import os
        if os.environ.get("ENABLE_PROPHET", "").lower() != "true":
            fallback_reason = "Prophet disabled by default (cmdstanpy backend not available on Windows). Set ENABLE_PROPHET=true to enable."
            logger.warning(f"[FALLBACK] {fallback_reason}")
            projected_units = _moving_average_forecast(features, horizon_days)
            executed_model = "moving_average"
            fallback_used = True
            return ForecastSummary(
                forecast_model=executed_model,
                horizon_days=horizon_days,
                projected_units=projected_units,
                requested_model=requested_model,
                fallback_used=fallback_used,
                fallback_reason=fallback_reason,
            )

    try:
        if model_name == "linear_regression":
            projected_units = _linear_regression_forecast(features, horizon_days)
        elif model_name == "xgboost":
            projected_units = _xgboost_forecast(features, horizon_days)
        elif model_name == "prophet":
            projected_units = _prophet_forecast(features, horizon_days)
        else:
            projected_units = _moving_average_forecast(features, horizon_days)
            executed_model = "moving_average"
    except ImportError as e:
        fallback_reason = f"ImportError: {str(e)}"
        logger.error(f"[FALLBACK] Model {model_name} import failed: {fallback_reason}")
        print(f"[FALLBACK] Model {model_name} import failed: {fallback_reason}", file=sys.stderr)
        projected_units = _moving_average_forecast(features, horizon_days)
        executed_model = "moving_average"
        fallback_used = True
    except Exception as e:
        fallback_reason = f"{type(e).__name__}: {str(e)[:100]}"
        logger.error(f"[FALLBACK] Model {model_name} execution failed: {fallback_reason}")
        print(f"[FALLBACK] Model {model_name} execution failed: {fallback_reason}", file=sys.stderr)
        projected_units = _moving_average_forecast(features, horizon_days)
        executed_model = "moving_average"
        fallback_used = True

    return ForecastSummary(
        forecast_model=executed_model,
        horizon_days=horizon_days,
        projected_units=projected_units,
        requested_model=requested_model,
        fallback_used=fallback_used,
        fallback_reason=fallback_reason,
    )
