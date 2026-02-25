import { NextRequest, NextResponse } from "next/server";
import { leadsAutocomplete, getClientIp } from "@/services/api/leads";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const clientIp = getClientIp(request.headers);

  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const radiusParam = searchParams.get("radius");

  const result = await leadsAutocomplete(
    {
      q: searchParams.get("q") ?? "",
      session_token: searchParams.get("session_token") ?? undefined,
      country: searchParams.get("country") ?? "in",
      language: searchParams.get("language") ?? "en",
      lat: latParam ? parseFloat(latParam) : undefined,
      lng: lngParam ? parseFloat(lngParam) : undefined,
      radius: radiusParam ? parseInt(radiusParam, 10) : undefined,
    },
    clientIp
  );

  if (!result.ok) {
    const status = result.status;
    const body = result.error as { message?: string };
    const res = NextResponse.json(body, { status });
    if (status === 429) {
      res.headers.set("Retry-After", "60");
    }
    return res;
  }
  return NextResponse.json(result.data);
}
