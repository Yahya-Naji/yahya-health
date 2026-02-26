"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

import { api } from "@/lib/api";
import type { EvaluationResult, Verdict, AgentEvaluation } from "@/types";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const config = {
    PASS: {
      label: "Pass",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    FAIL: {
      label: "Fail",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    HARD_FAIL: {
      label: "Hard Fail",
      className: "bg-red-50 text-red-700 border-red-200",
    },
  };
  const c = config[verdict] || config.FAIL;
  return (
    <Badge variant="outline" className={c.className}>
      {c.label}
    </Badge>
  );
}

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - score * circumference;
  const color =
    score >= 0.7 ? "#10b981" : score >= 0.4 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={6}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000"
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy="0.35em"
        className="fill-foreground text-lg font-bold"
        transform={`rotate(90, ${size / 2}, ${size / 2})`}
      >
        {(score * 100).toFixed(0)}%
      </text>
    </svg>
  );
}

function AgentResultCard({ result }: { result: AgentEvaluation }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="capitalize">{result.agent_name}</CardTitle>
          <VerdictBadge verdict={result.verdict} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <ScoreRing score={result.score} />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {result.reasoning}
            </p>
          </div>
        </div>
        {(result.flagged_turns?.length ?? 0) > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Flagged Turns
            </p>
            <div className="flex flex-wrap gap-1.5">
              {result.flagged_turns.map((turn) => (
                <Badge
                  key={turn}
                  variant="outline"
                  className="bg-red-50 text-red-700 border-red-200 text-xs"
                >
                  Turn {turn}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const turnVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

export default function EvaluationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = params.id as string;

  useEffect(() => {
    if (!id) return;
    api
      .getEvaluation(id)
      .then(setEvaluation)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Collect all flagged turn indices across all agents
  const allFlaggedTurns = new Set<number>();
  if (evaluation) {
    [
      evaluation.empathy_result,
      evaluation.groundedness_result,
      evaluation.safety_result,
    ].forEach((result) => {
      result?.flagged_turns?.forEach((t) => allFlaggedTurns.add(t));
    });
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/evaluations")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Evaluations
        </Button>
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground text-lg">
              {error || "Evaluation not found."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const agentResults = [
    evaluation.empathy_result,
    evaluation.groundedness_result,
    evaluation.safety_result,
  ].filter(Boolean) as AgentEvaluation[];

  return (
    <div className="space-y-8">
      {/* Back button & Header */}
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/evaluations")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Evaluations
        </Button>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Evaluation Detail
            </h1>
            <p className="text-muted-foreground mt-1 font-mono text-sm">
              {evaluation.evaluation_id}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {evaluation.overall_verdict && (
              <VerdictBadge verdict={evaluation.overall_verdict} />
            )}
            {evaluation.overall_score !== null && (
              <span className="text-2xl font-bold">
                {(evaluation.overall_score * 100).toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Agent Result Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {agentResults.map((result) => (
          <AgentResultCard key={result.agent_name} result={result} />
        ))}
      </div>

      {/* Verdict Reasoning */}
      {evaluation.verdict_reasoning && (
        <Card>
          <CardHeader>
            <CardTitle>Verdict Reasoning</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {evaluation.verdict_reasoning}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Transcript Viewer */}
      <Card>
        <CardHeader>
          <CardTitle>Transcript</CardTitle>
          <CardDescription>
            Conversation between user and agent ({evaluation.transcript?.length ?? 0}{" "}
            turns)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(evaluation.transcript ?? []).map((turn, index) => {
              const isFlagged = allFlaggedTurns.has(index);
              const isUser = turn.role === "user";
              return (
                <motion.div
                  key={index}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={turnVariants}
                  className={`flex ${isUser ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-3 ${
                      isFlagged
                        ? "border-2 border-red-300 bg-red-50"
                        : isUser
                          ? "bg-muted"
                          : "bg-indigo-50 text-indigo-900"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {turn.role}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Turn {index}
                      </span>
                      {isFlagged && (
                        <Badge
                          variant="outline"
                          className="bg-red-100 text-red-700 border-red-300 text-[10px]"
                        >
                          Flagged
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {turn.content}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
