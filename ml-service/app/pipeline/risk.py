from app.schemas import AnomalySummary, ForecastSummary, RiskSummary


def score_risk(
    forecasts: ForecastSummary,
    features,
    anomalies: AnomalySummary,
) -> RiskSummary:
    current_stock = float(features["inventory_level"].iloc[-1])
    daily_demand = max(forecasts.projected_units / forecasts.horizon_days, 1.0)
    projected_coverage_days = current_stock / daily_demand

    stockout_risk = min(1.0, max(0.0, (14.0 - projected_coverage_days) / 14.0))
    overstock_risk = min(1.0, max(0.0, (projected_coverage_days - 35.0) / 35.0))
    anomaly_factor = min(1.0, anomalies.anomaly_count / 5.0)

    priority = (0.5 * stockout_risk) + (0.3 * anomaly_factor) + (0.2 * (1.0 - overstock_risk))

    return RiskSummary(
        stockout_risk=round(stockout_risk, 3),
        overstock_risk=round(overstock_risk, 3),
        priority_score=round(priority, 3),
    )
