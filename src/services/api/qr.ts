/**
 * QR validation API service (Tribly backend: validate-qr).
 */

import { getTriblyBaseUrl, buildHeaders, ApiResult } from "./client";

export async function validateQr(
  qrData: string,
  authHeader: string | null
): Promise<ApiResult> {
  const trimmed = typeof qrData === "string" ? qrData.trim() : "";
  if (!trimmed) {
    return {
      ok: false,
      status: 400,
      error: { error: "qr_data is required" },
    };
  }

  try {
    const response = await fetch(
      `${getTriblyBaseUrl()}/dashboard/v1/business_qr/validate-qr`,
      {
        method: "POST",
        headers: buildHeaders(authHeader),
        body: JSON.stringify({ qr_data: trimmed }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data || { error: "Validation failed" },
      };
    }

    return { ok: true, status: 200, data };
  } catch (error) {
    console.error("Error validating QR:", error);
    return {
      ok: false,
      status: 500,
      error: { error: "Failed to validate QR" },
    };
  }
}
