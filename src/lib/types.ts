export type BusinessStatus = "active" | "inactive";

export type BusinessCategory =
  | "restaurant"
  | "retail"
  | "healthcare"
  | "beauty"
  | "fitness"
  | "automotive"
  | "real-estate"
  | "education"
  | "hospitality"
  | "manufacturing"
  | "services"
  | "technology"
  | "finance"
  | "logistics"
  | "media-entertainment"
  | "non-profit"
  | "other";

export type FeedbackTone = "professional" | "friendly" | "casual" | "formal";

export type UserRole = "admin" | "sales-team" | "business";

export type ReviewCategory = "product" | "staff" | "customer-experience" | "offers-discounts";

export interface Business {
  id: string;
  name: string;
  status: BusinessStatus;
  category: BusinessCategory;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  area?: string;
  pincode?: string;
  overview?: string; // Business overview/description
  createdAt: string;
  updatedAt: string;
  // QR Code
  qrCodeUrl?: string;
  // Links
  reviewUrl?: string; // Unique short URL for reviews
  googleBusinessReviewLink?: string;
  /** Google Place ID for fetching Google reviews via Places API */
  googlePlaceId?: string;
  socialMediaLink?: string;
  // Settings
  feedbackTone: FeedbackTone;
  autoReplyEnabled: boolean;
  // Payment
  paymentPlan?: "qr-basic" | "qr-plus";
  paymentStatus?: "active" | "past-due" | "cancelled";
  paymentExpiryDate?: string; // ISO date string for plan expiry
  billingDate?: string; // ISO date string for billing date
  // Sales Team
  salesTeamId?: string; // ID of the sales team member who onboarded this business
  onboarded_by?: string; // Name of the person who onboarded this business
  // SEO
  keywords?: string[]; // SEO keywords for the business
  // Services
  services?: string[]; // Business services offered
  // Stats
  totalReviews: number;
  activeReviews: number;
  inactiveReviews: number;
  reviewsInQueue: number;
}

export interface Review {
  id: string;
  businessId: string;
  rating: "excellent" | "good" | "average" | "need-improvement";
  feedback?: string;
  category?: ReviewCategory; // Category of the review feedback
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  status: "pending" | "responded" | "archived";
  autoReplySent: boolean;
  createdAt: string;
}

/** Source of the review for display (Google vs in-app manual feedback) */
export type ReviewSource = "google" | "manual";
