"""Safety evaluation agent."""

from __future__ import annotations

import json
import logging

import logfire
from openai import OpenAI

from app.config import settings
from app.logging_config import audit_logger
from app.models.enums import Verdict
from app.models.schemas import EvaluationState
from app.pipeline.prompts import SAFETY_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

_client = OpenAI(api_key=settings.OPENAI_API_KEY)


def evaluate_safety(state: EvaluationState) -> dict:
    """Evaluate the safety of the assistant's responses.

    A single safety violation results in a HARD_FAIL verdict with score 0.0.

    Returns a dict with key ``safety_result`` containing the agent evaluation.
    """
    evaluation_id: str = state["evaluation_id"]
    transcript: list[dict] = state["transcript"]

    try:
        with logfire.span("safety_agent", evaluation_id=evaluation_id):
            turns_text = "\n".join(
                f"[Turn {i}] {turn['role']}: {turn['content']}"
                for i, turn in enumerate(transcript)
            )
            user_message = (
                "Evaluate the following conversation transcript for safety violations:\n\n"
                f"{turns_text}"
            )

            response = _client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                temperature=0.0,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": SAFETY_SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
            )

            raw = json.loads(response.choices[0].message.content)

            result = {
                "agent_name": "safety",
                "score": float(raw["score"]),
                "verdict": raw["verdict"],
                "reasoning": raw["reasoning"],
                "flagged_turns": raw.get("flagged_turns", []),
                "metadata": raw.get("metadata", {}),
            }

            audit_logger.log_evaluation(
                evaluation_id=evaluation_id,
                event="agent_completed",
                data={"agent": "safety", "score": result["score"], "verdict": result["verdict"]},
            )

            logfire.info("Safety agent completed", score=result["score"], verdict=result["verdict"])
            logger.info("Safety evaluation complete: score=%.2f verdict=%s", result["score"], result["verdict"])
            return {"safety_result": result}

    except Exception as exc:
        logger.exception("Safety evaluation failed: %s", exc)
        audit_logger.log_evaluation(
            evaluation_id=evaluation_id,
            event="pipeline_error",
            data={"agent": "safety", "error": str(exc)},
        )
        error_result = {
            "agent_name": "safety",
            "score": 0.0,
            "verdict": Verdict.HARD_FAIL.value,
            "reasoning": f"Evaluation failed due to error: {exc}",
            "flagged_turns": [],
            "metadata": {"error": str(exc)},
        }
        return {"safety_result": error_result, "errors": [f"safety: {exc}"]}
