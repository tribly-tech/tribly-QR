import { NextRequest, NextResponse } from "next/server";
import { locationsNearbyRank } from "@/services/api/locations";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const result = await locationsNearbyRank(
    {
      lat: searchParams.get("lat") ?? "",
      lng: searchParams.get("lng") ?? "",
      place_id: searchParams.get("place_id") ?? "",
      radius_m: searchParams.get("radius_m") ?? undefined,
      search_rank: searchParams.get("search_rank") ?? undefined,
    },
    request.headers.get("authorization")
  );

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }
  return NextResponse.json(result.data);
}
