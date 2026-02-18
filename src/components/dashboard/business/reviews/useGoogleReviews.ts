"use client";

import { useState, useEffect, useCallback } from "react";
import type { GooglePlaceReview } from "@/services/external/google-places";

export interface GoogleReviewsState {
  rating: number | null;
  userRatingsTotal: number | null;
  reviews: GooglePlaceReview[];
  isLoading: boolean;
  error: string | null;
}

export function useGoogleReviews(placeId: string | null | undefined): GoogleReviewsState & { refetch: () => void } {
  const [state, setState] = useState<GoogleReviewsState>({
    rating: null,
    userRatingsTotal: null,
    reviews: [],
    isLoading: false,
    error: null,
  });

  const fetchReviews = useCallback(async () => {
    if (!placeId?.trim()) {
      setState((s) => ({
        ...s,
        rating: null,
        userRatingsTotal: null,
        reviews: [],
        isLoading: false,
        error: null,
      }));
      return;
    }

    setState((s) => ({ ...s, isLoading: true, error: null }));

    try {
      const res = await fetch(
        `/api/google-places/reviews?placeId=${encodeURIComponent(placeId.trim())}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load Google reviews");
      }

      setState({
        rating: data.rating ?? null,
        userRatingsTotal: data.user_ratings_total ?? null,
        reviews: Array.isArray(data.reviews) ? data.reviews : [],
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load Google reviews",
      }));
    }
  }, [placeId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return { ...state, refetch: fetchReviews };
}
