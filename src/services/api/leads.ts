/**
 * Leads API service (Growth QR - Tribly backend).
 * Endpoints: session, autocomplete, report.
 */

import { getTriblyBaseUrl, parseErrorResponse, ApiResult } from "./client";

const MIN_QUERY_LENGTH = 3;
const DEFAULT_RADIUS_M = 50000; // 50 km
const DEFAULT_COUNTRY = "in";
const DEFAULT_LANGUAGE = "en";

export interface LeadsSessionResponse {
  success: boolean;
  data?: {
    session_token: string;
    expires_in: number;
  };
}

export interface LeadsAutocompleteSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  types?: string[];
}

export interface LeadsAutocompleteParams {
  q: string;
  session_token?: string;
  country?: string;
  language?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}

export interface LeadsAutocompleteResponse {
  success: boolean;
  data?: LeadsAutocompleteSuggestion[];
  message?: string;
  error?: unknown;
}

export interface LeadsReportParams {
  place_id: string;
  email?: string;
  phone?: string;
}

export interface LeadsReportResponse {
  success: boolean;
  message?: string;
  data?: { lead_id: string };
  error?: unknown;
}

/** Get client IP from request headers (for server-side API routes) */
export function getClientIp(headers: Headers): string | null {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    null
  );
}

export async function leadsSession(
  clientIp?: string | null
): Promise<ApiResult<LeadsSessionResponse>> {
  try {
    const url = `${getTriblyBaseUrl()}/dashboard/v1/leads/session`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (clientIp) {
      (headers as Record<string, string>)["X-Forwarded-For"] = clientIp;
      (headers as Record<string, string>)["X-Client-IP"] = clientIp;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
    });

    if (!response.ok) {
      const errorBody = await parseErrorResponse(response);
      return {
        ok: false,
        status: response.status,
        error: errorBody || { error: "Leads session failed" },
      };
    }

    const data = (await response.json()) as LeadsSessionResponse;
    return { ok: true, status: 200, data };
  } catch (error) {
    console.error("Error calling leads session:", error);
    return {
      ok: false,
      status: 500,
      error: { error: "Failed to get leads session" },
    };
  }
}

export async function leadsAutocomplete(
  params: LeadsAutocompleteParams,
  clientIp?: string | null
): Promise<ApiResult<LeadsAutocompleteResponse>> {
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
    country: params.country ?? DEFAULT_COUNTRY,
    language: params.language ?? DEFAULT_LANGUAGE,
  });
  if (params.session_token) {
    searchParams.set("session_token", params.session_token);
  }
  if (params.lat != null && params.lng != null) {
    searchParams.set("lat", String(params.lat));
    searchParams.set("lng", String(params.lng));
    searchParams.set(
      "radius",
      String(params.radius ?? DEFAULT_RADIUS_M)
    );
  }

  try {
    const url = `${getTriblyBaseUrl()}/dashboard/v1/leads/autocomplete?${searchParams.toString()}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (clientIp) {
      (headers as Record<string, string>)["X-Forwarded-For"] = clientIp;
      (headers as Record<string, string>)["X-Client-IP"] = clientIp;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorBody = await parseErrorResponse(response);
      return {
        ok: false,
        status: response.status,
        error: errorBody || { error: "Leads autocomplete failed" },
      };
    }

    const data = (await response.json()) as LeadsAutocompleteResponse;
    return { ok: true, status: 200, data };
  } catch (error) {
    console.error("Error calling leads autocomplete:", error);
    return {
      ok: false,
      status: 500,
      error: { error: "Failed to search businesses" },
    };
  }
}

export async function leadsReport(
  params: LeadsReportParams,
  clientIp?: string | null
): Promise<ApiResult<LeadsReportResponse>> {
  const placeId = params.place_id?.trim();
  if (!placeId) {
    return {
      ok: false,
      status: 400,
      error: { error: "place_id is required" },
    };
  }
  if (!params.email?.trim() && !params.phone?.trim()) {
    return {
      ok: false,
      status: 400,
      error: { error: "At least one of email or phone is required" },
    };
  }

  const body: Record<string, string> = { place_id: placeId };
  if (params.email?.trim()) body.email = params.email.trim();
  if (params.phone?.trim()) body.phone = params.phone.trim();

  try {
    const url = `${getTriblyBaseUrl()}/dashboard/v1/leads/report`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (clientIp) {
      (headers as Record<string, string>)["X-Forwarded-For"] = clientIp;
      (headers as Record<string, string>)["X-Client-IP"] = clientIp;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as LeadsReportResponse;

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data || { error: "Leads report failed" },
      };
    }

    return { ok: true, status: response.status, data };
  } catch (error) {
    console.error("Error calling leads report:", error);
    return {
      ok: false,
      status: 500,
      error: { error: "Failed to submit report" },
    };
  }
}
