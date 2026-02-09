import { NextRequest, NextResponse } from "next/server";
import { googlePlacesDetails } from "@/services/external/google-places";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get("placeId");

  if (!placeId) {
    return NextResponse.json(
      { error: "placeId parameter is required" },
      { status: 400 }
    );
  }

  try {
    const data = await googlePlacesDetails(placeId);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get place details";
    const status = message === "Place not found" ? 404 : 500;
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
