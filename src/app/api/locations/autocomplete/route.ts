import { NextRequest, NextResponse } from "next/server";

const TRIBLY_API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.tribly.ai";
const MIN_INPUT_LENGTH = 3;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q");

  if (!q || q.trim().length < MIN_INPUT_LENGTH) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required (min 3 characters)" },
      { status: 400 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const sessionToken = searchParams.get("session_token") ?? undefined;
  const language = searchParams.get("language") ?? undefined;
  const country = searchParams.get("country") ?? "in";
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radius = searchParams.get("radius");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  const params = new URLSearchParams({
    q: q.trim(),
    country,
  });
  if (sessionToken) params.set("session_token", sessionToken);
  if (language) params.set("language", language);
  if (lat != null && lat !== "") params.set("lat", lat);
  if (lng != null && lng !== "") params.set("lng", lng);
  if (radius != null && radius !== "") params.set("radius", radius);

  try {
    const url = `${TRIBLY_API_BASE}/dashboard/v1/locations/autocomplete?${params.toString()}`;
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
        errorBody || { error: "Locations autocomplete failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    // Pass through tribly response; frontend normalizes to UI shape if needed
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error calling locations autocomplete:", error);
    return NextResponse.json(
      { error: "Failed to search locations" },
      { status: 500 }
    );
  }
}
