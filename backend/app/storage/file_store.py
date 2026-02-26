"""JSON file persistence for evaluation results."""

from __future__ import annotations

import json
from pathlib import Path

from app.config import settings


class FileStore:
    """Simple file-based store that persists evaluation results as JSON."""

    def __init__(self, results_dir: Path | None = None) -> None:
        self._results_dir = results_dir or settings.RESULTS_DIR
        self._results_dir.mkdir(parents=True, exist_ok=True)

    def _path_for(self, evaluation_id: str) -> Path:
        return self._results_dir / f"{evaluation_id}.json"

    def save_evaluation(self, evaluation_id: str, data: dict) -> None:
        """Persist an evaluation result to ``results/<evaluation_id>.json``."""
        path = self._path_for(evaluation_id)
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=2, default=str)

    def get_evaluation(self, evaluation_id: str) -> dict | None:
        """Load a single evaluation by ID, or return ``None`` if not found."""
        path = self._path_for(evaluation_id)
        if not path.exists():
            return None
        with open(path, "r", encoding="utf-8") as fh:
            return json.load(fh)

    def list_evaluations(self) -> list[dict]:
        """Return all stored evaluations as a list of dicts."""
        results: list[dict] = []
        for path in sorted(self._results_dir.glob("*.json")):
            with open(path, "r", encoding="utf-8") as fh:
                results.append(json.load(fh))
        return results


# Module-level singleton for convenience.
file_store = FileStore()
