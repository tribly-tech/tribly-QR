import { NextRequest, NextResponse } from "next/server";
import { fetchBusinessManualReviews } from "@/services/api/business";

/**
 * GET /api/business/[id]/reviews
 * Proxies the manual reviews endpoint. Backend URL stays server-side.
 * Forwards the Authorization header from the client.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authHeader = request.headers.get("authorization");

  const result = await fetchBusinessManualReviews(id, authHeader);

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }

  return NextResponse.json(result.data);
}
