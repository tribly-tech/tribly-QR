import { NextRequest, NextResponse } from "next/server";
import { fetchBusinessManualReviews } from "@/services/api/business";

/**
 * GET /api/business/[id]/reviews?page=1&page_size=20
 * Proxies the manual reviews endpoint. Backend URL stays server-side.
 * Forwards the Authorization header from the client.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authHeader = request.headers.get("authorization");
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(searchParams.get("page_size") ?? "20", 10);

  const result = await fetchBusinessManualReviews(id, authHeader, page, pageSize);

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }

  return NextResponse.json(result.data);
}
