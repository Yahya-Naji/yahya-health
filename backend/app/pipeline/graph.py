"""Build and compile the LangGraph evaluation pipeline."""

from __future__ import annotations

import json
import logging
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from langgraph.graph import END, START, StateGraph
from langgraph.types import RetryPolicy
from langgraph.checkpoint.memory import MemorySaver
from pydantic_evals import Case, Dataset
from pydantic_evals.evaluators import Evaluator, EvaluatorContext

from app.config import settings
from app.logging_config import audit_logger
from app.models.schemas import EvaluationState
from app.pipeline.agents.empathy import evaluate_empathy
from app.pipeline.agents.groundedness import evaluate_groundedness
from app.pipeline.agents.safety import evaluate_safety
from app.pipeline.aggregator import aggregate_verdict
from app.pipeline.nodes import load_knowledge_base, load_transcript, persist_results

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Graph construction
# ---------------------------------------------------------------------------

_builder = StateGraph(EvaluationState)

# Retry policy for LLM-calling nodes (handles transient OpenAI errors)
_llm_retry = RetryPolicy(max_attempts=3)

# Register nodes (agents get retry policies)
_builder.add_node("load_transcript", load_transcript)
_builder.add_node("load_knowledge_base", load_knowledge_base)
_builder.add_node("evaluate_empathy", evaluate_empathy, retry=_llm_retry)
_builder.add_node("evaluate_groundedness", evaluate_groundedness, retry=_llm_retry)
_builder.add_node("evaluate_safety", evaluate_safety, retry=_llm_retry)
_builder.add_node("aggregate_verdict", aggregate_verdict)
_builder.add_node("persist_results", persist_results)

# Edges: sequential start
_builder.add_edge(START, "load_transcript")
_builder.add_edge("load_transcript", "load_knowledge_base")

# Fan-out: knowledge_base feeds all three agents in parallel
_builder.add_edge("load_knowledge_base", "evaluate_empathy")
_builder.add_edge("load_knowledge_base", "evaluate_groundedness")
_builder.add_edge("load_knowledge_base", "evaluate_safety")

# Fan-in: all agents converge on aggregator
_builder.add_edge("evaluate_empathy", "aggregate_verdict")
_builder.add_edge("evaluate_groundedness", "aggregate_verdict")
_builder.add_edge("evaluate_safety", "aggregate_verdict")

# Final steps
_builder.add_edge("aggregate_verdict", "persist_results")
_builder.add_edge("persist_results", END)

# Checkpointer for state persistence and replay
checkpointer = MemorySaver()

# Compile the graph with checkpointing
evaluation_pipeline = _builder.compile(checkpointer=checkpointer)


# ---------------------------------------------------------------------------
# Pydantic Evals — custom evaluators (reported to Logfire Evals tab)
# ---------------------------------------------------------------------------


@dataclass
class VerdictEvaluator(Evaluator):
    """Report the overall verdict as a label."""

    def evaluate(self, ctx: EvaluatorContext) -> str:
        return ctx.output.get("overall_verdict", "N/A")


@dataclass
class OverallScore(Evaluator):
    """Report the overall weighted score."""

    def evaluate(self, ctx: EvaluatorContext) -> float:
        return ctx.output.get("overall_score", 0.0)


@dataclass
class SafetyScore(Evaluator):
    """Report the safety agent score."""

    def evaluate(self, ctx: EvaluatorContext) -> float:
        return (ctx.output.get("safety_result") or {}).get("score", 0.0)


@dataclass
class EmpathyScore(Evaluator):
    """Report the empathy agent score."""

    def evaluate(self, ctx: EvaluatorContext) -> float:
        return (ctx.output.get("empathy_result") or {}).get("score", 0.0)


@dataclass
class GroundednessScore(Evaluator):
    """Report the groundedness agent score."""

    def evaluate(self, ctx: EvaluatorContext) -> float:
        return (ctx.output.get("groundedness_result") or {}).get("score", 0.0)


_EVAL_EVALUATORS = [
    VerdictEvaluator(),
    OverallScore(),
    SafetyScore(),
    EmpathyScore(),
    GroundednessScore(),
]


# ---------------------------------------------------------------------------
# Convenience runner
# ---------------------------------------------------------------------------

def _invoke_pipeline(
    eval_id: str,
    turns: list[dict],
    transcript_id: str,
) -> dict:
    """Build initial state and invoke the LangGraph pipeline."""
    now = datetime.now(timezone.utc).isoformat()

    initial_state: EvaluationState = {
        "evaluation_id": eval_id,
        "transcript": turns,
        "knowledge_base": [],
        "transcript_id": transcript_id,
        "empathy_result": None,
        "groundedness_result": None,
        "safety_result": None,
        "overall_score": None,
        "overall_verdict": None,
        "verdict_reasoning": None,
        "created_at": now,
        "duration_ms": None,
        "errors": [],
    }

    audit_logger.log_evaluation(
        evaluation_id=eval_id,
        event="pipeline_started",
        data={"transcript_id": transcript_id, "turns": len(turns)},
    )

    logger.info("Starting evaluation pipeline (id=%s, turns=%d)", eval_id, len(turns))
    config = {"configurable": {"thread_id": f"eval-{eval_id}"}}
    final_state = evaluation_pipeline.invoke(initial_state, config=config)
    logger.info(
        "Pipeline complete (id=%s, verdict=%s, score=%s)",
        eval_id,
        final_state.get("overall_verdict"),
        final_state.get("overall_score"),
    )

    return final_state


def run_evaluation(
    transcript_id: str | None = None,
    transcript: list[dict] | None = None,
) -> dict:
    """Run the evaluation pipeline wrapped in Pydantic Evals for Logfire reporting.

    Provide either a ``transcript_id`` (to load from the data directory) or a
    raw ``transcript`` list.  Returns the final state dict.
    """
    eval_id = str(uuid.uuid4())
    tid = transcript_id or "inline"

    # Resolve transcript from file if needed
    if transcript is None and transcript_id is not None:
        transcripts_dir = settings.DATA_DIR / "transcripts"
        found = False
        for fpath in transcripts_dir.glob("*.json"):
            with open(fpath, "r", encoding="utf-8") as fh:
                data = json.load(fh)
            if isinstance(data, dict) and data.get("id") == transcript_id:
                transcript = data.get("turns", [])
                found = True
                break
        if not found:
            raise FileNotFoundError(f"Transcript with id '{transcript_id}' not found in {transcripts_dir}")
    elif transcript is None:
        raise ValueError("Either transcript_id or transcript must be provided.")

    # Normalise transcript entries to plain dicts
    turns: list[dict] = []
    for turn in transcript:
        if isinstance(turn, dict):
            turns.append(turn)
        else:
            turns.append(turn.model_dump())

    # Wrap in Pydantic Evals so scores appear in Logfire Evals tab
    _final_state: dict = {}

    def _eval_task(_input: str) -> dict:
        result = _invoke_pipeline(eval_id=eval_id, turns=turns, transcript_id=tid)
        _final_state.update(result)
        return result

    dataset = Dataset(
        name="syd-life-pipeline",
        cases=[Case(name=f"{tid}:{eval_id[:8]}", inputs=tid)],
        evaluators=_EVAL_EVALUATORS,
    )

    dataset.evaluate_sync(_eval_task)

    return _final_state
