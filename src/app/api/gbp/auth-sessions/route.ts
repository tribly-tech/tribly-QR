import { NextRequest, NextResponse } from "next/server";

const TRIBLY_API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.tribly.ai";

/**
 * POST /api/gbp/auth-sessions
 * Creates a new GBP auth session when sales person wants to connect a business
 *
 * Request body:
 * - business_name: string (required)
 * - business_phone: string (required)
 * - place_id: string (optional) - Google Place ID if available
 *
 * Response:
 * - session_id: string - Unique ID to track this auth request
 * - auth_url: string - URL to send to business owner
 * - expires_at: string - When this session expires
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { business_name, business_phone, place_id } = body;

    if (!business_name || !business_phone) {
      return NextResponse.json(
        { error: "business_name and business_phone are required" },
        { status: 400 },
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
      `${TRIBLY_API_BASE}/dashboard/v1/gbp/auth-sessions`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          business_name,
          business_phone,
          place_id: place_id || null,
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      let errorBody: unknown;
      try {
        errorBody = JSON.parse(text);
      } catch {
        errorBody = { message: text || response.statusText };
      }
      return NextResponse.json(
        errorBody || { error: "Failed to create auth session" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating GBP auth session:", error);
    return NextResponse.json(
      { error: "Failed to create auth session" },
      { status: 500 },
    );
  }
}
