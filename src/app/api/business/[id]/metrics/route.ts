import { NextRequest, NextResponse } from "next/server";
import {
  fetchPerformanceMetrics,
  type PerformanceFilter,
} from "@/services/api/business";

const VALID_FILTERS = new Set<PerformanceFilter>([
  "weekly",
  "monthly",
  "quarterly",
  "half_yearly",
  "yearly",
]);

/**
 * GET /api/business/[id]/metrics?filter=monthly
 * Proxies the GBP performance metrics endpoint. Backend URL stays server-side.
 * The backend resolves the business from the JWT; `[id]` keeps the URL consistent.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;

  const filter =
    (request.nextUrl.searchParams.get("filter") as PerformanceFilter) ||
    "monthly";

  if (!VALID_FILTERS.has(filter)) {
    return NextResponse.json(
      { message: `Invalid filter: ${filter}` },
      { status: 400 }
    );
  }

  const authHeader = request.headers.get("authorization");

  const result = await fetchPerformanceMetrics(filter, authHeader);

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }

  return NextResponse.json(result.data);
}
