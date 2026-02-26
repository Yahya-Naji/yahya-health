"""Empathy evaluation agent."""

from __future__ import annotations

import json
import logging

from openai import OpenAI

from app.config import settings
from app.logging_config import audit_logger
from app.models.enums import Verdict
from app.models.schemas import EvaluationState
from app.pipeline.prompts import EMPATHY_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

_client = OpenAI(api_key=settings.OPENAI_API_KEY)


def evaluate_empathy(state: EvaluationState) -> dict:
    """Evaluate the empathy and tone of the assistant in the transcript.

    Returns a dict with key ``empathy_result`` containing the agent evaluation.
    """
    evaluation_id: str = state["evaluation_id"]
    transcript: list[dict] = state["transcript"]

    try:
        # Build the user message from transcript turns
        turns_text = "\n".join(
            f"[Turn {i}] {turn['role']}: {turn['content']}"
            for i, turn in enumerate(transcript)
        )
        user_message = (
            "Evaluate the following conversation transcript for empathy:\n\n"
            f"{turns_text}"
        )

        response = _client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            temperature=0.0,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": EMPATHY_SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
        )

        raw = json.loads(response.choices[0].message.content)

        result = {
            "agent_name": "empathy",
            "score": float(raw["score"]),
            "verdict": raw["verdict"],
            "reasoning": raw["reasoning"],
            "flagged_turns": raw.get("flagged_turns", []),
            "metadata": {},
        }

        audit_logger.log_evaluation(
            evaluation_id=evaluation_id,
            event="agent_completed",
            data={"agent": "empathy", "score": result["score"], "verdict": result["verdict"]},
        )

        logger.info("Empathy evaluation complete: score=%.2f verdict=%s", result["score"], result["verdict"])
        return {"empathy_result": result}

    except Exception as exc:
        logger.exception("Empathy evaluation failed: %s", exc)
        audit_logger.log_evaluation(
            evaluation_id=evaluation_id,
            event="pipeline_error",
            data={"agent": "empathy", "error": str(exc)},
        )
        error_result = {
            "agent_name": "empathy",
            "score": 0.0,
            "verdict": Verdict.FAIL.value,
            "reasoning": f"Evaluation failed due to error: {exc}",
            "flagged_turns": [],
            "metadata": {"error": str(exc)},
        }
        return {"empathy_result": error_result, "errors": [f"empathy: {exc}"]}
