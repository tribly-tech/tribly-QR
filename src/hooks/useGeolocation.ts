"use client";

import { useState, useEffect, useCallback } from "react";

export interface GeolocationState {
  /** User's latitude if permission granted */
  lat: number | null;
  /** User's longitude if permission granted */
  lng: number | null;
  /** Whether geolocation is supported */
  supported: boolean;
  /** Permission state: 'prompt' | 'granted' | 'denied' | 'unknown' */
  permission: "prompt" | "granted" | "denied" | "unknown";
  /** Loading state while fetching */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Request permission and get position */
  requestPermission: () => Promise<void>;
}

/**
 * Hook to get user's geolocation with permission handling.
 * Only returns lat/lng when permission is granted.
 */
export function useGeolocation(): GeolocationState {
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<"prompt" | "granted" | "denied" | "unknown">("unknown");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setSupported(false);
      setPermission("denied");
      setError("Geolocation is not supported");
      return;
    }
    setSupported(true);
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setPermission("granted");
        setLoading(false);
      },
      (err) => {
        setPermission(err.code === 1 ? "denied" : "unknown");
        setError(err.message || "Failed to get location");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60_000 }
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSupported(!!navigator.geolocation);
    if (!navigator.geolocation) {
      setPermission("denied");
    }
  }, []);

  return {
    lat,
    lng,
    supported,
    permission,
    loading,
    error,
    requestPermission,
  };
}
