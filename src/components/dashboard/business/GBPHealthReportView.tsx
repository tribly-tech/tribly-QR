"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { GBPAnalysisData } from "@/components/sales-dashboard/types";
import type { Top3InRadiusResult } from "@/components/sales-dashboard/types";
import {
  CheckCircle2,
  Smile,
  Frown,
  Meh,
  TrendingUp,
  FileText,
  Search as SearchIcon,
  Image,
  Target,
  BarChart3,
  Clock,
  Star,
  Loader2,
  Trophy,
  MapPin,
  ChevronRight,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";

type MetricStatus = "good" | "average" | "poor";

const METRIC_KEYS = [
  "searchRank",
  "profileCompletion",
  "seoScore",
  "reviewScore",
  "reviewReplyScore",
  "responseTime",
  "photos",
  "reviewSentiment",
  "localPackVisibility",
] as const;

type MetricKey = (typeof METRIC_KEYS)[number];

function getMetricDetail(
  key: MetricKey,
  status: MetricStatus
): { title: string; description: string; severity: "High" | "Medium" | "Low"; howToFix: string[] } {
  const severity = status === "poor" ? "High" : status === "average" ? "Medium" : "Low";
  const config: Record<
    MetricKey,
    { title: string; descriptions: Record<MetricStatus, string>; howToFix: string[] }
  > = {
    searchRank: {
      title: "Google Search Rank",
      descriptions: {
        good: "Your business appears in strong positions on Google Search.",
        average: "Your business sometimes appears on the first page but not consistently in top positions.",
        poor: "Your business rarely appears in top search results, so customers may not find you easily.",
      },
      howToFix: [
        "Complete and optimize your Google Business Profile with keywords customers search for.",
        "Add a clear business description, services, and attributes.",
        "Encourage more reviews and respond to them to improve relevance.",
      ],
    },
    profileCompletion: {
      title: "Profile Completion",
      descriptions: {
        good: "Your profile has the key information customers look for.",
        average: "Some important fields are missing from your business profile.",
        poor: "Your profile is incomplete. Missing information hurts visibility and trust.",
      },
      howToFix: [
        "Fill in business hours, website, services, and a detailed description (750+ characters).",
        "Add attributes that match your business type.",
        "Use high-quality photos and keep information up to date.",
      ],
    },
    seoScore: {
      title: "SEO Score",
      descriptions: {
        good: "Your profile is well optimized for search.",
        average: "There is room to improve how your profile matches search intent.",
        poor: "Your profile is not optimized well for search; you may be missing local searches.",
      },
      howToFix: [
        "Use relevant keywords in your business name, description, and services.",
        "Add location-based phrases customers use when searching.",
        "Keep your categories accurate and add all that apply.",
      ],
    },
    reviewScore: {
      title: "Review Score",
      descriptions: {
        good: "You are getting a healthy flow of reviews.",
        average: "Review volume could be higher to build more trust.",
        poor: "Too few reviews; customers rely on reviews to choose businesses.",
      },
      howToFix: [
        "Ask satisfied customers for reviews (e.g. after a visit or purchase).",
        "Use QR codes or short links to your Google review page.",
        "Respond to every review to show you care and encourage more feedback.",
      ],
    },
    reviewReplyScore: {
      title: "Review Reply Score",
      descriptions: {
        good: "You respond to most reviews, which builds trust.",
        average: "Replying to more reviews will improve trust and engagement.",
        poor: "Unanswered reviews can make your business look inattentive.",
      },
      howToFix: [
        "Aim to reply to every review within 24–48 hours.",
        "Thank reviewers and address specific points they mentioned.",
        "For negative reviews, acknowledge the issue and say how you will improve.",
      ],
    },
    responseTime: {
      title: "Response Time",
      descriptions: {
        good: "You respond to reviews quickly.",
        average: "Faster responses can improve customer perception.",
        poor: "Slow responses can make customers feel ignored and may hurt your reputation.",
      },
      howToFix: [
        "Set a goal to respond within 24 hours when possible.",
        "Use saved replies for common themes, but personalize when needed.",
        "Turn on notifications so you see new reviews quickly.",
      ],
    },
    photos: {
      title: "Photos",
      descriptions: {
        good: "You have a solid set of photos that help customers understand your business.",
        average: "Adding more quality photos can improve engagement and trust.",
        poor: "Few or low-quality photos make it harder for customers to choose you.",
      },
      howToFix: [
        "Add at least 15 high-quality photos (exterior, interior, products, team).",
        "Use clear, well-lit images and update them regularly.",
        "Add photos that show what makes your business unique.",
      ],
    },
    reviewSentiment: {
      title: "Review Sentiment",
      descriptions: {
        good: "Most of your reviews are positive.",
        average: "Improving service and addressing concerns can shift sentiment up.",
        poor: "Negative sentiment can discourage new customers from choosing you.",
      },
      howToFix: [
        "Address negative feedback publicly and fix recurring issues.",
        "Encourage happy customers to leave reviews to balance the mix.",
        "Use feedback to improve products and service.",
      ],
    },
    localPackVisibility: {
      title: "Local Pack Visibility",
      descriptions: {
        good: "You appear in the local pack often for relevant searches.",
        average: "You could appear more often in the local 3-pack with better optimization.",
        poor: "You rarely appear in the local pack, so you miss high-intent local searches.",
      },
      howToFix: [
        "Optimize your profile for local keywords and your service area.",
        "Get more reviews and maintain a strong rating.",
        "Keep your profile complete and your business info consistent across the web.",
      ],
    },
  };
  const c = config[key];
  return {
    title: c.title,
    description: c.descriptions[status],
    severity,
    howToFix: c.howToFix,
  };
}

function getStatusFromScore(score: number): "good" | "average" | "poor" {
  if (score > 70) return "good";
  if (score >= 40) return "average";
  return "poor";
}

function getStatus(
  value: number,
  thresholds: { good: number; average: number }
): "good" | "average" | "poor" {
  if (value <= thresholds.good) return "good";
  if (value <= thresholds.average) return "average";
  return "poor";
}

function getStatusBadge(status: "good" | "average" | "poor") {
  const config = {
    good: {
      icon: Smile,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
    },
    average: {
      icon: Meh,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      border: "border-yellow-200",
    },
    poor: {
      icon: Frown,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
    },
  };
  const { icon: Icon, color, bg, border } = config[status];
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${bg} ${border} border shrink-0`}
    >
      <Icon className={`h-3.5 w-3.5 ${color} shrink-0`} />
      <span
        className={`text-xs font-semibold capitalize ${color} whitespace-nowrap`}
      >
        {status}
      </span>
    </div>
  );
}

export interface GBPHealthReportViewProps {
  gbpAnalysisData: GBPAnalysisData;
  top3Result?: Top3InRadiusResult | null;
  top3Loading?: boolean;
}

export function GBPHealthReportView({
  gbpAnalysisData,
  top3Result = null,
  top3Loading = false,
}: GBPHealthReportViewProps) {
  const [selectedMetric, setSelectedMetric] = useState<{
    key: MetricKey;
    status: MetricStatus;
  } | null>(null);

  const detail = selectedMetric
    ? getMetricDetail(selectedMetric.key, selectedMetric.status)
    : null;

  return (
    <div className="space-y-6">
      {/* Business Details and Rank Card */}
      <Card className="bg-white border-2 border-[#dbeafe] rounded-lg">
        <CardContent className="p-4 sm:p-6 lg:p-[26px] flex flex-col gap-4">
          {/* Header: "your Google reputation" */}
          <div className="flex items-center justify-center w-full">
            <div className="relative min-h-[60px] sm:h-[90px] w-full flex items-center justify-center py-2 sm:py-0">
              <div className="flex items-center justify-center gap-2 sm:gap-[12px] flex-wrap sm:flex-nowrap px-2">
                <span
                  className="text-xl sm:text-2xl lg:text-[32px] font-medium text-black leading-[1.4]"
                  style={{
                    fontFamily: "var(--font-clash-grotesk), sans-serif",
                    fontWeight: 500,
                  }}
                >
                  your
                </span>
                <svg
                  width="122"
                  height="41"
                  viewBox="0 0 122 41"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 sm:h-8 lg:h-10 w-auto object-contain flex-shrink-0"
                  aria-label="Google"
                >
                  <g clipPath="url(#clip0_1041_1590)">
                    <path d="M118.242 24.5952L121.628 26.8635C120.529 28.49 117.901 31.2808 113.357 31.2808C107.714 31.2808 103.512 26.8934 103.512 21.3122C103.512 15.373 107.759 11.3438 112.882 11.3438C118.034 11.3438 120.559 15.4624 121.376 17.6859L121.821 18.8201L108.546 24.3415C109.555 26.3413 111.13 27.356 113.357 27.356C115.584 27.356 117.129 26.2517 118.242 24.5952ZM107.833 20.9991L116.698 17.298C116.208 16.0596 114.753 15.1792 113.015 15.1792C110.803 15.1792 107.729 17.149 107.833 20.9991Z" fill="#FF302F"/>
                    <path d="M97.1094 1.18127H101.386V30.3704H97.1094V1.18127Z" fill="#20B15A"/>
                    <path d="M90.3678 12.1195H94.496V29.8478C94.496 37.2046 90.1748 40.234 85.0664 40.234C80.2553 40.234 77.3598 36.9809 76.2756 34.3396L80.0622 32.7576C80.7451 34.3842 82.3935 36.3094 85.0664 36.3094C88.3481 36.3094 90.3678 34.2649 90.3678 30.4448V29.0123H90.2193C89.2391 30.2059 87.3681 31.2803 84.9923 31.2803C80.0324 31.2803 75.4883 26.9378 75.4883 21.3419C75.4883 15.7158 80.0324 11.3287 84.9923 11.3287C87.3534 11.3287 89.2391 12.3883 90.2193 13.5522H90.3678V12.1195ZM90.6646 21.3419C90.6646 17.82 88.3333 15.2533 85.3634 15.2533C82.3637 15.2533 79.8393 17.82 79.8393 21.3419C79.8393 24.8187 82.3637 27.3407 85.3634 27.3407C88.3336 27.3558 90.6649 24.8187 90.6649 21.3419" fill="#3686F7"/>
                    <path d="M52.0186 21.2673C52.0186 27.0126 47.5639 31.2356 42.0992 31.2356C36.6347 31.2356 32.1797 26.9978 32.1797 21.2673C32.1797 15.4922 36.6347 11.2841 42.0992 11.2841C47.5639 11.2841 52.0186 15.4922 52.0186 21.2673ZM47.6826 21.2673C47.6826 17.686 45.0986 15.2234 42.0992 15.2234C39.0997 15.2234 36.5157 17.686 36.5157 21.2673C36.5157 24.8188 39.0997 27.3111 42.0992 27.3111C45.0989 27.3111 47.6826 24.8188 47.6826 21.2673Z" fill="#FF302F"/>
                    <path d="M73.6827 21.3122C73.6827 27.0575 69.2277 31.2805 63.7632 31.2805C58.2985 31.2805 53.8438 27.0573 53.8438 21.3122C53.8438 15.5371 58.2985 11.3438 63.7632 11.3438C69.2277 11.3438 73.6827 15.5223 73.6827 21.3122ZM69.3316 21.3122C69.3316 17.7309 66.7479 15.2683 63.7482 15.2683C60.7485 15.2683 58.1648 17.7309 58.1648 21.3122C58.1648 24.8637 60.7487 27.356 63.7482 27.356C66.7627 27.356 69.3316 24.8489 69.3316 21.3122Z" fill="#FFBA40"/>
                    <path d="M15.8679 26.9082C9.64582 26.9082 4.77536 21.8642 4.77536 15.6115C4.77536 9.35903 9.64582 4.31509 15.8679 4.31509C19.2239 4.31509 21.674 5.64315 23.4856 7.34443L26.4705 4.34503C23.9461 1.91265 20.5753 0.0618896 15.8679 0.0618896C7.34432 0.0621292 0.171875 7.04619 0.171875 15.6115C0.171875 24.1768 7.34432 31.1611 15.8679 31.1611C20.4714 31.1611 23.9461 29.639 26.6636 26.8037C29.4552 23.9981 30.3165 20.0585 30.3165 16.8651C30.3165 15.8652 30.1977 14.8356 30.064 14.0746H15.8679V18.2231H25.9804C25.6834 20.8198 24.8667 22.5956 23.6639 23.8041C22.2086 25.2816 19.9071 26.9082 15.8679 26.9082Z" fill="#3686F7"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_1041_1590">
                      <rect width="122" height="40.0312" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
                <span
                  className="text-xl sm:text-2xl lg:text-[32px] font-medium text-black leading-[1.4]"
                  style={{
                    fontFamily: "var(--font-clash-grotesk), sans-serif",
                    fontWeight: 500,
                  }}
                >
                  reputation
                </span>
              </div>
            </div>
          </div>

          {/* Business Details Section */}
          <div className="bg-white rounded-2xl">
            <div className="flex flex-col gap-2 items-center justify-center px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex flex-col items-center w-full">
                <h3
                  className="text-lg sm:text-xl lg:text-[24px] font-semibold text-[#111827] leading-tight sm:leading-8 text-center break-words px-2"
                  style={{
                    fontFamily: "var(--font-clash-grotesk), sans-serif",
                    fontWeight: 600,
                  }}
                >
                  {gbpAnalysisData.businessName}
                </h3>
              </div>
              <div className="flex flex-wrap items-center justify-center w-full gap-2">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {[...Array(5)].map((_, i) => {
                      const starValue = i + 1;
                      const rating = gbpAnalysisData.rating;
                      const isFilled = starValue <= Math.floor(rating);
                      const isHalf =
                        starValue === Math.ceil(rating) && rating % 1 !== 0;
                      return (
                        <span key={i} className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 inline-block" aria-hidden>
                          {isFilled ? (
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-amber-400">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          ) : isHalf ? (
                            <svg viewBox="0 0 24 24" className="w-full h-full">
                              <defs>
                                <linearGradient id={`star-half-gbp-${i}`} x1="0%" x2="100%" y1="0%" y2="0%">
                                  <stop offset="0%" stopColor="#fbbf24" />
                                  <stop offset="50%" stopColor="#fbbf24" />
                                  <stop offset="50%" stopColor="#e5e7eb" />
                                  <stop offset="100%" stopColor="#e5e7eb" />
                                </linearGradient>
                              </defs>
                              <path fill={`url(#star-half-gbp-${i})`} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full text-gray-300">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          )}
                        </span>
                      );
                    })}
                  </div>
                  <span
                    className="text-base sm:text-[18px] font-semibold text-[#111827] leading-6 sm:leading-7"
                    style={{ fontFamily: "var(--font-clash-grotesk), sans-serif", fontWeight: 600 }}
                  >
                    {gbpAnalysisData.rating}
                  </span>
                  <span
                    className="text-xs sm:text-[14px] font-normal text-[#4b5563] leading-4 sm:leading-5"
                    style={{ fontFamily: "var(--font-clash-grotesk), sans-serif", fontWeight: 400 }}
                  >
                    ({gbpAnalysisData.reviewCount} reviews)
                  </span>
                </div>
              </div>
              <div className="flex gap-2 items-center w-full justify-center px-2">
                <MapPin aria-hidden className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 text-[#4b5563]" />
                <span
                  className="text-xs sm:text-[14px] font-normal text-[#4b5563] leading-4 sm:leading-5 text-center break-words"
                  style={{ fontFamily: "var(--font-clash-grotesk), sans-serif", fontWeight: 400 }}
                >
                  {gbpAnalysisData.address}
                </span>
              </div>
            </div>
          </div>

          {/* Rank Section */}
          <div className="bg-[#fff2f2] rounded-lg w-full">
            <div className="flex flex-col items-center justify-center px-4 sm:px-7 py-3 sm:py-4">
              <div className="flex flex-col gap-2 items-center justify-center w-full">
                <div
                  className="text-4xl sm:text-5xl lg:text-[64px] font-medium text-[#dc2626] text-center leading-tight sm:leading-[72px]"
                  style={{ fontFamily: "var(--font-clash-grotesk), sans-serif", fontWeight: 500 }}
                >
                  {gbpAnalysisData.googleSearchRank}
                </div>
                <span
                  className="text-sm sm:text-[16px] font-medium text-[#dc2626] text-center leading-5 sm:leading-6"
                  style={{ fontFamily: "var(--font-clash-grotesk), sans-serif", fontWeight: 500 }}
                >
                  {(() => {
                    const rankStatus =
                      gbpAnalysisData.metricScores?.searchRank != null
                        ? getStatusFromScore(gbpAnalysisData.metricScores.searchRank)
                        : getStatus(gbpAnalysisData.googleSearchRank, { good: 5, average: 10 });
                    return rankStatus === "good" ? "Good" : rankStatus === "average" ? "Average" : "Poor";
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Top 3 within 5km */}
          <div className="w-full mt-4">
            {top3Loading ? (
              <div className="flex items-center justify-center gap-2 py-6 rounded-xl bg-muted/50 border border-border/50">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Checking local ranking...</span>
              </div>
            ) : top3Result ? (
              <div
                className={`rounded-xl border p-4 sm:p-5 ${
                  top3Result.inTop3
                    ? "bg-emerald-50/90 border-emerald-200"
                    : top3Result.rank > 0
                      ? "bg-amber-50/90 border-amber-200"
                      : "bg-slate-50/90 border-slate-200"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div
                    className={`flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${
                      top3Result.inTop3
                        ? "bg-emerald-100 text-emerald-700"
                        : top3Result.rank > 0
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {top3Result.inTop3 ? (
                      <Trophy className="h-5 w-5 sm:h-6 sm:w-6" />
                    ) : (
                      <MapPin className="h-5 w-5 sm:h-6 sm:w-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`text-base sm:text-lg font-semibold ${
                        top3Result.inTop3
                          ? "text-emerald-800"
                          : top3Result.rank > 0
                            ? "text-amber-800"
                            : "text-slate-700"
                      }`}
                    >
                      {top3Result.inTop3
                        ? `You're in the top 3 within ${top3Result.radiusKm} km`
                        : top3Result.rank > 0
                          ? `Not in top 3 within ${top3Result.radiusKm} km — you're #${top3Result.rank}${top3Result.totalInRadius > 0 ? ` of ${top3Result.totalInRadius} businesses` : ""}`
                          : "Local ranking"}
                    </h4>
                    {top3Result.message && (
                      <p className="text-sm text-muted-foreground mt-1">{top3Result.message}</p>
                    )}
                    {top3Result.fallback && (
                      <p className="text-xs text-muted-foreground mt-2">Based on your search rank in this area.</p>
                    )}
                  </div>
                  {top3Result.inTop3 && (
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        Top 3
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics Grid — click card to open problem detail */}
      <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-5 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 px-1 md:px-0 scrollbar-hide">
        <Card
          className="border border-gray-200 transition-shadow min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink cursor-pointer hover:shadow-md hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
          tabIndex={0}
          role="button"
          onClick={() =>
            setSelectedMetric({
              key: "searchRank",
              status:
                gbpAnalysisData.metricScores?.searchRank != null
                  ? getStatusFromScore(gbpAnalysisData.metricScores.searchRank)
                  : getStatus(gbpAnalysisData.googleSearchRank, { good: 5, average: 10 }),
            })
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedMetric({
                key: "searchRank",
                status:
                  gbpAnalysisData.metricScores?.searchRank != null
                    ? getStatusFromScore(gbpAnalysisData.metricScores.searchRank)
                    : getStatus(gbpAnalysisData.googleSearchRank, { good: 5, average: 10 }),
              });
            }
          }}
        >
          <CardHeader className="pb-4 border-b border-gray-200 mb-6">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50">
                <SearchIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex flex-col flex-1">
                <CardTitle className="text-base font-semibold text-gray-900">Google Search Rank</CardTitle>
                <CardDescription className="text-xs text-gray-600 mt-1">Average position on Google Search</CardDescription>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-2 items-center">
                <div className="text-2xl sm:text-3xl lg:text-[32px] font-medium text-gray-900 leading-none">
                  {gbpAnalysisData.googleSearchRank}
                </div>
                <div className="flex items-center justify-center">
                  {getStatusBadge(
                    gbpAnalysisData.metricScores?.searchRank != null
                      ? getStatusFromScore(gbpAnalysisData.metricScores.searchRank)
                      : getStatus(gbpAnalysisData.googleSearchRank, { good: 5, average: 10 })
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-600 pt-3 border-t border-gray-200 flex items-center justify-center gap-4 flex-wrap">
                <div className="flex items-center gap-2"><Smile className="h-3.5 w-3.5 text-green-600" /><span>Good: &lt; 5</span></div>
                <div className="flex items-center gap-2"><Meh className="h-3.5 w-3.5 text-yellow-600" /><span>Average: 6-10</span></div>
                <div className="flex items-center gap-2"><Frown className="h-3.5 w-3.5 text-red-600" /><span>Poor: &gt; 10</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border border-gray-200 transition-shadow min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink cursor-pointer hover:shadow-md hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
          tabIndex={0}
          role="button"
          onClick={() =>
            setSelectedMetric({
              key: "profileCompletion",
              status:
                gbpAnalysisData.metricScores?.profileCompletion != null
                  ? getStatusFromScore(gbpAnalysisData.metricScores.profileCompletion)
                  : getStatus(100 - gbpAnalysisData.profileCompletion, { good: 20, average: 40 }),
            })
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedMetric({
                key: "profileCompletion",
                status:
                  gbpAnalysisData.metricScores?.profileCompletion != null
                    ? getStatusFromScore(gbpAnalysisData.metricScores.profileCompletion)
                    : getStatus(100 - gbpAnalysisData.profileCompletion, { good: 20, average: 40 }),
              });
            }
          }}
        >
          <CardHeader className="pb-4 border-b border-gray-200 mb-6">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex flex-col flex-1">
                <CardTitle className="text-base font-semibold text-gray-900">Profile Completion</CardTitle>
                <CardDescription className="text-xs text-gray-600 mt-1">Completeness of business profile information</CardDescription>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-2 items-center">
                <div className="text-2xl sm:text-3xl lg:text-[32px] font-medium text-gray-900 leading-none">
                  {gbpAnalysisData.profileCompletion}%
                </div>
                <div className="flex items-center justify-center">
                  {getStatusBadge(
                    gbpAnalysisData.metricScores?.profileCompletion != null
                      ? getStatusFromScore(gbpAnalysisData.metricScores.profileCompletion)
                      : getStatus(100 - gbpAnalysisData.profileCompletion, { good: 20, average: 40 })
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center">{gbpAnalysisData.missingFields} fields missing</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border border-gray-200 transition-shadow min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink cursor-pointer hover:shadow-md hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
          tabIndex={0}
          role="button"
          onClick={() =>
            setSelectedMetric({
              key: "seoScore",
              status:
                gbpAnalysisData.metricScores?.seoScore != null
                  ? getStatusFromScore(gbpAnalysisData.metricScores.seoScore)
                  : getStatus(100 - gbpAnalysisData.seoScore, { good: 30, average: 60 }),
            })
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedMetric({ key: "seoScore", status: gbpAnalysisData.metricScores?.seoScore != null ? getStatusFromScore(gbpAnalysisData.metricScores.seoScore) : getStatus(100 - gbpAnalysisData.seoScore, { good: 30, average: 60 }) });
            }
          }}
        >
          <CardHeader className="pb-4 border-b border-gray-200 mb-6">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-green-50">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex flex-col flex-1">
                <CardTitle className="text-base font-semibold text-gray-900">SEO Score</CardTitle>
                <CardDescription className="text-xs text-gray-600 mt-1">Search engine optimization effectiveness</CardDescription>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-2 items-center">
                <div className="text-2xl sm:text-3xl lg:text-[32px] font-medium text-gray-900 leading-none">
                  {gbpAnalysisData.seoScore}%
                </div>
                <div className="flex items-center justify-center">
                  {getStatusBadge(
                    gbpAnalysisData.metricScores?.seoScore != null
                      ? getStatusFromScore(gbpAnalysisData.metricScores.seoScore)
                      : getStatus(100 - gbpAnalysisData.seoScore, { good: 30, average: 60 })
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center">Keywords optimization needed</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border border-gray-200 transition-shadow min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink cursor-pointer hover:shadow-md hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
          tabIndex={0}
          role="button"
          onClick={() =>
            setSelectedMetric({
              key: "reviewScore",
              status:
                gbpAnalysisData.metricScores?.reviewScore != null
                  ? getStatusFromScore(gbpAnalysisData.metricScores.reviewScore)
                  : getStatus(2 - gbpAnalysisData.reviewScore, { good: 0, average: 1 }),
            })
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedMetric({ key: "reviewScore", status: gbpAnalysisData.metricScores?.reviewScore != null ? getStatusFromScore(gbpAnalysisData.metricScores.reviewScore) : getStatus(2 - gbpAnalysisData.reviewScore, { good: 0, average: 1 }) });
            }
          }}
        >
          <CardHeader className="pb-4 border-b border-gray-200 mb-6">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-yellow-50">
                <Star className="h-5 w-5 text-yellow-600 fill-yellow-600" />
              </div>
              <div className="flex flex-col flex-1">
                <CardTitle className="text-base font-semibold text-gray-900">Review Score</CardTitle>
                <CardDescription className="text-xs text-gray-600 mt-1">Average number of reviews received per week</CardDescription>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-2 items-center">
                <div className="text-2xl sm:text-3xl lg:text-[32px] font-medium text-gray-900 leading-none">
                  {gbpAnalysisData.reviewScore}
                  <span className="text-xl sm:text-2xl text-gray-500">/week</span>
                </div>
                <div className="flex items-center justify-center">
                  {getStatusBadge(
                    gbpAnalysisData.metricScores?.reviewScore != null
                      ? getStatusFromScore(gbpAnalysisData.metricScores.reviewScore)
                      : getStatus(2 - gbpAnalysisData.reviewScore, { good: 0, average: 1 })
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center">Target: 2 reviews per week</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border border-gray-200 transition-shadow min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink cursor-pointer hover:shadow-md hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
          tabIndex={0}
          role="button"
          onClick={() =>
            setSelectedMetric({
              key: "reviewReplyScore",
              status:
                gbpAnalysisData.metricScores?.reviewReplyScore != null
                  ? getStatusFromScore(gbpAnalysisData.metricScores.reviewReplyScore)
                  : getStatus(100 - gbpAnalysisData.reviewReplyScore, { good: 20, average: 50 }),
            })
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedMetric({ key: "reviewReplyScore", status: gbpAnalysisData.metricScores?.reviewReplyScore != null ? getStatusFromScore(gbpAnalysisData.metricScores.reviewReplyScore) : getStatus(100 - gbpAnalysisData.reviewReplyScore, { good: 20, average: 50 }) });
            }
          }}
        >
          <CardHeader className="pb-4 border-b border-gray-200 mb-6">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50">
                <CheckCircle2 className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex flex-col flex-1">
                <CardTitle className="text-base font-semibold text-gray-900">Review Reply Score</CardTitle>
                <CardDescription className="text-xs text-gray-600 mt-1">Percentage of reviews responded to</CardDescription>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-2 items-center">
                <div className="text-2xl sm:text-3xl lg:text-[32px] font-medium text-gray-900 leading-none">
                  {gbpAnalysisData.reviewReplyScore}%
                </div>
                <div className="flex items-center justify-center">
                  {getStatusBadge(
                    gbpAnalysisData.metricScores?.reviewReplyScore != null
                      ? getStatusFromScore(gbpAnalysisData.metricScores.reviewReplyScore)
                      : getStatus(100 - gbpAnalysisData.reviewReplyScore, { good: 20, average: 50 })
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center">Target: 80%+ response rate</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border border-gray-200 transition-shadow min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink cursor-pointer hover:shadow-md hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
          tabIndex={0}
          role="button"
          onClick={() =>
            setSelectedMetric({
              key: "responseTime",
              status:
                gbpAnalysisData.metricScores?.responseTime != null
                  ? getStatusFromScore(gbpAnalysisData.metricScores.responseTime)
                  : getStatus(gbpAnalysisData.responseTime, { good: 24, average: 72 }),
            })
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedMetric({ key: "responseTime", status: gbpAnalysisData.metricScores?.responseTime != null ? getStatusFromScore(gbpAnalysisData.metricScores.responseTime) : getStatus(gbpAnalysisData.responseTime, { good: 24, average: 72 }) });
            }
          }}
        >
          <CardHeader className="pb-4 border-b border-gray-200 mb-6">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-orange-50">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex flex-col flex-1">
                <CardTitle className="text-base font-semibold text-gray-900">Response Time</CardTitle>
                <CardDescription className="text-xs text-gray-600 mt-1">Average time to respond to reviews</CardDescription>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-2 items-center">
                <div className="text-2xl sm:text-3xl lg:text-[32px] font-medium text-gray-900 leading-none">
                  {gbpAnalysisData.responseTime < 24
                    ? `${gbpAnalysisData.responseTime}h`
                    : `${Math.floor(gbpAnalysisData.responseTime / 24)}d`}
                </div>
                <div className="flex items-center justify-center">
                  {getStatusBadge(
                    gbpAnalysisData.metricScores?.responseTime != null
                      ? getStatusFromScore(gbpAnalysisData.metricScores.responseTime)
                      : getStatus(gbpAnalysisData.responseTime, { good: 24, average: 72 })
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center">Target: under 24 hours</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border border-gray-200 transition-shadow min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink cursor-pointer hover:shadow-md hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
          tabIndex={0}
          role="button"
          onClick={() =>
            setSelectedMetric({
              key: "photos",
              status:
                gbpAnalysisData.metricScores?.photoCount != null && gbpAnalysisData.metricScores?.photoQuality != null
                  ? getStatusFromScore((gbpAnalysisData.metricScores.photoCount + gbpAnalysisData.metricScores.photoQuality) / 2)
                  : getStatus(15 - gbpAnalysisData.photoCount, { good: 0, average: 5 }),
            })
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedMetric({
                key: "photos",
                status:
                  gbpAnalysisData.metricScores?.photoCount != null && gbpAnalysisData.metricScores?.photoQuality != null
                    ? getStatusFromScore((gbpAnalysisData.metricScores.photoCount + gbpAnalysisData.metricScores.photoQuality) / 2)
                    : getStatus(15 - gbpAnalysisData.photoCount, { good: 0, average: 5 }),
              });
            }
          }}
        >
          <CardHeader className="pb-4 border-b border-gray-200 mb-6">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-pink-50">
                <Image className="h-5 w-5 text-pink-600" />
              </div>
              <div className="flex flex-col flex-1">
                <CardTitle className="text-base font-semibold text-gray-900">Photos</CardTitle>
                <CardDescription className="text-xs text-gray-600 mt-1">Photo count and quality score</CardDescription>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-2 items-center">
                <div className="text-2xl sm:text-3xl lg:text-[32px] font-medium text-gray-900 leading-none">
                  {gbpAnalysisData.photoCount}
                </div>
                <div className="text-base text-gray-600 font-medium">Quality: {gbpAnalysisData.photoQuality}%</div>
                <div className="flex items-center justify-center">
                  {getStatusBadge(
                    gbpAnalysisData.metricScores?.photoCount != null &&
                      gbpAnalysisData.metricScores?.photoQuality != null
                      ? getStatusFromScore(
                          (gbpAnalysisData.metricScores.photoCount + gbpAnalysisData.metricScores.photoQuality) / 2
                        )
                      : getStatus(15 - gbpAnalysisData.photoCount, { good: 0, average: 5 })
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center">Target: 15+ high-quality photos</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border border-gray-200 transition-shadow min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink cursor-pointer hover:shadow-md hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
          tabIndex={0}
          role="button"
          onClick={() =>
            setSelectedMetric({
              key: "reviewSentiment",
              status:
                gbpAnalysisData.metricScores?.positiveSentiment != null
                  ? getStatusFromScore(gbpAnalysisData.metricScores.positiveSentiment)
                  : getStatus(100 - gbpAnalysisData.positiveReviews, { good: 20, average: 40 }),
            })
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedMetric({ key: "reviewSentiment", status: gbpAnalysisData.metricScores?.positiveSentiment != null ? getStatusFromScore(gbpAnalysisData.metricScores.positiveSentiment) : getStatus(100 - gbpAnalysisData.positiveReviews, { good: 20, average: 40 }) });
            }
          }}
        >
          <CardHeader className="pb-4 border-b border-gray-200 mb-6">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-teal-50">
                <BarChart3 className="h-5 w-5 text-teal-600" />
              </div>
              <div className="flex flex-col flex-1">
                <CardTitle className="text-base font-semibold text-gray-900">Review Sentiment</CardTitle>
                <CardDescription className="text-xs text-gray-600 mt-1">Breakdown of review ratings</CardDescription>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-2 items-center">
                <div className="text-2xl sm:text-3xl lg:text-[32px] font-medium text-gray-900 leading-none">
                  {gbpAnalysisData.positiveReviews}%
                </div>
                <div className="flex items-center justify-center">
                  {getStatusBadge(
                    gbpAnalysisData.metricScores?.positiveSentiment != null
                      ? getStatusFromScore(gbpAnalysisData.metricScores.positiveSentiment)
                      : getStatus(100 - gbpAnalysisData.positiveReviews, { good: 20, average: 40 })
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-600 pt-3 border-t border-gray-200 flex items-center justify-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span>Positive: {gbpAnalysisData.positiveReviews}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <span>Neutral: {gbpAnalysisData.neutralReviews}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span>Negative: {gbpAnalysisData.negativeReviews}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border border-gray-200 transition-shadow min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink cursor-pointer hover:shadow-md hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
          tabIndex={0}
          role="button"
          onClick={() =>
            setSelectedMetric({
              key: "localPackVisibility",
              status:
                gbpAnalysisData.metricScores?.localPackVisibility != null
                  ? getStatusFromScore(gbpAnalysisData.metricScores.localPackVisibility)
                  : getStatus(100 - gbpAnalysisData.localPackAppearances, { good: 30, average: 60 }),
            })
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedMetric({ key: "localPackVisibility", status: gbpAnalysisData.metricScores?.localPackVisibility != null ? getStatusFromScore(gbpAnalysisData.metricScores.localPackVisibility) : getStatus(100 - gbpAnalysisData.localPackAppearances, { good: 30, average: 60 }) });
            }
          }}
        >
          <CardHeader className="pb-4 border-b border-gray-200 mb-6">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-50">
                <Target className="h-5 w-5 text-cyan-600" />
              </div>
              <div className="flex flex-col flex-1">
                <CardTitle className="text-base font-semibold text-gray-900">Local Pack Visibility</CardTitle>
                <CardDescription className="text-xs text-gray-600 mt-1">Frequency in Google's local 3-pack</CardDescription>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-2 items-center">
                <div className="text-2xl sm:text-3xl lg:text-[32px] font-medium text-gray-900 leading-none">
                  {gbpAnalysisData.localPackAppearances}%
                </div>
                <div className="flex items-center justify-center">
                  {getStatusBadge(
                    gbpAnalysisData.metricScores?.localPackVisibility != null
                      ? getStatusFromScore(gbpAnalysisData.metricScores.localPackVisibility)
                      : getStatus(100 - gbpAnalysisData.localPackAppearances, { good: 30, average: 60 })
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center">Target: 50%+ of searches</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Problem detail dialog — structured, readable redesign */}
      <Dialog open={!!selectedMetric} onOpenChange={(open) => !open && setSelectedMetric(null)}>
        <DialogContent className="max-w-lg rounded-2xl shadow-xl border-0 p-0 gap-0 overflow-hidden">
          {detail && (
            <>
              {/* Header: metric name + severity (extra right/top padding for close button) */}
              <div className="bg-muted/40 pl-6 pr-12 pt-10 pb-5 border-b border-border/60">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
                    {detail.title}
                  </DialogTitle>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 ${
                      detail.severity === "High"
                        ? "bg-red-100 text-red-800"
                        : detail.severity === "Medium"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {detail.severity === "High" && <AlertTriangle className="h-3.5 w-3.5" />}
                    {detail.severity} severity
                  </span>
                </div>
              </div>

              <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Problem — what's going on */}
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-muted-foreground text-xs font-bold">
                      1
                    </span>
                    What&apos;s going on
                  </h3>
                  <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3.5">
                    <p className="text-sm text-foreground leading-[1.6]">
                      {detail.description}
                    </p>
                  </div>
                </section>

                {/* How to fix — actionable steps */}
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    How to fix it
                  </h3>
                  <ol className="space-y-3">
                    {detail.howToFix.map((step, i) => (
                      <li
                        key={i}
                        className="flex gap-3 rounded-xl border border-border/60 bg-white px-4 py-3.5 shadow-sm"
                      >
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-bold"
                          aria-hidden
                        >
                          {i + 1}
                        </span>
                        <p className="text-sm text-foreground leading-[1.6] pt-0.5">
                          {step}
                        </p>
                      </li>
                    ))}
                  </ol>
                </section>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
