"use client";

import { useState, useCallback } from "react";

export interface SubmitReportParams {
  place_id: string;
  email?: string;
  phone?: string;
}

export type ReportSubmitResult =
  | { success: true; isNewLead: boolean; message?: string; lead_id?: string }
  | { success: false; message: string; isAlreadyTaken?: boolean };

export interface UseLeadsReportResult {
  /** Submit report request */
  submitReport: (params: SubmitReportParams) => Promise<ReportSubmitResult>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to submit a leads report request.
 */
export function useLeadsReport(): UseLeadsReportResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitReport = useCallback(async (
    params: SubmitReportParams
  ): Promise<ReportSubmitResult> => {
    if (!params.place_id?.trim()) {
      return { success: false, message: "Place ID is required" };
    }
    if (!params.email?.trim() && !params.phone?.trim()) {
      return { success: false, message: "At least one of email or phone is required" };
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          place_id: params.place_id.trim(),
          email: params.email?.trim() || undefined,
          phone: params.phone?.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (res.status === 201) {
        return {
          success: true,
          isNewLead: true,
          message: data?.message || "Report request received. We'll send it to you shortly.",
          lead_id: data?.data?.lead_id,
        };
      }

      if (res.status === 200 && data?.success === false) {
        return {
          success: false,
          message:
            data?.message ||
            "This contact is already registered. Someone will reach out to you shortly.",
          isAlreadyTaken: true,
        };
      }

      if (!res.ok) {
        const msg =
          data?.message ||
          data?.error?.[0]?.message ||
          "Failed to submit report";
        setError(msg);
        return { success: false, message: msg };
      }

      return {
        success: true,
        isNewLead: false,
        message: data?.message,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit report";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    submitReport,
    loading,
    error,
  };
}
