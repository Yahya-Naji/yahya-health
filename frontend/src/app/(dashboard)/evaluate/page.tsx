"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Loader2,
  Heart,
  BookOpen,
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  GitBranch,
  Cpu,
  BarChart3,
  RefreshCw,
  Database,
  Activity,
  Clock,
  Sparkles,
  MessageSquare,
  Upload,
  FileJson,
} from "lucide-react";

import { api } from "@/lib/api";
import type { TranscriptSummary, TranscriptData, EvaluationResult } from "@/types";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

/* ── Pipeline step definitions ────────────────────────────────────────── */

type StepStatus = "pending" | "active" | "done" | "error";

interface PipelineStep {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  color: string;
  activeColor: string;
  doneColor: string;
}

interface PipelineFeature {
  icon: React.ElementType;
  label: string;
  color: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "load",
    label: "Loading Transcript",
    icon: Cpu,
    description: "Parsing conversation turns and loading knowledge base",
    color: "text-slate-400",
    activeColor: "text-indigo-600 border-indigo-500 bg-indigo-50",
    doneColor: "text-emerald-600 border-emerald-500 bg-emerald-50",
  },
  {
    id: "empathy",
    label: "Empathy Agent",
    icon: Heart,
    description: "Evaluating tone, warmth, acknowledgment, and clarity",
    color: "text-slate-400",
    activeColor: "text-pink-600 border-pink-500 bg-pink-50",
    doneColor: "text-emerald-600 border-emerald-500 bg-emerald-50",
  },
  {
    id: "groundedness",
    label: "Groundedness Agent",
    icon: BookOpen,
    description: "Verifying claims against 15 scientific guidelines",
    color: "text-slate-400",
    activeColor: "text-violet-600 border-violet-500 bg-violet-50",
    doneColor: "text-emerald-600 border-emerald-500 bg-emerald-50",
  },
  {
    id: "safety",
    label: "Medical Safety Agent",
    icon: ShieldAlert,
    description: "Checking for diagnosis, prescription, or unsafe advice",
    color: "text-slate-400",
    activeColor: "text-red-600 border-red-500 bg-red-50",
    doneColor: "text-emerald-600 border-emerald-500 bg-emerald-50",
  },
  {
    id: "aggregate",
    label: "Aggregating Verdict",
    icon: BarChart3,
    description: "Computing weighted score and final verdict",
    color: "text-slate-400",
    activeColor: "text-indigo-600 border-indigo-500 bg-indigo-50",
    doneColor: "text-emerald-600 border-emerald-500 bg-emerald-50",
  },
];

