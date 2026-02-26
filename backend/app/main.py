"""FastAPI application entry-point for the Syd Life AI Evaluation Pipeline."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import evaluations, knowledge_base, transcripts

app = FastAPI(
    title="Syd Life AI Evaluation Pipeline",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS -- allow the React dev server on localhost:3000
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
