"use client";

import { useState, useEffect, useRef } from "react";

export interface UseReviewsSummaryResult {
  summary: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches an AI-generated summary of the given review texts from the API.
 * Skips fetch when texts is empty or when contents haven't changed.
 */
export function useReviewsSummary(texts: string[]): UseReviewsSummaryResult {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastTextsKeyRef = useRef<string>("");

  const textsKey = texts.length > 0 ? texts.join("\n") : "";

  useEffect(() => {
    if (texts.length === 0) {
      lastTextsKeyRef.current = "";
      setSummary(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (textsKey === lastTextsKeyRef.current) return;
    lastTextsKeyRef.current = textsKey;

    let cancelled = false;
    setSummary(null);
    setError(null);
    setIsLoading(true);

    fetch("/api/ai/summarize-reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          setSummary(null);
        } else {
          setSummary(data.summary ?? null);
          setError(null);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load summary");
        setSummary(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [textsKey, texts.length]);

  return { summary, isLoading, error };
}
