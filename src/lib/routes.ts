/**
 * App route paths and query param conventions for production-ready URLs.
 * Use these to build links and to keep tab state in sync with the URL.
 */

/** Base paths (no trailing slash) */
export const PATHS = {
  dashboard: "/dashboard",
  dashboardAdmin: "/dashboard/admin",
  dashboardBusiness: (idOrSlug: string) => `/dashboard/business/${idOrSlug}`,
  dashboardProfile: "/dashboard/admin/profile",
  salesDashboard: "/sales-dashboard",
  salesAnalysisReport: "/sales-dashboard/analysis-report",
  login: "/login",
  feedback: "/feedback",
  review: (code: string) => `/review/${code}`,
} as const;

/** Business detail page: main tab query param and allowed values */
export const BUSINESS_TAB_PARAM = "tab" as const;
export const BUSINESS_MAIN_TABS = [
  "gmb-health",
  "recommended-actions",
  "overview",
  "reviews",
  "settings",
] as const;
export type BusinessMainTab = (typeof BUSINESS_MAIN_TABS)[number];

/** Business detail page: settings sub-tab (only when tab=settings) */
export const BUSINESS_SETTINGS_SUB_PARAM = "sub" as const;
export const BUSINESS_SETTINGS_SUB_TABS = [
  "business-info",
  "keywords",
  "links",
  "auto-reply",
] as const;
export type BusinessSettingsSubTab = (typeof BUSINESS_SETTINGS_SUB_TABS)[number];

/** Build business detail URL with optional tab (and optional settings sub) */
export function businessDetailUrl(
  idOrSlug: string,
  options?: { tab?: BusinessMainTab; sub?: BusinessSettingsSubTab }
): string {
  const base = PATHS.dashboardBusiness(idOrSlug);
  if (!options?.tab) return base;
  const params = new URLSearchParams();
  params.set(BUSINESS_TAB_PARAM, options.tab);
  if (options.tab === "settings" && options.sub) {
    params.set(BUSINESS_SETTINGS_SUB_PARAM, options.sub);
  }
  return `${base}?${params.toString()}`;
}

/** Profile page: tab query param and allowed values */
export const PROFILE_TAB_PARAM = "tab" as const;
export const PROFILE_TABS = ["personal", "sales-team"] as const;
export type ProfileTab = (typeof PROFILE_TABS)[number];

/** Build profile URL with optional tab */
export function profileUrl(options?: { tab?: ProfileTab }): string {
  const base = PATHS.dashboardProfile;
  if (!options?.tab) return base;
  const params = new URLSearchParams();
  params.set(PROFILE_TAB_PARAM, options.tab);
  return `${base}?${params.toString()}`;
}
