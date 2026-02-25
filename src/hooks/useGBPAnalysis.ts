"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getAuthToken } from "@/lib/auth";
import type { GBPAnalysisData } from "@/components/sales-dashboard/types";
import type { PlaceDetailsData } from "@/components/sales-dashboard/types";

export interface UseGBPAnalysisOptions {
  businessName: string;
  placeId?: string | null;
  placeDetails?: PlaceDetailsData | null;
  /** When true, skips fetch (e.g. when data is provided externally) */
  enabled?: boolean;
}

export interface UseGBPAnalysisResult {
  data: { overallScore: number; analysisData: GBPAnalysisData } | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetches GBP analysis from the backend API.
 * Used by GBPHealthTab, RecommendedActionsTab, and sales-dashboard.
 */
export function useGBPAnalysis({
  businessName,
  placeId = null,
  placeDetails = null,
  enabled = true,
}: UseGBPAnalysisOptions): UseGBPAnalysisResult {
  const [data, setData] = useState<{
    overallScore: number;
    analysisData: GBPAnalysisData;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchAnalysis = useCallback(
    async (signal?: AbortSignal) => {
      if (!businessName?.trim()) {
        setLoading(false);
        setError("Business name is required");
        setData(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const payload: Record<string, unknown> = {
          business_name: businessName.trim(),
        };
        if (placeId) payload.place_id = placeId;
        if (placeDetails) payload.place_details = placeDetails;

        const authToken = getAuthToken();
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

        const res = await fetch("/api/gbp/analyze", {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          signal,
        });

        if (!mountedRef.current) return;

        const json = await res.json();

        if (!res.ok) {
          throw new Error(
            json?.error?.error ?? json?.error ?? "Failed to load GBP analysis"
          );
        }

        const result = json?.data ?? json;
        setData({
          overallScore: result.overallScore ?? 0,
          analysisData: result.analysisData ?? result.analysis_data ?? {},
        });
        setError(null);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        if (mountedRef.current) {
          setError(
            err instanceof Error ? err.message : "Failed to load GBP analysis"
          );
          setData(null);
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [businessName, placeId, placeDetails]
  );

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }
    const controller = new AbortController();
    fetchAnalysis(controller.signal);
    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, [enabled, fetchAnalysis]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchAnalysis(),
  };
}
