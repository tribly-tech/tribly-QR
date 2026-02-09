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

export async function googlePlacesAutocomplete(
  query: string
): Promise<{ predictions: unknown[] }> {
  const apiKey = getGooglePlacesApiKey();

  if (!apiKey) {
    console.warn(
      "Google Places API key is not configured, using mock data for testing"
    );
    const { getMockPredictions } = await import("@/lib/mock-places-data");
    const mockResults = getMockPredictions(query);
    return { predictions: mockResults };
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${apiKey}&types=establishment`
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
