import { NextRequest, NextResponse } from "next/server";

const FASTAPI_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.tribly.ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const texts =
      Array.isArray(body?.texts) && body.texts.every((t: unknown) => typeof t === "string")
        ? (body.texts as string[]).filter(Boolean)
        : null;

    if (!texts || texts.length === 0) {
      return NextResponse.json(
        { error: "At least one review text is required" },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("Authorization") || "";

    const response = await fetch(
      `${FASTAPI_BASE}/dashboard/v1/ai/summarize-reviews`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({ texts }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.detail || data?.message || "AI summary failed" },
        { status: response.status }
      );
    }

    // FastAPI returns { data: { summary: "..." } }
    return NextResponse.json({ summary: data?.data?.summary ?? null });
  } catch (error) {
    console.error("AI summarize-reviews error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
