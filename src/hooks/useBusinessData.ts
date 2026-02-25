"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Business, BusinessCategory, ReviewCategory, Review } from "@/lib/types";
import { generateQRCodeDataUrl } from "@/lib/qr-utils";
import { parseWhatsAppNumberFromUrl } from "@/lib/whatsapp-utils";
import {
  getBusinessEditOverrides,
  mergeBusinessWithOverrides,
} from "@/lib/business-local-storage";
import { getStoredUser, getAuthToken } from "@/lib/auth";


/* eslint-disable @typescript-eslint/no-explicit-any */
function mapApiToBusiness(qrId: string, qrData: any): Business {
  return {
    id: qrId,
    name: qrData.business_name || "",
    status: "active",
    category: (qrData.business_category as BusinessCategory) || "other",
    email: qrData.business_contact?.email || "",
    phone: qrData.business_contact?.phone || "",
    address: qrData.business_address?.address_line1 || "",
    city: qrData.business_address?.city || "",
    area: qrData.business_address?.area || "",
    pincode:
      qrData.business_address?.pincode ||
      qrData.business_address?.postal_code ||
      "",
    overview: qrData.business_description || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reviewUrl: qrData.business_review_url,
    googleBusinessReviewLink: qrData.business_google_review_url || "",
    googlePlaceId: qrData.google_place_id || qrData.place_id || undefined,
    instagramUrl: qrData.instagram_url || undefined,
    youtubeUrl: qrData.youtube_url || undefined,
    whatsappNumber:
      parseWhatsAppNumberFromUrl(qrData.whatsapp_url || "") || undefined,
    whatsappUrl: qrData.whatsapp_url || undefined,
    keywords: Array.isArray(qrData.business_tags) ? qrData.business_tags : [],
    services: Array.isArray(qrData.business_services) ? qrData.business_services : [],
    feedbackTone: "professional",
    autoReplyEnabled: false,
    paymentPlan:
      qrData.plan === "qr-plus" || qrData.plan === "qr-basic"
        ? qrData.plan
        : undefined,
    totalReviews: 0,
    activeReviews: 0,
    inactiveReviews: 0,
    reviewsInQueue: 0,
  };
}

function mapApiToReviews(qrId: string, apiResponse: any): Review[] {
  const reviewsData = Array.isArray(apiResponse)
    ? apiResponse
    : apiResponse.data || apiResponse.reviews || [];

  return reviewsData.map((review: any, index: number) => {
    const contact = review.contact || "";
    const isEmail = contact.includes("@");

    return {
      id: `api-review-${index}-${review.created_at || Date.now()}`,
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
  });
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface UseBusinessDataReturn {
  business: Business | null;
  setBusiness: React.Dispatch<React.SetStateAction<Business | null>>;
  isLoading: boolean;
  loadError: string | null;
  website: string;
  setWebsite: React.Dispatch<React.SetStateAction<string>>;
  reviewUrl: string;
  qrCodeDataUrl: string | null;
  setQrCodeDataUrl: React.Dispatch<React.SetStateAction<string | null>>;
  qrCodeError: string | null;
  setQrCodeError: React.Dispatch<React.SetStateAction<string | null>>;
  currentUser: ReturnType<typeof getStoredUser>;
  setCurrentUser: React.Dispatch<
    React.SetStateAction<ReturnType<typeof getStoredUser>>
  >;
  apiReviews: Review[];
  isLoadingReviews: boolean;
  reviewError: string | null;
  retry: () => void;
}

export function useBusinessData(businessSlug: string): UseBusinessDataReturn {
  const router = useRouter();

  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [website, setWebsite] = useState("");
  const [reviewUrl, setReviewUrl] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [qrCodeError, setQrCodeError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getStoredUser>>(null);
  const [apiReviews, setApiReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const retry = useCallback(() => setRetryKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    const fetchBusiness = async () => {
      setLoadError(null);
      setIsLoading(true);

      try {
        const response = await fetch(`/api/business/${encodeURIComponent(businessSlug)}`);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          if (!cancelled) {
            setLoadError(
              errData.message ||
                "Failed to load business. Please check your connection and try again."
            );
            setIsLoading(false);
          }
          return;
        }

        const apiResponse = await response.json();
        const qrData = apiResponse.data;

        if (!qrData) {
          if (!cancelled) {
            setLoadError("Business not found.");
            setIsLoading(false);
          }
          return;
        }

        const mappedBusiness = mapApiToBusiness(businessSlug, qrData);

        // Merge with localStorage overrides (user may have saved when API didn't persist)
        const overrides =
          typeof window !== "undefined"
            ? getBusinessEditOverrides(businessSlug)
            : null;
        const { business: mergedBusiness, website: mergedWebsite } =
          mergeBusinessWithOverrides(
            mappedBusiness,
            overrides,
            qrData.business_website || ""
          );

        if (cancelled) return;

        setBusiness(mergedBusiness);
        setWebsite(mergedWebsite || qrData.business_website || "");
        setReviewUrl(qrData.business_review_url);

        // QR code
        if (qrData.business_qr_code_url) {
          setQrCodeDataUrl(qrData.business_qr_code_url);
          setBusiness((prev) =>
            prev
              ? { ...prev, qrCodeUrl: qrData.business_qr_code_url }
              : null
          );
        } else if (qrData.business_review_url) {
          setQrCodeError(null);
          generateQRCodeDataUrl(qrData.business_review_url)
            .then((dataUrl) => {
              if (cancelled) return;
              setQrCodeDataUrl(dataUrl);
              setQrCodeError(null);
              setBusiness((prev) =>
                prev ? { ...prev, qrCodeUrl: dataUrl } : null
              );
            })
            .catch((error) => {
              if (cancelled) return;
              console.error("Error generating QR code:", error);
              setQrCodeError("Failed to generate QR code");
            });
        }

        const user = getStoredUser();
        setCurrentUser(user);
        setIsLoading(false);

        // Fetch reviews
        await fetchReviews(businessSlug);
      } catch (error) {
        if (cancelled) return;
        console.error("Error fetching business QR data:", error);
        setLoadError(
          "Failed to load business. Please check your connection and try again."
        );
        setIsLoading(false);
      }
    };

    const fetchReviews = async (qrId: string) => {
      setIsLoadingReviews(true);
      setReviewError(null);
      try {
        const authToken = getAuthToken();
        const headers: HeadersInit = {};
        if (authToken) {
          headers["Authorization"] = `Bearer ${authToken}`;
        }

        const response = await fetch(
          `/api/business/${encodeURIComponent(qrId)}/reviews`,
          { headers }
        );

        if (!response.ok) {
          if (!cancelled) {
            setReviewError("Could not load reviews. You can still use the page.");
          }
          return;
        }

        const data = await response.json();
        if (!cancelled) {
          setApiReviews(mapApiToReviews(qrId, data));
        }
      } catch (error) {
        console.error("Error fetching manual reviews:", error);
        if (!cancelled) {
          setReviewError("Could not load reviews. You can still use the page.");
        }
      } finally {
        if (!cancelled) setIsLoadingReviews(false);
      }
    };

    fetchBusiness();

    return () => {
      cancelled = true;
    };
  }, [businessSlug, router, retryKey]);

  return {
    business,
    setBusiness,
    isLoading,
    loadError,
    website,
    setWebsite,
    reviewUrl,
    qrCodeDataUrl,
    setQrCodeDataUrl,
    qrCodeError,
    setQrCodeError,
    currentUser,
    setCurrentUser,
    apiReviews,
    isLoadingReviews,
    reviewError,
    retry,
  };
}
