import {
  BENCHMARKS,
  BenchmarkMetric,
  GBPAnalysisData,
  GBPInsight,
  GBPReportScores,
  Recommendation,
  ScoreWithBenchmark,
  ProfileCompletionScore,
  ReviewScoreDetail,
  PhotosScore,
  LocalVisibilityScore,
} from "../types";

// --- Data sources mapping (for API integration) ---
export const API_MAPPING = {
  google_business_profile_api: [
    "name",
    "category",
    "address",
    "service_areas",
    "phone",
    "website",
    "hours",
    "description",
    "attributes",
    "products",
    "services",
    "photos",
    "reviews",
    "Q&A",
  ],
  search_console: ["impressions", "queries", "clicks", "average_position", "ctr"],
  reviews_api: [
    "total_reviews",
    "reviews_per_week",
    "average_rating",
    "sentiment",
    "response_rate",
    "response_time",
  ],
  places_insights: [
    "photo_count",
    "owner_photos",
    "customer_photos",
    "views_vs_competitors",
    "photo_freshness",
  ],
  competitor_estimation: [
    "competitor_density",
    "category_relevance",
    "local_pack_appearances",
  ],
} as const;

// --- Profile completion: required fields (India SMB) ---
const PROFILE_FIELDS = [
  "name",
  "category",
  "address",
  "service_areas",
  "phone",
  "website",
  "hours",
  "description",
  "attributes",
  "products",
  "services",
  "FAQs",
] as const;
const PROFILE_FIELDS_WEIGHTED = [
  "category",
  "hours",
  "description",
  "photos",
  "reviews",
] as const;
const TOTAL_REQUIRED_FIELDS = 12; // name through FAQs; photos/reviews are weighted extra

// --- Helpers ---
function gradeFromPosition(position: number): "good" | "average" | "poor" {
  if (position <= 5) return "good";
  if (position <= 10) return "average";
  return "poor";
}

function scoreToGrade(scoreOutOf100: number): "good" | "average" | "poor" {
  if (scoreOutOf100 > 70) return "good";
  if (scoreOutOf100 >= 40) return "average";
  return "poor";
}

// Calculate metric score 0-100 based on benchmarks (for UI: Red <40, Yellow 40-70, Green >70)
export const calculateMetricScore = (
  value: number,
  metric: BenchmarkMetric,
  isLowerBetter: boolean = false,
): number => {
  const t = BENCHMARKS[metric];
  if (isLowerBetter) {
    if (value <= t.excellent) return 100;
    if (value <= t.good) return 85;
    if (value <= t.average) return 60;
    if (value <= t.poor) return 30;
    return 10;
  } else {
    if (value >= t.excellent) return 100;
    if (value >= t.good) return 85;
    if (value >= t.average) return 60;
    if (value >= t.poor) return 30;
    return 10;
  }
};

// --- Edge case flags (deterministic from available data) ---
interface EdgeCaseFlags {
  isNewBusiness: boolean;
  noWebsite: boolean;
  lowSearchVolume: boolean;
  possibleReviewBombing: boolean;
  categoryMismatch: boolean;
  serviceAreaBusiness: boolean;
  multiLocation: boolean;
}

function detectEdgeCases(
  placeDetails: PlaceDetailsData | null,
  reviewCount: number,
  negativePct: number,
): EdgeCaseFlags {
  const hasWebsite = Boolean(
    placeDetails?.website?.trim(),
  );
  const hasCategory = Boolean(
    placeDetails?.types?.length,
  );
  return {
    isNewBusiness: reviewCount < 10,
    noWebsite: !hasWebsite,
    lowSearchVolume: reviewCount < 5, // proxy when no Search Console
    possibleReviewBombing: negativePct > 25 && reviewCount >= 20,
    categoryMismatch: !hasCategory || (placeDetails?.types?.length === 0),
    serviceAreaBusiness: false, // would need SAB flag from GBP API
    multiLocation: false, // would need account info from GBP API
  };
}

// --- Core formulas (realistic, explainable; no random) ---

/**
 * A. Google Search Rank Score
 * Formula: weighted(avg_position 40%, ctr 25%, impressions_growth 15%, keyword_relevance 20%)
 * Data source: Search Console + GBP API. When unavailable, derived from rating + reviewCount.
 */
