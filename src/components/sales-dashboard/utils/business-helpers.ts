import { BusinessCategory } from "@/lib/types";
import {
  getMockPredictions,
  getMockPlaceDetails,
} from "@/lib/mock-places-data";
import {
  extractAddressComponents,
  mapGoogleTypesToCategory,
} from "@/lib/google-places";
import { serviceSuggestions } from "@/lib/category-suggestions";
import { Smile, Meh, Frown } from "lucide-react";

// Helper function to get status for metrics
export const getStatus = (
  value: number,
  thresholds: { good: number; average: number },
): "good" | "average" | "poor" => {
  if (value <= thresholds.good) return "good";
  if (value <= thresholds.average) return "average";
  return "poor";
};

// Status configuration for badges
export const STATUS_CONFIG = {
  good: {
    icon: Smile,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  average: {
    icon: Meh,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
  },
  poor: {
    icon: Frown,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
  },
} as const;

// Generate mock business data for step-2 prefilling
export const generateMockBusinessData = (
  businessName: string,
  businessPhoneNumber?: string,
): {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  area: string;
  category: BusinessCategory;
  overview: string;
  googleBusinessReviewLink: string;
  services: string[];
} => {
  // Try to get data from mock places if business name matches
  const suggestions = getMockPredictions(businessName);
  if (suggestions.length > 0) {
    const businessDetails = getMockPlaceDetails(suggestions[0].place_id);
    if (businessDetails) {
      const addressComponents = extractAddressComponents(businessDetails);
      const category = mapGoogleTypesToCategory(businessDetails.types || []);

      // Get services based on category
      const categoryServices =
        serviceSuggestions[category as BusinessCategory] || [];
      const selectedServices = categoryServices.slice(0, 3);

      // Generate email from business name
      const emailDomain = businessDetails.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

      return {
        name: businessDetails.name,
        email: `contact@${emailDomain}.com`,
        phone:
          businessDetails.formatted_phone_number ||
          businessDetails.international_phone_number ||
          businessPhoneNumber ||
          "",
        address: addressComponents.address,
        city: addressComponents.city,
        area: addressComponents.area,
        category: category as BusinessCategory,
        overview: `Welcome to ${businessDetails.name}! We are a ${category} business committed to providing excellent service and customer satisfaction. Visit us at ${addressComponents.address}, ${addressComponents.city}.`,
        googleBusinessReviewLink: businessDetails.website || "",
        services: selectedServices,
      };
    }
  }

  // Fallback mock data if no match found
  const emailDomain =
    businessName.toLowerCase().replace(/[^a-z0-9]/g, "") || "business";
  return {
    name: businessName,
    email: `contact@${emailDomain}.com`,
    phone: businessPhoneNumber || "+91 98765 43210",
    address: "123 Main Street, Building Name",
    city: "Visakhapatnam",
    area: "Asilmetta",
    category: "retail" as BusinessCategory,
    overview: `Welcome to ${businessName}! We are committed to providing excellent service and customer satisfaction.`,
    googleBusinessReviewLink: "",
    services: ["Service 1", "Service 2", "Service 3"],
  };
};
