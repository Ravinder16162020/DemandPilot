from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from threading import Lock
from typing import Any

import pandas as pd


@dataclass
class DatasetRecord:
    dataset_id: str
    file_name: str
    status: str
    rows_total: int
    rows_valid: int
    rows_rejected: int
    created_at: datetime = field(default_factory=datetime.utcnow)
    frame: pd.DataFrame | None = None


@dataclass
class RunRecord:
    run_id: str
    dataset_id: str
    horizon_days: int
    model_name: str
    status: str
    persisted: bool = False
    persistence_error: str | None = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    forecasts: list[dict[str, Any]] = field(default_factory=list)
    risks: list[dict[str, Any]] = field(default_factory=list)
    recommendations: list[dict[str, Any]] = field(default_factory=list)


class RuntimeStore:
    def __init__(self) -> None:
        self._lock = Lock()
        self.datasets: dict[str, DatasetRecord] = {}
        self.runs: dict[str, RunRecord] = {}

    def save_dataset(self, record: DatasetRecord) -> None:
        with self._lock:
            self.datasets[record.dataset_id] = record

    def get_dataset(self, dataset_id: str) -> DatasetRecord | None:
        with self._lock:
            return self.datasets.get(dataset_id)

    def latest_dataset(self) -> DatasetRecord | None:
        with self._lock:
            if not self.datasets:
                return None
            return sorted(self.datasets.values(), key=lambda item: item.created_at)[-1]

    def save_run(self, run: RunRecord) -> None:
        with self._lock:
            self.runs[run.run_id] = run

    def latest_run(self) -> RunRecord | None:
        with self._lock:
            if not self.runs:
                return None
            return sorted(self.runs.values(), key=lambda item: item.created_at)[-1]

    def latest_run_for_dataset(self, dataset_id: str) -> RunRecord | None:
        with self._lock:
            filtered = [item for item in self.runs.values() if item.dataset_id == dataset_id]
            if not filtered:
                return None
            return sorted(filtered, key=lambda item: item.created_at)[-1]


runtime_store = RuntimeStore()
