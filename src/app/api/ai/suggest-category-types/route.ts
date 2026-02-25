import { NextRequest, NextResponse } from "next/server";

const FASTAPI_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.tribly.ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get("Authorization") || "";

    const response = await fetch(
      `${FASTAPI_BASE}/dashboard/v1/ai/suggest-category-types`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.message || "Failed to fetch category types" },
        { status: response.status }
      );
    }

    // FastAPI returns { data: { types: [...] } }
    return NextResponse.json({ types: data?.data?.types ?? [] });
  } catch (error) {
    console.error("suggest-category-types proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
