"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { getStoredUser, getAuthToken } from "@/lib/auth";
import type { Top3InRadiusResult } from "@/components/sales-dashboard/types";
import { GBPHealthReportView } from "@/components/dashboard/business/GBPHealthReportView";
import {
  ChevronRight,
  CheckCircle2,
  Shield,
  AlertCircle,
  TrendingUp,
  Target,
  Lightbulb,
  BarChart3,
  Clock,
  Zap,
  Bell,
  Lock,
  ArrowRight,
  Loader2,
  RefreshCw,
} from "lucide-react";

function AnalysisReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessNameParam = searchParams.get("business");

  const [user, setUser] = useState(getStoredUser());
  const [gbpScore, setGbpScore] = useState<number | null>(null);
  const [gbpAnalysisData, setGbpAnalysisData] = useState<{
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
    actionItems: Array<{
      priority: "high" | "medium" | "low";
      title: string;
      description: string;
    }>;
    /** 0-100 per metric for UI: Red <40, Yellow 40-70, Green >70 */
    metricScores?: Record<string, number>;
  } | null>(null);
  const [placeDetails, setPlaceDetails] = useState<{
    place_id?: string;
    name?: string;
    formatted_address?: string;
    formatted_phone_number?: string;
    international_phone_number?: string;
    website?: string;
    business_review_url?: string;
    address_components?: Array<{
      longText?: string;
      shortText?: string;
      types?: string[];
      languageCode?: string;
    }>;
    location?: { lat: number; lng: number };
    geometry?: { location: { lat: number; lng: number } };
    types?: string[];
    business_status?: string;
    rating?: number;
    user_ratings_total?: number;
  } | null>(null);
  const [businessPhoneNumber, setBusinessPhoneNumber] = useState("");
  const [gbpConnected, setGbpConnected] = useState(false);
  const [businessName, setBusinessName] = useState("");

  // GBP Auth Session State
  const [authSessionId, setAuthSessionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [authCompletedBusinessReviewUrl, setAuthCompletedBusinessReviewUrl] =
    useState<string | null>(null);
  const [authCompletedBusinessEmail, setAuthCompletedBusinessEmail] = useState<
    string | null
  >(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // business_review_url from gbpAnalysisData (stored when analyzing)
  const [storedBusinessReviewUrl, setStoredBusinessReviewUrl] = useState<
    string | null
  >(null);

  // Top 3 within 5km (local competitiveness)
  const [top3Result, setTop3Result] = useState<Top3InRadiusResult | null>(null);
  const [top3Loading, setTop3Loading] = useState(false);

  // Load analysis data from sessionStorage
  useEffect(() => {
    const storedData = sessionStorage.getItem("gbpAnalysisData");
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setGbpScore(data.overallScore);
        setGbpAnalysisData(data.analysisData);
        setBusinessName(data.businessName || businessNameParam || "");
        setBusinessPhoneNumber(data.businessPhoneNumber || "");
        // Store place details if available
        if (data.placeDetails) {
          setPlaceDetails(data.placeDetails);
        }
        if (data.business_review_url) {
          setStoredBusinessReviewUrl(data.business_review_url);
        }
      } catch (error) {
        console.error("Error parsing analysis data:", error);
        // Redirect back if data is invalid
        router.push("/sales-dashboard/step-1");
      }
    } else {
      // If no data in sessionStorage, redirect back to step-1
      router.push("/sales-dashboard/step-1");
    }
  }, [router, businessNameParam]);

  // Fetch "top 3 within 5km" when we have place and analysis data
  useEffect(() => {
    if (!gbpAnalysisData) return;

    const placeId = placeDetails?.place_id;
    const coords = placeDetails?.geometry?.location ?? placeDetails?.location;
    const lat = coords?.lat;
    const lng = coords?.lng;
    const searchRank = gbpAnalysisData.googleSearchRank;

    const params = new URLSearchParams();
    if (placeId) params.set("place_id", placeId);
    if (lat != null && lng != null) {
      params.set("lat", String(lat));
      params.set("lng", String(lng));
    }
    params.set("radius_m", "5000");
    if (searchRank != null && !Number.isNaN(searchRank)) {
      params.set("search_rank", String(searchRank));
    }

    setTop3Loading(true);
    const authToken = getAuthToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

    fetch(`/api/locations/nearby-rank?${params.toString()}`, { method: "GET", headers })
      .then((res) => res.json())
      .then((json) => {
        const data = json.data ?? json;
        setTop3Result({
          inTop3: data.in_top_3 ?? data.inTop3 ?? false,
          rank: data.rank ?? 0,
          totalInRadius: data.total_in_radius ?? data.totalInRadius ?? 0,
          radiusKm: data.radius_km ?? data.radiusKm ?? 5,
          message: data.message,
          fallback: data.fallback ?? false,
        });
      })
      .catch(() => {
        setTop3Result({
          inTop3: false,
          rank: 0,
          totalInRadius: 0,
          radiusKm: 5,
          message: "Unable to check local ranking.",
          fallback: true,
        });
      })
      .finally(() => setTop3Loading(false));
  }, [gbpAnalysisData, placeDetails?.place_id, placeDetails?.geometry?.location, placeDetails?.location]);

  // Stop polling and cleanup
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Check auth session status
  const checkSessionStatus = useCallback(
    async (sessionId: string) => {
      try {
        const authToken = getAuthToken();
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (authToken) {
          headers["Authorization"] = `Bearer ${authToken}`;
        }

        const response = await fetch(
          `/api/gbp/auth-sessions/${sessionId}/status`,
          {
            method: "GET",
            headers,
            cache: "no-store", // Prevent cached responses - critical for polling
          }
        );

        if (!response.ok) {
          throw new Error("Failed to check session status");
        }

        const data = await response.json();
        const rawStatus = data.data?.status ?? data.status ?? data.session?.status;
        const status = typeof rawStatus === "string" ? rawStatus.toLowerCase().trim() : rawStatus;

        setPollCount((prev) => prev + 1);

        if (status === "completed") {
          stopPolling();
          setGbpConnected(true);
          setAuthError(null);
          // Store business_review_url from auth session (backend returns it when completed)
          const reviewUrl =
            data.data?.business_review_url || data.business_review_url;
          if (reviewUrl) {
            setAuthCompletedBusinessReviewUrl(reviewUrl);
          }
          const businessEmail = data.data?.business_email || data.business_email;
          if (businessEmail) {
            setAuthCompletedBusinessEmail(businessEmail);
          }
          sessionStorage.setItem(
            `gbp_connected_${placeDetails?.place_id || businessName}`,
            "true"
          );
        } else if (status === "expired") {
          stopPolling();
          setAuthError(
            "The authorization link has expired. Please send a new link."
          );
          setAuthSessionId(null);
        } else if (status === "failed") {
          stopPolling();
          setAuthError("Authorization failed. Please try again.");
          setAuthSessionId(null);
        } else if (status === "error") {
          stopPolling();
          const errorMessage =
            data.data?.error_message ||
            data.data?.errorMessage ||
            data.error_message ||
            data.errorMessage ||
            "An error occurred. Please try again.";
          setAuthError(errorMessage);
          setAuthSessionId(null);
        }
        // If still "pending", continue polling
      } catch (error) {
        console.error("Error checking session status:", error);
        // Don't stop polling on network errors, just log them
      }
    },
    [stopPolling, placeDetails?.place_id, businessName]
  );

  // Start polling for auth status
  const startPolling = useCallback(
    (sessionId: string) => {
      setIsPolling(true);
      setPollCount(0);
      setAuthError(null);

      // Poll every 10 seconds
      pollingIntervalRef.current = setInterval(() => {
        checkSessionStatus(sessionId);
      }, 10000);

      // Stop polling after 30 minutes (session expires)
      pollingTimeoutRef.current = setTimeout(() => {
        stopPolling();
        setAuthError(
          "Session timed out. Please send a new authorization link."
        );
        setAuthSessionId(null);
      }, 30 * 60 * 1000);

      // Do an immediate check
      checkSessionStatus(sessionId);
    },
    [checkSessionStatus, stopPolling]
  );

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Resume polling on page load when user returns with an active session
  useEffect(() => {
    if (!gbpAnalysisData || isPolling || gbpConnected || isCreatingSession) return;

    const storedSessionId =
      typeof window !== "undefined"
        ? sessionStorage.getItem("gbp_completed_session_id")
        : null;
    if (!storedSessionId) return;

    const placeId = placeDetails?.place_id;
    const connectedKey = `gbp_connected_${placeId || businessName}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(connectedKey) === "true") {
      setGbpConnected(true);
      return;
    }

    setAuthSessionId(storedSessionId);
    startPolling(storedSessionId);
  }, [gbpAnalysisData, placeDetails?.place_id, businessName, isPolling, gbpConnected, isCreatingSession, startPolling]);

  // Handle Connect with GBP - Creates auth session and opens WhatsApp
  const handleConnectWithGBP = async () => {
    if (!businessPhoneNumber.trim()) return;

    setIsCreatingSession(true);
    setAuthError(null);

    try {
      // Step 1: Create auth session on backend
      const authToken = getAuthToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch("/api/gbp/auth-sessions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          business_name: businessName,
          business_phone: businessPhoneNumber,
          place_id: placeDetails?.place_id || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create auth session");
      }

      const data = await response.json();
      const sessionId = data.data?.session_id || data.session_id;

      if (!sessionId) {
        throw new Error("No session ID returned from server");
      }

      setAuthSessionId(sessionId);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("gbp_completed_session_id", sessionId);
      }

      // Step 2: Generate the frontend auth page URL with session_id and business name
      // The frontend page shows a nice UI and then redirects to backend /auth endpoint
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tribly.ai";
      const gbpConnectUrl = `${baseUrl}/google-business-auth?session_id=${sessionId}&business=${encodeURIComponent(
        businessName
      )}`;

      // Step 3: Create WhatsApp message
      const message = `Hi! Please connect your Google Business Profile with Tribly to unlock powerful insights and tools.

Click here to authorize (valid for 30 minutes):
${gbpConnectUrl}

This secure link will allow Tribly to help improve your online presence.`;

      // Format phone number for WhatsApp
      const cleanPhone = businessPhoneNumber.replace(/[^\d]/g, "");

      // Open WhatsApp with prefilled message
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        message
      )}`;
      window.open(whatsappUrl, "_blank");

      // Step 4: Start polling for status
      startPolling(sessionId);
    } catch (error) {
      console.error("Error creating auth session:", error);
      setAuthError("Failed to create authorization link. Please try again.");
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Resend the WhatsApp message (reuse existing session if still valid)
  const handleResendWhatsApp = () => {
    if (!authSessionId || !businessPhoneNumber.trim()) return;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tribly.ai";
    const gbpConnectUrl = `${baseUrl}/google-business-auth?session_id=${authSessionId}&business=${encodeURIComponent(
      businessName
    )}`;

    const message = `Hi! Reminder: Please connect your Google Business Profile with Tribly.

Click here to authorize:
${gbpConnectUrl}

This secure link will allow Tribly to help improve your online presence.`;

    const cleanPhone = businessPhoneNumber.replace(/[^\d]/g, "");
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  // Extract address component by type (supports longText from API and long_name from Google)
  const getAddressComponent = (types: string[]): string => {
    if (!placeDetails?.address_components) return "";
    for (const type of types) {
      const component = placeDetails.address_components.find((c) =>
        c.types?.includes(type)
      );
      const value = component?.longText ?? (component as { long_name?: string })?.long_name;
      if (value) return value;
    }
    return "";
  };

  // Map Google Place types to business category
  const mapTypesToCategory = (types: string[] | undefined): string => {
    if (!types || types.length === 0) return "other";

    const typeToCategory: Record<string, string> = {
      restaurant: "restaurant",
      food: "restaurant",
      cafe: "restaurant",
      bakery: "restaurant",
      meal_takeaway: "restaurant",
      meal_delivery: "restaurant",
      bar: "restaurant",
      store: "retail",
      shopping_mall: "retail",
      clothing_store: "retail",
      shoe_store: "retail",
      jewelry_store: "retail",
      electronics_store: "retail",
      furniture_store: "retail",
      home_goods_store: "retail",
      supermarket: "retail",
      grocery_or_supermarket: "retail",
      convenience_store: "retail",
      hospital: "healthcare",
      doctor: "healthcare",
      dentist: "healthcare",
      pharmacy: "healthcare",
      physiotherapist: "healthcare",
      veterinary_care: "healthcare",
      health: "healthcare",
      beauty_salon: "beauty",
      hair_care: "beauty",
      spa: "beauty",
      gym: "fitness",
      fitness: "fitness",
      car_dealer: "automotive",
      car_repair: "automotive",
      car_wash: "automotive",
      gas_station: "automotive",
      real_estate_agency: "real-estate",
      school: "education",
      university: "education",
      library: "education",
      lodging: "hospitality",
      hotel: "hospitality",
      guest_house: "hospitality",
    };

    for (const type of types) {
      const category = typeToCategory[type.toLowerCase()];
      if (category) return category;
    }
    return "other";
  };

  // Handle Next Steps button (move to Step 2)
  const handleNextSteps = () => {
    if (!gbpAnalysisData) return;

    // Extract data from placeDetails and gbpAnalysisData
    const name =
      placeDetails?.name || gbpAnalysisData.businessName || businessName;
    const phone =
      placeDetails?.formatted_phone_number ||
      placeDetails?.international_phone_number ||
      businessPhoneNumber ||
      "";
    const address =
      placeDetails?.formatted_address || gbpAnalysisData.address || "";

    // Extract city and area from address_components
    const city =
      getAddressComponent(["locality", "administrative_area_level_3"]) ||
      getAddressComponent(["administrative_area_level_2"]) ||
      "";
    const area =
      getAddressComponent([
        "sublocality_level_1",
        "sublocality",
        "neighborhood",
      ]) || "";
    const pincode = getAddressComponent(["postal_code"]) || "";

    // Map place types to category
    const category = mapTypesToCategory(placeDetails?.types);

    const email = authCompletedBusinessEmail ?? "";

    // Generate overview from real data
    const ratingText = gbpAnalysisData.rating
      ? ` with a ${gbpAnalysisData.rating}-star rating`
      : "";
    const reviewText = gbpAnalysisData.reviewCount
      ? ` and ${gbpAnalysisData.reviewCount} reviews`
      : "";
    const overview = `Welcome to ${name}! We are a ${category} business${ratingText}${reviewText}. ${
      address ? `Visit us at ${address}.` : ""
    }`;

    // Get business_review_url: prefer auth-completed URL, then stored from analysis, then placeDetails, then construct from place_id
    // Format: https://search.google.com/local/writereview?placeid={place_id}
    const constructedReviewUrl = placeDetails?.place_id
      ? `https://search.google.com/local/writereview?placeid=${placeDetails.place_id}`
      : "";
    const googleBusinessReviewLink =
      authCompletedBusinessReviewUrl ||
      storedBusinessReviewUrl ||
      placeDetails?.business_review_url ||
      placeDetails?.website ||
      constructedReviewUrl ||
      "";

    // Store data in sessionStorage for step-2
    sessionStorage.setItem(
      "step2PrefillData",
      JSON.stringify({
        name,
        email,
        phone,
        address,
        city,
        area,
        pincode,
        category,
        overview,
        googleBusinessReviewLink,
        services: [], // Will be populated based on category in step-2
      })
    );

    // Navigate to step-2
    router.push("/sales-dashboard/step-2");
  };

  if (!user || user.role !== "sales-team") {
    return null;
  }

  if (!gbpAnalysisData || gbpScore === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading analysis report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF]">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
            Google Analysis
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Google Business Profile reputation analysis
          </p>
        </div>

        <div className="space-y-6">
          <GBPHealthReportView
            gbpAnalysisData={gbpAnalysisData}
            top3Result={top3Result}
            top3Loading={top3Loading}
            hideDiscoverySection
          />

          {/* Recommended Actions */}
          {gbpAnalysisData.actionItems.length > 0 && (
            <Card className="border-2 border-white bg-white">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-100">
                    <Lightbulb className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Recommended Actions
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 mt-1">
                      Priority actions to improve your Google Business Profile score
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {gbpAnalysisData.actionItems.map((item, index) => (
                    <div
                      key={index}
                      className={`p-4 sm:p-5 rounded-xl transition-all ${
                        item.priority === "high"
                          ? "bg-red-50/80"
                          : item.priority === "medium"
                          ? "bg-yellow-50/80"
                          : "bg-blue-50/80"
                      }`}
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div
                          className={`mt-1 flex-shrink-0 ${
                            item.priority === "high"
                              ? "text-red-600"
                              : item.priority === "medium"
                              ? "text-yellow-600"
                              : "text-blue-600"
                          }`}
                        >
                          {item.priority === "high" ? (
                            <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                          ) : (
                            <Target className="h-5 w-5 sm:h-6 sm:w-6" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-2">
                            {item.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Connect Google Business Profile Card */}
          {!gbpConnected && (
            <Card className="border border-blue-200/50 bg-white overflow-hidden relative">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-100/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

              <CardHeader className="pb-4 sm:pb-6 relative z-10">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-white to-blue-50/50 border border-blue-100/50 flex-shrink-0">
                    <svg
                      className="w-8 h-8 sm:w-10 sm:h-10"
                      viewBox="0 0 54 54"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M48.7909 22.4681H46.9886V22.3752H26.8513V31.3251H39.4964C37.6516 36.5351 32.6945 40.275 26.8513 40.275C19.4375 40.275 13.4265 34.2641 13.4265 26.8502C13.4265 19.4363 19.4375 13.4253 26.8513 13.4253C30.2736 13.4253 33.387 14.7163 35.7576 16.8252L42.0863 10.4965C38.0902 6.77217 32.7449 4.4754 26.8513 4.4754C14.4949 4.4754 4.47656 14.4937 4.47656 26.8502C4.47656 39.2067 14.4949 49.225 26.8513 49.225C39.2078 49.225 49.2261 39.2067 49.2261 26.8502C49.2261 25.35 49.0717 23.8855 48.7909 22.4681Z"
                        fill="#FFC107"
                      />
                      <path
                        d="M7.05859 16.4358L14.4098 21.827C16.3989 16.9023 21.2162 13.4253 26.8536 13.4253C30.2758 13.4253 33.3892 14.7163 35.7598 16.8251L42.0886 10.4964C38.0924 6.77211 32.7471 4.47534 26.8536 4.47534C18.2594 4.47534 10.8064 9.32731 7.05859 16.4358Z"
                        fill="#FF3D00"
                      />
                      <path
                        d="M26.8488 49.2247C32.6282 49.2247 37.8796 47.0129 41.85 43.4162L34.925 37.5562C32.6035 39.3228 29.766 40.2779 26.8488 40.2748C21.0292 40.2748 16.0877 36.5639 14.2261 31.3853L6.92969 37.0069C10.6327 44.253 18.1529 49.2247 26.8488 49.2247Z"
                        fill="#4CAF50"
                      />
                      <path
                        d="M48.7912 22.4679H46.9889V22.375H26.8516V31.3249H39.4967C38.6142 33.8045 37.0247 35.9712 34.9244 37.5574L34.9277 37.5552L41.8527 43.4151C41.3627 43.8604 49.2263 38.0373 49.2263 26.85C49.2263 25.3497 49.072 23.8853 48.7912 22.4679Z"
                        fill="#1976D2"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-2 leading-tight">
                      Get More Detailed Insights by Connecting Your Google
                      Business Profile
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      Unlock powerful analytics, automated management, and
                      actionable insights to grow your online presence
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative z-10">
                <div className="space-y-6">
                  {/* Top 5 Ranking - Critical Statistic */}
                  <div className="relative p-4 sm:p-6 bg-gradient-to-br from-indigo-50/90 via-sky-50/90 to-purple-50/90 rounded-2xl border border-indigo-200/60">
                    {/* Decorative elements */}
                    <div className="absolute top-2 right-2 w-20 h-20 bg-indigo-200/20 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-2 left-2 w-16 h-16 bg-sky-200/20 rounded-full blur-2xl"></div>

                    <div className="relative z-10">
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                        {/* Left: Statistic */}
                        <div className="flex-1 w-full">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                            <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-indigo-100 to-sky-100 border border-indigo-200/50 flex-shrink-0">
                              <Target className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight">
                                95% of Customers Engage with Top 5 Businesses
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-600 mt-1.5 leading-relaxed">
                                Find your business in the top 5 search results
                              </p>
                            </div>
                          </div>

                          {/* Current Rank vs Target - Card Design */}
                          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 sm:gap-4 mt-4 sm:mt-5">
                            {/* Current Position Card */}
                            <div className="bg-white rounded-xl p-3 sm:p-5 border border-white min-w-[120px] sm:min-w-[140px]">
                              <div className="text-center">
                                <div
                                  className={`text-2xl sm:text-3xl lg:text-4xl mb-1.5 ${
                                    gbpAnalysisData.googleSearchRank <= 5
                                      ? "text-green-700"
                                      : "text-red-700"
                                  }`}
                                >
                                  {gbpAnalysisData.googleSearchRank <= 5
                                    ? `Rank #${gbpAnalysisData.googleSearchRank.toFixed(
                                        1
                                      )}`
                                    : `Rank #${gbpAnalysisData.googleSearchRank}`}
                                </div>
                                <div className="text-xs text-gray-700">
                                  Current Position
                                </div>
                              </div>
                            </div>

                            {/* Arrow */}
                            <div className="flex items-center">
                              <svg
                                className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rotate-90 sm:rotate-0"
                                viewBox="0 0 64 64"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M6.29101 29.5791L49.6436 29.5791C46.0373 25.2591 44.5206 21.5967 44.2129 20.3057L47.3623 18.1836C48.1226 20.3808 49.4537 22.4663 51.7891 25.7061C53.5407 28.1359 55.8518 30.6046 57.4082 31.7822L57.709 32C56.1624 33.0663 53.6574 35.7022 51.7891 38.2939C49.4537 41.5337 48.1227 43.6192 47.3623 45.8164L44.2129 43.6943C44.5207 42.4033 46.0373 38.7409 49.6436 34.4209L6.29101 34.4209L6.29101 29.5791Z"
                                  fill="black"
                                />
                              </svg>
                            </div>

                            {/* Target Card */}
                            <div className="bg-white rounded-xl p-3 sm:p-5 border border-white min-w-[120px] sm:min-w-[140px]">
                              <div className="text-center">
                                <div className="text-2xl sm:text-3xl lg:text-4xl text-green-700 mb-1.5">
                                  Top 5
                                </div>
                                <div className="text-xs text-gray-700">
                                  Target
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Success Message - Only show if in top 5 */}
                          {gbpAnalysisData.googleSearchRank <= 5 && (
                            <div className="mt-5 flex items-center gap-3 text-green-700">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-green-700 flex items-center justify-center bg-transparent">
                                <CheckCircle2 className="h-3 w-3 text-green-700" />
                              </div>
                              <span className="text-sm leading-relaxed">
                                You're in the top 5! Connect to maintain and
                                improve your position.
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Right: Visual Impact */}
                        <div className="flex-shrink-0 w-full sm:w-auto">
                          <div className="bg-gradient-to-br from-white to-indigo-50/40 rounded-xl p-4 sm:p-5 border border-indigo-200/60">
                            <div className="text-center">
                              <div className="text-3xl sm:text-4xl text-indigo-600 mb-1.5">
                                95%
                              </div>
                              <div className="text-xs text-gray-700 uppercase tracking-wide">
                                Customer Engagement
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                with Top 5 Results
                              </div>
                            </div>
                            <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-gray-200/60">
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="text-gray-600">Top 5</span>
                                <span className="text-indigo-600">95%</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-600">Others</span>
                                <span className="text-gray-500">5%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Call to Action */}
                      <div className="mt-6 pt-5 border-t border-indigo-200/50">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-700 leading-relaxed">
                            <span className="text-gray-900">
                              Connect your Google Business Profile
                            </span>{" "}
                            to get detailed insights, optimization strategies,
                            and automated tools to help you reach and stay in
                            the top 5 search results.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unlock Powerful Features Card */}
          {!gbpConnected && (
            <Card className="border border-blue-200/50 bg-white">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-900">
                  Unlock Powerful Features
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Connect your Google Business Profile to access advanced
                  analytics, automation, and insights that help you grow your
                  online presence
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Value Propositions with Data Points */}
                <div className="flex md:grid md:grid-cols-2 gap-3 sm:gap-4 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 px-1 md:px-0 scrollbar-hide mb-6">
                  {/* Real-time Analytics */}
                  <div className="flex items-start gap-2 sm:gap-3 p-4 sm:p-5 bg-gradient-to-br from-white to-blue-50/40 rounded-xl border border-blue-100/60 min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink">
                    <div className="p-2 sm:p-2.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/40 flex-shrink-0">
                      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm sm:text-base text-gray-900 font-semibold mb-1.5 leading-tight">
                        Real-time Analytics Dashboard
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        Track review trends, sentiment analysis, and competitor
                        performance with live data updates
                      </p>
                      <div className="mt-2 sm:mt-3 flex items-center gap-2 text-xs text-blue-600">
                        <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                        <span>See 30%+ improvement in insights accuracy</span>
                      </div>
                    </div>
                  </div>

                  {/* AI-Powered Responses */}
                  <div className="flex items-start gap-2 sm:gap-3 p-4 sm:p-5 bg-gradient-to-br from-white to-indigo-50/40 rounded-xl border border-indigo-100/60 min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink">
                    <div className="p-2 sm:p-2.5 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200/40 flex-shrink-0">
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm sm:text-base text-gray-900 font-semibold mb-1.5 leading-tight">
                        AI-Powered Review Responses
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        Get instant, personalized response suggestions that save
                        time and improve customer satisfaction
                      </p>
                      <div className="mt-2 sm:mt-3 flex items-center gap-2 text-xs text-indigo-600">
                        <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                        <span>Respond 5x faster to customer reviews</span>
                      </div>
                    </div>
                  </div>

                  {/* Automated Notifications */}
                  <div className="flex items-start gap-2 sm:gap-3 p-4 sm:p-5 bg-gradient-to-br from-white to-purple-50/40 rounded-xl border border-purple-100/60 min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink">
                    <div className="p-2 sm:p-2.5 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/40 flex-shrink-0">
                      <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm sm:text-base text-gray-900 font-semibold mb-1.5 leading-tight">
                        Instant Review Notifications
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        Get notified immediately when new reviews are posted, so
                        you can respond quickly and professionally
                      </p>
                      <div className="mt-2 sm:mt-3 flex items-center gap-2 text-xs text-purple-600">
                        <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                        <span>Never miss a customer review again</span>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Insights */}
                  <div className="flex items-start gap-2 sm:gap-3 p-4 sm:p-5 bg-gradient-to-br from-white to-green-50/40 rounded-xl border border-green-100/60 min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink">
                    <div className="p-2 sm:p-2.5 rounded-lg bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200/40 flex-shrink-0">
                      <Target className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm sm:text-base text-gray-900 font-semibold mb-1.5 leading-tight">
                        Advanced Performance Insights
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        Access detailed metrics on search visibility, local pack
                        appearances, and customer engagement patterns
                      </p>
                      <div className="mt-2 sm:mt-3 flex items-center gap-2 text-xs text-green-600">
                        <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                        <span>Identify growth opportunities instantly</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust & Security */}
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-gradient-to-br from-white to-gray-50/50 rounded-xl border border-gray-200/60 mb-6">
                  <div className="p-2 sm:p-2.5 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200/40 flex-shrink-0">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                      <span className="font-semibold text-gray-900">
                        Secure & Private:
                      </span>{" "}
                      Your data is encrypted and we only access information
                      needed to manage your profile.
                      <span className="text-gray-600">
                        {" "}
                        Read-only access for analytics.
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Phone Number Input and Connect with GBP */}
          {!gbpConnected && (
            <Card className={isPolling ? "border-blue-200 bg-blue-50/30" : ""}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {isPolling && (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  )}
                  Connect with Google Business Profile
                </CardTitle>
                <CardDescription>
                  {isPolling
                    ? "Waiting for business owner to authorize access..."
                    : "Enter the business owner's phone number to send them the GBP connection link via WhatsApp"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {/* Error Message */}
                  {authError && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  {/* Phone Input - only show when not polling */}
                  {!isPolling && (
                    <div className="grid gap-2">
                      <Label htmlFor="business-phone">
                        Business Phone Number{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="business-phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={businessPhoneNumber}
                        onChange={(e) => setBusinessPhoneNumber(e.target.value)}
                        className="w-full"
                        disabled={isCreatingSession}
                      />
                      <p className="text-xs text-muted-foreground">
                        Include country code (e.g., +91 for India)
                      </p>
                    </div>
                  )}

                  {/* Polling Status */}
                  {isPolling && authSessionId && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="relative">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-blue-900">
                            Authorization link sent
                          </p>
                          <p className="text-sm text-blue-700">
                            Waiting for {businessName || "business owner"} to
                            authorize...
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            Checking status... (checked {pollCount} time
                            {pollCount !== 1 ? "s" : ""})
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={handleResendWhatsApp}
                          variant="outline"
                          className="flex-1"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Resend WhatsApp Message
                        </Button>
                        <Button
                          onClick={() => {
                            stopPolling();
                            setAuthSessionId(null);
                            if (typeof window !== "undefined") {
                              sessionStorage.removeItem("gbp_completed_session_id");
                            }
                          }}
                          variant="ghost"
                          className="flex-1 text-muted-foreground"
                        >
                          Cancel
                        </Button>
                      </div>

                      <p className="text-xs text-muted-foreground text-center">
                        The link is valid for 30 minutes. You can close this
                        page and come back later.
                      </p>
                    </div>
                  )}

                  {/* Send Button - only show when not polling */}
                  {!isPolling && (
                    <>
                      <Button
                        onClick={handleConnectWithGBP}
                        disabled={
                          !businessPhoneNumber.trim() || isCreatingSession
                        }
                        className="w-full bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 text-gray-900 border border-gray-300/60 text-sm sm:text-base py-4 sm:py-6 transition-all"
                        size="lg"
                      >
                        {isCreatingSession ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Creating authorization link...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 sm:gap-3">
                            <Shield className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                            <span className="whitespace-nowrap">
                              Share with business owner
                            </span>
                            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-1 flex-shrink-0" />
                          </div>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        This will open WhatsApp with a prefilled message
                        containing the Google Business Profile connection link.
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps Button */}
          {gbpConnected && (
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base">
                        Google Business Profile Connected
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Business owner has successfully authorized access
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleNextSteps}
                    size="lg"
                    className="gap-2 w-full sm:w-auto"
                  >
                    Next Steps
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AnalysisReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF] flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <AnalysisReportContent />
    </Suspense>
  );
}
