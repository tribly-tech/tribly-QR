"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface LeadsAutocompleteSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  types?: string[];
}

export interface UseLeadsAutocompleteParams {
  /** Session token from useLeadsSession */
  sessionToken: string | null;
  /** Debounce delay in ms (default 400) */
  debounceMs?: number;
  /** Min query length (default 3) */
  minLength?: number;
  /** Location from useGeolocation - only used when both lat and lng are set */
  lat?: number | null;
  lng?: number | null;
  /** Radius in meters (default 50000 = 50km) */
  radius?: number;
}

export interface UseLeadsAutocompleteResult {
  suggestions: LeadsAutocompleteSuggestion[];
  loading: boolean;
  error: string | null;
  /** Call when user types - triggers debounced search */
  search: (query: string) => void;
}

const DEFAULT_DEBOUNCE_MS = 400;
const DEFAULT_MIN_LENGTH = 3;
const DEFAULT_RADIUS_M = 50000; // 50 km

/**
 * Hook for debounced leads autocomplete search.
 * Uses session token and optional location when available.
 */
export function useLeadsAutocomplete({
  sessionToken,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  minLength = DEFAULT_MIN_LENGTH,
  lat,
  lng,
  radius = DEFAULT_RADIUS_M,
}: UseLeadsAutocompleteParams): UseLeadsAutocompleteResult {
  const [suggestions, setSuggestions] = useState<LeadsAutocompleteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(
    (query: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }

      const trimmed = query.trim();
      if (trimmed.length < minLength) {
        setSuggestions([]);
        setError(null);
        setLoading(false);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        debounceRef.current = null;
        setLoading(true);
        setError(null);
        abortRef.current = new AbortController();
        const signal = abortRef.current.signal;

        try {
          const params = new URLSearchParams({
            q: trimmed,
            country: "in",
            language: "en",
          });
          if (sessionToken) params.set("session_token", sessionToken);
          if (lat != null && lng != null) {
            params.set("lat", String(lat));
            params.set("lng", String(lng));
            params.set("radius", String(radius));
          }

          const res = await fetch(`/api/leads/autocomplete?${params.toString()}`, {
            signal,
          });
          const data = await res.json();

          if (res.status === 429) {
            setError("Too many requests. Please try again later.");
            setSuggestions([]);
            return;
          }

          if (!res.ok) {
            setError(data?.message || "Search failed");
            setSuggestions([]);
            return;
          }

          const list = data?.data ?? data ?? [];
          setSuggestions(Array.isArray(list) ? list : []);
        } catch (err) {
          if ((err as Error).name === "AbortError") return;
          setError("Search failed. Please try again.");
          setSuggestions([]);
        } finally {
          setLoading(false);
          abortRef.current = null;
        }
      }, debounceMs);
    },
    [sessionToken, debounceMs, minLength, lat, lng, radius]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return {
    suggestions,
    loading,
    error,
    search,
  };
}
