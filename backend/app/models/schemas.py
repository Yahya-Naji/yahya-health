"""Pydantic models and LangGraph state schema for the evaluation pipeline."""

from __future__ import annotations

import operator
from typing import Annotated, Optional, TypedDict

from pydantic import BaseModel, Field

from app.models.enums import Verdict


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class ConversationTurn(BaseModel):
    role: str
    content: str


class KnowledgeBaseEntry(BaseModel):
    id: str
    guideline: str
    category: str
    source: str
    tags: list[str]


class TranscriptData(BaseModel):
    id: str
    label: str
    description: str
    turns: list[ConversationTurn]


class AgentEvaluation(BaseModel):
    agent_name: str
    score: float = Field(ge=0.0, le=1.0)
    verdict: Verdict
    reasoning: str
    flagged_turns: list[int] = Field(default_factory=list)
    metadata: dict = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# LangGraph state (must be TypedDict, not BaseModel)
# ---------------------------------------------------------------------------

class EvaluationState(TypedDict):
    evaluation_id: str
    transcript: list[dict]
    knowledge_base: list[dict]
    transcript_id: str
    empathy_result: Optional[dict]
    groundedness_result: Optional[dict]
    safety_result: Optional[dict]
    overall_score: Optional[float]
    overall_verdict: Optional[str]
    verdict_reasoning: Optional[str]
    created_at: str
    duration_ms: Optional[int]
    errors: Annotated[list[str], operator.add]


# ---------------------------------------------------------------------------
# API request / response
# ---------------------------------------------------------------------------

class EvaluationRequest(BaseModel):
    transcript_id: Optional[str] = None
    transcript: Optional[list[ConversationTurn]] = None


class EvaluationResponse(BaseModel):
    evaluation_id: str
    transcript_id: str
    overall_score: float
    overall_verdict: str
    verdict_reasoning: str
    empathy_result: dict
    groundedness_result: dict
    safety_result: dict
    created_at: str
    duration_ms: int
