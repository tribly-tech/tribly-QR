import { NextRequest, NextResponse } from "next/server";

const TRIBLY_API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.tribly.ai";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get("place_id");

  if (!placeId || placeId.trim().length === 0) {
    return NextResponse.json(
      { error: "Query parameter 'place_id' is required" },
      { status: 400 },
    );
  }

  const authHeader = request.headers.get("authorization");
  const sessionToken = searchParams.get("session_token") ?? undefined;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  const params = new URLSearchParams({
    place_id: placeId.trim(),
  });
  if (sessionToken) {
    params.set("session_token", sessionToken);
  }

  try {
    const url = `${TRIBLY_API_BASE}/dashboard/v1/locations/details?${params.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const text = await response.text();
      let errorBody: unknown;
      try {
        errorBody = JSON.parse(text);
      } catch {
        errorBody = { message: text || response.statusText };
      }
      return NextResponse.json(
        errorBody || { error: "Location details fetch failed" },
        { status: response.status },
      );
    }

    const data = await response.json();
    // Pass through tribly response; frontend normalizes to UI shape if needed
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error calling location details:", error);
    return NextResponse.json(
      { error: "Failed to fetch location details" },
      { status: 500 },
    );
  }
}
