from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.pipeline.feature_engineering import build_features
from app.pipeline.forecasting import forecast_demand


MODELS = ["moving_average", "linear_regression", "xgboost", "prophet"]


def compute_metrics(errors: list[float], actuals: list[float]) -> dict[str, float]:
    if not errors:
        return {"mae": 0.0, "rmse": 0.0, "mape": 0.0, "bias": 0.0, "samples": 0}

    abs_errors = [abs(error) for error in errors]
    squared_errors = [error * error for error in errors]
    ape_values = [abs(error) / actual if actual > 0 else 0.0 for error, actual in zip(errors, actuals)]

    return {
        "mae": round(sum(abs_errors) / len(abs_errors), 3),
        "rmse": round(math.sqrt(sum(squared_errors) / len(squared_errors)), 3),
        "mape": round((sum(ape_values) / len(ape_values)) * 100.0, 3),
        "bias": round(sum(errors) / len(errors), 3),
        "samples": len(errors),
    }


def evaluate_model(features, model_name: str, max_splits: int) -> dict[str, object]:
    errors: list[float] = []
    actuals: list[float] = []
    predictions: list[dict[str, float]] = []

    split_points = list(range(len(features) - max_splits, len(features)))
    split_points = [index for index in split_points if index > 0]

    for split_index in split_points:
        train_frame = features.iloc[:split_index].copy()
        actual_value = float(features.iloc[split_index]["units_sold"])

        forecast = forecast_demand(train_frame, 1, model_name)
        predicted_value = float(forecast.projected_units)

        error = predicted_value - actual_value
        errors.append(error)
        actuals.append(actual_value)
        predictions.append(
            {
                "split_index": split_index,
                "actual": round(actual_value, 3),
                "predicted": round(predicted_value, 3),
                "error": round(error, 3),
                "forecast_model": forecast.forecast_model,
            }
        )

    metrics = compute_metrics(errors, actuals)
    return {
        "model": model_name,
        "metrics": metrics,
        "evaluations": predictions,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate DemandPilot forecasting models against historical data.")
    parser.add_argument("--dataset-id", default="ds_model_test", help="Dataset identifier to evaluate")
    parser.add_argument(
        "--max-splits",
        type=int,
        default=5,
        help="Maximum number of rolling historical splits to evaluate per model",
    )
    parser.add_argument("--json", action="store_true", help="Print JSON instead of a human-readable table")
    parser.add_argument("--out", default="", help="Optional JSON output file path")
    args = parser.parse_args()

    features = build_features(args.dataset_id)
    if len(features) < 2:
        print("Not enough historical rows to evaluate models.")
        return 1

    max_splits = max(1, min(args.max_splits, len(features) - 1))
    results = [evaluate_model(features, model_name, max_splits) for model_name in MODELS]

    if args.out:
        output_path = Path(args.out)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(results, indent=2), encoding="utf-8")

    if args.json:
        print(json.dumps(results, indent=2))
    else:
        print(f"Historical evaluation for dataset: {args.dataset_id}")
        print(f"Rows available: {len(features)}")
        print(f"Rolling splits used: {max_splits}")
        print("")

        for result in results:
            metrics = result["metrics"]
            print(
                f"{result['model']}: MAE={metrics['mae']} RMSE={metrics['rmse']} "
                f"MAPE={metrics['mape']}% Bias={metrics['bias']} Samples={metrics['samples']}"
            )

        winner = min(results, key=lambda item: item["metrics"]["mae"])
        print("")
        print(f"Best model by MAE: {winner['model']}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())