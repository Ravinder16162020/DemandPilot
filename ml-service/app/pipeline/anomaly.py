import pandas as pd

from app.schemas import AnomalySummary


def detect_anomalies(features: pd.DataFrame) -> AnomalySummary:
    series = features["units_sold"]
    mean = float(series.mean())
    std = float(series.std()) or 1.0

    z_scores = (series - mean) / std
    anomaly_count = int((z_scores.abs() > 2.5).sum())

    return AnomalySummary(anomaly_count=anomaly_count, method="z_score")