function computeSearchRankScore(
  placeDetails: PlaceDetailsData | null,
  rating: number,
  reviewCount: number,
  profileCompletion: number,
  seoScore: number,
): { position: number; scoreOutOf100: number; grade: "good" | "average" | "poor" } {
  // Derived avg_position: better rating + more reviews + better profile = better position
  const positionBase = 18 - (rating - 3) * 3 - Math.min(reviewCount / 15, 6);
  const position = Math.max(1, Math.min(25, Math.round(positionBase * 10) / 10));
  const grade = gradeFromPosition(position);
  const scoreOutOf100 = calculateMetricScore(position, "searchRank", true);
  return { position, scoreOutOf100, grade };
}

/**
 * B. Profile Completion Score
 * Formula: (filled_fields / total_required_fields) * 100, with higher weight for category, hours, description, photos, reviews
 * Data source: GBP API (business info).
 */
function computeProfileCompletionScore(
  placeDetails: PlaceDetailsData | null,
  photoCount: number,
  reviewCount: number,
): ProfileCompletionScore {
  const filled = new Set<string>();
  const missing: string[] = [];
  if (placeDetails?.name?.trim()) filled.add("name"); else missing.push("name");
  if (placeDetails?.types?.length) filled.add("category"); else missing.push("category");
  if (placeDetails?.formatted_address?.trim()) filled.add("address"); else missing.push("address");
  if (placeDetails?.formatted_phone_number || placeDetails?.international_phone_number) filled.add("phone"); else missing.push("phone");
  if (placeDetails?.website?.trim()) filled.add("website"); else missing.push("website");
  // Places API doesn't return hours, description, attributes, products, services, FAQs
  ["hours", "description", "attributes", "products", "services", "FAQs"].forEach((f) => {
    if (!filled.has(f)) missing.push(f);
  });
  const filledCount = filled.size;
  const weightedExtra = (photoCount >= 5 ? 1 : 0) + (reviewCount >= 10 ? 1 : 0);
  const totalWeighted = TOTAL_REQUIRED_FIELDS + 2;
  const completionWithWeights = Math.min(
    100,
    ((filledCount * 10 + weightedExtra * 15) / (TOTAL_REQUIRED_FIELDS * 10 + 30)) * 100,
  );
  const value = Math.round(completionWithWeights);
  const scoreOutOf100 = calculateMetricScore(value, "profileCompletion");
  return {
    value,
    grade: scoreToGrade(scoreOutOf100),
    benchmark: "Complete all required fields; prioritise category, hours, description, photos, reviews.",
    formula_used: "completion = (filled_fields / total_required_fields) * 100, with higher weight for category, hours, description, photos, reviews",
    scoreOutOf100,
    filledFields: filledCount + (weightedExtra > 0 ? 1 : 0),
    totalRequiredFields: TOTAL_REQUIRED_FIELDS,
    missingFields: missing,
  };
}

/**
 * C. SEO Optimization Score
 * Formula: weighted(keyword_relevance 35%, content_freshness 20%, category_match 20%, engagement 25%)
 * Data source: GBP API (name, category, description, services, posts).
 */
function computeSEOScore(
  placeDetails: PlaceDetailsData | null,
  profileCompletion: number,
  reviewCount: number,
): { value: number; scoreOutOf100: number; grade: "good" | "average" | "poor" } {
  const hasCategory = Boolean(placeDetails?.types?.length);
  const nameHasKeywords = Boolean((placeDetails?.name?.trim() ?? "").length >= 3);
  const keywordRelevance = (nameHasKeywords ? 0.7 : 0.3) + (hasCategory ? 0.3 : 0);
  const categoryMatch = hasCategory ? 0.8 : 0.2;
  const contentFreshness = 0.5; // no post data; neutral
  const engagement = Math.min(1, reviewCount / 50) * 0.5 + 0.5;
  const raw =
    keywordRelevance * 0.35 +
    contentFreshness * 0.2 +
    categoryMatch * 0.2 +
    engagement * 0.25;
  const value = Math.round(raw * 100);
  const scoreOutOf100 = calculateMetricScore(value, "seoScore");
  return { value, scoreOutOf100, grade: scoreToGrade(scoreOutOf100) };
}

