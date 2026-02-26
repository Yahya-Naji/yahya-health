# AI Collaboration Log

## Tools Used
- **Cursor** — Architecture design, code generation, data creation

## Prompt Examples

### Prompt 1: Architecture Design
> "Design a comprehensive architecture for a Python-based LLM Evaluation Pipeline using LangGraph multi-agent architecture. This is for a Syd Life AI hiring task. Design a multi-agent system using LangGraph where: Empathy Agent, Groundedness Agent, Medical Safety Agent run in parallel fan-out, with a deterministic Aggregator."

**Result:** Generated the full system architecture with LangGraph StateGraph, parallel fan-out/fan-in pattern, Pydantic state schema, and API endpoint design.

### Prompt 2: Mock Transcript Generation
> "Create 12 mock transcript JSON files: 4 good (grounded in KB), 4 hallucinated (ungrounded wellness trends), 4 dangerous (medical diagnosis attempts). Make conversations realistic with 4-6 turns each."

**Result:** Generated realistic transcripts covering edge cases. The "dangerous" transcripts included specific medication dosages and diagnosis language that would clearly trigger the Medical Safety agent.

### Prompt 3: Pipeline Agent Implementation
> "Create the LangGraph pipeline files. Build 3 agent functions that call GPT-4o with response_format=json_object and temperature=0.0. Use parallel fan-out edges in the StateGraph."

**Result:** Generated the complete pipeline with proper error handling and structured logging.

### Prompt 4: Observability & Testing Integration
> "Look into Promptfoo and Logfire. Check how we can enrich the backend — do first Logfire evals, then LangGraph, then Promptfoo for local and CI tests."

**Result:** Integrated Logfire for full observability (auto-instrumented OpenAI + FastAPI + custom agent spans), added LangGraph checkpointing (MemorySaver) and RetryPolicy on all agents, created Promptfoo test suite with 5 test cases covering all verdict types, and a GitHub Actions CI workflow that blocks PRs if prompts regress.

## AI Correction Instance

**Issue:** The initial AI-generated `EvaluationState` was a Pydantic `BaseModel`. However, LangGraph requires `TypedDict` for state schemas (not Pydantic models), and the `errors` field needed `Annotated[list[str], operator.add]` for proper append semantics during parallel execution.

**How I recognized it:** LangGraph documentation specifies that state must be a `TypedDict` with reducer annotations for fields that multiple nodes write to. Using a Pydantic BaseModel would cause runtime errors when the graph tries to merge state from parallel branches.

**Fix:** Changed `EvaluationState` from `BaseModel` to `TypedDict` and added the `operator.add` annotation for the `errors` field, ensuring that when multiple agents append errors concurrently, they merge correctly instead of overwriting each other.
