import { NextRequest, NextResponse } from "next/server";
import { validateQr } from "@/services/api/qr";
import { validateQrBodySchema } from "@/lib/validation";

/**
 * POST /api/qr/validate
 * Validates a Tribly QR by full URL or 8-character code.
 * Proxies to backend validate-qr; returns is_active, code, cdn_url.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = validateQrBodySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "qr_data is required";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const result = await validateQr(
      parsed.data.qr_data,
      request.headers.get("authorization")
    );

    if (!result.ok) {
      return NextResponse.json(result.error, { status: result.status });
    }
    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error validating QR:", error);
    return NextResponse.json(
      { error: "Failed to validate QR" },
      { status: 500 }
    );
  }
}