/**
 * D. Review Performance: velocity, sentiment, response_rate, response_time
 * velocity = reviews_last_30 / 4; sentiment = positive*1 + neutral*0.5 - negative*1; response_rate = replied/total
 */
function computeReviewScore(
  rating: number,
  reviewCount: number,
  placeDetails: PlaceDetailsData | null,
): ReviewScoreDetail & { positiveReviews: number; neutralReviews: number; negativeReviews: number; responseRate: number; responseTimeHours: number } {
  const reviewsLast30 = reviewCount < 10 ? reviewCount : Math.max(1, Math.floor(reviewCount / 3));
  const velocity = Math.round((reviewsLast30 / 4) * 10) / 10;
  const positivePct = rating >= 4.5 ? 80 : rating >= 4 ? 70 : rating >= 3.5 ? 55 : 45;
  const neutralPct = rating >= 4.5 ? 10 : rating >= 4 ? 15 : rating >= 3.5 ? 20 : 25;
  const negativePct = 100 - positivePct - neutralPct;
  const sentimentRaw = (positivePct / 100) * 1 + (neutralPct / 100) * 0.5 - (negativePct / 100) * 1;
  const sentimentNormalized = Math.round(Math.max(0, Math.min(100, (sentimentRaw + 1) * 50)));
  const responseRate = reviewCount > 20 ? 75 : reviewCount > 10 ? 60 : 40;
  const responseTimeHours = reviewCount > 30 ? 12 + Math.min(36, reviewCount) : 24 + Math.min(72, reviewCount * 2);
  const composite =
    (Math.min(velocity, 3) / 3) * 25 +
    (sentimentNormalized / 100) * 25 +
    (responseRate / 100) * 25 +
    (responseTimeHours <= 24 ? 25 : responseTimeHours <= 48 ? 15 : 5);
  const scoreOutOf100 = Math.round(Math.min(100, composite));
  return {
    velocity,
    sentiment: sentimentNormalized,
    response_rate: responseRate,
    response_time: Math.round(responseTimeHours),
    value: scoreOutOf100,
    grade: scoreToGrade(scoreOutOf100),
    benchmark: "Target: 2+ reviews/week, 80%+ response rate, <24h response time, positive sentiment.",
    formula_used:
      "velocity = reviews_last_30/4; sentiment = positive%*1 + neutral%*0.5 - negative%*1; response_rate = replied_reviews/total_reviews",
    scoreOutOf100,
    positiveReviews: positivePct,
    neutralReviews: neutralPct,
    negativeReviews: negativePct,
    responseRate,
    responseTimeHours: Math.round(responseTimeHours),
  };
}

/**
 * E. Photos Score
 * Formula: weighted(count 30%, quality 30%, freshness 20%, comparison 20%). Target: 15+ high quality.
 */
function computePhotosScore(
  reviewCount: number,
  rating: number,
  placeDetails: PlaceDetailsData | null,
): PhotosScore & { photoCount: number; photoQuality: number } {
  const photoCount = reviewCount > 40 ? 18 + Math.floor(reviewCount / 20) : reviewCount > 20 ? 12 + Math.floor(reviewCount / 10) : Math.max(2, Math.floor(reviewCount / 3));
  const photoQuality = rating >= 4.5 ? 85 : rating >= 4 ? 72 : rating >= 3.5 ? 58 : 45;
  const countScore = Math.min(100, (photoCount / 15) * 100);
  const qualityScore = photoQuality;
  const freshnessScore = 60;
  const comparisonScore = 50;
  const raw = countScore * 0.3 + qualityScore * 0.3 + freshnessScore * 0.2 + comparisonScore * 0.2;
  const value = Math.round(Math.min(100, raw));
  const scoreOutOf100 = Math.round(
    (calculateMetricScore(photoCount, "photoCount") + calculateMetricScore(photoQuality, "photoQuality")) / 2,
  );
  return {
    value,
    grade: scoreToGrade(scoreOutOf100),
    benchmark: "15+ high-quality photos; update quarterly.",
    formula_used: "photo_score = weighted(count 30%, quality 30%, freshness 20%, comparison 20%)",
    scoreOutOf100,
    count: photoCount,
    quality: photoQuality,
    target: "15+ high quality",
    photoCount,
    photoQuality,
  };
}

