"""Transcript endpoints: list and retrieve sample transcripts."""

from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.config import settings

router = APIRouter(prefix="/api")

_TRANSCRIPTS_DIR: Path = settings.DATA_DIR / "transcripts"


def _load_transcript(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


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


@router.get("/transcripts/{transcript_id}")
async def get_transcript(transcript_id: str) -> dict:
    """Return the full transcript data for a given ID."""
    for path in _TRANSCRIPTS_DIR.glob("*.json"):
        data = _load_transcript(path)
        if data.get("id") == transcript_id:
            return data

    raise HTTPException(status_code=404, detail="Transcript not found.")
