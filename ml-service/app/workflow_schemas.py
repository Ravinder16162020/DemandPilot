from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class DatasetUploadResponse(BaseModel):
    dataset_id: str
    file_name: str
    status: str
    rows_total: int
    rows_valid: int
    rows_rejected: int


class DatasetStatusResponse(BaseModel):
    dataset_id: str
    status: str
    rows_total: int
    rows_valid: int
    rows_rejected: int
    created_at: datetime


class TrainResponse(BaseModel):
    run_id: str
    dataset_id: str
    horizon_days: int
    model_name: str
    status: str
    series_trained: int
    persisted: bool = False
    persistence_error: str | None = None
    data_source: str = "memory_fallback"


class ForecastItem(BaseModel):
    run_id: str
    store_id: str
    sku_id: str
    model_name: str
    horizon_days: int
    projected_units: int


class RiskItem(BaseModel):
    run_id: str
    store_id: str
    sku_id: str
    risk_score: float
    risk_level: Literal["LOW", "MEDIUM", "HIGH"]
    coverage_ratio: float


class RecommendationItem(BaseModel):
    run_id: str
    store_id: str
    sku_id: str
    suggested_order_qty: int
    urgency: str
    reason: str


class DashboardSummary(BaseModel):
    run_id: str | None
    datasets_loaded: int
    total_series_scored: int
    high_risk_series: int
    open_recommendations: int


class CopilotExplainRequest(BaseModel):
    sku_id: str
    store_id: str
    forecast_next_days: int = Field(default=7, ge=1, le=60)
    forecast_units: float = Field(ge=0)
    available_stock: float = Field(ge=0)
    lead_time_days: int = Field(default=3, ge=0, le=120)
    risk_score: float = Field(ge=0, le=100)
    anomaly_note: str = "none"
    recommended_reorder_qty: float = Field(default=0, ge=0)


class CopilotExplainResponse(BaseModel):
    summary: str
    action: str
    business_impact: str


class RealtimeScoreRequest(BaseModel):
    dataset_id: str | None = None
    date: str | None = None
    store_id: str
    sku_id: str
    units_sold: float = Field(default=0, ge=0)
    inventory_on_hand: float = Field(ge=0)
    inventory_in_transit: float = Field(default=0, ge=0)
    promo_flag: bool = False
    holiday_flag: bool = False
    discount_pct: float = Field(default=0, ge=0)
    price: float = Field(default=0, ge=0)
    lead_time_days: int = Field(default=3, ge=0, le=120)
    forecast_days: int = Field(default=7, ge=1, le=60)
    forecast_model: Literal["auto", "moving_average", "linear_regression", "xgboost", "prophet"] = "auto"


class RealtimeScoreResponse(BaseModel):
    dataset_id: str
    store_id: str
    sku_id: str
    forecast_model: str
    forecast_days: int
    projected_units: int
    stockout_risk: float
    overstock_risk: float
    priority_score: float
    suggested_order_qty: int
    urgency: str
    reason: str
    latency_ms: int
    data_source: str


class RealtimeReadinessResponse(BaseModel):
    status: str
    datasets_loaded: int
    latest_dataset_id: str | None