const PIPELINE_FEATURES: PipelineFeature[] = [
  { icon: RefreshCw, label: "Retry x3", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { icon: Database, label: "Checkpointed", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { icon: Activity, label: "Logfire Traced", color: "text-orange-600 bg-orange-50 border-orange-200" },
];

/* ── Pipeline visualization component ─────────────────────────────────── */

function PipelineVisualizer({
  stepStatuses,
  parallelActive,
}: {
  stepStatuses: Record<string, StepStatus>;
  parallelActive: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-indigo-600" />
          <CardTitle>LangGraph Pipeline</CardTitle>
        </div>
        <CardDescription>
          Multi-agent evaluation with parallel fan-out
        </CardDescription>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {PIPELINE_FEATURES.map((f) => (
            <span
              key={f.label}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${f.color}`}
            >
              <f.icon className="h-2.5 w-2.5" />
              {f.label}
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Main flow */}
          <div className="space-y-0">
            {/* Step 1: Load */}
            <PipelineNode step={PIPELINE_STEPS[0]} status={stepStatuses["load"]} />

            {/* Connector line */}
            <div className="flex justify-center">
              <div className={`w-0.5 h-6 transition-colors duration-500 ${
                stepStatuses["load"] === "done" ? "bg-emerald-300" : "bg-slate-200"
              }`} />
            </div>

            {/* Fan-out label */}
            <AnimatePresence>
              {parallelActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex justify-center mb-2"
                >
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                    Parallel Fan-Out
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Parallel agents */}
            <div className="grid grid-cols-3 gap-3">
              {PIPELINE_STEPS.slice(1, 4).map((step) => (
                <PipelineNode
                  key={step.id}
                  step={step}
                  status={stepStatuses[step.id]}
                  compact
                />
              ))}
            </div>

            {/* Fan-in connector */}
            <div className="flex justify-center">
              <div className="flex items-center gap-0">
                <div className={`flex-1 h-0.5 transition-colors duration-500 ${
                  stepStatuses["empathy"] === "done" ? "bg-emerald-300" : "bg-slate-200"
                }`} />
                <div className={`w-0.5 h-6 transition-colors duration-500 ${
                  stepStatuses["safety"] === "done" ? "bg-emerald-300" : "bg-slate-200"
                }`} />
                <div className={`flex-1 h-0.5 transition-colors duration-500 ${
                  stepStatuses["groundedness"] === "done" ? "bg-emerald-300" : "bg-slate-200"
                }`} />
              </div>
            </div>

            {/* Fan-in label */}
            <AnimatePresence>
              {stepStatuses["aggregate"] !== "pending" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex justify-center mb-2"
                >
                  <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200 text-xs">
                    Fan-In
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 5: Aggregate */}
            <PipelineNode step={PIPELINE_STEPS[4]} status={stepStatuses["aggregate"]} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PipelineNode({
  step,
  status,
  compact = false,
}: {
  step: PipelineStep;
  status: StepStatus;
  compact?: boolean;
}) {
  const isActive = status === "active";
  const isDone = status === "done";
  const isError = status === "error";

  const borderClass = isActive
    ? step.activeColor
    : isDone
      ? step.doneColor
      : isError
        ? "text-red-600 border-red-500 bg-red-50"
        : "text-slate-400 border-slate-200 bg-white";

  const StatusIcon = isDone
    ? CheckCircle
    : isError
      ? XCircle
      : isActive
        ? Loader2
        : step.icon;

  return (
    <motion.div
      initial={false}
      animate={{
        scale: isActive ? 1.02 : 1,
        boxShadow: isActive
          ? "0 4px 20px rgba(99, 102, 241, 0.15)"
          : "0 0px 0px rgba(0,0,0,0)",
      }}
      transition={{ duration: 0.3 }}
      className={`relative rounded-xl border-2 transition-colors duration-500 ${borderClass} ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className={`flex items-center gap-3 ${compact ? "flex-col text-center" : ""}`}>
        <div className="relative">
          <StatusIcon
            className={`${compact ? "h-6 w-6" : "h-7 w-7"} ${
              isActive ? "animate-spin" : ""
            } ${isDone ? "text-emerald-600" : isError ? "text-red-600" : ""}`}
          />
          {isActive && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-current opacity-30"
              animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </div>
        <div className={compact ? "" : "flex-1"}>
          <p className={`font-semibold ${compact ? "text-xs" : "text-sm"}`}>
            {step.label}
          </p>
          {!compact && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {step.description}
            </p>
          )}
          {/* Show feature badges on compact agent nodes when done */}
          {compact && isDone && (
            <div className="flex flex-wrap justify-center gap-1 mt-1.5">
              <span className="inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0 text-[8px] font-medium text-amber-600 bg-amber-50 border-amber-200">
                <RefreshCw className="h-2 w-2" />
                x3
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0 text-[8px] font-medium text-orange-600 bg-orange-50 border-orange-200">
                <Activity className="h-2 w-2" />
                Traced
              </span>
            </div>
          )}
        </div>
        {isDone && !compact && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
              Done
            </Badge>
          </motion.div>
        )}
      </div>

      {/* Progress bar for active state */}
      {isActive && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl overflow-hidden"
        >
          <motion.div
            className="h-full bg-current opacity-40"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────── */

type EvalPhase = "idle" | "running" | "complete";

export default function EvaluatePage() {
  const router = useRouter();
  const [transcripts, setTranscripts] = useState<TranscriptSummary[]>([]);
  const [loadingTranscripts, setLoadingTranscripts] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [evalPhase, setEvalPhase] = useState<EvalPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);

  // Generate transcript state
  const [genTopic, setGenTopic] = useState("");
  const [genTurns, setGenTurns] = useState(4);
  const [genStyle, setGenStyle] = useState("good");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("select");

  // Upload state
  const [uploadedTurns, setUploadedTurns] = useState<Array<{ role: string; content: string }> | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>({
    load: "pending",
    empathy: "pending",
    groundedness: "pending",
    safety: "pending",
    aggregate: "pending",
  });

  const parallelActive =
    stepStatuses["empathy"] === "active" ||
    stepStatuses["groundedness"] === "active" ||
    stepStatuses["safety"] === "active";

  useEffect(() => {
    api
      .getTranscripts()
      .then((data) => setTranscripts(data.transcripts))
      .catch(() => setTranscripts([]))
      .finally(() => setLoadingTranscripts(false));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setTranscriptData(null);
      return;
    }
    setLoadingPreview(true);
    api
      .getTranscript(selectedId)
      .then(setTranscriptData)
      .catch(() => setTranscriptData(null))
      .finally(() => setLoadingPreview(false));
  }, [selectedId]);

  const updateStep = useCallback((id: string, status: StepStatus) => {
    setStepStatuses((prev) => ({ ...prev, [id]: status }));
  }, []);

  const handleEvaluate = async () => {
    if (!selectedId) return;
    setEvalPhase("running");
    setError(null);
    setResult(null);

    // Reset all steps
    setStepStatuses({
      load: "pending",
      empathy: "pending",
      groundedness: "pending",
      safety: "pending",
      aggregate: "pending",
    });

    // Simulate pipeline progress while the real API call runs
    const simulateProgress = async () => {
      // Step 1: Load
      updateStep("load", "active");
      await delay(800);
      updateStep("load", "done");

      // Step 2-4: Parallel agents (stagger start slightly for visual effect)
      await delay(200);
      updateStep("empathy", "active");
      await delay(150);
      updateStep("groundedness", "active");
      await delay(150);
      updateStep("safety", "active");

      // Agents finish at different times
      await delay(2000);
      updateStep("empathy", "done");
      await delay(800);
      updateStep("safety", "done");
      await delay(600);
      updateStep("groundedness", "done");

      // Step 5: Aggregate
      await delay(300);
      updateStep("aggregate", "active");
      await delay(1000);
      updateStep("aggregate", "done");
    };

    // Run simulation and API call concurrently
    const [apiResult] = await Promise.allSettled([
      api.evaluate({ transcript_id: selectedId }),
      simulateProgress(),
    ]);

    if (apiResult.status === "fulfilled") {
      // Ensure all steps show done
      setStepStatuses({
        load: "done",
        empathy: "done",
        groundedness: "done",
        safety: "done",
        aggregate: "done",
      });
      setResult(apiResult.value);
      setEvalPhase("complete");
    } else {
      setError(apiResult.reason?.message || "Evaluation failed");
      setEvalPhase("idle");
    }
  };

  const handleGenerate = async () => {
    if (!genTopic.trim()) return;
    setGenerating(true);
    setGenError(null);

    try {
      const saved = await api.generateTranscript({
        topic: genTopic.trim(),
        num_turns: genTurns,
        style: genStyle,
      });
      // Add to transcript list and select it
      setTranscripts((prev) => [
        ...prev,
        {
          id: saved.id,
          label: saved.label,
          description: saved.description,
          turn_count: saved.turns.length,
        },
      ]);
      setSelectedId(saved.id);
      setActiveTab("select");
      // Clear generate state
      setGenTopic("");
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        const turns = Array.isArray(parsed) ? parsed : parsed?.turns;
        if (!Array.isArray(turns) || turns.length === 0) {
          setUploadError("JSON must be an array of turns or an object with a \"turns\" array.");
          setUploadedTurns(null);
          return;
        }
        for (let i = 0; i < turns.length; i++) {
          if (!turns[i].role || !turns[i].content) {
            setUploadError(`Turn ${i} is missing "role" or "content".`);
            setUploadedTurns(null);
            return;
          }
        }
        setUploadedTurns(turns);
      } catch {
        setUploadError("Invalid JSON file.");
        setUploadedTurns(null);
      }
    };
    reader.readAsText(file);
  };

  const handleUploadAndSelect = async () => {
    if (!uploadedTurns) return;
    setUploading(true);
    setUploadError(null);

    try {
      const saved = await api.uploadTranscript({
        label: uploadFileName.replace(/\.json$/i, ""),
        turns: uploadedTurns,
      });
      setTranscripts((prev) => [
        ...prev,
        {
          id: saved.id,
          label: saved.label,
          description: saved.description,
          turn_count: saved.turns.length,
        },
      ]);
      setSelectedId(saved.id);
      setActiveTab("select");
      setUploadedTurns(null);
      setUploadFileName("");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const verdictConfig = {
    PASS: { label: "Pass", icon: CheckCircle, className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    FAIL: { label: "Fail", icon: AlertTriangle, className: "bg-amber-50 text-amber-700 border-amber-200" },
    HARD_FAIL: { label: "Hard Fail", icon: XCircle, className: "bg-red-50 text-red-700 border-red-200" },
  };

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Run Evaluation</h1>
        <p className="text-muted-foreground mt-1">
          Select a transcript and watch the multi-agent pipeline evaluate it in real-time
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Selector + Preview */}
        <div className="lg:col-span-3 space-y-6">
          {/* Transcript Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Select Transcript</CardTitle>
              <CardDescription>
                Choose an existing transcript, upload a JSON file, or generate one with AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="select" className="flex-1">Select Existing</TabsTrigger>
                  <TabsTrigger value="upload" className="flex-1">
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    Upload JSON
                  </TabsTrigger>
                  <TabsTrigger value="generate" className="flex-1">
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Generate
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="select" className="space-y-4 mt-4">
                  {loadingTranscripts ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <Select value={selectedId} onValueChange={setSelectedId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a transcript..." />
                      </SelectTrigger>
                      <SelectContent>
                        {transcripts.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            <span className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  t.label.includes("good")
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : t.label.includes("hallucin")
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-red-50 text-red-700 border-red-200"
                                }`}
                              >
                                {t.label.includes("good")
                                  ? "Good"
                                  : t.label.includes("hallucin")
                                    ? "Halluc."
                                    : "Danger"}
                              </Badge>
                              {t.id} ({t.turn_count} turns)
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {selectedId && transcripts.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {transcripts.find((t) => t.id === selectedId)?.description}
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="upload" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <Label htmlFor="transcript-file">Transcript JSON File</Label>
                    <div
                      className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-indigo-300 transition-colors cursor-pointer"
                      onClick={() => document.getElementById("transcript-file")?.click()}
                    >
                      <FileJson className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                      {uploadFileName ? (
                        <p className="text-sm font-medium text-indigo-700">{uploadFileName}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Click to select a JSON file with transcript turns
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Format: [{`{`}&quot;role&quot;: &quot;user&quot;, &quot;content&quot;: &quot;...&quot;{`}`}, ...]
                      </p>
                      <input
                        id="transcript-file"
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>

                    {uploadedTurns && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm text-emerald-700">
                        Parsed {uploadedTurns.length} turns successfully
                      </div>
                    )}

                    {uploadError && (
                      <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {uploadError}
                      </div>
                    )}

                    <Button
                      className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white"
                      disabled={!uploadedTurns || uploading}
                      onClick={handleUploadAndSelect}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Upload &amp; Select
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="generate" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="gen-topic">What is the conversation about?</Label>
                      <textarea
                        id="gen-topic"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="e.g. A user asking about managing type 2 diabetes through diet..."
                        value={genTopic}
                        onChange={(e) => setGenTopic(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Number of turns</Label>
                        <Select value={String(genTurns)} onValueChange={(v) => setGenTurns(Number(v))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[2, 4, 6, 8, 10].map((n) => (
                              <SelectItem key={n} value={String(n)}>
                                {n} turns
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label>Conversation style</Label>
                        <Select value={genStyle} onValueChange={setGenStyle}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="good">
                              <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                Good
                              </span>
                            </SelectItem>
                            <SelectItem value="hallucinated">
                              <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-amber-500" />
                                Hallucinated
                              </span>
                            </SelectItem>
                            <SelectItem value="dangerous">
                              <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-red-500" />
                                Dangerous
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-3 py-2">
                      <p className="text-xs text-indigo-600 flex items-center gap-1.5">
                        <MessageSquare className="h-3 w-3" />
                        GPT-4o will generate a realistic {genTurns}-turn health conversation
                      </p>
                    </div>

                    {genError && (
                      <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {genError}
                      </div>
                    )}

                    <Button
                      className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white"
                      disabled={!genTopic.trim() || generating}
                      onClick={handleGenerate}
                    >
                      {generating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Generate & Select
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                  {error}
                </div>
              )}

              <Button
                size="lg"
                disabled={!selectedId || evalPhase === "running"}
                onClick={handleEvaluate}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg"
              >
                {evalPhase === "running" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Evaluation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Transcript Preview */}
          {loadingPreview && (
            <Card>
              <CardContent className="py-6">
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {transcriptData && !loadingPreview && (
            <Card>
              <CardHeader>
                <CardTitle>Transcript Preview</CardTitle>
                <CardDescription>
                  {transcriptData.turns.length} turns in this conversation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {transcriptData.turns.map((turn, index) => {
                    const isUser = turn.role === "user";
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex ${isUser ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-3 ${
                            isUser ? "bg-muted" : "bg-indigo-50 text-indigo-900"
                          }`}
                        >
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            {turn.role} · Turn {index}
                          </span>
                          <p className="text-sm leading-relaxed mt-1">
                            {turn.content}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Pipeline Visualizer */}
        <div className="lg:col-span-2 space-y-6">
          <PipelineVisualizer
            stepStatuses={stepStatuses}
            parallelActive={parallelActive}
          />

          {/* Result Card */}
          <AnimatePresence>
            {evalPhase === "complete" && result && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-violet-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                      Evaluation Complete
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Verdict */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Verdict
                      </span>
                      {result.overall_verdict && (
                        <Badge
                          variant="outline"
                          className={
                            verdictConfig[result.overall_verdict]?.className
                          }
                        >
                          {(() => {
                            const V =
                              verdictConfig[result.overall_verdict]?.icon;
                            return V ? <V className="h-3 w-3 mr-1" /> : null;
                          })()}
                          {verdictConfig[result.overall_verdict]?.label}
                        </Badge>
                      )}
                    </div>

                    {/* Score */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Overall Score
                      </span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        {result.overall_score !== null
                          ? `${(result.overall_score * 100).toFixed(0)}%`
                          : "N/A"}
                      </span>
                    </div>

                    {/* Agent scores */}
                    <div className="space-y-2 pt-2 border-t">
                      {[
                        { label: "Empathy", result: result.empathy_result, icon: Heart },
                        { label: "Groundedness", result: result.groundedness_result, icon: BookOpen },
                        { label: "Safety", result: result.safety_result, icon: ShieldAlert },
                      ].map((agent) => (
                        <div key={agent.label} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <agent.icon className="h-3.5 w-3.5" />
                            {agent.label}
                          </span>
                          <span className="font-semibold">
                            {agent.result
                              ? `${(agent.result.score * 100).toFixed(0)}%`
                              : "N/A"}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Pipeline metadata */}
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          Duration
                        </span>
                        <span className="font-semibold">
                          {result.duration_ms !== null
                            ? result.duration_ms >= 1000
                              ? `${(result.duration_ms / 1000).toFixed(1)}s`
                              : `${result.duration_ms}ms`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Database className="h-3.5 w-3.5" />
                          Thread
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          eval-{result.evaluation_id.slice(0, 8)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {PIPELINE_FEATURES.map((f) => (
                          <span
                            key={f.label}
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${f.color}`}
                          >
                            <f.icon className="h-2.5 w-2.5" />
                            {f.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    <Button
                      className="w-full mt-2"
                      onClick={() =>
                        router.push(`/evaluations/${result.evaluation_id}`)
                      }
                    >
                      View Full Report
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
