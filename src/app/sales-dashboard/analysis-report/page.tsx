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
import {
  ChevronRight,
  CheckCircle2,
  Shield,
  AlertCircle,
  Smile,
  Frown,
  Meh,
  TrendingUp,
  FileText,
  Search as SearchIcon,
  Image,
  Target,
  Lightbulb,
  BarChart3,
  Clock,
  Star,
  Zap,
  Bell,
  Lock,
  ArrowRight,
  Loader2,
  RefreshCw,
  Trophy,
  MapPin,
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
          }
        );

        if (!response.ok) {
          throw new Error("Failed to check session status");
        }

        const data = await response.json();
        const status = data.data?.status || data.status;

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

      // Poll every 15 seconds
      pollingIntervalRef.current = setInterval(() => {
        checkSessionStatus(sessionId);
      }, 15000);

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

  // Extract address component by type
  const getAddressComponent = (types: string[]): string => {
    if (!placeDetails?.address_components) return "";
    for (const type of types) {
      const component = placeDetails.address_components.find((c) =>
        c.types?.includes(type)
      );
      if (component?.longText) return component.longText;
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

    // Map place types to category
    const category = mapTypesToCategory(placeDetails?.types);

    // Generate email from business name
    const emailDomain =
      name.toLowerCase().replace(/[^a-z0-9]/g, "") || "business";
    const email = `contact@${emailDomain}.com`;

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
        category,
        overview,
        googleBusinessReviewLink,
        services: [], // Will be populated based on category in step-2
      })
    );

    // Navigate to step-2
    router.push("/sales-dashboard/step-2");
  };

  // Helper: get status from 0-100 score (UI rules: Red <40, Yellow 40-70, Green >70)
  const getStatusFromScore = (score: number): "good" | "average" | "poor" => {
    if (score > 70) return "good";
    if (score >= 40) return "average";
    return "poor";
  };

  // Fallback: get status from raw value + thresholds when metricScores not available
  const getStatus = (
    value: number,
    thresholds: { good: number; average: number }
  ): "good" | "average" | "poor" => {
    if (value <= thresholds.good) return "good";
    if (value <= thresholds.average) return "average";
    return "poor";
  };

  // Helper function to get status component
  const getStatusBadge = (status: "good" | "average" | "poor") => {
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

        {/* GBP Score Display with Detailed Metrics */}
        <div className="space-y-6">
          {/* Business Details and Rank Card - Figma Design */}
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
                  {/* Business Name */}
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

                  {/* Rating and Reviews */}
                  <div className="flex flex-wrap items-center justify-center w-full gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
                      {/* Star Rating */}
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
                                    <linearGradient id={`star-half-${i}`} x1="0%" x2="100%" y1="0%" y2="0%">
                                      <stop offset="0%" stopColor="#fbbf24" />
                                      <stop offset="50%" stopColor="#fbbf24" />
                                      <stop offset="50%" stopColor="#e5e7eb" />
                                      <stop offset="100%" stopColor="#e5e7eb" />
                                    </linearGradient>
                                  </defs>
                                  <path fill={`url(#star-half-${i})`} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
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
                      {/* Rating Number */}
                      <span
                        className="text-base sm:text-[18px] font-semibold text-[#111827] leading-6 sm:leading-7"
                        style={{
                          fontFamily: "var(--font-clash-grotesk), sans-serif",
                          fontWeight: 600,
                        }}
                      >
                        {gbpAnalysisData.rating}
                      </span>
                      {/* Review Count */}
                      <span
                        className="text-xs sm:text-[14px] font-normal text-[#4b5563] leading-4 sm:leading-5"
                        style={{
                          fontFamily: "var(--font-clash-grotesk), sans-serif",
                          fontWeight: 400,
                        }}
                      >
                        ({gbpAnalysisData.reviewCount} reviews)
                      </span>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex gap-2 items-center w-full justify-center px-2">
                    <MapPin
                      aria-hidden
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 text-[#4b5563]"
                    />
                    <span
                      className="text-xs sm:text-[14px] font-normal text-[#4b5563] leading-4 sm:leading-5 text-center break-words"
                      style={{
                        fontFamily: "var(--font-clash-grotesk), sans-serif",
                        fontWeight: 400,
                      }}
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
                    {/* Rank Number */}
                    <div
                      className="text-4xl sm:text-5xl lg:text-[64px] font-medium text-[#dc2626] text-center leading-tight sm:leading-[72px]"
                      style={{
                        fontFamily: "var(--font-clash-grotesk), sans-serif",
                        fontWeight: 500,
                      }}
                    >
                      {gbpAnalysisData.googleSearchRank}
                    </div>
                    {/* Rank Status */}
                    <span
                      className="text-sm sm:text-[16px] font-medium text-[#dc2626] text-center leading-5 sm:leading-6"
                      style={{
                        fontFamily: "var(--font-clash-grotesk), sans-serif",
                        fontWeight: 500,
                      }}
                    >
                      {(() => {
                        const rankStatus =
                          gbpAnalysisData.metricScores?.searchRank != null
                            ? getStatusFromScore(gbpAnalysisData.metricScores.searchRank)
                            : getStatus(gbpAnalysisData.googleSearchRank, {
                                good: 5,
                                average: 10,
                              });
                        return rankStatus === "good"
                          ? "Good"
                          : rankStatus === "average"
                            ? "Average"
                            : "Poor";
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Top 3 within 5km — local competitiveness */}
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
                          <p className="text-sm text-muted-foreground mt-1">
                            {top3Result.message}
                          </p>
                        )}
                        {top3Result.fallback && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Based on your search rank in this area.
                          </p>
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

          {/* Detailed Metrics Grid */}
          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-5 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 px-1 md:px-0 scrollbar-hide">
            {/* Google Search Rank */}
            <Card className="border border-gray-200 transition-shadow min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink">
              <CardHeader className="pb-4 border-b border-gray-200 mb-6">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50">
                    <SearchIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex flex-col">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Google Search Rank
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-600 mt-1">
                      Average position on Google Search
                    </CardDescription>
                  </div>
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
                          : getStatus(gbpAnalysisData.googleSearchRank, {
                              good: 5,
                              average: 10,
                            })
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Smile className="h-3.5 w-3.5 text-green-600" />
                        <span>Good: &lt; 5</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Meh className="h-3.5 w-3.5 text-yellow-600" />
                        <span>Average: 6-10</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Frown className="h-3.5 w-3.5 text-red-600" />
                        <span>Poor: &gt; 10</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Completion */}
            <Card className="border border-gray-200 transition-shadow min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink">
              <CardHeader className="pb-4 border-b border-gray-200 mb-6">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-50">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex flex-col">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Profile Completion
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-600 mt-1">
                      Completeness of business profile information
                    </CardDescription>
                  </div>
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
                          : getStatus(100 - gbpAnalysisData.profileCompletion, {
                              good: 20,
                              average: 40,
                            })
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    {gbpAnalysisData.missingFields} fields missing
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* SEO Score */}
            <Card className="border border-gray-200 transition-shadow min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink">
              <CardHeader className="pb-4 border-b border-gray-200 mb-6">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-green-50">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex flex-col">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      SEO Score
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-600 mt-1">
                      Search engine optimization effectiveness
                    </CardDescription>
                  </div>
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
                          : getStatus(100 - gbpAnalysisData.seoScore, {
                              good: 30,
                              average: 60,
                            })
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Keywords optimization needed
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Review Score */}
            <Card className="border border-gray-200 transition-shadow min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink">
              <CardHeader className="pb-4 border-b border-gray-200 mb-6">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-yellow-50">
                    <Star className="h-5 w-5 text-yellow-600 fill-yellow-600" />
                  </div>
                  <div className="flex flex-col">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Review Score
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-600 mt-1">
                      Average number of reviews received per week
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2 items-center">
                    <div className="text-2xl sm:text-3xl lg:text-[32px] font-medium text-gray-900 leading-none">
                      {gbpAnalysisData.reviewScore}
                      <span className="text-xl sm:text-2xl text-gray-500">
                        /week
                      </span>
                    </div>
                    <div className="flex items-center justify-center">
                      {getStatusBadge(
                        gbpAnalysisData.metricScores?.reviewScore != null
                          ? getStatusFromScore(gbpAnalysisData.metricScores.reviewScore)
                          : getStatus(2 - gbpAnalysisData.reviewScore, {
                              good: 0,
                              average: 1,
                            })
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Target: 2 reviews per week
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Review Reply Score */}
            <Card className="border border-gray-200 transition-shadow min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink">
              <CardHeader className="pb-4 border-b border-gray-200 mb-6">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50">
                    <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex flex-col">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Review Reply Score
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-600 mt-1">
                      Percentage of reviews responded to
                    </CardDescription>
                  </div>
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
                          : getStatus(100 - gbpAnalysisData.reviewReplyScore, {
                              good: 20,
                              average: 50,
                            })
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Target: 80%+ response rate
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Response Time to Reviews */}
            <Card className="border border-gray-200 transition-shadow min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink">
              <CardHeader className="pb-4 border-b border-gray-200 mb-6">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-orange-50">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex flex-col">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Response Time
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-600 mt-1">
                      Average time to respond to reviews
                    </CardDescription>
                  </div>
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
                          : getStatus(gbpAnalysisData.responseTime, {
                              good: 24,
                              average: 72,
                            })
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Target: under 24 hours
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Photo Count and Quality */}
            <Card className="border border-gray-200 transition-shadow min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink">
              <CardHeader className="pb-4 border-b border-gray-200 mb-6">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-pink-50">
                    <Image className="h-5 w-5 text-pink-600" />
                  </div>
                  <div className="flex flex-col">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Photos
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-600 mt-1">
                      Photo count and quality score
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2 items-center">
                    <div className="text-2xl sm:text-3xl lg:text-[32px] font-medium text-gray-900 leading-none">
                      {gbpAnalysisData.photoCount}
                    </div>
                    <div className="text-base text-gray-600 font-medium">
                      Quality: {gbpAnalysisData.photoQuality}%
                    </div>
                    <div className="flex items-center justify-center">
                      {getStatusBadge(
                        gbpAnalysisData.metricScores?.photoCount != null &&
                          gbpAnalysisData.metricScores?.photoQuality != null
                          ? getStatusFromScore(
                              (gbpAnalysisData.metricScores.photoCount +
                                gbpAnalysisData.metricScores.photoQuality) /
                                2
                            )
                          : getStatus(15 - gbpAnalysisData.photoCount, {
                              good: 0,
                              average: 5,
                            })
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Target: 15+ high-quality photos
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Review Sentiment Breakdown */}
            <Card className="border border-gray-200 transition-shadow min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink">
              <CardHeader className="pb-4 border-b border-gray-200 mb-6">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-50">
                    <BarChart3 className="h-5 w-5 text-teal-600" />
                  </div>
                  <div className="flex flex-col">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Review Sentiment
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-600 mt-1">
                      Breakdown of review ratings
                    </CardDescription>
                  </div>
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
                          : getStatus(100 - gbpAnalysisData.positiveReviews, {
                              good: 20,
                              average: 40,
                            })
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                        <span>
                          Positive: {gbpAnalysisData.positiveReviews}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                        <span>Neutral: {gbpAnalysisData.neutralReviews}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                        <span>
                          Negative: {gbpAnalysisData.negativeReviews}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Local Pack Appearances */}
            <Card className="border border-gray-200 transition-shadow min-w-[280px] md:min-w-0 flex-shrink-0 md:flex-shrink">
              <CardHeader className="pb-4 border-b border-gray-200 mb-6">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-50">
                    <Target className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div className="flex flex-col">
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Local Pack Visibility
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-600 mt-1">
                      Frequency in Google's local 3-pack
                    </CardDescription>
                  </div>
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
                          : getStatus(100 - gbpAnalysisData.localPackAppearances, {
                              good: 30,
                              average: 60,
                            })
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Target: 50%+ of searches
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Items & Recommendations */}
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
                      Priority actions to improve your Google Business Profile
                      score
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
                  <div className="relative p-4 sm:p-6 bg-gradient-to-br from-orange-50/90 via-amber-50/90 to-yellow-50/90 rounded-2xl border border-orange-200/60">
                    {/* Decorative elements */}
                    <div className="absolute top-2 right-2 w-20 h-20 bg-orange-200/15 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-2 left-2 w-16 h-16 bg-amber-200/15 rounded-full blur-2xl"></div>

                    <div className="relative z-10">
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                        {/* Left: Statistic */}
                        <div className="flex-1 w-full">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                            <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 border border-orange-200/50 flex-shrink-0">
                              <Target className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
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
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 sm:p-5 border border-green-200/60 min-w-[120px] sm:min-w-[140px]">
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
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 sm:p-5 border border-green-200/60 min-w-[120px] sm:min-w-[140px]">
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
                          <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-xl p-4 sm:p-5 border border-orange-200/50">
                            <div className="text-center">
                              <div className="text-3xl sm:text-4xl text-orange-600 mb-1.5">
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
                                <span className="text-orange-600">95%</span>
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
                      <div className="mt-6 pt-5 border-t border-orange-200/50">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
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
