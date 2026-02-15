"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { searchAddresses, getPlaceDetails, extractAddressComponents } from "@/lib/google-places";
import type { GooglePlacePrediction } from "@/lib/google-places";

export interface AddressComponents {
  address: string;
  city: string;
  area: string;
  pincode: string;
}

interface AddressAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (components: AddressComponents) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

const MIN_INPUT_LENGTH = 3;
const DEBOUNCE_MS = 300;

export function AddressAutocompleteInput({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Search for an address...",
  id = "address",
  disabled = false,
  className,
}: AddressAutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<GooglePlacePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < MIN_INPUT_LENGTH) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const results = await searchAddresses(query);
      setSuggestions(results);
      setSelectedIndex(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (value.length >= MIN_INPUT_LENGTH) {
      debounceRef.current = setTimeout(() => fetchSuggestions(value), DEBOUNCE_MS);
    } else {
      setSuggestions([]);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, fetchSuggestions]);

  const handleSelect = useCallback(
    async (prediction: GooglePlacePrediction) => {
      setShowSuggestions(false);
      setSuggestions([]);
      onChange(prediction.description);

      if (onAddressSelect) {
        try {
          const details = await getPlaceDetails(prediction.place_id);
          if (details) {
            const extracted = extractAddressComponents(details);
            onAddressSelect({
              address: extracted.address,
              city: extracted.city,
              area: extracted.area,
              pincode: extracted.postalCode,
            });
          }
        } catch (err) {
          console.error("Failed to fetch place details:", err);
        }
      }
    },
    [onChange, onAddressSelect]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Escape") setShowSuggestions(false);
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) => (i < suggestions.length - 1 ? i + 1 : i));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((i) => (i > 0 ? i - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => value.length >= MIN_INPUT_LENGTH && setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={className}
        autoComplete="off"
      />
      {showSuggestions && (suggestions.length > 0 || isLoading) && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover py-1 shadow-md">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Searching…</div>
          ) : (
            suggestions.map((s, i) => (
              <div
                key={s.place_id}
                role="button"
                tabIndex={0}
                className={`cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${
                  i === selectedIndex ? "bg-accent text-accent-foreground" : ""
                }`}
                onClick={() => handleSelect(s)}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <div className="font-medium">{s.structured_formatting?.main_text ?? s.description}</div>
                {s.structured_formatting?.secondary_text && (
                  <div className="text-xs text-muted-foreground truncate">
                    {s.structured_formatting.secondary_text}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
