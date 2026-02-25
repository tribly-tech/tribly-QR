import { NextRequest, NextResponse } from "next/server";
import {
  registerBusiness,
  type RegisterBusinessPayload,
} from "@/services/api/business";

/**
 * POST /api/business/register
 * Proxies business onboarding to the backend. Backend URL stays server-side.
 * Forwards the Authorization header from the client.
 *
 * Request body: RegisterBusinessPayload
 * Response: { business_id?: string } on success
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const body = (await request.json()) as RegisterBusinessPayload;

    const qrCode = typeof body?.qr_code === "string" ? body.qr_code.trim() : "";
    const plan = typeof body?.plan === "string" ? body.plan : "";

    if (!qrCode || qrCode.length !== 8) {
      return NextResponse.json(
        { message: "Please scan a valid QR code (8 characters) before submitting." },
        { status: 400 }
      );
    }

    if (!plan) {
      return NextResponse.json(
        { message: "Payment plan is required." },
        { status: 400 }
      );
    }

    const payload: RegisterBusinessPayload = {
      qr_code: qrCode,
      gbp_session_id: typeof body.gbp_session_id === "string" ? body.gbp_session_id : undefined,
      name: typeof body.name === "string" ? body.name.trim() || undefined : undefined,
      description: typeof body.description === "string" ? body.description.trim() || undefined : undefined,
      email: typeof body.email === "string" ? body.email.trim() || undefined : undefined,
      phone: typeof body.phone === "string" ? body.phone.trim() || undefined : undefined,
      category: typeof body.category === "string" ? body.category || undefined : undefined,
      google_review_url:
        typeof body.google_review_url === "string"
          ? body.google_review_url.trim() || undefined
          : undefined,
      plan,
      tags: Array.isArray(body.tags) ? body.tags : undefined,
      address: body.address && typeof body.address === "object"
        ? {
            address_line1: typeof body.address.address_line1 === "string" ? body.address.address_line1.trim() || undefined : undefined,
            address_line2: typeof body.address.address_line2 === "string" ? body.address.address_line2.trim() || undefined : undefined,
            city: typeof body.address.city === "string" ? body.address.city.trim() || undefined : undefined,
            area: typeof body.address.area === "string" ? body.address.area.trim() || undefined : undefined,
            pincode: typeof body.address.pincode === "string" ? body.address.pincode.trim() || undefined : undefined,
          }
        : undefined,
    };

    const result = await registerBusiness(payload, authHeader);

    if (!result.ok) {
      const err = result.error;
      const message =
        typeof err === "string"
          ? err
          : typeof err === "object" && err !== null && "message" in err
            ? (err as { message?: string }).message
            : "Failed to onboard business";
      return NextResponse.json(
        { message: message ?? "Failed to onboard business" },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Business register route error:", error);
    return NextResponse.json(
      { message: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
