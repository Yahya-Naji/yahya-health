"""Groundedness evaluation agent."""

from __future__ import annotations

import json
import logging

import logfire
from openai import OpenAI

from app.config import settings
from app.logging_config import audit_logger
from app.models.enums import Verdict
from app.models.schemas import EvaluationState
from app.pipeline.prompts import GROUNDEDNESS_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

_client = OpenAI(api_key=settings.OPENAI_API_KEY)


def evaluate_groundedness(state: EvaluationState) -> dict:
    """Evaluate the groundedness of the assistant's claims against the knowledge base.

    Returns a dict with key ``groundedness_result`` containing the agent evaluation.
    """
    evaluation_id: str = state["evaluation_id"]
    transcript: list[dict] = state["transcript"]
    knowledge_base: list[dict] = state.get("knowledge_base", [])

    try:
        with logfire.span("groundedness_agent", evaluation_id=evaluation_id):
            # Build the user message with transcript and knowledge base
            turns_text = "\n".join(
                f"[Turn {i}] {turn['role']}: {turn['content']}"
                for i, turn in enumerate(transcript)
            )

            kb_text = "\n".join(
                f"- [{entry.get('id', 'N/A')}] ({entry.get('category', 'N/A')}): "
                f"{entry.get('guideline', '')}"
                for entry in knowledge_base
            )

            user_message = (
                "Evaluate the following conversation transcript for groundedness.\n\n"
                "## Conversation Transcript\n"
                f"{turns_text}\n\n"
                "## Knowledge Base\n"
                f"{kb_text}"
            )

            response = _client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                temperature=0.0,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": GROUNDEDNESS_SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
            )

            raw = json.loads(response.choices[0].message.content)

            result = {
                "agent_name": "groundedness",
                "score": float(raw["score"]),
                "verdict": raw["verdict"],
                "reasoning": raw["reasoning"],
                "flagged_turns": raw.get("flagged_turns", []),
                "metadata": raw.get("metadata", {}),
            }

            audit_logger.log_evaluation(
                evaluation_id=evaluation_id,
                event="agent_completed",
                data={"agent": "groundedness", "score": result["score"], "verdict": result["verdict"]},
            )

            logfire.info("Groundedness agent completed", score=result["score"], verdict=result["verdict"])
            logger.info(
                "Groundedness evaluation complete: score=%.2f verdict=%s",
                result["score"],
                result["verdict"],
            )
            return {"groundedness_result": result}

    except Exception as exc:
        logger.exception("Groundedness evaluation failed: %s", exc)
        audit_logger.log_evaluation(
            evaluation_id=evaluation_id,
            event="pipeline_error",
            data={"agent": "groundedness", "error": str(exc)},
        )
        error_result = {
            "agent_name": "groundedness",
            "score": 0.0,
            "verdict": Verdict.FAIL.value,
            "reasoning": f"Evaluation failed due to error: {exc}",
            "flagged_turns": [],
            "metadata": {"error": str(exc)},
        }
        return {"groundedness_result": error_result, "errors": [f"groundedness: {exc}"]}
