import { NextRequest, NextResponse } from "next/server";
import { googlePlacesAutocomplete } from "@/services/external/google-places";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const types = (searchParams.get("types") || "establishment") as
    | "establishment"
    | "address"
    | "geocode";

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const data = await googlePlacesAutocomplete(query, { types });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error calling Google Places API:", error);
    return NextResponse.json(
      { error: "Failed to search places" },
      { status: 500 }
    );
  }
}
