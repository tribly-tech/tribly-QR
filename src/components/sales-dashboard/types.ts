import { BusinessCategory, BusinessStatus } from "@/lib/types";

// --- GBP Score Tool: Data Model (India SMB, tier-1 & tier-2) ---

/** Business summary for report header */
export interface GBPBusinessInfo {
  name: string;
  location: string;
  category: string;
}

/** Score with formula, benchmark, and grade (explainable to business owners) */
export interface ScoreWithBenchmark {
  value: number;
  grade: "good" | "average" | "poor";
  benchmark: string;
  formula_used: string;
  /** 0-100 for UI: Red <40, Yellow 40-70, Green >70 */
  scoreOutOf100?: number;
}

/** Profile completion: filled_fields / total_required_fields * 100, weighted fields */
export interface ProfileCompletionScore extends ScoreWithBenchmark {
  filledFields: number;
  totalRequiredFields: number;
  missingFields: string[];
}

/** Review performance: velocity, sentiment, response rate/time */
export interface ReviewScoreDetail {
  velocity: number; // reviews per week (reviews_last_30 / 4)
  sentiment: number; // positive*1 + neutral*0.5 - negative*1 (normalized 0-100)
  response_rate: number; // replied_reviews / total_reviews * 100
  response_time: number; // hours
  value: number; // composite 0-100
  grade: "good" | "average" | "poor";
  benchmark: string;
  formula_used: string;
  scoreOutOf100?: number;
}

/** Photos: count, quality, freshness, comparison */
export interface PhotosScore extends ScoreWithBenchmark {
  count: number;
  quality: number;
  target: string; // e.g. "15+ high quality"
}

/** Local pack visibility */
export interface LocalVisibilityScore extends ScoreWithBenchmark {
  appearancesPercent: number;
  target: string; // e.g. ">50%"
}

/** Full scores block for JSON output */
export interface GBPReportScores {
  search_rank: ScoreWithBenchmark;
  profile_completion: ProfileCompletionScore;
  seo_score: ScoreWithBenchmark;
  review_score: ReviewScoreDetail;
  photos: PhotosScore;
  local_visibility: LocalVisibilityScore;
}

/** Insight: issue, impact, action, priority (for recommendations) */
export interface GBPInsight {
  issue: string;
  impact: string;
  action: string;
  priority: "high" | "medium" | "low";
}

/** API mapping: which field comes from which source */
export interface GBPAPIMapping {
  google_business_profile_api: string[];
  search_console: string[];
  reviews_api: string[];
  places_insights: string[];
  competitor_estimation: string[];
}

// --- Legacy / UI-compatible types ---

// GBP Analysis Data Type (flat shape for existing UI; populated from new logic)
export interface GBPAnalysisData {
  businessName: string;
  rating: number;
  reviewCount: number;
  address: string;
  googleSearchRank: number;
  profileCompletion: number;
  missingFields: number;
  seoScore: number;
  reviewScore: number;
  reviewReplyScore: number;
  responseTime: number;
  photoCount: number;
  photoQuality: number;
  positiveReviews: number;
  neutralReviews: number;
  negativeReviews: number;
  localPackAppearances: number;
  actionItems: ActionItem[];
  /** 0-100 per metric for UI: Red <40, Yellow 40-70, Green >70 */
  metricScores?: Record<string, number>;
  /** Detailed scores (formula, benchmark) for explainability */
  scoresDetail?: GBPReportScores;
  /** Insights as issue/impact/action/priority */
  insights?: GBPInsight[];
}

export interface ActionItem {
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
}

export interface Recommendation extends ActionItem {
  impact: number;
}

// New Business Form State
export interface NewBusinessState {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  area: string;
   pincode: string;
  category: BusinessCategory | "";
  overview: string;
  googleBusinessReviewLink: string;
  paymentPlan: "qr-basic" | "qr-plus" | "";
  status: BusinessStatus;
  paymentExpiryDate: string;
  paymentStatus: "active" | "past-due" | "cancelled" | undefined;
  services: string[];
}

// Payment Status Type
export type PaymentStatus = "pending" | "success" | "failed" | "expired";

// Industry Benchmarks (India SMB: tier-1 & tier-2)
// Explainable: formula + data source + benchmark + improvement suggestion
export const BENCHMARKS = {
  // Search rank: average position. Good <5, Average 6-10, Poor >10
  responseTime: { excellent: 12, good: 24, average: 48, poor: 72 },
  photoCount: { excellent: 20, good: 15, average: 10, poor: 5 },
  photoQuality: { excellent: 90, good: 75, average: 60, poor: 40 },
  reviewReplyRate: { excellent: 90, good: 80, average: 60, poor: 40 },
  profileCompletion: { excellent: 95, good: 85, average: 70, poor: 50 },
  searchRank: { excellent: 3, good: 5, average: 10, poor: 15 }, // position; lower is better
  seoScore: { excellent: 85, good: 70, average: 50, poor: 30 },
  reviewVelocity: { excellent: 3, good: 2, average: 1, poor: 0 }, // reviews per week
  positiveSentiment: { excellent: 85, good: 75, average: 65, poor: 50 },
  localPackVisibility: { excellent: 60, good: 45, average: 30, poor: 15 }, // target >50%
} as const;

export type BenchmarkMetric = keyof typeof BENCHMARKS;

// UI rules: Red <40, Yellow 40-70, Green >70 (0-100 score)
export const UI_SCORE_THRESHOLDS = { red: 40, yellow: 70 } as const;

/** Response JSON schema for GBP Score Tool API */
export interface GBPAnalysisReportResponse {
  business: GBPBusinessInfo;
  scores: GBPReportScores;
  insights: GBPInsight[];
}

/** Place details from Google Places / locations API (for GBP analysis input) */
export interface PlaceDetailsData {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  location?: { lat: number; lng: number };
  geometry?: { location: { lat: number; lng: number } };
  types?: string[];
  business_status?: string;
  rating?: number;
  user_ratings_total?: number;
}

/** Result of "top 3 within radius" check for local competitiveness */
export interface Top3InRadiusResult {
  inTop3: boolean;
  rank: number;
  totalInRadius: number;
  radiusKm: number;
  message?: string;
  /** When true, result is derived from search rank (no nearby API) */
  fallback?: boolean;
}
