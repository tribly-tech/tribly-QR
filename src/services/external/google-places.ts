/**
 * Server-side Google Places API (used by Next.js API route handlers).
 * API key must be set in env; falls back to mock data when not configured.
 */

import { getGooglePlacesApiKey } from "@/config";

const FIELDS = [
  "place_id",
  "name",
  "formatted_address",
  "formatted_phone_number",
  "international_phone_number",
  "website",
  "address_components",
  "geometry",
  "types",
  "business_status",
  "rating",
  "user_ratings_total",
].join(",");

/** Fields for Place Details when we need reviews (Places API returns up to 5) */
const FIELDS_WITH_REVIEWS = [
  "place_id",
  "rating",
  "user_ratings_total",
  "reviews",
].join(",");

export interface GooglePlaceReview {
  author_name: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number; // Unix timestamp
}

export async function googlePlacesAutocomplete(
  query: string,
  options?: { types?: "establishment" | "address" | "geocode" }
): Promise<{ predictions: unknown[] }> {
  const apiKey = getGooglePlacesApiKey();
  const types = options?.types ?? "establishment";

  if (!apiKey) {
    console.warn(
      "Google Places API key is not configured, using mock data for testing"
    );
    const { getMockPredictions } = await import("@/lib/mock-places-data");
    const mockResults = getMockPredictions(query);
    return { predictions: mockResults };
  }

  const typesParam = types === "establishment" ? "&types=establishment" : `&types=${types}`;
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${apiKey}${typesParam}`
  );

  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    console.error("Google Places API error:", data.status, data.error_message);
    throw new Error(data.error_message || "Failed to fetch places");
  }

  return { predictions: data.predictions || [] };
}

export async function googlePlacesDetails(placeId: string): Promise<{
  result: unknown | null;
}> {
  const apiKey = getGooglePlacesApiKey();

  if (!apiKey) {
    console.warn(
      "Google Places API key is not configured, using mock data for testing"
    );
    const { getMockPlaceDetails } = await import("@/lib/mock-places-data");
    const mockResult = getMockPlaceDetails(placeId);
    if (!mockResult) {
      throw new Error("Place not found");
    }
    return { result: mockResult };
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${FIELDS}&key=${apiKey}`
  );

  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== "OK") {
    console.error("Google Places API error:", data.status, data.error_message);
    throw new Error(data.error_message || "Failed to fetch place details");
  }

  return { result: data.result || null };
}

/** Default rating/count when using mock place details without a matching mock place */
const MOCK_DEFAULT_RATING = 4.2;
const MOCK_DEFAULT_TOTAL = 24;

/**
 * Fetch place details including rating and reviews (Places API returns up to 5 reviews).
 * Use this for the Reviews tab; does not require extra fields like address.
 * Uses mock data when: no API key, or placeId starts with "mock_" (for local testing).
 */
export async function googlePlacesDetailsWithReviews(placeId: string): Promise<{
  rating?: number;
  user_ratings_total?: number;
  reviews: GooglePlaceReview[];
}> {
  const apiKey = getGooglePlacesApiKey();
  const useMock =
    !apiKey || placeId.startsWith("mock_");

  if (useMock) {
    const { getMockPlaceDetails } = await import("@/lib/mock-places-data");
    const mockResult = getMockPlaceDetails(placeId);
    const rating = mockResult?.rating ?? MOCK_DEFAULT_RATING;
    const user_ratings_total = mockResult?.user_ratings_total ?? MOCK_DEFAULT_TOTAL;
    return {
      rating,
      user_ratings_total,
      reviews: [],
    };
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${FIELDS_WITH_REVIEWS}&key=${apiKey}`
  );

  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== "OK") {
    console.error("Google Places API error:", data.status, data.error_message);
    throw new Error(data.error_message || "Failed to fetch place details");
  }

  const result = data.result || null;
  const reviews = Array.isArray(result?.reviews) ? result.reviews : [];
  return {
    rating: typeof result?.rating === "number" ? result.rating : undefined,
    user_ratings_total:
      typeof result?.user_ratings_total === "number"
        ? result.user_ratings_total
        : undefined,
    reviews,
  };
}
