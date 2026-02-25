"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGBPAnalysis } from "@/hooks/useGBPAnalysis";
import type { ActionItem, PlaceDetailsData } from "@/components/sales-dashboard/types";
import {
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  Circle,
} from "lucide-react";

const STORAGE_KEY_PREFIX = "gbp_action_done_";

function getStoredDoneIds(businessName: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const key = `${STORAGE_KEY_PREFIX}${encodeURIComponent(businessName)}`;
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function setStoredDoneIds(businessName: string, ids: Set<string>) {
  try {
    const key = `${STORAGE_KEY_PREFIX}${encodeURIComponent(businessName)}`;
    localStorage.setItem(key, JSON.stringify([...ids]));
  } catch {}
}

function taskId(item: ActionItem, index: number): string {
  return `${index}-${item.title.slice(0, 40)}`;
}

function PriorityPill({ priority }: { priority: ActionItem["priority"] }) {
  const config = {
    high: { label: "High impact", dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700" },
    medium: { label: "Medium", dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
    low: { label: "Low", dot: "bg-sky-500", bg: "bg-sky-50", text: "text-sky-700" },
  };
  const { label, dot, bg, text } = config[priority];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

export interface RecommendedActionsTabProps {
  businessName: string;
  /** Optional place_id; backend fetches details when provided (business dashboard flow) */
  placeId?: string | null;
  /** Optional pre-fetched place details (sales dashboard flow) */
  placeDetails?: PlaceDetailsData | null;
}

export function RecommendedActionsTab({
  businessName,
  placeId = null,
  placeDetails = null,
}: RecommendedActionsTabProps) {
  const { data, loading, error } = useGBPAnalysis({
    businessName,
    placeId,
    placeDetails,
    enabled: !!businessName?.trim(),
  });
  const gbpAnalysisData = data?.analysisData ?? null;

  const [doneIds, setDoneIds] = useState<Set<string>>(() => new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    setDoneIds(getStoredDoneIds(businessName));
  }, [businessName]);

  const toggleDone = (id: string) => {
    const next = new Set(doneIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setDoneIds(next);
    setStoredDoneIds(businessName, next);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading your action plan...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !gbpAnalysisData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Unable to load actions</CardTitle>
          <CardDescription>{error ?? "Ensure the business name is set."}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const actionItems = gbpAnalysisData.actionItems ?? [];
  if (actionItems.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-green-100 flex items-center justify-center mb-5">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <p className="font-semibold text-lg text-gray-900">All caught up</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            No actions needed right now. Check Google Business Health for your latest metrics.
          </p>
        </CardContent>
      </Card>
    );
  }

  const completedCount = actionItems.filter((item, i) => doneIds.has(taskId(item, i))).length;
  const total = actionItems.length;
  const pending = actionItems
    .map((item, i) => ({ item, i, id: taskId(item, i) }))
    .filter(({ id }) => !doneIds.has(id));
  const completed = actionItems
    .map((item, i) => ({ item, i, id: taskId(item, i) }))
    .filter(({ id }) => doneIds.has(id));

  const nextStep = pending[0];
  const progressPercent = total ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Hero: Next step (primary action card) */}
      {nextStep && (
        <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="flex gap-4">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Your next step
                </p>
                <h2 className="text-lg font-semibold text-foreground leading-tight">
                  {nextStep.item.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {nextStep.item.description}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Button
                    variant="outline"
                    size="default"
                    className="gap-2 rounded-lg border-primary/50 bg-background font-medium text-primary hover:bg-primary/5 hover:border-primary"
                    onClick={() => window.open("https://business.google.com/", "_blank", "noopener,noreferrer")}
                  >
                    Open Google Business
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <button
                    type="button"
                    onClick={() => toggleDone(nextStep.id)}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Circle className="h-4 w-4 shrink-0" strokeWidth={2} />
                    Mark as done
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* More tasks: accordion list */}
      {pending.length > 1 && (
        <div>
          <div className="flex items-center justify-between gap-4 mb-3 px-1">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              More to do
            </h3>
            <div className="flex items-center gap-3 min-w-0 shrink-0">
              <div className="h-2 w-20 sm:w-28 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 tabular-nums whitespace-nowrap">
                {completedCount} of {total} done
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {pending.slice(1).map(({ item, i, id }) => {
              const isExpanded = expandedId === id;
              return (
                <Card
                  key={id}
                  className="overflow-hidden transition-all duration-200 border-gray-200/80 hover:border-gray-300 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : id)}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-3.5">
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gray-100 text-sm font-semibold text-gray-600 shrink-0">
                        {pending.findIndex((p) => p.id === id) + 2}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <PriorityPill priority={item.priority} />
                        </div>
                        <p className="font-medium text-gray-900 truncate pr-2">{item.title}</p>
                      </div>
                      <div className="shrink-0 text-gray-400">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                    {isExpanded && (
                      <div
                        className="border-t border-gray-100 px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-3 bg-gray-50/50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p className="text-sm text-gray-600 leading-relaxed mb-4">{item.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 font-medium"
                            onClick={() => window.open("https://business.google.com/", "_blank", "noopener,noreferrer")}
                          >
                            Open Google Business
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="gap-2 font-medium" onClick={() => toggleDone(id)}>
                            Mark as done
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed section (collapsible) */}
      {completed.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowCompleted((c) => !c)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors px-1 py-1 rounded-md"
          >
            {showCompleted ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span>{completed.length} completed</span>
          </button>
          {showCompleted && (
            <div className="mt-2 space-y-2">
              {completed.map(({ item, id }) => (
                <Card key={id} className="border-green-200/60 bg-green-50/30 overflow-hidden">
                  <CardContent className="py-3 px-4 sm:px-5 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                    <p className="text-sm font-medium text-gray-700 line-through flex-1">{item.title}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="font-medium text-gray-500 shrink-0"
                      onClick={() => toggleDone(id)}
                    >
                      Undo
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
