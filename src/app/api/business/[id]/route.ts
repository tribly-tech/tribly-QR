import { NextRequest, NextResponse } from "next/server";
import { fetchBusinessByQrId } from "@/services/api/business";

/**
 * GET /api/business/[id]
 * Proxies the business scan endpoint. Backend URL stays server-side.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await fetchBusinessByQrId(id);

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }

  return NextResponse.json(result.data);
}
