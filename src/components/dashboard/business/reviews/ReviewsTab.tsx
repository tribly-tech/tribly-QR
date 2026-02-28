"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, MessageSquare, Loader2, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { ReviewCard } from "./ReviewCard";
import { useGoogleReviews } from "./useGoogleReviews";
import { useReviewsSummary } from "./useReviewsSummary";
import type { Review, ReviewCategory } from "@/lib/types";
import type { Business } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getAuthToken } from "@/lib/auth";

export type ReviewFilter = "all" | "google" | "manual";

export interface ReviewsTabProps {
  /** Business (for place ID and Google review link) */
  business: Business | null;
  /** Optional Google Place ID; when set, Google reviews are fetched via Places API */
  placeId?: string | null;
}

const PAGE_SIZE = 20;

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapApiToReview(qrId: string, review: any, index: number): Review {
  const contact = review.contact || "";
  const isEmail = contact.includes("@");
  return {
    id: review.id || `api-review-${index}-${review.created_at || Date.now()}`,
    businessId: qrId,
    rating: "need-improvement" as const,
    feedback: review.feedback || "",
    category: "customer-experience" as ReviewCategory,
    customerName: review.name || "",
    customerEmail: isEmail ? contact : undefined,
    customerPhone: !isEmail ? contact : undefined,
    status: "pending" as const,
    autoReplySent: false,
    createdAt: review.created_at || new Date().toISOString(),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function ReviewsTab({
  business,
  placeId: placeIdProp,
}: ReviewsTabProps) {
  const placeId = placeIdProp ?? business?.googlePlaceId ?? null;
  const { rating, userRatingsTotal, reviews: googleReviews, isLoading: isLoadingGoogle } = useGoogleReviews(placeId);

  const [filter, setFilter] = useState<ReviewFilter>("all");

  // GBP sync state
  const [isSyncingGbp, setIsSyncingGbp] = useState(false);

  // Manual reviews pagination state (self-managed)
  const [manualReviews, setManualReviews] = useState<Review[]>([]);
  const [isLoadingManual, setIsLoadingManual] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchManualReviews = useCallback(async (page: number) => {
    if (!business?.id) return;
    setIsLoadingManual(true);
    try {
      const authToken = getAuthToken();
      const headers: HeadersInit = {};
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
      const res = await fetch(
        `/api/business/${encodeURIComponent(business.id)}/reviews?page=${page}&page_size=${PAGE_SIZE}`,
        { headers }
      );
      if (!res.ok) return;
      const data = await res.json();
      const reviewsRaw: any[] = Array.isArray(data?.reviews)
        ? data.reviews
        : Array.isArray(data)
        ? data
        : [];
      setManualReviews(reviewsRaw.map((r, i) => mapApiToReview(business.id, r, i)));
      setTotalCount(data?.total ?? reviewsRaw.length);
      setTotalPages(data?.total_pages ?? 1);
    } catch {
      // silent — reviews are optional
    } finally {
      setIsLoadingManual(false);
    }
  }, [business?.id]);

  useEffect(() => {
    fetchManualReviews(currentPage);
  }, [fetchManualReviews, currentPage]);

  // Trigger GBP reviews sync on mount so we always have fresh Google reviews
  useEffect(() => {
    if (!business?.id) return;
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBase) return;

    const syncReviews = async () => {
      setIsSyncingGbp(true);
      try {
        const authToken = getAuthToken();
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
        await fetch(`${apiBase}/dashboard/v1/gbp/performance/sync-reviews`, {
          method: "POST",
          headers,
        });
      } catch {
        // silent — sync failure should not block the UI
      } finally {
        setIsSyncingGbp(false);
      }
    };

    syncReviews();
    // Only run on mount (business.id is stable for the lifetime of this tab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.id]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const reviewTexts = useMemo(() => {
    const google = (googleReviews ?? []).map((r) => r.text).filter(Boolean) as string[];
    const manual = (manualReviews ?? []).map((r) => r.feedback).filter(Boolean) as string[];
    return [...google, ...manual];
  }, [googleReviews, manualReviews]);

  const { summary, isLoading: isSummaryLoading, error: summaryError } = useReviewsSummary(reviewTexts);

  const showGoogle = filter === "all" || filter === "google";
  const showManual = filter === "all" || filter === "manual";

  const hasGoogle = (placeId && (googleReviews.length > 0 || (rating != null && userRatingsTotal != null))) || false;
  const hasManual = manualReviews.length > 0 || totalCount > 0;
  const isLoading = isLoadingManual || (!!placeId && isLoadingGoogle);

  const filterButtons: { value: ReviewFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "google", label: "Google" },
    { value: "manual", label: "Manual" },
  ];

  // Generate page numbers with ellipsis
  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

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
              <CardTitle className="text-lg font-semibold tracking-tight flex items-center gap-2">
                All reviews
                {totalCount > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({totalCount} manual)
                  </span>
                )}
                {isSyncingGbp && (
                  <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Syncing Google reviews…
                  </span>
                )}
              </CardTitle>
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
                  {isLoadingGoogle && googleReviews.length === 0 ? (
                    <div className="flex items-center gap-2 py-6 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Loading Google reviews…</span>
                    </div>
                  ) : googleReviews.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border bg-muted/20 py-10 text-center space-y-2">
                      <Star className="h-10 w-10 mx-auto text-muted-foreground/50" />
                      <p className="text-sm font-medium text-muted-foreground">No Google reviews to show yet</p>
                      <p className="text-sm text-muted-foreground/90 leading-relaxed max-w-sm mx-auto">
                        Reviews from your Google listing will appear here (Places API returns up to 5).
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-3 list-none p-0 m-0">
                      {googleReviews.map((r, i) => (
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
                  {isLoadingManual && manualReviews.length === 0 ? (
                    <div className="flex items-center gap-2 py-6 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Loading manual reviews…</span>
                    </div>
                  ) : manualReviews.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border bg-muted/20 py-10 text-center space-y-2">
                      <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/50" />
                      <p className="text-sm font-medium text-muted-foreground">No manual reviews yet</p>
                      <p className="text-sm text-muted-foreground/90 leading-relaxed max-w-sm mx-auto">
                        Reviews from customers who chose &quot;Need Improvement&quot; will appear here.
                      </p>
                    </div>
                  ) : (
                    <>
                      <ul className="space-y-3 list-none p-0 m-0">
                        {manualReviews.map((review) => (
                          <li key={review.id}>
                            <ReviewCard review={review} source="manual" />
                          </li>
                        ))}
                      </ul>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-2">
                          <p className="text-xs text-muted-foreground">
                            Page {currentPage} of {totalPages}
                          </p>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage <= 1 || isLoadingManual}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {getPageNumbers().map((p, i) =>
                              p === "..." ? (
                                <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
                              ) : (
                                <Button
                                  key={p}
                                  variant={p === currentPage ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handlePageChange(p as number)}
                                  disabled={isLoadingManual}
                                  className="h-8 w-8 p-0 text-xs"
                                >
                                  {p}
                                </Button>
                              )
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage >= totalPages || isLoadingManual}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
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

              {(filter === "google" && !placeId) || (filter === "manual" && manualReviews.length === 0 && !isLoadingManual) ? (
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
