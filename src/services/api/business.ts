/**
 * Business QR data API (Tribly backend: business_qr/scan, manual_reviews, gbp/performance).
 */

import { getTriblyBaseUrl, buildHeaders, ApiResult } from "./client";

export async function fetchBusinessByQrId(
  qrId: string
): Promise<ApiResult> {
  if (!qrId) {
    return { ok: false, status: 400, error: { message: "qr_id is required" } };
  }

  try {
    const response = await fetch(
      `${getTriblyBaseUrl()}/dashboard/v1/business_qr/scan?qr_id=${encodeURIComponent(qrId)}`,
      { headers: buildHeaders(null) }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data ?? { message: "Failed to fetch business" },
      };
    }

    return { ok: true, status: response.status, data };
  } catch (error) {
    console.error("Error fetching business by QR ID:", error);
    return {
      ok: false,
      status: 500,
      error: { message: "Failed to fetch business data" },
    };
  }
}

export async function fetchBusinessManualReviews(
  qrId: string,
  authHeader: string | null,
  page = 1,
  pageSize = 20
): Promise<ApiResult> {
  if (!qrId) {
    return { ok: false, status: 400, error: { message: "qr_id is required" } };
  }

  try {
    const response = await fetch(
      `${getTriblyBaseUrl()}/dashboard/v1/business_qr/manual_reviews?qr_id=${encodeURIComponent(qrId)}&page=${page}&page_size=${pageSize}`,
      { headers: buildHeaders(authHeader) }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data ?? { message: "Failed to fetch reviews" },
      };
    }

    return { ok: true, status: response.status, data };
  } catch (error) {
    console.error("Error fetching manual reviews:", error);
    return {
      ok: false,
      status: 500,
      error: { message: "Failed to fetch reviews" },
    };
  }
}

export async function lookupQrShortCode(
  shortCode: string
): Promise<ApiResult> {
  const code = (shortCode || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{8}$/.test(code)) {
    return {
      ok: false,
      status: 400,
      error: { message: "Invalid short code: must be exactly 8 alphanumeric characters" },
    };
  }

  try {
    const response = await fetch(
      `${getTriblyBaseUrl()}/dashboard/v1/business_qr/qr/${encodeURIComponent(code)}`,
      { headers: buildHeaders(null) }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data ?? { message: "QR code not found" },
      };
    }

    return { ok: true, status: response.status, data };
  } catch (error) {
    console.error("Error looking up QR short code:", error);
    return {
      ok: false,
      status: 500,
      error: { message: "Failed to look up QR code" },
    };
  }
}

export type PerformanceFilter =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "half_yearly"
  | "yearly";

export interface RegisterBusinessPayload {
  qr_code: string;
  gbp_session_id?: string;
  name?: string;
  description?: string;
  email?: string;
  phone?: string;
  category?: string;
  google_review_url?: string;
  plan: string;
  tags?: string[];
  address?: {
    address_line1?: string;
    address_line2?: string;
    city?: string;
    area?: string;
    pincode?: string;
  };
}

export async function registerBusiness(
  payload: RegisterBusinessPayload,
  authHeader: string | null
): Promise<ApiResult<{ business_id?: string }>> {
  const code = (payload.qr_code || "").trim();
  if (code.length !== 8) {
    return {
      ok: false,
      status: 400,
      error: { message: "qr_code must be exactly 8 characters" },
    };
  }
  if (!payload.plan) {
    return {
      ok: false,
      status: 400,
      error: { message: "plan is required" },
    };
  }

  try {
    const response = await fetch(
      `${getTriblyBaseUrl()}/dashboard/v1/business_qr/register`,
      {
        method: "POST",
        headers: buildHeaders(authHeader),
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok || data.status !== "success") {
      return {
        ok: false,
        status: response.status,
        error:
          data.detail ?? data.message ?? { message: "Failed to onboard business" },
      };
    }

    return {
      ok: true,
      status: response.status,
      data: data.data ?? {},
    };
  } catch (error) {
    console.error("Error registering business:", error);
    return {
      ok: false,
      status: 500,
      error: { message: "Failed to onboard business" },
    };
  }
}

export async function fetchPerformanceMetrics(
  filter: PerformanceFilter,
  authHeader: string | null
): Promise<ApiResult> {
  try {
    const url = new URL(
      `${getTriblyBaseUrl()}/dashboard/v1/gbp/performance/metrics`
    );
    url.searchParams.set("filter", filter);

    const response = await fetch(url.toString(), {
      headers: buildHeaders(authHeader),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data ?? { message: "Failed to fetch performance metrics" },
      };
    }

    return { ok: true, status: response.status, data };
  } catch (error) {
    console.error("Error fetching performance metrics:", error);
    return {
      ok: false,
      status: 500,
      error: { message: "Failed to fetch performance metrics" },
    };
  }
}
