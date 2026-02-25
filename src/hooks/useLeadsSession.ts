"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface LeadsSessionState {
  sessionToken: string | null;
  loading: boolean;
  error: string | null;
  /** Refetch session if needed (e.g. after expiry) */
  refetch: () => Promise<void>;
}

/**
 * Hook to get and maintain a leads session token.
 * Always fetches session on mount.
 * Uses AbortController to prevent duplicate requests in React Strict Mode.
 */
export function useLeadsSession(): LeadsSessionState {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchSession = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads/session", {
        method: "POST",
        signal,
      });
      if (!mountedRef.current) return;
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to get session");
      }
      const token = data?.data?.session_token ?? data?.session_token ?? null;
      setSessionToken(token);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to get session");
        setSessionToken(null);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();
    fetchSession(controller.signal);
    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, [fetchSession]);

  return {
    sessionToken,
    loading,
    error,
    refetch: fetchSession,
  };
}
