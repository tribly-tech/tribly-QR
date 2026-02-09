import { NextRequest, NextResponse } from "next/server";
import { createGbpAuthSession } from "@/services/api/gbp";
import { gbpAuthSessionBodySchema } from "@/lib/validation";

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
    const parsed = gbpAuthSessionBodySchema.safeParse(body);
    if (!parsed.success) {
      const msg =
        parsed.error.issues[0]?.message ??
        "business_name and business_phone are required";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const result = await createGbpAuthSession(
      {
        business_name: parsed.data.business_name,
        business_phone: parsed.data.business_phone,
        place_id: parsed.data.place_id ?? null,
      },
      request.headers.get("authorization")
    );

    if (!result.ok) {
      return NextResponse.json(result.error, { status: result.status });
    }
    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error creating GBP auth session:", error);
    return NextResponse.json(
      { error: "Failed to create auth session" },
      { status: 500 }
    );
  }
}
