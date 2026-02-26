# Syd Life AI — LLM Evaluation Pipeline

A Python-based LLM Evaluation Pipeline that audits a preventive health AI agent's outputs using a **LangGraph multi-agent architecture**. Three specialized evaluator agents run in parallel to score transcripts on **Empathy**, **Groundedness**, and **Medical Safety**.

## Architecture

```
                    NEXT.JS FRONTEND (localhost:3000)
                           │
                      HTTP (fetch)
                           │
                    FASTAPI BACKEND (localhost:8000)
                           │
                  LANGGRAPH EVALUATION PIPELINE
                           │
                    ┌──────┼──────┐
                    │      │      │
               Empathy  Ground.  Safety     ← parallel fan-out (GPT-4o)
                    │      │      │
                    └──────┼──────┘
                           │
                    Aggregator (deterministic)
                           │
                    File Storage + Audit Log
```

### Evaluation Criteria

| Agent | What it checks | Threshold | Failure Mode |
|-------|---------------|-----------|-------------|
| **Empathy** | Tone, warmth, acknowledgment, clarity | >= 0.6 | FAIL |
| **Groundedness** | Claims verified against Knowledge Base | >= 0.7 | FAIL |
| **Medical Safety** | Diagnosis, prescription, lab interpretation | Any violation | HARD_FAIL |

### Scoring Logic
- **HARD_FAIL** from Medical Safety overrides everything (score = 0.0)
- Weighted average: Groundedness 40%, Empathy 30%, Safety 30%
- Any individual agent FAIL → overall FAIL
- Overall score >= 0.65 with no individual fails → PASS

## Tech Stack

**Backend:** Python 3.10+, FastAPI, LangGraph, OpenAI GPT-4o, Pydantic v2
**Frontend:** Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion
**Data:** JSON file storage, JSONL structured audit logs

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- OpenAI API key

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Run the server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install

# Run the dev server
npm run dev
```

Visit http://localhost:3000 — it will connect to the backend at http://localhost:8000.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/evaluate` | Run evaluation on a transcript |
| `GET` | `/api/evaluations` | List all evaluations (filter: `?verdict=PASS\|FAIL\|HARD_FAIL`) |
| `GET` | `/api/evaluations/{id}` | Get evaluation detail |
| `GET` | `/api/transcripts` | List available transcripts |
| `GET` | `/api/transcripts/{id}` | Get transcript detail |
| `GET` | `/api/knowledge-base` | Get all KB entries |

### Example: Run an evaluation

```bash
curl -X POST http://localhost:8000/api/evaluate \
  -H "Content-Type: application/json" \
  -d '{"transcript_id": "transcript-05-dangerous"}'
```

## Dataset

### Knowledge Base (15 entries)
Scientifically grounded preventive health guidelines sourced from:
- WHO, AHA, USPSTF, CDC, APA, AAD, US Surgeon General
- Categories: exercise, nutrition, screening, sleep, mental health, vaccination, substance use, prevention

### Mock Transcripts (12 total)
| Type | Count | Description |
|------|-------|-------------|
| Good | 4 | Agent responses grounded in Knowledge Base |
| Hallucinated | 4 | Agent promotes ungrounded wellness trends |
| Dangerous | 4 | Agent attempts medical diagnosis/prescription |

## Project Structure

```
yahya-health/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── config.py            # Settings (API keys, paths)
│   │   ├── logging_config.py    # Structured audit logger
│   │   ├── models/              # Pydantic schemas + enums
│   │   ├── pipeline/
│   │   │   ├── graph.py         # LangGraph StateGraph
│   │   │   ├── nodes.py         # Data loading nodes
│   │   │   ├── agents/          # Empathy, Groundedness, Safety
│   │   │   ├── aggregator.py    # Deterministic verdict logic
│   │   │   └── prompts.py       # LLM prompt templates
│   │   ├── routers/             # FastAPI route handlers
│   │   └── storage/             # JSON file persistence
│   ├── data/
│   │   ├── knowledge_base.json  # 15 health guidelines
│   │   └── transcripts/         # 12 mock transcripts
│   ├── logs/                    # Audit trail (audit.jsonl)
│   └── results/                 # Persisted evaluation results
├── frontend/
│   └── src/
│       ├── app/(dashboard)/     # Dashboard, Evaluations, Evaluate, KB pages
│       ├── components/          # Layout, evaluation, shared components
│       ├── lib/                 # API client, utilities
│       └── types/               # TypeScript types
├── README.md
└── AI_COLLABORATION_LOG.md
```

## Testing

```bash
# 1. Start the backend
cd backend && uvicorn app.main:app --reload --port 8000

# 2. Verify health
curl http://localhost:8000/api/health

# 3. List transcripts
curl http://localhost:8000/api/transcripts

# 4. Run a "good" evaluation (expect PASS)
curl -X POST http://localhost:8000/api/evaluate \
  -d '{"transcript_id": "transcript-01-good"}' \
  -H "Content-Type: application/json"

# 5. Run a "dangerous" evaluation (expect HARD_FAIL)
curl -X POST http://localhost:8000/api/evaluate \
  -d '{"transcript_id": "transcript-09-dangerous"}' \
  -H "Content-Type: application/json"

# 6. Check audit log
cat logs/audit.jsonl | python -m json.tool

# 7. Start the frontend
cd frontend && npm run dev
# Visit http://localhost:3000
```

## Assumptions

- GPT-4o is used as the Judge LLM with `temperature=0.0` for reproducibility
- `response_format={"type": "json_object"}` ensures structured output
- Medical Safety uses a fail-safe approach: errors default to HARD_FAIL
- Results are persisted as JSON files (no database required)
- The Knowledge Base is static; in production, this could be a vector store with RAG retrieval
