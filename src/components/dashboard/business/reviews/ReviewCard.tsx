"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Star,
  User,
  Calendar,
  Mail,
  Phone,
  Reply,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Review } from "@/lib/types";
import type { GooglePlaceReview } from "@/services/external/google-places";
import { cn } from "@/lib/utils";

// -----------------------------------------------------------------------------
// Date formatting (shared: day, month, year for both Google and manual)
// -----------------------------------------------------------------------------

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

/** Format a date as "18 Feb 2026" for consistent display across Google and manual reviews. */
function formatReviewDate(date: Date | number): string {
  const d = typeof date === "number" ? new Date(date * 1000) : date;
  return d.toLocaleDateString("en-IN", DATE_OPTIONS);
}

// -----------------------------------------------------------------------------
// Normalized review (single shape for the card UI)
// -----------------------------------------------------------------------------

export interface NormalizedReview {
  source: "google" | "manual";
  badgeLabel: string;
  badgeIcon: React.ReactNode | null;
  starRating: number;
  dateStr: string;
  bodyText: string;
  authorName: string;
  authorAvatarUrl: string | null;
  authorContact: { email?: string; phone?: string } | null;
  replyHint: string;
  replyPlaceholder: string;
}

const RATING_LABELS: Record<Review["rating"], string> = {
  excellent: "Excellent",
  good: "Good",
  average: "Average",
  "need-improvement": "Need Improvement",
};

const RATING_TO_STARS: Record<Review["rating"], number> = {
  excellent: 5,
  good: 4,
  average: 3,
  "need-improvement": 1,
};

function normalizeGoogleReview(review: GooglePlaceReview): NormalizedReview {
  const dateStr = review.time
    ? formatReviewDate(review.time)
    : review.relative_time_description || "";
  return {
    source: "google",
    badgeLabel: "Google",
    badgeIcon: (
      <img
        src="/assets/Google-icon.svg"
        alt=""
        className="h-3.5 w-3.5 shrink-0"
      />
    ),
    starRating: review.rating,
    dateStr,
    bodyText: review.text ?? "",
    authorName: review.author_name,
    authorAvatarUrl: review.profile_photo_url ?? null,
    authorContact: null,
    replyHint: "Your reply will be published on your Google Business Profile as a public response to this review.",
    replyPlaceholder: "Compose your response…",
  };
}

function normalizeManualReview(review: Review): NormalizedReview {
  const dateStr = formatReviewDate(new Date(review.createdAt));
  const ratingLabel = RATING_LABELS[review.rating] ?? review.rating;
  return {
    source: "manual",
    badgeLabel: `Manual · ${ratingLabel}`,
    badgeIcon: null,
    starRating: RATING_TO_STARS[review.rating],
    dateStr,
    bodyText: review.feedback ?? "",
    authorName: review.customerName ?? "Customer",
    authorAvatarUrl: null,
    authorContact:
      review.customerEmail || review.customerPhone
        ? { email: review.customerEmail, phone: review.customerPhone }
        : null,
    replyHint:
      "Your reply will be delivered to the customer via email, WhatsApp, or SMS, depending on their contact preferences.",
    replyPlaceholder: "Compose your response…",
  };
}

// -----------------------------------------------------------------------------
// Shared UI: Stars
// -----------------------------------------------------------------------------

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4 transition-colors",
            i <= full ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
          )}
          aria-hidden
        />
      ))}
      {hasHalf && full < 5 && (
        <Star className="h-4 w-4 fill-amber-400/70 text-amber-400" aria-hidden />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Props and single ReviewCard component
// -----------------------------------------------------------------------------

interface ReviewCardGoogleProps {
  review: GooglePlaceReview;
  source: "google";
}

interface ReviewCardManualProps {
  review: Review;
  source: "manual";
}

export type ReviewCardProps = ReviewCardGoogleProps | ReviewCardManualProps;

const CARD_CLASSES = cn(
  "overflow-hidden rounded-xl border border-border/60 bg-card transition-all duration-200",
  "hover:border-border hover:shadow-md hover:shadow-black/5",
  "focus-within:ring-2 focus-within:ring-ring/20 focus-within:ring-offset-2"
);

export function ReviewCard(props: ReviewCardProps) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");

  const normalized =
    props.source === "google"
      ? normalizeGoogleReview(props.review)
      : normalizeManualReview(props.review);

  return (
    <Card className={CARD_CLASSES}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-5">
          {/* Header: source badge, stars, date */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge
                variant="secondary"
                className={cn(
                  "font-medium text-xs border-0 gap-1.5",
                  normalized.source === "google"
                    ? "bg-blue-50 text-blue-800 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-800/60"
                    : "bg-muted/80 text-muted-foreground"
                )}
              >
                {normalized.badgeIcon}
                {normalized.badgeLabel}
              </Badge>
              <Stars rating={normalized.starRating} />
            </div>
            <span className="text-sm text-muted-foreground flex items-center gap-1.5 font-medium">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {normalized.dateStr}
            </span>
          </div>

          {/* Body text — contained for emphasis */}
          {normalized.bodyText && (
            <div className="rounded-lg border border-border/80 bg-muted/30 px-4 py-3.5">
              <p className="text-[15px] text-foreground leading-7 tracking-wide m-0">
                {normalized.bodyText}
              </p>
            </div>
          )}

          {/* Author row + Reply button */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-muted-foreground text-sm flex-wrap leading-relaxed">
              {normalized.authorAvatarUrl ? (
                <img
                  src={normalized.authorAvatarUrl}
                  alt=""
                  className="h-7 w-7 rounded-full object-cover ring-1 ring-border/50 shrink-0"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted shrink-0">
                  <User className="h-3.5 w-3.5" />
                </span>
              )}
              <span className="font-medium text-foreground/90">
                {normalized.authorName}
              </span>
              {normalized.authorContact?.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {normalized.authorContact.email}
                </span>
              )}
              {normalized.authorContact?.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {normalized.authorContact.phone}
                </span>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground border-border/80"
              onClick={() => setReplyOpen((o) => !o)}
            >
              <Reply className="h-3.5 w-3.5" />
              Reply
              {replyOpen ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>

          {/* Expandable reply composer */}
          {replyOpen && (
            <div className="rounded-lg border border-border/80 bg-muted/30 p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {normalized.replyHint}
              </p>
              <Textarea
                placeholder={normalized.replyPlaceholder}
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
                className="min-h-[88px] resize-y text-sm leading-relaxed"
                maxLength={3500}
              />
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReplyOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (replyDraft.trim()) {
                      navigator.clipboard.writeText(replyDraft.trim());
                    }
                  }}
                  disabled={!replyDraft.trim()}
                >
                  Submit response
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
