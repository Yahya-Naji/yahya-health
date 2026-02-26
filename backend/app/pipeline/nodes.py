"""Utility nodes for the evaluation pipeline graph."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path

from app.config import settings
from app.logging_config import audit_logger
from app.models.schemas import EvaluationState

logger = logging.getLogger(__name__)


def load_transcript(state: EvaluationState) -> dict:
    """Pass-through node -- the transcript is already present in state.

    This node exists as an explicit graph entry point and can be extended
    later (e.g. to fetch transcripts from a database).
    """
    logger.info(
        "Transcript loaded: %d turns (transcript_id=%s)",
        len(state.get("transcript", [])),
        state.get("transcript_id", "inline"),
    )
    return {}


def load_knowledge_base(state: EvaluationState) -> dict:
    """Read the knowledge base from the data directory.

    Returns ``{"knowledge_base": [...]}``.
    """
    kb_path: Path = settings.DATA_DIR / "knowledge_base.json"

    try:
        with open(kb_path, "r", encoding="utf-8") as fh:
            entries: list[dict] = json.load(fh)
        logger.info("Knowledge base loaded: %d entries from %s", len(entries), kb_path)
        return {"knowledge_base": entries}
    except FileNotFoundError:
        logger.warning("Knowledge base file not found at %s; using empty list.", kb_path)
        return {"knowledge_base": [], "errors": [f"Knowledge base not found: {kb_path}"]}
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse knowledge base: %s", exc)
        return {"knowledge_base": [], "errors": [f"Knowledge base parse error: {exc}"]}


def persist_results(state: EvaluationState) -> dict:
    """Save the full evaluation result to the file store and log the verdict.

    The result is written as a JSON file to ``settings.RESULTS_DIR``.
    """
    evaluation_id: str = state["evaluation_id"]
    results_dir: Path = settings.RESULTS_DIR
    results_dir.mkdir(parents=True, exist_ok=True)

    result_payload = {
        "evaluation_id": evaluation_id,
        "transcript_id": state.get("transcript_id", ""),
        "overall_score": state.get("overall_score"),
        "overall_verdict": state.get("overall_verdict"),
        "verdict_reasoning": state.get("verdict_reasoning"),
        "empathy_result": state.get("empathy_result"),
        "groundedness_result": state.get("groundedness_result"),
        "safety_result": state.get("safety_result"),
        "created_at": state.get("created_at", ""),
        "duration_ms": state.get("duration_ms"),
        "errors": state.get("errors", []),
    }

    output_path = results_dir / f"{evaluation_id}.json"
    with open(output_path, "w", encoding="utf-8") as fh:
        json.dump(result_payload, fh, indent=2, default=str)

    logger.info("Results persisted to %s", output_path)

    # Audit log the final verdict
    audit_logger.log_evaluation(
        evaluation_id=evaluation_id,
        event="verdict_rendered",
        data={
            "overall_score": state.get("overall_score"),
            "overall_verdict": state.get("overall_verdict"),
            "verdict_reasoning": state.get("verdict_reasoning"),
        },
    )

    # Compute duration
    created_at_str = state.get("created_at", "")
    duration_ms: int | None = None
    if created_at_str:
        try:
            start = datetime.fromisoformat(created_at_str)
            duration_ms = int((datetime.now(timezone.utc) - start).total_seconds() * 1000)
        except (ValueError, TypeError):
            pass

    return {"duration_ms": duration_ms}
