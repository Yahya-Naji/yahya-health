"""FastAPI application entry-point for the Syd Life AI Evaluation Pipeline."""

import logging

import logfire
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import evaluations, knowledge_base, transcripts

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Logfire — observability for OpenAI calls, FastAPI requests, and pipeline
# ---------------------------------------------------------------------------
try:
    logfire.configure()
    logfire.instrument_openai()
    _logfire_ok = True
except Exception:
    logger.warning("Logfire not configured (run `logfire auth` to enable). Continuing without observability.")
    _logfire_ok = False

app = FastAPI(
    title="Syd Life AI Evaluation Pipeline",
    version="1.0.0",
)

if _logfire_ok:
    logfire.instrument_fastapi(app)

# ---------------------------------------------------------------------------
# CORS -- allow the React dev server on localhost:3000
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(evaluations.router)
app.include_router(knowledge_base.router)
app.include_router(transcripts.router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}
