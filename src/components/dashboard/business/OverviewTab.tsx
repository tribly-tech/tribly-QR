"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Plus, X } from "lucide-react";
import { Business, BusinessCategory } from "@/lib/types";

interface OverviewTabProps {
  business: Business | null;
  handleUpdateBusiness: (updates: Partial<Business>) => void;
  handleSaveChanges: (section: string) => void;
  website: string;
  setWebsite: (value: string) => void;
  suggestedCategories: BusinessCategory[];
  categorySuggestions: Record<string, string[]>;
  serviceInput: string;
  setServiceInput: (value: string) => void;
  showServiceSuggestions: boolean;
  setShowServiceSuggestions: (value: boolean) => void;
  getServiceSuggestions: string[];
  handleAddServiceEnhanced: (service: string) => void;
  handleRemoveService: (service: string) => void;
}

export function OverviewTab({
  business,
  handleUpdateBusiness,
  handleSaveChanges,
  website,
  setWebsite,
  suggestedCategories,
  categorySuggestions,
  serviceInput,
  setServiceInput,
  showServiceSuggestions,
  setShowServiceSuggestions,
  getServiceSuggestions,
  handleAddServiceEnhanced,
  handleRemoveService,
}: OverviewTabProps) {
  return (
    <div className="space-y-6 mt-0">
      {/* Basic Information Section */}
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
                value={business?.name || ""}
                onChange={(e) => handleUpdateBusiness({ name: e.target.value })}
                required
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
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://www.example.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">
                Business Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={business?.category || ""}
                onValueChange={(value) => {
                  handleUpdateBusiness({ category: value as BusinessCategory });
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
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              {/* Category Suggestions */}
              {suggestedCategories.length > 0 && !business?.category && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-2">Suggested categories:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedCategories.map((cat) => (
                      <Badge
                        key={cat}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => handleUpdateBusiness({ category: cat })}
                      >
                        {cat.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Category-specific suggestions */}
              {business?.category && categorySuggestions[business.category] && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    Common types for {business.category}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {categorySuggestions[business.category].slice(0, 5).map((suggestion) => (
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
                  placeholder={business?.category ? `Add a service (e.g., ${getServiceSuggestions[0] || "Service name"})` : "Select a category first to see suggestions"}
                  value={serviceInput}
                  onChange={(e) => {
                    setServiceInput(e.target.value);
                    setShowServiceSuggestions(e.target.value.length > 0 && getServiceSuggestions.length > 0);
                  }}
                  onFocus={() => {
                    if (getServiceSuggestions.length > 0) {
                      setShowServiceSuggestions(true);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && serviceInput.trim()) {
                      e.preventDefault();
                      handleAddServiceEnhanced(serviceInput);
                    }
                  }}
                  disabled={!business?.category}
                />

                {/* Service Suggestions Dropdown */}
                {showServiceSuggestions && getServiceSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-auto top-full service-suggestions-dropdown">
                    {getServiceSuggestions
                      .filter((suggestion) =>
                        suggestion.toLowerCase().includes(serviceInput.toLowerCase())
                      )
                      .map((suggestion) => (
                        <div
                          key={suggestion}
                          className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                          onClick={() => handleAddServiceEnhanced(suggestion)}
                        >
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{suggestion}</span>
                          </div>
                        </div>
                      ))}
                    {serviceInput.trim() && !getServiceSuggestions.some(s => s.toLowerCase() === serviceInput.toLowerCase()) && (
                      <div
                        className="p-2 hover:bg-muted cursor-pointer border-t"
                        onClick={() => handleAddServiceEnhanced(serviceInput)}
                      >
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Add "{serviceInput}"</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Service Suggestions */}
              {business?.category && getServiceSuggestions.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-2">Suggested business services:</p>
                  <div className="flex flex-wrap gap-2">
                    {getServiceSuggestions.slice(0, 8).map((suggestion) => (
                      <Badge
                        key={suggestion}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => handleAddServiceEnhanced(suggestion)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {suggestion}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Added Services */}
              {business?.services && business.services.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-2">Added business services:</p>
                  <div className="flex flex-wrap gap-2">
                    {business.services.map((service) => (
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
                {business?.category
                  ? "Click on suggested business services or type to add custom services"
                  : "Select a business category first to see business service suggestions"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Overview Section */}
      <Card>
        <CardHeader>
          <CardTitle>Business Overview</CardTitle>
          <CardDescription>
            Provide a brief description of the business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="overview">Business Overview</Label>
              <Textarea
                id="overview"
                placeholder="Describe the business, its services, specialties, and what makes it unique..."
                value={business?.overview || ""}
                onChange={(e) => handleUpdateBusiness({ overview: e.target.value })}
                className="min-h-[120px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                A brief description of the business that will be displayed on the business profile
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information Section */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            Provide contact details for the business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">
                Business Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@business.com"
                value={business?.email || ""}
                onChange={(e) => handleUpdateBusiness({ email: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Primary email address for business communications
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={business?.phone || ""}
                onChange={(e) => handleUpdateBusiness({ phone: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Include country code (e.g., +91 for India)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Information Section */}
      <Card>
        <CardHeader>
          <CardTitle>Location Information</CardTitle>
          <CardDescription>
            Enter the physical location of the business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                placeholder="123 Main Street, Building Name"
                value={business?.address || ""}
                onChange={(e) => handleUpdateBusiness({ address: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Complete street address including building number and name
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Mumbai"
                  value={business?.city || ""}
                  onChange={(e) => handleUpdateBusiness({ city: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="area">Area / Locality</Label>
                <Input
                  id="area"
                  placeholder="Bandra"
                  value={business?.area || ""}
                  onChange={(e) => handleUpdateBusiness({ area: e.target.value })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-end">
            <Button
              onClick={() => handleSaveChanges("Business information")}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
