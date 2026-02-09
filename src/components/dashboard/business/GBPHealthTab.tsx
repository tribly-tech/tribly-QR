"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GBPHealthReportView } from "./GBPHealthReportView";
import { calculateGBPScore } from "@/components/sales-dashboard";
import type { GBPAnalysisData } from "@/components/sales-dashboard/types";
import type { Top3InRadiusResult } from "@/components/sales-dashboard/types";
import { getAuthToken } from "@/lib/auth";
import { Loader2, AlertCircle } from "lucide-react";

export interface GBPHealthTabProps {
  businessName: string;
  /** Optional place_id to fetch top-3-in-radius; if not provided, top3 is skipped */
  placeId?: string | null;
  /** Optional lat/lng for nearby-rank API */
  location?: { lat: number; lng: number } | null;
}

export function GBPHealthTab({
  businessName,
  placeId = null,
  location = null,
}: GBPHealthTabProps) {
  const [gbpAnalysisData, setGbpAnalysisData] = useState<GBPAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [top3Result, setTop3Result] = useState<Top3InRadiusResult | null>(null);
  const [top3Loading, setTop3Loading] = useState(false);

  useEffect(() => {
    if (!businessName?.trim()) {
      setLoading(false);
      setError("Business name is required");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    calculateGBPScore(businessName, null)
      .then((result) => {
        if (!cancelled) {
          setGbpAnalysisData(result.analysisData);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("GBP health analysis failed:", err);
          setError(err instanceof Error ? err.message : "Failed to load Google Business Health analysis");
          setGbpAnalysisData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [businessName]);

  // Optional: fetch top 3 within 5km when we have place_id or location
  useEffect(() => {
    if (!gbpAnalysisData || (!placeId && !location)) return;

    const lat = location?.lat;
    const lng = location?.lng;
    const searchRank = gbpAnalysisData.googleSearchRank;

    const params = new URLSearchParams();
    if (placeId) params.set("place_id", placeId);
    if (lat != null && lng != null) {
      params.set("lat", String(lat));
      params.set("lng", String(lng));
    }
    params.set("radius_m", "5000");
    if (searchRank != null && !Number.isNaN(searchRank)) {
      params.set("search_rank", String(searchRank));
    }

    setTop3Loading(true);
    const authToken = getAuthToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

    fetch(`/api/locations/nearby-rank?${params.toString()}`, { method: "GET", headers })
      .then((res) => res.json())
      .then((json) => {
        const data = json.data ?? json;
        setTop3Result({
          inTop3: data.in_top_3 ?? data.inTop3 ?? false,
          rank: data.rank ?? 0,
          totalInRadius: data.total_in_radius ?? data.totalInRadius ?? 0,
          radiusKm: data.radius_km ?? data.radiusKm ?? 5,
          message: data.message,
          fallback: data.fallback ?? false,
        });
      })
      .catch(() => {
        setTop3Result(null);
      })
      .finally(() => setTop3Loading(false));
  }, [gbpAnalysisData, placeId, location?.lat, location?.lng]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading Google Business Health analysis...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !gbpAnalysisData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Unable to load analysis
          </CardTitle>
          <CardDescription>
            {error ?? "No analysis data available. Ensure the business name is set."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <GBPHealthReportView
      gbpAnalysisData={gbpAnalysisData}
      top3Result={top3Result}
      top3Loading={top3Loading}
    />
  );
}
