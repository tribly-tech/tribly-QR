/**
 * GBP (Google Business Profile) API service.
 * - Auth sessions
 * - Analyze (score + analysis from place details)
 */

import { getTriblyBaseUrl, buildHeaders, parseErrorResponse, ApiResult } from "./client";

export interface GbpAnalyzeRequest {
  business_name: string;
  place_id?: string | null;
  place_details?: Record<string, unknown> | null;
}

export interface GbpAnalyzeResult {
  overallScore: number;
  analysisData: {
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
    actionItems: Array<{ priority: string; title: string; description: string }>;
    metricScores?: Record<string, number>;
  };
}

export async function gbpAnalyze(
  body: GbpAnalyzeRequest,
  authHeader: string | null
): Promise<ApiResult<GbpAnalyzeResult>> {
  if (!body.business_name?.trim()) {
    return {
      ok: false,
      status: 400,
      error: { error: "business_name is required" },
    };
  }

  try {
    const payload: Record<string, unknown> = {
      business_name: body.business_name.trim(),
    };
    if (body.place_id) payload.place_id = body.place_id;
    if (body.place_details) payload.place_details = body.place_details;

    const response = await fetch(
      `${getTriblyBaseUrl()}/dashboard/v1/gbp/analyze`,
      {
        method: "POST",
        headers: buildHeaders(authHeader),
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorBody = await parseErrorResponse(response);
      return {
        ok: false,
        status: response.status,
        error: errorBody || { error: "GBP analysis failed" },
      };
    }

    const json = await response.json();
    const data = json.data ?? json;
    const result: GbpAnalyzeResult = {
      overallScore: data.overallScore ?? 0,
      analysisData: data.analysisData ?? data.analysis_data ?? {},
    };
    return { ok: true, status: 200, data: result };
  } catch (error) {
    console.error("Error calling GBP analyze:", error);
    return {
      ok: false,
      status: 500,
      error: { error: "Failed to run GBP analysis" },
    };
  }
}

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
