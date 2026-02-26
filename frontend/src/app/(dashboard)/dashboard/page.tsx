"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ClipboardList,
  CheckCircle,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

import { api } from "@/lib/api";
import type { EvaluationResult, Verdict } from "@/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function DashboardPage() {
  const [evaluations, setEvaluations] = useState<EvaluationResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getEvaluations()
      .then((data) => setEvaluations(data.evaluations))
      .catch(() => setEvaluations([]))
      .finally(() => setLoading(false));
  }, []);

  const totalEvaluations = evaluations.length;
  const passCount = evaluations.filter(
    (e) => e.overall_verdict === "PASS"
  ).length;
  const passRate =
    totalEvaluations > 0
      ? ((passCount / totalEvaluations) * 100).toFixed(1)
      : "0";
  const hardFailCount = evaluations.filter(
    (e) => e.overall_verdict === "HARD_FAIL"
  ).length;
  const avgScore =
    totalEvaluations > 0
      ? (
          evaluations.reduce((sum, e) => sum + (e.overall_score ?? 0), 0) /
          totalEvaluations
        ).toFixed(2)
      : "0";

  const recentEvaluations = evaluations.slice(0, 5);

  const stats = [
    {
      title: "Total Evaluations",
      value: totalEvaluations,
      icon: ClipboardList,
      bg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      title: "Pass Rate",
      value: `${passRate}%`,
      icon: CheckCircle,
      bg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      title: "Hard Fails",
      value: hardFailCount,
      icon: ShieldAlert,
      bg: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      title: "Avg Score",
      value: avgScore,
      icon: TrendingUp,
      bg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of evaluation pipeline results
        </p>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.title}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`rounded-full p-2 ${stat.bg}`}>
                    <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Recent Evaluations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Evaluations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recentEvaluations.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No evaluations yet. Run your first evaluation to see results here.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transcript ID</TableHead>
                  <TableHead>Verdict</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEvaluations.map((evaluation) => (
                  <TableRow key={evaluation.evaluation_id}>
                    <TableCell>
                      <Link
                        href={`/evaluations/${evaluation.evaluation_id}`}
                        className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                      >
                        {evaluation.transcript_id.slice(0, 12)}...
                      </Link>
                    </TableCell>
                    <TableCell>
                      {evaluation.overall_verdict && (
                        <VerdictBadge verdict={evaluation.overall_verdict} />
                      )}
                    </TableCell>
                    <TableCell>
                      {evaluation.overall_score !== null
                        ? (evaluation.overall_score * 100).toFixed(0) + "%"
                        : "N/A"}
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
    </div>
  );
}
