from fastapi import FastAPI
import uuid

import pandas as pd

from app.pipeline.anomaly import detect_anomalies
from app.pipeline.feature_engineering import build_features
from app.pipeline.forecasting import forecast_demand
from app.pipeline.recommendation import build_recommendations
from app.pipeline.risk import score_risk
from app.schemas import FullPipelineRequest, FullPipelineResponse
from app.workflow_routes import workflow_router

app = FastAPI(title="DemandPilot ML Service", version="0.1.0")
app.include_router(workflow_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"service": "ml-service", "status": "ok"}


@app.post("/ml/full-pipeline", response_model=FullPipelineResponse)
def full_pipeline(payload: FullPipelineRequest) -> FullPipelineResponse:
    features = build_features(payload.dataset_id)
    forecasts = forecast_demand(features, payload.forecast_days, payload.forecast_model)
    anomalies = detect_anomalies(features)
    risks = score_risk(forecasts, features, anomalies)
    recommendations = build_recommendations(risks)

    run_id = f"run_{payload.dataset_id}_{pd.Timestamp.utcnow().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}"

    return FullPipelineResponse(
        job_id=run_id,
        status="COMPLETED",
        forecast_summary=forecasts,
        anomaly_summary=anomalies,
        risk_summary=risks,
        recommendations=recommendations,
    )
