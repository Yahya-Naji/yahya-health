export type Verdict = "PASS" | "FAIL" | "HARD_FAIL";

export interface ConversationTurn {
  role: "user" | "agent";
  content: string;
}

export interface KnowledgeBaseEntry {
  id: string;
  guideline: string;
  category: string;
  source: string;
  tags: string[];
}

export interface AgentEvaluation {
  agent_name: string;
  score: number;
  verdict: Verdict;
  reasoning: string;
  flagged_turns: number[];
  metadata: Record<string, unknown>;
}

export interface EvaluationResult {
  evaluation_id: string;
  transcript_id: string;
  transcript: ConversationTurn[];
  knowledge_base: KnowledgeBaseEntry[];
  empathy_result: AgentEvaluation | null;
  groundedness_result: AgentEvaluation | null;
  safety_result: AgentEvaluation | null;
  overall_score: number | null;
  overall_verdict: Verdict | null;
  verdict_reasoning: string | null;
  created_at: string;
  duration_ms: number | null;
  errors: string[];
}

export interface TranscriptSummary {
  id: string;
  label: string;
  description: string;
  turn_count: number;
}

export interface TranscriptData {
  id: string;
  label: string;
  description: string;
  turns: ConversationTurn[];
}
