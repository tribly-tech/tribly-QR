import { NextRequest, NextResponse } from "next/server";
import { loginBusinessQr } from "@/services/api/auth";

/**
 * POST /api/auth/login
 * Proxies login to the backend. Keeps the backend URL server-side only.
 *
 * Request body: { email: string, password: string }
 * Response: backend login response (status, message, data) or error.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email =
      typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    const result = await loginBusinessQr(email, password);

    if (!result.ok) {
      return NextResponse.json(result.error, { status: result.status });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { message: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
