import { NextRequest, NextResponse } from "next/server";

const TRIBLY_API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.tribly.ai";
const DEFAULT_RADIUS_M = 5000; // 5 km
const TOP_N = 3;

export interface NearbyRankResponse {
  in_top_3: boolean;
  rank: number;
  total_in_radius: number;
  radius_km: number;
  message?: string;
  fallback?: boolean;
}

/**
 * GET /api/locations/nearby-rank
 * Query: lat, lng, place_id, radius_m (optional, default 5000), search_rank (optional, for fallback)
 *
 * Tries Tribly backend first. If not implemented, returns a fallback based on
 * search_rank when provided (rank <= 3 => in_top_3).
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const placeId = searchParams.get("place_id");
  const radiusM = searchParams.get("radius_m");
  const searchRankParam = searchParams.get("search_rank");

  const radiusMeters = radiusM ? Math.min(50000, Math.max(500, parseInt(radiusM, 10) || DEFAULT_RADIUS_M)) : DEFAULT_RADIUS_M;
  const radiusKm = Math.round((radiusMeters / 1000) * 10) / 10;

  // Fallback: when backend doesn't support nearby-rank, use search_rank if provided
  if (searchRankParam != null && searchRankParam !== "") {
    const searchRank = parseFloat(searchRankParam);
    if (!Number.isNaN(searchRank) && searchRank >= 1) {
      const inTop3 = searchRank <= TOP_N;
      const rank = Math.round(searchRank);
      return NextResponse.json({
        data: {
          in_top_3: inTop3,
          rank,
          total_in_radius: Math.max(rank, 10),
          radius_km: radiusKm,
          message: inTop3
            ? `Based on your search rank (${rank}), you appear to be in the top ${TOP_N} in your area.`
            : `Based on your search rank (${rank}), you're not in the top ${TOP_N} within ${radiusKm} km.`,
          fallback: true,
        },
      });
    }
  }

  if (!placeId?.trim()) {
    return NextResponse.json(
      { error: "Query parameter 'place_id' is required when lat/lng are not used with search_rank fallback" },
      { status: 400 }
    );
  }

  if (lat == null || lng == null || lat === "" || lng === "") {
    return NextResponse.json(
      {
        data: {
          in_top_3: false,
          rank: 0,
          total_in_radius: 0,
          radius_km: radiusKm,
          message: "Location (lat/lng) is required to check ranking within radius.",
          fallback: true,
        },
      },
      { status: 200 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  const params = new URLSearchParams({
    lat: lat.trim(),
    lng: lng.trim(),
    place_id: placeId.trim(),
    radius_m: String(radiusMeters),
  });

  try {
    const url = `${TRIBLY_API_BASE}/dashboard/v1/locations/nearby-rank?${params.toString()}`;
    const response = await fetch(url, { method: "GET", headers });

    if (response.ok) {
      const json = await response.json();
      const data = json.data ?? json;
      return NextResponse.json({
        data: {
          in_top_3: data.in_top_3 ?? data.inTop3 ?? false,
          rank: data.rank ?? 0,
          total_in_radius: data.total_in_radius ?? data.totalInRadius ?? 0,
          radius_km: data.radius_km ?? data.radiusKm ?? radiusKm,
          message: data.message,
          fallback: false,
        },
      });
    }

    if (response.status === 404 || response.status === 501) {
      return NextResponse.json(
        {
          data: {
            in_top_3: false,
            rank: 0,
            total_in_radius: 0,
            radius_km: radiusKm,
            message: "Local ranking is not available for this location yet.",
            fallback: true,
          },
        },
        { status: 200 }
      );
    }

    const text = await response.text();
    let errorBody: unknown;
    try {
      errorBody = JSON.parse(text);
    } catch {
      errorBody = { message: text || response.statusText };
    }
    return NextResponse.json(errorBody ?? { error: "Nearby rank failed" }, { status: response.status });
  } catch (error) {
    console.error("Error calling nearby-rank:", error);
    return NextResponse.json(
      {
        data: {
          in_top_3: false,
          rank: 0,
          total_in_radius: 0,
          radius_km: radiusKm,
          message: "Unable to check local ranking. Try again later.",
          fallback: true,
        },
      },
      { status: 200 }
    );
  }
}
