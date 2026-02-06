import { NextRequest, NextResponse } from "next/server";

const TRIBLY_API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.tribly.ai";

/**
 * GET /api/gbp/auth-sessions/[sessionId]/status
 * Checks the status of a GBP auth session (used for polling)
 *
 * Response:
 * - status: "pending" | "completed" | "expired" | "failed"
 * - completed_at: string | null - When the auth was completed
 * - business_data: object | null - Business data if completed
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;

  if (!sessionId) {
    return NextResponse.json(
      { error: "Session ID is required" },
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

  try {
    const response = await fetch(
      `${TRIBLY_API_BASE}/dashboard/v1/gbp/auth-sessions/${sessionId}/status`,
      {
        method: "GET",
        headers,
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
        errorBody || { error: "Failed to get session status" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error getting GBP auth session status:", error);
    return NextResponse.json(
      { error: "Failed to get session status" },
      { status: 500 },
    );
  }
}
