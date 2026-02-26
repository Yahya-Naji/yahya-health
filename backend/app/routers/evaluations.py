"""Evaluation endpoints: run new evaluations and retrieve results."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.models.enums import Verdict
from app.models.schemas import EvaluationRequest, EvaluationResponse
from app.pipeline.graph import run_evaluation
from app.storage.file_store import file_store

router = APIRouter(prefix="/api")


@router.post("/evaluate", response_model=EvaluationResponse)
async def evaluate(request: EvaluationRequest) -> EvaluationResponse:
    """Run the full evaluation pipeline on a transcript.

    Accepts either a ``transcript_id`` referencing a file in ``data/transcripts/``
    or an inline list of conversation turns.
    """
    if request.transcript_id is None and request.transcript is None:
        raise HTTPException(
            status_code=400,
            detail="Provide either 'transcript_id' or 'transcript'.",
        )

    # run_evaluation is synchronous (LangGraph); FastAPI will run it in a
    # threadpool automatically when called from an async endpoint.
    result: dict = run_evaluation(
        transcript_id=request.transcript_id,
        transcript=[t.model_dump() for t in request.transcript]
        if request.transcript
        else None,
    )

    return EvaluationResponse(**result)


@router.get("/evaluations")
async def list_evaluations(
    verdict: Verdict | None = Query(default=None, description="Filter by verdict"),
) -> dict:
    """Return all stored evaluation results, optionally filtered by verdict."""
    evaluations = file_store.list_evaluations()

    if verdict is not None:
        evaluations = [
            e for e in evaluations if e.get("overall_verdict") == verdict.value
        ]

    return {"evaluations": evaluations, "total": len(evaluations)}


@router.get("/evaluations/{evaluation_id}")
async def get_evaluation(evaluation_id: str) -> dict:
    """Return the full detail of a single evaluation."""
    result = file_store.get_evaluation(evaluation_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Evaluation not found.")
    return result
