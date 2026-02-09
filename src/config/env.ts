/**
 * Centralized environment and API configuration.
 * Use these getters instead of process.env directly for consistency and testability.
 */

const TRIBLY_API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.tribly.ai";

/** Public API base URL for Tribly backend (dashboard APIs) */
export function getApiBaseUrl(): string {
  return TRIBLY_API_BASE;
}

/** Google Places API key (server-side). Undefined if not set. */
export function getGooglePlacesApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
}
