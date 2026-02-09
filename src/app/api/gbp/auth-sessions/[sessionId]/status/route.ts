import { NextRequest, NextResponse } from "next/server";
import { getGbpAuthSessionStatus } from "@/services/api/gbp";

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
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const result = await getGbpAuthSessionStatus(
    sessionId,
    request.headers.get("authorization")
  );

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }
  return NextResponse.json(result.data);
}
