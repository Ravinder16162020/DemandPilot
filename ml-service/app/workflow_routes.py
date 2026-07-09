from __future__ import annotations

import os

from fastapi import APIRouter, Depends, File, Header, HTTPException, Query, UploadFile

from app.runtime_store import runtime_store
from app.workflow_schemas import (
    CopilotExplainRequest,
    CopilotExplainResponse,
    DashboardSummary,
    DatasetStatusResponse,
    DatasetUploadResponse,
    ForecastItem,
    RealtimeReadinessResponse,
    RealtimeScoreRequest,
    RealtimeScoreResponse,
    RecommendationItem,
    RiskItem,
    TrainResponse,
)
from app.workflow_service import (
    build_explanation,
    get_dashboard_summary,
    get_realtime_readiness,
    ingest_csv,
    realtime_score,
    train_dataset,
)


workflow_router = APIRouter(prefix="", tags=["workflow"])


def _require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    expected_key = os.getenv("WORKFLOW_API_KEY")
    if not expected_key:
        return

    if x_api_key != expected_key:
        raise HTTPException(status_code=401, detail="unauthorized")


@workflow_router.post("/datasets/upload", response_model=DatasetUploadResponse)
async def upload_dataset(file: UploadFile = File(...)) -> DatasetUploadResponse:
    try:
        content = await file.read()
        record = ingest_csv(file.filename or "dataset.csv", content)
        return DatasetUploadResponse(
            dataset_id=record.dataset_id,
            file_name=record.file_name,
            status=record.status,
            rows_total=record.rows_total,
            rows_valid=record.rows_valid,
            rows_rejected=record.rows_rejected,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@workflow_router.get("/datasets/{dataset_id}/status", response_model=DatasetStatusResponse)
def dataset_status(dataset_id: str) -> DatasetStatusResponse:
    record = runtime_store.get_dataset(dataset_id)
    if record is None:
        raise HTTPException(status_code=404, detail="dataset not found")

    return DatasetStatusResponse(
        dataset_id=record.dataset_id,
        status=record.status,
        rows_total=record.rows_total,
        rows_valid=record.rows_valid,
        rows_rejected=record.rows_rejected,
        created_at=record.created_at,
    )


@workflow_router.post("/ml/train/{dataset_id}", response_model=TrainResponse)
def train_models(
    dataset_id: str,
    horizon_days: int = Query(default=7, ge=1, le=60),
    model_name: str = Query(default="xgboost"),
    _auth: None = Depends(_require_api_key),
) -> TrainResponse:
    try:
        run = train_dataset(dataset_id, horizon_days, model_name)
        return TrainResponse(
            run_id=run.run_id,
            dataset_id=run.dataset_id,
            horizon_days=run.horizon_days,
            model_name=run.model_name,
            status=run.status,
            series_trained=len(run.forecasts),
            persisted=run.persisted,
            persistence_error=run.persistence_error,
            data_source="postgres" if run.persisted else "memory_fallback",
        )
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@workflow_router.get("/forecasts", response_model=list[ForecastItem])
def list_forecasts(
    store_id: str | None = None,
    sku_id: str | None = None,
) -> list[ForecastItem]:
    latest = runtime_store.latest_run()
    if latest is None:
        return []

    items = latest.forecasts
    if store_id:
        items = [item for item in items if item["store_id"] == store_id]
    if sku_id:
        items = [item for item in items if item["sku_id"] == sku_id]

    return [ForecastItem(**item) for item in items]


@workflow_router.get("/risks/high", response_model=list[RiskItem])
def list_high_risks(limit: int = Query(default=20, ge=1, le=200)) -> list[RiskItem]:
    latest = runtime_store.latest_run()
    if latest is None:
        return []

    items = [item for item in latest.risks if item["risk_level"] == "HIGH"]
    items = sorted(items, key=lambda item: item["risk_score"], reverse=True)[:limit]
    return [RiskItem(**item) for item in items]


@workflow_router.get("/recommendations", response_model=list[RecommendationItem])
def list_recommendations(store_id: str | None = None) -> list[RecommendationItem]:
    latest = runtime_store.latest_run()
    if latest is None:
        return []

    items = latest.recommendations
    if store_id:
        items = [item for item in items if item["store_id"] == store_id]

    return [RecommendationItem(**item) for item in items]


@workflow_router.get("/dashboard/summary", response_model=DashboardSummary)
def dashboard_summary() -> DashboardSummary:
    return DashboardSummary(**get_dashboard_summary())


@workflow_router.post("/copilot/explain", response_model=CopilotExplainResponse)
def copilot_explain(payload: CopilotExplainRequest, _auth: None = Depends(_require_api_key)) -> CopilotExplainResponse:
    return CopilotExplainResponse(**build_explanation(payload.model_dump()))


@workflow_router.get("/ml/realtime/readiness", response_model=RealtimeReadinessResponse)
def realtime_readiness() -> RealtimeReadinessResponse:
    return RealtimeReadinessResponse(**get_realtime_readiness())


@workflow_router.post("/ml/realtime/score", response_model=RealtimeScoreResponse)
def realtime_score_route(payload: RealtimeScoreRequest, _auth: None = Depends(_require_api_key)) -> RealtimeScoreResponse:
    try:
        result = realtime_score(payload.model_dump())
        return RealtimeScoreResponse(**result)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