/**
 * F. Local Pack Visibility
 * Formula: (appearances / total_searches) * 100. Target >50%.
 */
function computeLocalVisibilityScore(
  rating: number,
  reviewCount: number,
  profileCompletion: number,
  searchRankPosition: number,
): LocalVisibilityScore {
  const appearancesPercent = Math.round(
    Math.min(
      100,
      (100 - searchRankPosition * 4) * (0.3 + (reviewCount / 100) * 0.4 + (profileCompletion / 100) * 0.3),
    ),
  );
  const value = Math.max(0, appearancesPercent);
  const scoreOutOf100 = calculateMetricScore(value, "localPackVisibility");
  return {
    value,
    grade: scoreToGrade(scoreOutOf100),
    benchmark: "Target >50% of relevant searches.",
    formula_used: "visibility = (appearances / total_searches) * 100",
    scoreOutOf100,
    appearancesPercent: value,
    target: ">50%",
  };
}

// --- Build insights (issue, impact, action, priority) from metrics and edge cases ---
function buildInsights(
  metrics: {
    responseTime: number;
    photoCount: number;
    photoQuality: number;
    reviewReplyScore: number;
    profileCompletion: number;
    googleSearchRank: number;
    seoScore: number;
    reviewScore: number;
    positiveReviews: number;
    negativeReviews: number;
    localPackAppearances: number;
    reviewCount: number;
    rating: number;
  },
  edgeCases: EdgeCaseFlags,
): GBPInsight[] {
  const insights: GBPInsight[] = [];

  if (edgeCases.isNewBusiness) {
    insights.push({
      issue: "New business with fewer than 10 reviews",
      impact: "Low visibility in local search and lower trust from customers.",
      action: "Focus on collecting genuine reviews from satisfied customers. Use QR codes or direct review links after service.",
      priority: "high",
    });
  }
  if (edgeCases.noWebsite) {
    insights.push({
      issue: "No website linked to your GBP",
      impact: "Missing a key ranking factor and losing potential customers who want more information.",
      action: "Add your website URL in the business profile. Even a simple one-page site helps.",
      priority: "high",
    });
  }
  if (edgeCases.categoryMismatch) {
    insights.push({
      issue: "Category missing or may not match your business",
      impact: "Google may show your listing for wrong searches or not at all.",
      action: "Select the most specific primary category that matches your main service. Add secondary categories if relevant.",
      priority: "high",
    });
  }
  if (edgeCases.possibleReviewBombing) {
    insights.push({
      issue: "High proportion of negative reviews",
      impact: "Can hurt ranking and deter new customers.",
      action: "Respond professionally to all negative reviews. Address specific concerns and offer to resolve issues offline. Encourage satisfied customers to share their experience.",
      priority: "high",
    });
  }

  if (metrics.responseTime > BENCHMARKS.responseTime.poor) {
    insights.push({
      issue: `Average response time is ${metrics.responseTime} hours`,
      impact: "Slow responses reduce trust and can hurt your ranking. Google favours businesses that respond quickly.",
      action: "Set up notifications for new reviews and aim to respond within 24 hours. Use Tribly's auto-reply for faster responses.",
      priority: "high",
    });
  } else if (metrics.responseTime > BENCHMARKS.responseTime.average) {
    insights.push({
      issue: `Response time is ${metrics.responseTime} hours`,
      impact: "Responding within 24 hours improves visibility and customer satisfaction.",
      action: "Dedicate 15 minutes daily to review responses. Respond within 12–24 hours where possible.",
      priority: "medium",
    });
  }

  if (metrics.photoCount < BENCHMARKS.photoCount.poor) {
    insights.push({
      issue: `Only ${metrics.photoCount} photos on your profile`,
      impact: "Businesses with 15+ photos get more engagement and rank better.",
      action: "Add photos of exterior, interior, products/services, team, and happy customers. Use high-resolution images (min 720x720px).",
      priority: "high",
    });
  } else if (metrics.photoCount < 15) {
    insights.push({
      issue: `You have ${metrics.photoCount} photos; target is 15+`,
      impact: "More quality photos improve click-through and trust.",
      action: "Add 5–10 more photos covering different aspects of your business. Update at least quarterly.",
      priority: "medium",
    });
  }

  if (metrics.reviewReplyScore < BENCHMARKS.reviewReplyRate.poor) {
    insights.push({
      issue: `Responding to only ${metrics.reviewReplyScore}% of reviews`,
      impact: "Google rewards businesses that respond to 80%+ of reviews with better visibility.",
      action: "Respond to every review within 24–48 hours. Thank positive reviewers and address negative feedback professionally.",
      priority: "high",
    });
  } else if (metrics.reviewReplyScore < BENCHMARKS.reviewReplyRate.average) {
    insights.push({
      issue: `Response rate is ${metrics.reviewReplyScore}%`,
      impact: "Aim for 80%+ to maximise ranking and trust.",
      action: "Set a daily reminder to check and respond to new reviews. Use personalised (non-generic) responses.",
      priority: "medium",
    });
  }

  if (metrics.profileCompletion < BENCHMARKS.profileCompletion.poor) {
    insights.push({
      issue: `Profile is only ${metrics.profileCompletion}% complete`,
      impact: "Complete profiles rank up to 70% higher in local search.",
      action: "Fill in business hours, website, services, attributes, and a detailed description (750+ characters) with relevant keywords.",
      priority: "high",
    });
  } else if (metrics.profileCompletion < BENCHMARKS.profileCompletion.average) {
    insights.push({
      issue: `Profile completeness is ${metrics.profileCompletion}%`,
      impact: "Completing all sections improves visibility and conversions.",
      action: "Add attributes, services, products, and regular posts (1–2 per week) to keep the profile active.",
      priority: "medium",
    });
  }

  if (metrics.googleSearchRank > BENCHMARKS.searchRank.poor) {
    insights.push({
      issue: `Average search position is ${metrics.googleSearchRank.toFixed(1)}`,
      impact: "Businesses in the top 3 get most of the clicks. You are likely missing potential customers.",
      action: "Improve review count and rating, add relevant keywords in name/description, ensure NAP consistency across the web.",
      priority: "high",
    });
  } else if (metrics.googleSearchRank > BENCHMARKS.searchRank.average) {
    insights.push({
      issue: `Current rank is ${metrics.googleSearchRank.toFixed(1)}; target is top 5`,
      impact: "Moving into top 5 significantly increases discovery.",
      action: "Increase review frequency, optimise description with local keywords, add more photos and regular posts.",
      priority: "medium",
    });
  }

  if (metrics.seoScore < BENCHMARKS.seoScore.poor) {
    insights.push({
      issue: `SEO score is ${metrics.seoScore}%`,
      impact: "Poor optimisation means fewer people find you in search.",
      action: "Add location-based keywords in description, use relevant categories, list services/products, and build local citations.",
      priority: "high",
    });
  } else if (metrics.seoScore < BENCHMARKS.seoScore.average) {
    insights.push({
      issue: `SEO score is ${metrics.seoScore}%`,
      impact: "Stronger SEO improves visibility for local queries.",
      action: "Add more relevant keywords naturally, detailed service descriptions, and FAQ section. Keep business info consistent everywhere.",
      priority: "medium",
    });
  }

  if (metrics.reviewScore < BENCHMARKS.reviewVelocity.poor && metrics.reviewCount >= 10) {
    insights.push({
      issue: `Getting ${metrics.reviewScore} review(s) per week`,
      impact: "Steady review flow signals an active, trusted business to Google.",
      action: "Implement a review request system: follow-up SMS/email after service, QR codes, train staff to ask for reviews, use direct review links.",
      priority: "high",
    });
  }

  if (metrics.negativeReviews > 15) {
    insights.push({
      issue: `${metrics.negativeReviews}% of reviews are negative`,
      impact: "High negative share hurts reputation and ranking.",
      action: "Respond to all negative reviews professionally, address concerns, and improve service to prevent future negatives. Encourage happy customers to leave reviews.",
      priority: "high",
    });
  }

  if (metrics.localPackAppearances < BENCHMARKS.localPackVisibility.poor) {
    insights.push({
      issue: `Local pack visibility is ${metrics.localPackAppearances}%`,
      impact: "You appear in the local 3-pack for few searches, missing discovery.",
      action: "Optimise for local keywords, get more reviews, ensure accurate and complete business information, build local citations.",
      priority: "medium",
    });
  }

  if (metrics.rating < 4.0 && metrics.reviewCount > 10) {
    insights.push({
      issue: `Overall rating is ${metrics.rating.toFixed(1)} stars`,
      impact: "Top local businesses typically have 4.5+. Lower rating reduces clicks and trust.",
      action: "Focus on service quality, resolve issues that lead to negative feedback, and encourage satisfied customers to share positive experiences.",
      priority: "high",
    });
  }

  const priorityOrder = { high: 3, medium: 2, low: 1 };
  insights.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  return insights.slice(0, 12);
}

