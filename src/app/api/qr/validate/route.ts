import { NextRequest, NextResponse } from "next/server";

const TRIBLY_API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.tribly.ai";

/**
 * POST /api/qr/validate
 * Validates a Tribly QR by full URL or 8-character code.
 * Proxies to backend validate-qr; returns is_active, code, cdn_url.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const qr_data = body.qr_data;

    if (!qr_data || typeof qr_data !== "string" || !qr_data.trim()) {
      return NextResponse.json(
        { error: "qr_data is required" },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("authorization");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const response = await fetch(
      `${TRIBLY_API_BASE}/dashboard/v1/business_qr/validate-qr`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ qr_data: qr_data.trim() }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data || { error: "Validation failed" }, {
        status: response.status,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error validating QR:", error);
    return NextResponse.json(
      { error: "Failed to validate QR" },
      { status: 500 }
    );
  }
}
