"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, MessageSquare, Loader2, Sparkles } from "lucide-react";
import { ReviewCard } from "./ReviewCard";
import { useGoogleReviews } from "./useGoogleReviews";
import { useReviewsSummary } from "./useReviewsSummary";
import type { Review } from "@/lib/types";
import type { Business } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ReviewFilter = "all" | "google" | "manual";

export interface ReviewsTabProps {
  /** Business (for place ID and Google review link) */
  business: Business | null;
  /** Manual reviews from your API (need-improvement feedback) */
  manualReviews: Review[];
  /** Manual reviews loading */
  isLoadingManual: boolean;
  /** Optional Google Place ID; when set, Google reviews are fetched via Places API */
  placeId?: string | null;
}

export function ReviewsTab({
  business,
  manualReviews,
  isLoadingManual,
  placeId: placeIdProp,
}: ReviewsTabProps) {
  const placeId = placeIdProp ?? business?.googlePlaceId ?? null;
  const { rating, userRatingsTotal, reviews: googleReviews, isLoading: isLoadingGoogle } = useGoogleReviews(placeId);

  const [filter, setFilter] = useState<ReviewFilter>("all");

  const filteredGoogle = useMemo(() => googleReviews, [googleReviews]);
  const filteredManual = useMemo(() => manualReviews, [manualReviews]);

  const reviewTexts = useMemo(() => {
    const google = (filteredGoogle ?? []).map((r) => r.text).filter(Boolean) as string[];
    const manual = (filteredManual ?? []).map((r) => r.feedback).filter(Boolean) as string[];
    return [...google, ...manual];
  }, [filteredGoogle, filteredManual]);

  const { summary, isLoading: isSummaryLoading, error: summaryError } = useReviewsSummary(reviewTexts);

  const showGoogle = filter === "all" || filter === "google";
  const showManual = filter === "all" || filter === "manual";

  const hasGoogle = (placeId && (googleReviews.length > 0 || (rating != null && userRatingsTotal != null))) || false;
  const hasManual = manualReviews.length > 0;
  const isLoading = isLoadingManual || (!!placeId && isLoadingGoogle);

  const filterButtons: { value: ReviewFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "google", label: "Google" },
    { value: "manual", label: "Manual" },
  ];

  return (
    <div className="space-y-6">
      {/* AI Summary of reviews */}
      <Card className="border-border/80 overflow-hidden">
        <CardHeader className="space-y-1.5 pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </span>
            AI Summary of reviews
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            Overview of sentiment and themes from your Google and manual feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {reviewTexts.length === 0 ? (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              No reviews to summarize yet. Reviews will appear here once you have Google or manual feedback.
            </p>
          ) : isSummaryLoading ? (
            <div className="flex items-center gap-3 text-muted-foreground py-1">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <span className="text-sm font-medium">Generating summary…</span>
            </div>
          ) : summaryError ? (
            <p className="text-sm text-destructive leading-relaxed">{summaryError}</p>
          ) : summary ? (
            <div className="rounded-lg bg-muted/40 border border-border/60 p-4 sm:p-5">
              <p className="text-[15px] text-foreground leading-7 max-w-3xl whitespace-pre-wrap tracking-wide">
                {summary}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="space-y-1.5 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold tracking-tight">All reviews</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Google and manual feedback in one place
              </CardDescription>
            </div>
            <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
              {filterButtons.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                    filter === value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading && !hasGoogle && !hasManual ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-4">
              <Loader2 className="h-8 w-8 animate-spin shrink-0" />
              <p className="text-sm font-medium">Loading reviews…</p>
            </div>
          ) : (
            <>
              {/* Google reviews section */}
              {showGoogle && (hasGoogle || placeId) && (
                <section className="space-y-3">
                  {filter === "all" && (
                    <h3 className="text-sm font-semibold text-foreground/90 flex items-center gap-2 tracking-tight">
                      <Star className="h-4 w-4 text-amber-500" />
                      Google reviews
                    </h3>
                  )}
                  {isLoadingGoogle && filteredGoogle.length === 0 ? (
                    <div className="flex items-center gap-2 py-6 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Loading Google reviews…</span>
                    </div>
                  ) : filteredGoogle.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border bg-muted/20 py-10 text-center space-y-2">
                      <Star className="h-10 w-10 mx-auto text-muted-foreground/50" />
                      <p className="text-sm font-medium text-muted-foreground">No Google reviews to show yet</p>
                      <p className="text-sm text-muted-foreground/90 leading-relaxed max-w-sm mx-auto">
                        Reviews from your Google listing will appear here (Places API returns up to 5).
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-3 list-none p-0 m-0">
                      {filteredGoogle.map((r, i) => (
                        <li key={`google-${r.time}-${i}`}>
                          <ReviewCard review={r} source="google" />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {/* Manual reviews section */}
              {showManual && (
                <section className="space-y-3">
                  {filter === "all" && (hasGoogle || placeId) && (
                    <h3 className="text-sm font-semibold text-foreground/90 flex items-center gap-2 tracking-tight">
                      <MessageSquare className="h-4 w-4 text-amber-500" />
                      Manual feedback
                    </h3>
                  )}
                  {isLoadingManual && filteredManual.length === 0 ? (
                    <div className="flex items-center gap-2 py-6 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Loading manual reviews…</span>
                    </div>
                  ) : filteredManual.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border bg-muted/20 py-10 text-center space-y-2">
                      <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/50" />
                      <p className="text-sm font-medium text-muted-foreground">No manual reviews yet</p>
                      <p className="text-sm text-muted-foreground/90 leading-relaxed max-w-sm mx-auto">
                        Reviews from customers who chose &quot;Need Improvement&quot; will appear here.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-3 list-none p-0 m-0">
                      {filteredManual.map((review) => (
                        <li key={review.id}>
                          <ReviewCard review={review} source="manual" />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {filter === "all" && !hasGoogle && !hasManual && !placeId && (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 py-12 text-center space-y-3">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="text-base font-medium text-foreground/90">No reviews yet</p>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                    Connect your Google Place to see Google reviews. Manual feedback from your review page will appear here too.
                  </p>
                </div>
              )}

              {(filter === "google" && !placeId) || (filter === "manual" && filteredManual.length === 0) ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 py-10 text-center">
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                    {filter === "google"
                      ? "Add a Google Place ID in business settings to show Google reviews here."
                      : "No manual reviews to show."}
                  </p>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
