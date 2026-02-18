import { NextRequest, NextResponse } from "next/server";
import { googlePlacesDetailsWithReviews } from "@/services/external/google-places";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get("placeId");

  if (!placeId?.trim()) {
    return NextResponse.json(
      { error: "placeId query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const data = await googlePlacesDetailsWithReviews(placeId.trim());
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch Google reviews";
    const status = message === "Place not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
