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

  // Use ref to track the latest search query for race condition handling
  const latestQueryRef = useRef<string>("");

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
        // Build API URL with query parameters
        const params = new URLSearchParams({
          q: businessName.trim(),
          country: "in", // Default to India
        });

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

        // Map to GooglePlacePrediction format
        const suggestions = apiSuggestions.map(mapToGooglePlacePrediction);

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
  }, [businessName, gbpScore]);

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
