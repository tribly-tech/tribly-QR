"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { BusinessCategory } from "@/lib/types";
import {
  categorySuggestions,
  serviceSuggestions,
} from "@/lib/category-suggestions";
import { NewBusinessState } from "../types";

interface BasicInformationCardProps {
  newBusiness: NewBusinessState;
  setNewBusiness: React.Dispatch<React.SetStateAction<NewBusinessState>>;
  suggestedCategories: BusinessCategory[];
  serviceInput: string;
  setServiceInput: (value: string) => void;
  showServiceSuggestions: boolean;
  setShowServiceSuggestions: (show: boolean) => void;
  isLoadingScanData: boolean;
}

export function BasicInformationCard({
  newBusiness,
  setNewBusiness,
  suggestedCategories,
  serviceInput,
  setServiceInput,
  showServiceSuggestions,
  setShowServiceSuggestions,
  isLoadingScanData,
}: BasicInformationCardProps) {
  // Get service suggestions based on category
  const getServiceSuggestions = useMemo(() => {
    if (!newBusiness.category) return [];
    return serviceSuggestions[newBusiness.category as BusinessCategory] || [];
  }, [newBusiness.category]);

  // Add service
  const handleAddService = (service: string) => {
    if (service.trim() && !newBusiness.services.includes(service.trim())) {
      setNewBusiness((prev) => ({
        ...prev,
        services: [...prev.services, service.trim()],
      }));
      setServiceInput("");
      setShowServiceSuggestions(false);
    }
  };

  // Remove service
  const handleRemoveService = (service: string) => {
    setNewBusiness((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s !== service),
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>
          Enter the essential details about the business
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">
              Business Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., The Coffee House"
              value={newBusiness.name}
              onChange={(e) =>
                setNewBusiness({ ...newBusiness, name: e.target.value })
              }
              required
              disabled={isLoadingScanData}
            />
            <p className="text-xs text-muted-foreground">
              Enter the official business name as it appears on legal documents
            </p>
          </div>

          {/* Dotted Separator */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dotted border-muted-foreground/30"></div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">
              Business Category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={newBusiness.category}
              onValueChange={(value) => {
                setNewBusiness({
                  ...newBusiness,
                  category: value as BusinessCategory,
                });
                setServiceInput("");
              }}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select business category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="restaurant">Restaurant</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="beauty">Beauty</SelectItem>
                <SelectItem value="fitness">Fitness</SelectItem>
                <SelectItem value="automotive">Automotive</SelectItem>
                <SelectItem value="real-estate">Real Estate</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="hospitality">Hospitality</SelectItem>
                <SelectItem value="manufacturing">Manufacturing/Industrial</SelectItem>
                <SelectItem value="services">Professional & Local Services</SelectItem>
                <SelectItem value="technology">Technology / IT / SaaS</SelectItem>
                <SelectItem value="finance">Financial Services</SelectItem>
                <SelectItem value="logistics">Logistics & Transport</SelectItem>
                <SelectItem value="media-entertainment">Media & Entertainment</SelectItem>
                <SelectItem value="non-profit">Non-profit / NGO</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Suggestions */}
            {suggestedCategories.length > 0 && !newBusiness.category && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-2">
                  Suggested categories:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedCategories.map((cat) => (
                    <Badge
                      key={cat}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() =>
                        setNewBusiness({ ...newBusiness, category: cat })
                      }
                    >
                      {cat
                        .split("-")
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() + word.slice(1),
                        )
                        .join(" ")}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Category-specific suggestions */}
            {newBusiness.category &&
              categorySuggestions[newBusiness.category as BusinessCategory] && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    Common types for {newBusiness.category}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {categorySuggestions[
                      newBusiness.category as BusinessCategory
                    ]
                      .slice(0, 5)
                      .map((suggestion) => (
                        <Badge
                          key={suggestion}
                          variant="secondary"
                          className="text-xs"
                        >
                          {suggestion}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

            <p className="text-xs text-muted-foreground">
              Select the primary category that best describes the business
            </p>
          </div>

          {/* Dotted Separator */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dotted border-muted-foreground/30"></div>
            </div>
          </div>

          {/* Services Section */}
          <div className="grid gap-2">
            <Label htmlFor="services">Business Services</Label>
            <div className="relative service-input-container">
              <Input
                id="services"
                placeholder={
                  newBusiness.category
                    ? `Add a service (e.g., ${
                        getServiceSuggestions[0] || "Service name"
                      })`
                    : "Select a category first to see suggestions"
                }
                value={serviceInput}
                onChange={(e) => {
                  setServiceInput(e.target.value);
                  setShowServiceSuggestions(
                    e.target.value.length > 0 &&
                      getServiceSuggestions.length > 0,
                  );
                }}
                onFocus={() => {
                  if (getServiceSuggestions.length > 0) {
                    setShowServiceSuggestions(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && serviceInput.trim()) {
                    e.preventDefault();
                    handleAddService(serviceInput);
                  }
                }}
                disabled={!newBusiness.category}
              />

              {/* Service Suggestions Dropdown */}
              {showServiceSuggestions && getServiceSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md max-h-48 overflow-auto top-full service-suggestions-dropdown">
                  {getServiceSuggestions
                    .filter((suggestion) =>
                      suggestion
                        .toLowerCase()
                        .includes(serviceInput.toLowerCase()),
                    )
                    .map((suggestion) => (
                      <div
                        key={suggestion}
                        className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onClick={() => handleAddService(suggestion)}
                      >
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{suggestion}</span>
                        </div>
                      </div>
                    ))}
                  {serviceInput.trim() &&
                    !getServiceSuggestions.some(
                      (s) => s.toLowerCase() === serviceInput.toLowerCase(),
                    ) && (
                      <div
                        className="p-2 hover:bg-muted cursor-pointer border-t"
                        onClick={() => handleAddService(serviceInput)}
                      >
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Add &quot;{serviceInput}&quot;
                          </span>
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Service Suggestions */}
            {newBusiness.category && getServiceSuggestions.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-2">
                  Suggested business services:
                </p>
                <div className="flex flex-wrap gap-2">
                  {getServiceSuggestions.slice(0, 8).map((suggestion) => (
                    <Badge
                      key={suggestion}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handleAddService(suggestion)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Added Services */}
            {newBusiness.services.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">
                  Added business services:
                </p>
                <div className="flex flex-wrap gap-2">
                  {newBusiness.services.map((service) => (
                    <Badge
                      key={service}
                      variant="default"
                      className="cursor-pointer"
                      onClick={() => handleRemoveService(service)}
                    >
                      {service}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {newBusiness.category
                ? "Click on suggested business services or type to add custom services"
                : "Select a business category first to see business service suggestions"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
