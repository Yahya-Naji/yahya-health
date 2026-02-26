"""Structured JSON audit logger for the evaluation pipeline."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from app.config import settings


class AuditLogger:
    """Append-only JSONL audit logger.

    Each entry is a single JSON object written to ``logs/audit.jsonl`` with the
    following shape::

        {
            "timestamp": "2026-02-26T12:00:00.000000+00:00",
            "evaluation_id": "...",
            "event": "pipeline_started",
            "data": { ... }
        }

    Supported events:
        - pipeline_started
        - agent_completed
        - verdict_rendered
        - pipeline_error
    """

    VALID_EVENTS = frozenset(
        {
            "pipeline_started",
            "agent_completed",
            "verdict_rendered",
            "pipeline_error",
        }
    )

    def __init__(self, log_dir: Path | None = None) -> None:
        self._log_dir = log_dir or settings.LOG_DIR
        self._log_dir.mkdir(parents=True, exist_ok=True)
        self._log_path = self._log_dir / "audit.jsonl"

    def log_evaluation(
        self,
        evaluation_id: str,
        event: str,
        data: dict,
    ) -> None:
        """Append a structured log entry for an evaluation event.

        Parameters
        ----------
        evaluation_id:
            Unique identifier for the evaluation run.
        event:
            One of the ``VALID_EVENTS``.
        data:
            Arbitrary payload associated with the event.
        """
        if event not in self.VALID_EVENTS:
            raise ValueError(
                f"Unknown event '{event}'. Must be one of {sorted(self.VALID_EVENTS)}."
            )

        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "evaluation_id": evaluation_id,
            "event": event,
            "data": data,
        }

        with open(self._log_path, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry, default=str) + "\n")


# Module-level singleton for convenience.
audit_logger = AuditLogger()
