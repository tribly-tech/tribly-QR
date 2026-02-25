import { NextRequest, NextResponse } from "next/server";
import { leadsReport, getClientIp } from "@/services/api/leads";

export async function POST(request: NextRequest) {
  let body: { place_id?: string; email?: string; phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const clientIp = getClientIp(request.headers);
  const result = await leadsReport(
    {
      place_id: body.place_id ?? "",
      email: body.email,
      phone: body.phone,
    },
    clientIp
  );

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }
  return NextResponse.json(result.data, {
    status: result.status === 201 ? 201 : 200,
  });
}