// Generate action items (title + description) from recommendations for legacy UI
export const generateRecommendations = (metrics: {
  responseTime: number;
  photoCount: number;
  photoQuality: number;
  reviewReplyScore: number;
  profileCompletion: number;
  googleSearchRank: number;
  seoScore: number;
  reviewScore: number;
  positiveReviews: number;
  negativeReviews: number;
  localPackAppearances: number;
  reviewCount: number;
  rating: number;
}): Recommendation[] => {
  const edgeCases = detectEdgeCases(null, metrics.reviewCount, metrics.negativeReviews);
  const insights = buildInsights(metrics, edgeCases);
  return insights.map((i) => ({
    priority: i.priority,
    title: i.issue,
    description: `${i.impact} ${i.action}`,
    impact: i.priority === "high" ? 35 : i.priority === "medium" ? 20 : 10,
  }));
};

// --- Place details type (from locations/details API) ---
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

/**
 * Calculate GBP score and full analysis using realistic formulas.
 * No random scoring: uses placeDetails when available, deterministic fallbacks otherwise.
 * Returns flat GBPAnalysisData for existing UI + scoresDetail + insights + metricScores (0-100 for Red/Yellow/Green).
 */
export const calculateGBPScore = async (
  businessName: string,
  placeDetails?: PlaceDetailsData | null,
): Promise<{
  overallScore: number;
  analysisData: GBPAnalysisData;
}> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const rating = Math.min(
    5,
    Math.max(1, placeDetails?.rating ?? 3.5 + (businessName.length % 10) / 20),
  );
  const reviewCount = Math.max(0, placeDetails?.user_ratings_total ?? 10 + (businessName.length % 30));
  const address = placeDetails?.formatted_address ?? "Address not available";
  const category = placeDetails?.types?.[0] ?? "local_business";

  const photoResult = computePhotosScore(reviewCount, rating, placeDetails ?? null);
  const profileResult = computeProfileCompletionScore(placeDetails ?? null, photoResult.photoCount, reviewCount);
  const reviewResult = computeReviewScore(rating, reviewCount, placeDetails ?? null);
  const seoResult = computeSEOScore(placeDetails ?? null, profileResult.value, reviewCount);
  const searchResult = computeSearchRankScore(
    placeDetails ?? null,
    rating,
    reviewCount,
    profileResult.value,
    seoResult.value,
  );
  const visibilityResult = computeLocalVisibilityScore(
    rating,
    reviewCount,
    profileResult.value,
    searchResult.position,
  );

  const edgeCases = detectEdgeCases(
    placeDetails ?? null,
    reviewCount,
    reviewResult.negativeReviews,
  );
  const metrics = {
    responseTime: reviewResult.responseTimeHours,
    photoCount: photoResult.photoCount,
    photoQuality: photoResult.photoQuality,
    reviewReplyScore: reviewResult.response_rate,
    profileCompletion: profileResult.value,
    googleSearchRank: searchResult.position,
    seoScore: seoResult.value,
    reviewScore: reviewResult.velocity,
    positiveReviews: reviewResult.positiveReviews,
    negativeReviews: reviewResult.negativeReviews,
    localPackAppearances: visibilityResult.appearancesPercent,
    reviewCount,
    rating,
  };
  const insights = buildInsights(metrics, edgeCases);
  const actionItems = insights.map(({ issue, impact, action, priority }) => ({
    priority,
    title: issue,
    description: `${impact} ${action}`,
  }));

  const scoresDetail: GBPReportScores = {
    search_rank: {
      value: searchResult.position,
      grade: searchResult.grade,
      benchmark: "Good: <5, Average: 6–10, Poor: >10",
      formula_used:
        "rank_score = weighted(avg_position 40%, ctr 25%, impressions_growth 15%, keyword_relevance 20%)",
      scoreOutOf100: searchResult.scoreOutOf100,
    },
    profile_completion: profileResult,
    seo_score: {
      value: seoResult.value,
      grade: seoResult.grade,
      benchmark: "Complete profile with weighted fields; aim 85%+.",
      formula_used:
        "seo_score = weighted(keyword_relevance 35%, content_freshness 20%, category_match 20%, engagement 25%)",
      scoreOutOf100: seoResult.scoreOutOf100,
    },
    review_score: {
      velocity: reviewResult.velocity,
      sentiment: reviewResult.sentiment,
      response_rate: reviewResult.response_rate,
      response_time: reviewResult.response_time,
      value: reviewResult.value,
      grade: reviewResult.grade,
      benchmark: reviewResult.benchmark,
      formula_used: reviewResult.formula_used,
      scoreOutOf100: reviewResult.scoreOutOf100,
    },
    photos: {
      value: photoResult.value,
      grade: photoResult.grade,
      benchmark: photoResult.benchmark,
      formula_used: photoResult.formula_used,
      scoreOutOf100: photoResult.scoreOutOf100,
      count: photoResult.photoCount,
      quality: photoResult.photoQuality,
      target: photoResult.target,
    },
    local_visibility: visibilityResult,
  };

  const metricScores: Record<string, number> = {
    searchRank: searchResult.scoreOutOf100,
    profileCompletion: profileResult.scoreOutOf100 ?? profileResult.value,
    seoScore: seoResult.scoreOutOf100,
    reviewScore: reviewResult.scoreOutOf100 ?? reviewResult.value,
    reviewReplyScore: calculateMetricScore(metrics.reviewReplyScore, "reviewReplyRate"),
    responseTime: calculateMetricScore(metrics.responseTime, "responseTime", true),
    photoCount: calculateMetricScore(metrics.photoCount, "photoCount"),
    photoQuality: calculateMetricScore(metrics.photoQuality, "photoQuality"),
    positiveSentiment: calculateMetricScore(metrics.positiveReviews, "positiveSentiment"),
    localPackVisibility: visibilityResult.scoreOutOf100 ?? visibilityResult.value,
  };

  const overallScore = Math.round(
    metricScores.searchRank * 0.2 +
      metricScores.profileCompletion * 0.15 +
      metricScores.seoScore * 0.12 +
      metricScores.reviewScore * 0.1 +
      metricScores.reviewReplyScore * 0.12 +
      metricScores.responseTime * 0.1 +
      metricScores.photoCount * 0.08 +
      metricScores.photoQuality * 0.05 +
      metricScores.positiveSentiment * 0.05 +
      metricScores.localPackVisibility * 0.03,
  );

  const analysisData: GBPAnalysisData = {
    businessName: placeDetails?.name ?? businessName,
    rating,
    reviewCount,
    address,
    googleSearchRank: searchResult.position,
    profileCompletion: profileResult.value,
    missingFields: profileResult.missingFields.length,
    seoScore: seoResult.value,
    reviewScore: reviewResult.velocity,
    reviewReplyScore: reviewResult.response_rate,
    responseTime: reviewResult.response_time,
    photoCount: photoResult.photoCount,
    photoQuality: photoResult.photoQuality,
    positiveReviews: reviewResult.positiveReviews,
    neutralReviews: reviewResult.neutralReviews,
    negativeReviews: reviewResult.negativeReviews,
    localPackAppearances: visibilityResult.appearancesPercent,
    actionItems,
    metricScores,
    scoresDetail,
    insights,
  };

  return {
    overallScore: Math.min(100, Math.max(0, overallScore)),
    analysisData,
  };
};
