"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GBPHealthReportView, type GBPDiscoveryAndActions } from "./GBPHealthReportView";
import { useGBPAnalysis } from "@/hooks/useGBPAnalysis";
import type { Top3InRadiusResult } from "@/components/sales-dashboard/types";
import { getAuthToken } from "@/lib/auth";
import { Loader2, AlertCircle } from "lucide-react";

export interface GBPHealthTabProps {
  businessName: string;
  /** Business ID (slug) to fetch yearly discovery & customer actions from /api/business/[id]/metrics */
  businessId?: string | null;
  /** Optional place_id to fetch top-3-in-radius; if not provided, top3 is skipped */
  placeId?: string | null;
  /** Optional lat/lng for nearby-rank API */
  location?: { lat: number; lng: number } | null;
}

/** Maps performance metrics API response to GBPDiscoveryAndActions */
function mapMetricsToDiscoveryAndActions(data: {
  discovery?: { searches?: { value?: number }; search_views?: { value?: number }; maps_views?: { value?: number } };
  customer_actions?: { calls?: { value?: number }; directions?: { value?: number }; website_clicks?: { value?: number } };
}): GBPDiscoveryAndActions {
  return {
    discovery: {
      searchQueries: data.discovery?.searches?.value ?? null,
      searchViews: data.discovery?.search_views?.value ?? null,
      mapViews: data.discovery?.maps_views?.value ?? null,
    },
    customerActions: {
      websiteClicks: data.customer_actions?.website_clicks?.value ?? null,
      directionRequests: data.customer_actions?.directions?.value ?? null,
      phoneCalls: data.customer_actions?.calls?.value ?? null,
    },
  };
}

export function GBPHealthTab({
  businessName,
  businessId = null,
  placeId = null,
  location = null,
}: GBPHealthTabProps) {
  const { data, loading, error } = useGBPAnalysis({
    businessName,
    placeId,
    enabled: !!businessName?.trim(),
  });
  const gbpAnalysisData = data?.analysisData ?? null;

  const [top3Result, setTop3Result] = useState<Top3InRadiusResult | null>(null);
  const [top3Loading, setTop3Loading] = useState(false);
  const [discoveryAndActions, setDiscoveryAndActions] = useState<GBPDiscoveryAndActions | null>(null);

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

  // Fetch yearly discovery & customer actions from metrics API (when GBP is connected)
  useEffect(() => {
    if (!businessId?.trim()) {
      setDiscoveryAndActions(null);
      return;
    }
    let cancelled = false;
    const authToken = getAuthToken();
    const headers: HeadersInit = {};
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

    fetch(`/api/business/${encodeURIComponent(businessId)}/metrics?filter=yearly`, { headers })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { message?: string }).message ?? "Failed to load metrics");
        }
        return res.json();
      })
      .then((metrics) => {
        if (!cancelled && metrics?.discovery && metrics?.customer_actions) {
          setDiscoveryAndActions(mapMetricsToDiscoveryAndActions(metrics));
        } else {
          setDiscoveryAndActions(null);
        }
      })
      .catch(() => {
        if (!cancelled) setDiscoveryAndActions(null);
      });
    return () => { cancelled = true; };
  }, [businessId]);

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
      discoveryAndActions={discoveryAndActions}
    />
  );
}
