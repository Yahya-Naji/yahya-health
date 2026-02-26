"""Knowledge-base endpoint: expose guideline entries."""

from __future__ import annotations

import json

from fastapi import APIRouter

from app.config import settings

router = APIRouter(prefix="/api")


@router.get("/knowledge-base")
async def get_knowledge_base() -> dict:
    """Read and return all entries from ``data/knowledge_base.json``."""
    kb_path = settings.DATA_DIR / "knowledge_base.json"
    with open(kb_path, "r", encoding="utf-8") as fh:
        entries: list[dict] = json.load(fh)
    return {"entries": entries}
