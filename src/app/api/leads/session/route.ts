import { NextRequest, NextResponse } from "next/server";
import { leadsSession, getClientIp } from "@/services/api/leads";

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  const result = await leadsSession(clientIp);

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }
  return NextResponse.json(result.data);
}
