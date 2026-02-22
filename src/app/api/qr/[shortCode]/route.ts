import { NextRequest, NextResponse } from "next/server";
import { lookupQrShortCode } from "@/services/api/business";

/**
 * GET /api/qr/[shortCode]
 * Resolves a printed QR short code to its qr_id and business_id.
 * No auth required (public scan flow).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await params;

  const result = await lookupQrShortCode(shortCode);

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }

  return NextResponse.json(result.data);
}
