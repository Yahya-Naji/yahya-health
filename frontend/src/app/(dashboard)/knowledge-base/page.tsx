"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

import { api } from "@/lib/api";
import type { KnowledgeBaseEntry } from "@/types";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const categoryColors: Record<string, string> = {
  exercise: "bg-indigo-50 text-indigo-700 border-indigo-200",
  nutrition: "bg-emerald-50 text-emerald-700 border-emerald-200",
  screening: "bg-violet-50 text-violet-700 border-violet-200",
  mental_health: "bg-purple-50 text-purple-700 border-purple-200",
  substance_use: "bg-amber-50 text-amber-700 border-amber-200",
  prevention: "bg-pink-50 text-pink-700 border-pink-200",
  sleep: "bg-blue-50 text-blue-700 border-blue-200",
  vaccination: "bg-teal-50 text-teal-700 border-teal-200",
};

function getCategoryStyle(category: string): string {
  return (
    categoryColors[category.toLowerCase()] ||
    "bg-gray-50 text-gray-700 border-gray-200"
  );
}

export default function KnowledgeBasePage() {
  const [entries, setEntries] = useState<KnowledgeBaseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    api
      .getKnowledgeBase()
      .then((data) => setEntries(data.entries))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter(
      (entry) =>
        entry.guideline.toLowerCase().includes(query) ||
        entry.category.toLowerCase().includes(query) ||
        entry.source.toLowerCase().includes(query) ||
        entry.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [entries, searchQuery]);

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
        <p className="text-muted-foreground mt-1">
          {entries.length} scientifically grounded health guidelines used by the Groundedness Agent
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search guidelines, categories, tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent pl-10 pr-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Knowledge Base Cards */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">
            {searchQuery
              ? "No guidelines match your search."
              : "No knowledge base entries found."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredEntries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">
                    {entry.guideline}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={`shrink-0 capitalize ${getCategoryStyle(entry.category)}`}
                  >
                    {entry.category.replace(/_/g, " ")}
                  </Badge>
                </div>
                <CardDescription>{entry.source}</CardDescription>
              </CardHeader>
              <CardContent>
                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {entry.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}
