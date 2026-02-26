"""Knowledge-base endpoint: expose and manage guideline entries."""

from __future__ import annotations

import json

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.config import settings

router = APIRouter(prefix="/api")


class CreateKnowledgeBaseEntry(BaseModel):
    guideline: str
    category: str
    source: str
    tags: list[str] = Field(default_factory=list)


@router.get("/knowledge-base")
async def get_knowledge_base() -> dict:
    """Read and return all entries from ``data/knowledge_base.json``."""
    kb_path = settings.DATA_DIR / "knowledge_base.json"
    with open(kb_path, "r", encoding="utf-8") as fh:
        entries: list[dict] = json.load(fh)
    return {"entries": entries}


@router.post("/knowledge-base")
async def add_knowledge_base_entry(entry: CreateKnowledgeBaseEntry) -> dict:
    """Append a new guideline entry to the knowledge base."""
    kb_path = settings.DATA_DIR / "knowledge_base.json"
    with open(kb_path, "r", encoding="utf-8") as fh:
        entries: list[dict] = json.load(fh)

    # Auto-generate next ID
    max_num = 0
    for e in entries:
        eid = e.get("id", "")
        if eid.startswith("kb-"):
            try:
                max_num = max(max_num, int(eid.split("-")[1]))
            except ValueError:
                pass
    new_id = f"kb-{max_num + 1:03d}"

    new_entry = {"id": new_id, **entry.model_dump()}
    entries.append(new_entry)

    with open(kb_path, "w", encoding="utf-8") as fh:
        json.dump(entries, fh, indent=2, ensure_ascii=False)

    return new_entry
