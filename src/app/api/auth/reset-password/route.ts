import { NextRequest, NextResponse } from "next/server";
import { resetPassword } from "@/services/api/auth";

/**
 * POST /api/auth/reset-password
 * Proxies password reset to the backend. Keeps the backend URL server-side only.
 *
 * Request body: { new_password: string, token: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newPassword =
      typeof body?.new_password === "string" ? body.new_password : "";
    const token = typeof body?.token === "string" ? body.token : "";

    if (!newPassword || !token) {
      return NextResponse.json(
        { message: "New password and token are required" },
        { status: 400 }
      );
    }

    const result = await resetPassword(newPassword, token);

    if (!result.ok) {
      return NextResponse.json(result.error, { status: result.status });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Reset password route error:", error);
    return NextResponse.json(
      { message: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
