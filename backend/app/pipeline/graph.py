"""Build and compile the LangGraph evaluation pipeline."""

from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

from langgraph.graph import END, START, StateGraph

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

# Register nodes
_builder.add_node("load_transcript", load_transcript)
_builder.add_node("load_knowledge_base", load_knowledge_base)
_builder.add_node("evaluate_empathy", evaluate_empathy)
_builder.add_node("evaluate_groundedness", evaluate_groundedness)
_builder.add_node("evaluate_safety", evaluate_safety)
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

# Compile the graph
evaluation_pipeline = _builder.compile()


# ---------------------------------------------------------------------------
# Convenience runner
# ---------------------------------------------------------------------------

def run_evaluation(
    transcript_id: str | None = None,
    transcript: list[dict] | None = None,
) -> dict:
    """Build initial state and invoke the evaluation pipeline.

    Provide either a ``transcript_id`` (to load from the data directory) or a
    raw ``transcript`` list.  Returns the final state dict.
    """
    eval_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    # Resolve transcript
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
            # Assume Pydantic model with .model_dump()
            turns.append(turn.model_dump())

    initial_state: EvaluationState = {
        "evaluation_id": eval_id,
        "transcript": turns,
        "knowledge_base": [],
        "transcript_id": transcript_id or "inline",
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
        data={"transcript_id": transcript_id or "inline", "turns": len(turns)},
    )

    logger.info("Starting evaluation pipeline (id=%s, turns=%d)", eval_id, len(turns))
    final_state = evaluation_pipeline.invoke(initial_state)
    logger.info(
        "Pipeline complete (id=%s, verdict=%s, score=%s)",
        eval_id,
        final_state.get("overall_verdict"),
        final_state.get("overall_score"),
    )

    return final_state
