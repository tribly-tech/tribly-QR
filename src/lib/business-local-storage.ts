import { Business } from "./types";

const STORAGE_KEY_PREFIX = "tribly-business-edits-";

/** Fields we persist locally for mock businesses (survives page refresh) */
export type BusinessEditOverrides = Partial<
  Pick<
    Business,
    | "name"
    | "category"
    | "email"
    | "phone"
    | "address"
    | "city"
    | "area"
    | "pincode"
    | "overview"
    | "services"
    | "googleBusinessReviewLink"
    | "socialMediaLink"
    | "autoReplyEnabled"
    | "keywords"
  >
> & { website?: string };

export function getBusinessEditOverrides(businessId: string): BusinessEditOverrides | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${businessId}`);
    if (!raw) return null;
    return JSON.parse(raw) as BusinessEditOverrides;
  } catch {
    return null;
  }
}

/** Merge incoming overrides with existing (so we don't lose other sections) */
export function updateBusinessEditOverrides(
  businessId: string,
  updates: BusinessEditOverrides
): void {
  const existing = getBusinessEditOverrides(businessId) || {};
  setBusinessEditOverrides(businessId, { ...existing, ...updates });
}

export function setBusinessEditOverrides(
  businessId: string,
  overrides: BusinessEditOverrides
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${businessId}`,
      JSON.stringify(overrides)
    );
  } catch {
    // Ignore storage errors
  }
}

export function mergeBusinessWithOverrides(
  business: Business,
  overrides: BusinessEditOverrides | null,
  website?: string
): { business: Business; website: string } {
  if (!overrides) {
    return { business, website: website ?? "" };
  }
  const merged: Business = { ...business };
  if (overrides.name !== undefined) merged.name = overrides.name;
  if (overrides.category !== undefined) merged.category = overrides.category;
  if (overrides.email !== undefined) merged.email = overrides.email;
  if (overrides.phone !== undefined) merged.phone = overrides.phone;
  if (overrides.address !== undefined) merged.address = overrides.address;
  if (overrides.city !== undefined) merged.city = overrides.city;
  if (overrides.area !== undefined) merged.area = overrides.area;
  if (overrides.pincode !== undefined) merged.pincode = overrides.pincode;
  if (overrides.overview !== undefined) merged.overview = overrides.overview;
  if (overrides.services !== undefined) merged.services = overrides.services;
  if (overrides.googleBusinessReviewLink !== undefined)
    merged.googleBusinessReviewLink = overrides.googleBusinessReviewLink;
  if (overrides.socialMediaLink !== undefined)
    merged.socialMediaLink = overrides.socialMediaLink;
  if (overrides.autoReplyEnabled !== undefined)
    merged.autoReplyEnabled = overrides.autoReplyEnabled;
  if (overrides.keywords !== undefined) merged.keywords = overrides.keywords;

  const mergedWebsite =
    overrides.website !== undefined ? overrides.website : website ?? "";
  return { business: merged, website: mergedWebsite };
}
