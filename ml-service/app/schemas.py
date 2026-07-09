from pydantic import BaseModel, Field
from typing import Literal


class FullPipelineRequest(BaseModel):
    dataset_id: str = Field(alias="datasetId")
    forecast_days: int = Field(default=28, ge=7, le=60, alias="forecastDays")
    forecast_model: Literal["moving_average", "linear_regression", "xgboost", "prophet"] = Field(
        default="moving_average", alias="forecastModel"
    )


class ForecastSummary(BaseModel):
    forecast_model: str
    horizon_days: int
    projected_units: int
    requested_model: str = "unknown"
    fallback_used: bool = False
    fallback_reason: str | None = None


class AnomalySummary(BaseModel):
    anomaly_count: int
    method: str


class RiskSummary(BaseModel):
    stockout_risk: float
    overstock_risk: float
    priority_score: float


class Recommendation(BaseModel):
    sku_id: str
    store_id: str
    order_qty: int
    urgency: str
    reason: str


class FullPipelineResponse(BaseModel):
    job_id: str
    status: str
    forecast_summary: ForecastSummary
    anomaly_summary: AnomalySummary
    risk_summary: RiskSummary
    recommendations: list[Recommendation]
