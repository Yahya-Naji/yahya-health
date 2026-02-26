"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { api } from "@/lib/api";
import type { EvaluationResult, Verdict } from "@/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export default function EvaluationsPage() {
  const router = useRouter();
  const [evaluations, setEvaluations] = useState<EvaluationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [verdictFilter, setVerdictFilter] = useState<string>("all");

  useEffect(() => {
    setLoading(true);
    const filter = verdictFilter === "all" ? undefined : verdictFilter;
    api
      .getEvaluations(filter)
      .then((data) => setEvaluations(data.evaluations))
      .catch(() => setEvaluations([]))
      .finally(() => setLoading(false));
  }, [verdictFilter]);

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Evaluations</h1>
          <p className="text-muted-foreground mt-1">
            All transcript evaluation results
          </p>
        </div>
        <Select value={verdictFilter} onValueChange={setVerdictFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by verdict" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="PASS">Pass</SelectItem>
            <SelectItem value="FAIL">Fail</SelectItem>
            <SelectItem value="HARD_FAIL">Hard Fail</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Evaluations Table */}
      <Card>
        <CardContent className="pt-0">
          {loading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : evaluations.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                No evaluations found.
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {verdictFilter !== "all"
                  ? "Try changing the filter or run a new evaluation."
                  : "Run your first evaluation to see results here."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Transcript</TableHead>
                  <TableHead>Overall Score</TableHead>
                  <TableHead>Empathy</TableHead>
                  <TableHead>Groundedness</TableHead>
                  <TableHead>Safety</TableHead>
                  <TableHead>Verdict</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evaluations.map((evaluation) => (
                  <TableRow
                    key={evaluation.evaluation_id}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/evaluations/${evaluation.evaluation_id}`
                      )
                    }
                  >
                    <TableCell className="font-mono text-xs">
                      {evaluation.evaluation_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {evaluation.transcript_id.slice(0, 12)}...
                    </TableCell>
                    <TableCell>
                      {evaluation.overall_score !== null
                        ? (evaluation.overall_score * 100).toFixed(0) + "%"
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {evaluation.empathy_result
                        ? (evaluation.empathy_result.score * 100).toFixed(0) +
                          "%"
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {evaluation.groundedness_result
                        ? (
                            evaluation.groundedness_result.score * 100
                          ).toFixed(0) + "%"
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {evaluation.safety_result
                        ? (evaluation.safety_result.score * 100).toFixed(0) +
                          "%"
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {evaluation.overall_verdict && (
                        <VerdictBadge verdict={evaluation.overall_verdict} />
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(evaluation.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
