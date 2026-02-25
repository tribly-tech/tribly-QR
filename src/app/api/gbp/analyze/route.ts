import { NextRequest, NextResponse } from "next/server";
import { gbpAnalyze } from "@/services/api/gbp";

/**
 * POST /api/gbp/analyze
 * Runs GBP analysis. Proxies to backend with business_name, optional place_id and place_details.
 *
 * Request body:
 * - business_name: string (required)
 * - place_id?: string
 * - place_details?: object (pre-fetched place details)
 *
 * Response: { data: { overallScore, analysisData } }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const businessName = body?.business_name?.trim();
    if (!businessName) {
      return NextResponse.json(
        { error: "business_name is required" },
        { status: 400 }
      );
    }

    const result = await gbpAnalyze(
      {
        business_name: businessName,
        place_id: body.place_id ?? null,
        place_details: body.place_details ?? null,
      },
      request.headers.get("authorization")
    );

    if (!result.ok) {
      return NextResponse.json(result.error, { status: result.status });
    }
    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error("GBP analyze error:", error);
    return NextResponse.json(
      { error: "Failed to run GBP analysis" },
      { status: 500 }
    );
  }
}
