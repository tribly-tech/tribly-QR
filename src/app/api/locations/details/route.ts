import { NextRequest, NextResponse } from "next/server";
import { locationsDetails } from "@/services/api/locations";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const result = await locationsDetails(
    {
      place_id: searchParams.get("place_id") ?? "",
      session_token: searchParams.get("session_token") ?? undefined,
    },
    request.headers.get("authorization")
  );

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }
  return NextResponse.json(result.data);
}
