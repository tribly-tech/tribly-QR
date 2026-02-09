/**
 * Locations API service (Tribly backend: autocomplete, details, nearby-rank).
 * Used by Next.js API route handlers; response shapes unchanged.
 */

import { getTriblyBaseUrl, buildHeaders, parseErrorResponse, ApiResult } from "./client";

const MIN_QUERY_LENGTH = 3;
const DEFAULT_RADIUS_M = 5000;
const TOP_N = 3;

export interface LocationsAutocompleteParams {
  q: string;
  session_token?: string;
  language?: string;
  country?: string;
  lat?: string;
  lng?: string;
  radius?: string;
}

export async function locationsAutocomplete(
  params: LocationsAutocompleteParams,
  authHeader: string | null
): Promise<ApiResult> {
  const trimmed = params.q?.trim();
  if (!trimmed || trimmed.length < MIN_QUERY_LENGTH) {
    return {
      ok: false,
      status: 400,
      error: { error: "Query parameter 'q' is required (min 3 characters)" },
    };
  }

  const searchParams = new URLSearchParams({
    q: trimmed,
    country: params.country ?? "in",
  });
  if (params.session_token) searchParams.set("session_token", params.session_token);
  if (params.language) searchParams.set("language", params.language);
  if (params.lat != null && params.lat !== "") searchParams.set("lat", params.lat);
  if (params.lng != null && params.lng !== "") searchParams.set("lng", params.lng);
  if (params.radius != null && params.radius !== "") searchParams.set("radius", params.radius);

  try {
    const url = `${getTriblyBaseUrl()}/dashboard/v1/locations/autocomplete?${searchParams.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: buildHeaders(authHeader),
    });

    if (!response.ok) {
      const errorBody = await parseErrorResponse(response);
      return {
        ok: false,
        status: response.status,
        error: errorBody || { error: "Locations autocomplete failed" },
      };
    }

    const data = await response.json();
    return { ok: true, status: 200, data };
  } catch (error) {
    console.error("Error calling locations autocomplete:", error);
    return {
      ok: false,
      status: 500,
      error: { error: "Failed to search locations" },
    };
  }
}

export interface LocationsDetailsParams {
  place_id: string;
  session_token?: string;
}

export async function locationsDetails(
  params: LocationsDetailsParams,
  authHeader: string | null
): Promise<ApiResult> {
  const placeId = params.place_id?.trim();
  if (!placeId) {
    return {
      ok: false,
      status: 400,
      error: { error: "Query parameter 'place_id' is required" },
    };
  }

  const searchParams = new URLSearchParams({ place_id: placeId });
  if (params.session_token) searchParams.set("session_token", params.session_token);

  try {
    const url = `${getTriblyBaseUrl()}/dashboard/v1/locations/details?${searchParams.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: buildHeaders(authHeader),
    });

    if (!response.ok) {
      const errorBody = await parseErrorResponse(response);
      return {
        ok: false,
        status: response.status,
        error: errorBody || { error: "Location details fetch failed" },
      };
    }

    const data = await response.json();
    return { ok: true, status: 200, data };
  } catch (error) {
    console.error("Error calling location details:", error);
    return {
      ok: false,
      status: 500,
      error: { error: "Failed to fetch location details" },
    };
  }
}

export interface NearbyRankParams {
  lat: string;
  lng: string;
  place_id: string;
  radius_m?: string;
  search_rank?: string;
}

export interface NearbyRankData {
  in_top_3: boolean;
  rank: number;
  total_in_radius: number;
  radius_km: number;
  message?: string;
  fallback?: boolean;
}

export async function locationsNearbyRank(
  params: NearbyRankParams,
  authHeader: string | null
): Promise<ApiResult<{ data: NearbyRankData }>> {
  const radiusM = params.radius_m;
  const radiusMeters = radiusM
    ? Math.min(50000, Math.max(500, parseInt(radiusM, 10) || DEFAULT_RADIUS_M))
    : DEFAULT_RADIUS_M;
  const radiusKm = Math.round((radiusMeters / 1000) * 10) / 10;

  if (params.search_rank != null && params.search_rank !== "") {
    const searchRank = parseFloat(params.search_rank);
    if (!Number.isNaN(searchRank) && searchRank >= 1) {
      const inTop3 = searchRank <= TOP_N;
      const rank = Math.round(searchRank);
      return {
        ok: true,
        status: 200,
        data: {
          data: {
            in_top_3: inTop3,
            rank,
            total_in_radius: Math.max(rank, 10),
            radius_km: radiusKm,
            message: inTop3
              ? `Based on your search rank (${rank}), you appear to be in the top ${TOP_N} in your area.`
              : `Based on your search rank (${rank}), you're not in the top ${TOP_N} within ${radiusKm} km.`,
            fallback: true,
          },
        },
      };
    }
  }

  if (!params.place_id?.trim()) {
    return {
      ok: false,
      status: 400,
      error: {
        error:
          "Query parameter 'place_id' is required when lat/lng are not used with search_rank fallback",
      },
    };
  }

  if (
    params.lat == null ||
    params.lng == null ||
    params.lat === "" ||
    params.lng === ""
  ) {
    return {
      ok: true,
      status: 200,
      data: {
        data: {
          in_top_3: false,
          rank: 0,
          total_in_radius: 0,
          radius_km: radiusKm,
          message: "Location (lat/lng) is required to check ranking within radius.",
          fallback: true,
        },
      },
    };
  }

  const searchParams = new URLSearchParams({
    lat: params.lat.trim(),
    lng: params.lng.trim(),
    place_id: params.place_id.trim(),
    radius_m: String(radiusMeters),
  });

  try {
    const url = `${getTriblyBaseUrl()}/dashboard/v1/locations/nearby-rank?${searchParams.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: buildHeaders(authHeader),
    });

    if (response.ok) {
      const json = await response.json();
      const data = json.data ?? json;
      return {
        ok: true,
        status: 200,
        data: {
          data: {
            in_top_3: data.in_top_3 ?? data.inTop3 ?? false,
            rank: data.rank ?? 0,
            total_in_radius: data.total_in_radius ?? data.totalInRadius ?? 0,
            radius_km: data.radius_km ?? data.radiusKm ?? radiusKm,
            message: data.message,
            fallback: false,
          },
        },
      };
    }

    if (response.status === 404 || response.status === 501) {
      return {
        ok: true,
        status: 200,
        data: {
          data: {
            in_top_3: false,
            rank: 0,
            total_in_radius: 0,
            radius_km: radiusKm,
            message: "Local ranking is not available for this location yet.",
            fallback: true,
          },
        },
      };
    }

    const errorBody = await parseErrorResponse(response);
    return {
      ok: false,
      status: response.status,
      error: errorBody ?? { error: "Nearby rank failed" },
    };
  } catch (error) {
    console.error("Error calling nearby-rank:", error);
    return {
      ok: true,
      status: 200,
      data: {
        data: {
          in_top_3: false,
          rank: 0,
          total_in_radius: 0,
          radius_km: radiusKm,
          message: "Unable to check local ranking. Try again later.",
          fallback: true,
        },
      },
    };
  }
}
