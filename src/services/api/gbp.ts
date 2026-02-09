/**
 * GBP (Google Business Profile) auth sessions API service.
 */

import { getTriblyBaseUrl, buildHeaders, parseErrorResponse, ApiResult } from "./client";

export interface CreateAuthSessionBody {
  business_name: string;
  business_phone: string;
  place_id?: string | null;
}

export async function createGbpAuthSession(
  body: CreateAuthSessionBody,
  authHeader: string | null
): Promise<ApiResult> {
  if (!body.business_name || !body.business_phone) {
    return {
      ok: false,
      status: 400,
      error: { error: "business_name and business_phone are required" },
    };
  }

  try {
    const response = await fetch(
      `${getTriblyBaseUrl()}/dashboard/v1/gbp/auth-sessions`,
      {
        method: "POST",
        headers: buildHeaders(authHeader),
        body: JSON.stringify({
          business_name: body.business_name,
          business_phone: body.business_phone,
          place_id: body.place_id || null,
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await parseErrorResponse(response);
      return {
        ok: false,
        status: response.status,
        error: errorBody || { error: "Failed to create auth session" },
      };
    }

    const data = await response.json();
    return { ok: true, status: 200, data };
  } catch (error) {
    console.error("Error creating GBP auth session:", error);
    return {
      ok: false,
      status: 500,
      error: { error: "Failed to create auth session" },
    };
  }
}

export async function getGbpAuthSessionStatus(
  sessionId: string,
  authHeader: string | null
): Promise<ApiResult> {
  if (!sessionId) {
    return {
      ok: false,
      status: 400,
      error: { error: "Session ID is required" },
    };
  }

  try {
    const response = await fetch(
      `${getTriblyBaseUrl()}/dashboard/v1/gbp/auth-sessions/${sessionId}/status`,
      {
        method: "GET",
        headers: buildHeaders(authHeader),
      }
    );

    if (!response.ok) {
      const errorBody = await parseErrorResponse(response);
      return {
        ok: false,
        status: response.status,
        error: errorBody || { error: "Failed to get session status" },
      };
    }

    const data = await response.json();
    return { ok: true, status: 200, data };
  } catch (error) {
    console.error("Error getting GBP auth session status:", error);
    return {
      ok: false,
      status: 500,
      error: { error: "Failed to get session status" },
    };
  }
}
