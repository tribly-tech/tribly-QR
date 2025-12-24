import { Business } from "./types";

/**
 * Generate a consistent 6-digit unique code from business ID
 */
function generateUniqueCode(businessId: string): string {
  // Create a hash from business ID to generate consistent 6-digit code
  let hash = 0;
  for (let i = 0; i < businessId.length; i++) {
    const char = businessId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to positive 6-digit number
  const code = Math.abs(hash) % 1000000;
  // Pad with zeros to ensure 6 digits
  return code.toString().padStart(6, '0');
}

/**
 * Generate a URL-friendly slug from business name and ID
 * Format: business-name-123456 (6-digit unique code)
 */
export function generateBusinessSlug(business: Business): string {
  // Convert business name to URL-friendly format
  const nameSlug = business.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

  // Generate consistent 6-digit unique code from business ID
  const uniqueCode = generateUniqueCode(business.id);

  return `${nameSlug}-${uniqueCode}`;
}

/**
 * Extract unique code from slug
 */
export function extractUniqueCodeFromSlug(slug: string): string | null {
  // Extract the unique code (last part after last hyphen, should be 6 digits)
  const parts = slug.split("-");
  if (parts.length < 2) return null;
  
  const uniqueCode = parts[parts.length - 1];
  // Verify it's a 6-digit number
  if (/^\d{6}$/.test(uniqueCode)) {
    return uniqueCode;
  }
  return null;
}

/**
 * Find business by slug
 */
export function getBusinessBySlug(slug: string, businesses: Business[]): Business | undefined {
  // Try to match by generating slug for each business
  for (const business of businesses) {
    const generatedSlug = generateBusinessSlug(business);
    if (generatedSlug === slug) {
      return business;
    }
  }
  
  // Fallback: try to extract unique code and find matching business
  const uniqueCode = extractUniqueCodeFromSlug(slug);
  if (uniqueCode) {
    // Find business by matching the generated unique code
    return businesses.find((business) => {
      const code = generateUniqueCode(business.id);
      return code === uniqueCode;
    });
  }
  
  return undefined;
}

