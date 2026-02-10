"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, Loader2, MapPin } from "lucide-react";
import { GooglePlacePrediction } from "@/lib/google-places";
import { getAuthToken } from "@/lib/auth";

// Minimum characters required by the API
const MIN_INPUT_LENGTH = 3;

// API response type from /api/locations/autocomplete
export interface LocationSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  types?: string[];
  distance_meters?: number; // May be returned when lat/lng is passed to the API
}

// ── Relevance scoring: ranks suggestions by keyword match + distance ──

/**
 * Score a suggestion against the user's query.
 * Higher score = more relevant = shown first.
 */
function scoreRelevance(
  suggestion: LocationSuggestion,
  query: string,
): number {
  const q = query.toLowerCase().trim();
  const name = suggestion.main_text.toLowerCase();
  const desc = suggestion.description.toLowerCase();

  let score = 0;

  // ── Keyword matching (max ~100) ──

  if (name === q) {
    // Exact match – top priority
    score += 100;
  } else if (name.startsWith(q)) {
    // Name starts with the full query
    score += 80;
  } else if (q.startsWith(name)) {
    // Query contains the full business name
    score += 70;
  } else if (name.includes(q)) {
    // Name contains the full query as a substring
    score += 60;
  } else {
    // Word-level matching
    const queryWords = q.split(/\s+/).filter((w) => w.length > 0);
    const matched = queryWords.filter((w) => name.includes(w));
    if (matched.length === queryWords.length && queryWords.length > 0) {
      score += 50; // All words present
    } else if (matched.length > 0) {
      score += 20 + (matched.length / queryWords.length) * 25;
    }
  }

  // Bonus: word-boundary match in name (e.g. "coffee" matches "The Coffee House")
  try {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}`, "i").test(suggestion.main_text)) {
      score += 5;
    }
  } catch {
    // Regex can fail on unusual input – silently skip
  }

  // Bonus: query words found in the address / description
  const qWords = q.split(/\s+/).filter((w) => w.length > 0);
  score += qWords.filter((w) => desc.includes(w)).length * 2;

  // ── Distance scoring (max ~20) ──
  if (
    suggestion.distance_meters != null &&
    suggestion.distance_meters >= 0
  ) {
    const km = suggestion.distance_meters / 1000;
    // 0 km → +20,  50+ km → 0
    score += Math.max(0, 20 - km * 0.4);
  }

  // Penalty: very short name that doesn't really match
  if (name.length < q.length / 2 && score < 60) {
    score -= 10;
  }

  return score;
}

/** Sort suggestions in-place by descending relevance score. */
function rankSuggestions(
  suggestions: LocationSuggestion[],
  query: string,
): LocationSuggestion[] {
  return [...suggestions].sort(
    (a, b) => scoreRelevance(b, query) - scoreRelevance(a, query),
  );
}

// Transform API response to GooglePlacePrediction format
function mapToGooglePlacePrediction(
  suggestion: LocationSuggestion,
): GooglePlacePrediction {
  return {
    place_id: suggestion.place_id,
    description: suggestion.description,
    structured_formatting: {
      main_text: suggestion.main_text,
      secondary_text: suggestion.secondary_text,
    },
  };
}

interface Step1BusinessAnalysisProps {
  businessName: string;
  setBusinessName: (name: string) => void;
  selectedBusiness: GooglePlacePrediction | null;
  setSelectedBusiness: (business: GooglePlacePrediction | null) => void;
  gbpScore: number | null;
  isAnalyzing: boolean;
  onAnalyse: () => void;
}

export function Step1BusinessAnalysis({
  businessName,
  setBusinessName,
  selectedBusiness,
  setSelectedBusiness,
  gbpScore,
  isAnalyzing,
  onAnalyse,
}: Step1BusinessAnalysisProps) {
  const [businessNameSuggestions, setBusinessNameSuggestions] = useState<
    GooglePlacePrediction[]
  >([]);
  const [showBusinessNameSuggestions, setShowBusinessNameSuggestions] =
    useState(false);
  const [isSearchingBusinessName, setIsSearchingBusinessName] = useState(false);

  // User's geolocation for proximity-biased search
  const [userLat, setUserLat] = useState<string | null>(null);
  const [userLng, setUserLng] = useState<string | null>(null);

  // Use ref to track the latest search query for race condition handling
  const latestQueryRef = useRef<string>("");

  // Get user's geolocation on mount for proximity-biased results
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLat(String(position.coords.latitude));
          setUserLng(String(position.coords.longitude));
        },
        () => {
          // Geolocation denied or unavailable – search still works, just without bias
          console.log("Geolocation not available – results won't be proximity-biased");
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 },
      );
    }
  }, []);

  // Search for business name suggestions using the locations autocomplete API
  useEffect(() => {
    const searchBusinessNameSuggestions = async () => {
      // Don't search if query is too short
      if (businessName.length < MIN_INPUT_LENGTH) {
        setBusinessNameSuggestions([]);
        setShowBusinessNameSuggestions(false);
        return;
      }

      // Don't show suggestions if we have a GBP score (analysis already done)
      if (gbpScore !== null) {
        setShowBusinessNameSuggestions(false);
        return;
      }

      // Store current query for race condition check
      latestQueryRef.current = businessName;

      setIsSearchingBusinessName(true);
      try {
        // Build API URL with query parameters + location for proximity bias
        const params = new URLSearchParams({
          q: businessName.trim(),
          country: "in", // Default to India
        });

        // Pass user location for proximity-biased results (like Google)
        if (userLat && userLng) {
          params.set("lat", userLat);
          params.set("lng", userLng);
          params.set("radius", "50000"); // 50 km bias radius
        }

        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        // Add authorization header if available
        const authToken = getAuthToken();
        if (authToken) {
          headers["Authorization"] = `Bearer ${authToken}`;
        }

        const response = await fetch(
          `/api/locations/autocomplete?${params.toString()}`,
          {
            method: "GET",
            headers,
          },
        );

        // Handle race condition - ignore results if query has changed
        if (latestQueryRef.current !== businessName) {
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch suggestions");
        }

        const data = await response.json();

        // Extract suggestions from API response
        const apiSuggestions: LocationSuggestion[] = data.data || [];

        // Rank suggestions by keyword relevance + distance (nearest & best match first)
        const rankedSuggestions = rankSuggestions(apiSuggestions, businessName);

        // Map to GooglePlacePrediction format
        const suggestions = rankedSuggestions.map(mapToGooglePlacePrediction);

        // Check if the current business name exactly matches any suggestion
        const exactMatch = suggestions.some(
          (s) =>
            s.structured_formatting.main_text.toLowerCase() ===
            businessName.toLowerCase(),
        );

        setBusinessNameSuggestions(suggestions);
        setShowBusinessNameSuggestions(
          suggestions.length > 0 && !exactMatch && gbpScore === null,
        );
      } catch (error) {
        console.error("Error searching business name suggestions:", error);
        setBusinessNameSuggestions([]);
        setShowBusinessNameSuggestions(false);
      } finally {
        // Only update loading state if this is still the latest query
        if (latestQueryRef.current === businessName) {
          setIsSearchingBusinessName(false);
        }
      }
    };

    // Debounce API calls - 300ms is a good balance for typing
    const debounceTimer = setTimeout(searchBusinessNameSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [businessName, gbpScore, userLat, userLng]);

  // Handle business name suggestion selection
  const handleSelectBusinessNameSuggestion = (
    suggestion: GooglePlacePrediction,
  ) => {
    const selectedName = suggestion.structured_formatting.main_text;
    setBusinessName(selectedName);

    // Store the entire suggestion so we can use place_id later for details API
    setSelectedBusiness(suggestion);

    setShowBusinessNameSuggestions(false);
    setBusinessNameSuggestions([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest(".business-name-input-container") &&
        !target.closest(".business-name-suggestions-dropdown")
      ) {
        setShowBusinessNameSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="grid gap-6 mt-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Step 1: Business Analysis
          </CardTitle>
          <CardDescription>
            Enter the business name to analyze their Google Business Profile
            reputation score
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {/* Business Name Input */}
            <div className="grid gap-2 relative business-name-input-container">
              <Label htmlFor="business-name">
                Business Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="business-name"
                  placeholder="e.g., The Coffee House or Mia by Tanishq"
                  value={businessName}
                  onChange={(e) => {
                    const value = e.target.value;
                    setBusinessName(value);
                    // Clear selected business when user types (they're searching again)
                    if (selectedBusiness) {
                      setSelectedBusiness(null);
                    }
                    if (value.length >= MIN_INPUT_LENGTH && gbpScore === null) {
                      // The useEffect will handle showing suggestions
                    } else {
                      setShowBusinessNameSuggestions(false);
                      setBusinessNameSuggestions([]);
                    }
                  }}
                  onFocus={() => {
                    if (
                      businessNameSuggestions.length > 0 &&
                      gbpScore === null
                    ) {
                      const exactMatch = businessNameSuggestions.some(
                        (s) =>
                          s.structured_formatting.main_text.toLowerCase() ===
                          businessName.toLowerCase(),
                      );
                      if (!exactMatch) {
                        setShowBusinessNameSuggestions(true);
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      businessName.trim() &&
                      !isAnalyzing
                    ) {
                      onAnalyse();
                      setShowBusinessNameSuggestions(false);
                    } else if (e.key === "Escape") {
                      setShowBusinessNameSuggestions(false);
                    }
                  }}
                  disabled={isAnalyzing || gbpScore !== null}
                  className="pl-10"
                />
                {isSearchingBusinessName && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Business Name Suggestions Dropdown */}
              {showBusinessNameSuggestions &&
                businessNameSuggestions.length > 0 &&
                gbpScore === null && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md max-h-60 overflow-auto top-full business-name-suggestions-dropdown">
                    {businessNameSuggestions.map((suggestion) => (
                      <div
                        key={suggestion.place_id}
                        className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onClick={() =>
                          handleSelectBusinessNameSuggestion(suggestion)
                        }
                      >
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {suggestion.structured_formatting.main_text}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {suggestion.structured_formatting.secondary_text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              <p className="text-xs text-muted-foreground">
                Enter the official business name as it appears on Google
                Business Profile. Type at least 3 characters to see suggestions.
              </p>
            </div>

            {/* Analyse Button */}
            {!gbpScore && (
              <Button
                onClick={onAnalyse}
                disabled={!businessName.trim() || isAnalyzing}
                size="lg"
                className="w-full sm:w-auto"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Analyse
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
