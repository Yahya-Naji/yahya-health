"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  ArrowRight,
  Shield,
  Heart,
  BookOpen,
  Brain,
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Clock,
  Cpu,
  GitBranch,
  Sparkles,
  Activity,
} from "lucide-react";

/* ── Hero images ──────────────────────────────────────────────────────── */

const heroImages = [
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1920&q=80",
  "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=1920&q=80",
  "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1920&q=80",
  "https://images.unsplash.com/photo-1576671081837-49000212a370?w=1920&q=80",
];

const stats = [
  { value: "3", label: "Judge Agents" },
  { value: "<5s", label: "Eval Latency" },
  { value: "15", label: "KB Guidelines" },
  { value: "AI", label: "Powered" },
];

/* ── Features ─────────────────────────────────────────────────────────── */

const features = [
  {
    icon: Heart,
    title: "Empathy Analysis",
    description:
      "Evaluates whether the AI agent communicates with warmth, acknowledgment, and supportive tone — not just clinical accuracy.",
    gradient: "from-indigo-500 to-violet-500",
  },
  {
    icon: BookOpen,
    title: "Groundedness Check",
    description:
      "Verifies every claim against a curated Knowledge Base of 15 scientific guidelines. Detects hallucinations and fabricated statistics.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: ShieldAlert,
    title: "Medical Safety Audit",
    description:
      "Flags any attempt to diagnose conditions, prescribe medications, or interpret lab results — an instant HARD FAIL.",
    gradient: "from-purple-500 to-fuchsia-500",
  },
  {
    icon: GitBranch,
    title: "Multi-Agent Pipeline",
    description:
      "LangGraph orchestrates 3 specialized agents in parallel fan-out, with a deterministic aggregator for the final verdict.",
    gradient: "from-fuchsia-500 to-pink-500",
  },
];

/* ── How it works ─────────────────────────────────────────────────────── */

const pipelineSteps = [
  {
    step: "01",
    icon: Cpu,
    title: "Load & Parse Transcript",
    description:
      "The pipeline ingests a conversation between a user and the health AI agent, normalizing turns for evaluation.",
  },
  {
    step: "02",
    icon: Brain,
    title: "Parallel Agent Evaluation",
    description:
      "Three GPT-4o judges run simultaneously — Empathy, Groundedness, and Medical Safety — each with specialized prompts and scoring rubrics.",
  },
  {
    step: "03",
    icon: BarChart3,
    title: "Aggregate & Verdict",
    description:
      "A deterministic aggregator combines scores (40% Groundedness, 30% Empathy, 30% Safety). Any HARD_FAIL from Safety overrides everything.",
  },
];

/* ── Verdict cards ────────────────────────────────────────────────────── */

const verdictExamples = [
  {
    icon: CheckCircle,
    verdict: "PASS",
    title: "Grounded Response",
    example: "Agent recommends 150 min/week exercise per WHO guidelines",
    color: "text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
  },
  {
    icon: AlertTriangle,
    verdict: "FAIL",
    title: "Hallucination Detected",
    example: "Agent claims alkaline water prevents cancer",
    color: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
  },
  {
    icon: XCircle,
    verdict: "HARD FAIL",
    title: "Unsafe Diagnosis",
    example: "Agent diagnoses diabetes and prescribes metformin dosage",
    color: "text-red-400",
    border: "border-red-500/30",
    bg: "bg-red-500/10",
  },
];

/* ── Metrics ──────────────────────────────────────────────────────────── */

const metrics = [
  { value: "3", label: "Parallel Agents", icon: Brain },
  { value: "GPT-4o", label: "Judge LLM", icon: Cpu },
  { value: "15", label: "KB Guidelines", icon: BookOpen },
  { value: "12", label: "Test Transcripts", icon: Activity },
  { value: "0.0", label: "Temperature", icon: Clock },
  { value: "100%", label: "Structured JSON", icon: Sparkles },
];

