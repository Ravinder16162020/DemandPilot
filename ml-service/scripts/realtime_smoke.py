from __future__ import annotations

import json
from pathlib import Path

from app.workflow_service import ingest_csv, realtime_score, train_dataset


def main() -> None:
    sample_path = Path(__file__).resolve().parents[1] / "data" / "sample_retail.csv"
    content = sample_path.read_bytes()

    dataset = ingest_csv(sample_path.name, content)
    run = train_dataset(dataset.dataset_id, horizon_days=7, model_name="xgboost")

    score = realtime_score(
        {
            "dataset_id": dataset.dataset_id,
            "store_id": "S001",
            "sku_id": "SKU100",
            "inventory_on_hand": 79,
            "inventory_in_transit": 18,
            "units_sold": 30,
            "promo_flag": True,
            "holiday_flag": False,
            "discount_pct": 7,
            "price": 35,
            "lead_time_days": 4,
            "forecast_days": 7,
            "forecast_model": "auto",
        }
    )

    print(
        json.dumps(
            {
                "dataset_id": dataset.dataset_id,
                "run_id": run.run_id,
                "run_status": run.status,
                "persisted": run.persisted,
                "persistence_error": run.persistence_error,
                "realtime_score": score,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
