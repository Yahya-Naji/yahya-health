"""Transcript endpoints: list, retrieve, upload, and generate transcripts."""

from __future__ import annotations

import json
import re
from pathlib import Path

import logfire
from openai import OpenAI
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import settings
from app.pipeline.prompts import STYLE_INSTRUCTIONS, TRANSCRIPT_GENERATOR_SYSTEM_PROMPT

router = APIRouter(prefix="/api")

_TRANSCRIPTS_DIR: Path = settings.DATA_DIR / "transcripts"


def _load_transcript(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def _next_transcript_id() -> tuple[str, int]:
    """Return the next available transcript ID and its number."""
    max_num = 0
    for p in sorted(_TRANSCRIPTS_DIR.glob("*.json")):
        match = re.search(r"transcript_(\d+)", p.stem)
        if match:
            max_num = max(max_num, int(match.group(1)))
    next_num = max_num + 1
    return f"transcript_{next_num:02d}", next_num


class UploadTranscriptRequest(BaseModel):
    label: str = ""
    description: str = ""
    turns: list[dict] = Field(..., min_length=1)


class GenerateTranscriptRequest(BaseModel):
    topic: str = Field(..., min_length=3, description="What the conversation is about")
    num_turns: int = Field(default=4, ge=2, le=10, description="Number of conversation turns")
    style: str = Field(
        default="good",
        description="Conversation style: good, hallucinated, or dangerous",
    )


@router.get("/transcripts")
async def list_transcripts() -> dict:
    """Return a summary of every transcript in ``data/transcripts/``."""
    transcripts: list[dict] = []
    for path in sorted(_TRANSCRIPTS_DIR.glob("*.json")):
        data = _load_transcript(path)
        transcripts.append(
            {
                "id": data["id"],
                "label": data["label"],
                "description": data["description"],
                "turn_count": len(data.get("turns", [])),
            }
        )
    return {"transcripts": transcripts}


# NOTE: /transcripts/generate MUST be registered before /transcripts/{transcript_id}
# so FastAPI doesn't treat "generate" as a transcript_id.
@router.post("/transcripts/generate")
def generate_transcript(request: GenerateTranscriptRequest) -> dict:
    """Use GPT-4o to generate a realistic transcript based on user input."""
    style = request.style if request.style in STYLE_INSTRUCTIONS else "good"
    system_prompt = TRANSCRIPT_GENERATOR_SYSTEM_PROMPT.format(
        num_turns=request.num_turns,
        style_instruction=STYLE_INSTRUCTIONS[style],
    )

    with logfire.span("generate_transcript", topic=request.topic, style=style):
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            temperature=0.8,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Generate a conversation about: {request.topic}"},
            ],
        )

    raw = response.choices[0].message.content or "[]"
    try:
        parsed = json.loads(raw)
        turns = parsed if isinstance(parsed, list) else parsed.get("turns", parsed.get("conversation", []))
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse generated transcript.")

    if not isinstance(turns, list) or len(turns) == 0:
        raise HTTPException(status_code=500, detail="Generated transcript was empty.")

    transcript_id, _ = _next_transcript_id()

    data = {
        "id": transcript_id,
        "label": f"{style} — generated",
        "description": f"AI-generated ({style}): {request.topic}",
        "turns": turns,
    }

    file_path = _TRANSCRIPTS_DIR / f"{transcript_id}.json"
    with open(file_path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2, ensure_ascii=False)

    return data


@router.get("/transcripts/{transcript_id}")
async def get_transcript(transcript_id: str) -> dict:
    """Return the full transcript data for a given ID."""
    for path in _TRANSCRIPTS_DIR.glob("*.json"):
        data = _load_transcript(path)
        if data.get("id") == transcript_id:
            return data

    raise HTTPException(status_code=404, detail="Transcript not found.")


@router.post("/transcripts")
async def upload_transcript(request: UploadTranscriptRequest) -> dict:
    """Save an uploaded transcript and return its metadata."""
    for i, turn in enumerate(request.turns):
        if "role" not in turn or "content" not in turn:
            raise HTTPException(
                status_code=400,
                detail=f"Turn {i} must have 'role' and 'content' fields.",
            )

    transcript_id, _ = _next_transcript_id()

    data = {
        "id": transcript_id,
        "label": request.label or "uploaded",
        "description": request.description
        or f"Uploaded transcript with {len(request.turns)} turns",
        "turns": request.turns,
    }

    file_path = _TRANSCRIPTS_DIR / f"{transcript_id}.json"
    with open(file_path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2, ensure_ascii=False)

    return data