/* ── Animations ───────────────────────────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12 },
  }),
};

const fadeScale = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

const slideIn = (dir: "left" | "right") => ({
  hidden: { opacity: 0, x: dir === "left" ? -60 : 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7 },
  },
});

/* ── Component ────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative h-screen min-h-[700px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={current}
            src={heroImages[current]}
            alt="Health AI background"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/30 to-violet-900/20" />

        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-50">
          <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur-md">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Syd Life AI
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="px-4 py-1.5 rounded-lg text-sm text-white/90 hover:bg-white/10 hover:text-white transition-all"
              >
                Dashboard
              </Link>
              <Link
                href="/evaluate"
                className="px-4 py-1.5 rounded-lg text-sm bg-white/15 text-white backdrop-blur-md hover:bg-white/25 border border-white/20 transition-all"
              >
                Run Evaluation
              </Link>
            </div>
          </div>
        </header>

        {/* Hero content */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-md"
            >
              <Zap className="h-3.5 w-3.5" />
              LLM Evaluation Pipeline
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-5xl font-bold leading-tight tracking-tight text-white md:text-7xl"
            >
              Audit your AI,
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                before it speaks
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70"
            >
              Three AI judges evaluate every health agent response for empathy,
              scientific accuracy, and medical safety — catching hallucinations
              and unsafe diagnoses before they reach patients.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="mt-10 flex items-center justify-center gap-4"
            >
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg text-base font-semibold bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-600 hover:to-violet-600 transition-all hover:scale-105 active:scale-95"
              >
                Try for Free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/evaluate"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg text-base font-semibold border border-white/25 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
              >
                <Activity className="h-4 w-4" />
                Live Demo
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-16 grid w-full max-w-2xl grid-cols-4 divide-x divide-white/15 rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-lg"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.0 + i * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="mt-1 text-xs text-white/50">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Slider dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.3 }}
            className="mt-8 flex gap-2"
          >
            {heroImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === current
                    ? "w-8 bg-white"
                    : "w-2 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section className="relative border-t border-border bg-white px-4 py-24 md:py-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-6xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="mb-16 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-600">
              <Sparkles className="h-3.5 w-3.5" />
              Core Capabilities
            </div>
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
              Three layers of protection
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Every AI agent response passes through three specialized evaluators before it can reach a patient.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                custom={index}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-50 to-white p-8 transition-shadow hover:shadow-xl hover:shadow-indigo-500/10"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div
                  className={`relative mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg shadow-indigo-500/20`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="relative text-lg font-semibold">{feature.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How the Pipeline Works ────────────────────────────────────── */}
      <section className="relative bg-gradient-to-b from-slate-50 to-white px-4 py-24 md:py-32 overflow-hidden">
        <div className="mx-auto max-w-6xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="mb-20 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-xs font-semibold text-violet-600">
              <GitBranch className="h-3.5 w-3.5" />
              LangGraph Pipeline
            </div>
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              A LangGraph StateGraph orchestrates the evaluation with parallel fan-out for maximum speed.
            </p>
          </motion.div>

          <div className="grid gap-12 md:gap-16">
            {pipelineSteps.map((item, index) => (
              <motion.div
                key={item.step}
                variants={slideIn(index % 2 === 0 ? "left" : "right")}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 ${
                  index % 2 === 1 ? "md:flex-row-reverse" : ""
                }`}
              >
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="relative flex-shrink-0"
                >
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                    <item.icon className="w-14 h-14 md:w-16 md:h-16 text-white" />
                  </div>
                  <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-white border-2 border-indigo-200 flex items-center justify-center text-sm font-bold text-indigo-600 shadow-md">
                    {item.step}
                  </div>
                </motion.div>

                <div className="text-center md:text-left flex-1">
                  <h3 className="text-2xl font-bold md:text-3xl">{item.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground max-w-lg">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Verdict Examples ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-24 md:py-32">
        <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-violet-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="relative mx-auto max-w-6xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="mb-16 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-md">
              <ShieldAlert className="h-3.5 w-3.5" />
              Verdict System
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
              Three possible outcomes
            </h2>
            <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
              Each transcript receives a clear verdict. Medical safety violations trigger an instant hard fail — no exceptions.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {verdictExamples.map((v, index) => (
              <motion.div
                key={v.verdict}
                custom={index}
                variants={fadeScale}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                className={`rounded-2xl border ${v.border} ${v.bg} p-8 backdrop-blur-md text-center transition-all`}
              >
                <v.icon className={`mx-auto h-10 w-10 ${v.color} mb-4`} />
                <div className={`text-2xl font-bold ${v.color}`}>{v.verdict}</div>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  {v.title}
                </h3>
                <p className="mt-2 text-sm text-white/50 italic">
                  &ldquo;{v.example}&rdquo;
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Metrics ───────────────────────────────────────────────────── */}
      <section className="relative bg-white px-4 py-24 md:py-32 overflow-hidden">
        <div className="relative mx-auto max-w-6xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="mb-16 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-600">
              <BarChart3 className="h-3.5 w-3.5" />
              Technical Specs
            </div>
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
              Built for precision
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Every design decision optimized for reproducible, auditable, and safe evaluations.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                custom={index}
                variants={fadeScale}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="rounded-2xl border bg-gradient-to-br from-slate-50 to-white p-6 md:p-8 text-center transition-shadow hover:shadow-lg hover:shadow-indigo-500/10"
              >
                <div className="mx-auto mb-3 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                  <metric.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                  {metric.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {metric.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white px-4 py-24 md:py-32 border-t">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 via-transparent to-violet-50/50" />
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="relative mx-auto max-w-3xl text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="mx-auto mb-8 w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            Ready to audit your health AI?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Run your first evaluation in seconds. Select a transcript, let the multi-agent pipeline analyze it, and get a detailed safety report.
          </p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/evaluate"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-600 hover:to-violet-600 transition-all hover:scale-105 active:scale-95"
            >
              Try for Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold border text-muted-foreground hover:bg-slate-50 transition-all hover:scale-105 active:scale-95"
            >
              View Dashboard
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t bg-slate-50 px-4 py-8 text-center text-sm text-muted-foreground">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-indigo-500" />
            <span className="font-medium">
              Syd Life AI &copy; {new Date().getFullYear()}
            </span>
          </div>
          <span>LangGraph + GPT-4o + FastAPI</span>
        </div>
      </footer>
    </div>
  );
}
