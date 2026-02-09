import { NextRequest, NextResponse } from "next/server";
import { locationsAutocomplete } from "@/services/api/locations";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const result = await locationsAutocomplete(
    {
      q: searchParams.get("q") ?? "",
      session_token: searchParams.get("session_token") ?? undefined,
      language: searchParams.get("language") ?? undefined,
      country: searchParams.get("country") ?? "in",
      lat: searchParams.get("lat") ?? undefined,
      lng: searchParams.get("lng") ?? undefined,
      radius: searchParams.get("radius") ?? undefined,
    },
    request.headers.get("authorization")
  );

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }
  return NextResponse.json(result.data);
}
