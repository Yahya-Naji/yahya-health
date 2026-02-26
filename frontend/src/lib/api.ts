import type {
  EvaluationResult,
  KnowledgeBaseEntry,
  TranscriptSummary,
  TranscriptData,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }
  return res.json();
}

export const api = {
  health: () => apiFetch<{ status: string }>("/api/health"),

  evaluate: (body: {
    transcript_id?: string;
    transcript?: Array<{ role: string; content: string }>;
  }) =>
    apiFetch<EvaluationResult>("/api/evaluate", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getEvaluations: (verdict?: string) =>
    apiFetch<{ evaluations: EvaluationResult[]; total: number }>(
      `/api/evaluations${verdict ? `?verdict=${verdict}` : ""}`
    ),

  getEvaluation: (id: string) =>
    apiFetch<EvaluationResult>(`/api/evaluations/${id}`),

  getTranscripts: () =>
    apiFetch<{ transcripts: TranscriptSummary[] }>("/api/transcripts"),

  getTranscript: (id: string) =>
    apiFetch<TranscriptData>(`/api/transcripts/${id}`),

  getKnowledgeBase: () =>
    apiFetch<{ entries: KnowledgeBaseEntry[] }>("/api/knowledge-base"),
};
