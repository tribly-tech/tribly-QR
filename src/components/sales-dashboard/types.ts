import { BusinessCategory, BusinessStatus } from "@/lib/types";

// GBP Analysis Data Type
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

// Industry Benchmarks
export const BENCHMARKS = {
  responseTime: { excellent: 12, good: 24, average: 48, poor: 72 },
  photoCount: { excellent: 20, good: 15, average: 10, poor: 5 },
  photoQuality: { excellent: 90, good: 75, average: 60, poor: 40 },
  reviewReplyRate: { excellent: 90, good: 80, average: 60, poor: 40 },
  profileCompletion: { excellent: 95, good: 85, average: 70, poor: 50 },
  searchRank: { excellent: 3, good: 5, average: 10, poor: 15 },
  seoScore: { excellent: 85, good: 70, average: 50, poor: 30 },
  reviewVelocity: { excellent: 3, good: 2, average: 1, poor: 0 },
  positiveSentiment: { excellent: 85, good: 75, average: 65, poor: 50 },
  localPackVisibility: { excellent: 60, good: 45, average: 30, poor: 15 },
} as const;

export type BenchmarkMetric = keyof typeof BENCHMARKS;
