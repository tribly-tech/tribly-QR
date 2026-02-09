# Structural Refactor Summary

**Date:** February 9, 2025  
**Scope:** Modular, scalable, production-grade structure. No feature changes, no route/API/UI/schema changes.

---

## 1. What Was Done

### A. New Folder Structure (Target Architecture)

- **`src/config/`** – Environment and API base URL (`getApiBaseUrl()`, `getGooglePlacesApiKey()`). All env access centralized here.
- **`src/types/`** – Central type exports; re-exports from `lib/types` for backward compatibility.
- **`src/features/`** – Feature-first layout:
  - `features/auth/` – Auth feature entry (re-exports hooks).
  - `features/shared/` – Placeholder for cross-feature code.
- **`src/services/`** – Backend and external API access:
  - **`services/api/`** – Tribly API: base client, locations (autocomplete, details, nearby-rank), QR validate, GBP auth-sessions. Route handlers call these; response shapes unchanged.
  - **`services/external/`** – Google Places (server-side autocomplete/details). Used only by API routes.
- **`src/hooks/`** – `useAuth()` (user, isLoading, isAuthenticated, logout, setUser) and `useAuthToken()`.
- **`src/lib/utils/`** – Re-exports `cn` from `lib/utils.ts`.
- **`src/lib/constants/`** – `index` re-exports `brand` constants.
- **`src/lib/validation/`** – Zod schemas for API bodies:
  - `validateQrBodySchema` (POST /api/qr/validate)
  - `gbpAuthSessionBodySchema` (POST /api/gbp/auth-sessions)
- **`src/components/layout/`** – `AuthGuard` moved here; uses `useAuth()`. Presentational loading/redirect behavior unchanged.
- **`src/components/forms/`** – Placeholder for form-specific components.

### B. API Route Handlers → Service Layer

All affected route handlers now delegate to services and return the same status/body:

| Route | Service | Validation |
|-------|---------|------------|
| `GET /api/locations/autocomplete` | `locationsAutocomplete()` | - |
| `GET /api/locations/details` | `locationsDetails()` | - |
| `GET /api/locations/nearby-rank` | `locationsNearbyRank()` | - |
| `POST /api/qr/validate` | `validateQr()` | Zod `validateQrBodySchema` |
| `POST /api/gbp/auth-sessions` | `createGbpAuthSession()` | Zod `gbpAuthSessionBodySchema` |
| `GET /api/gbp/auth-sessions/[sessionId]/status` | `getGbpAuthSessionStatus()` | - |
| `GET /api/google-places/autocomplete` | `googlePlacesAutocomplete()` | - |
| `GET /api/google-places/details` | `googlePlacesDetails()` | - |

Request/response contracts and status codes are unchanged.

### C. Auth and Layout

- **AuthGuard** – Implemented in `components/layout/AuthGuard.tsx` using `useAuth()`. `components/auth-guard.tsx` re-exports from `components/layout` so existing imports still work.
- **Dashboard layouts** – Still use `<AuthGuard>`; no URL or behavior change.

### D. TypeScript Fixes (Pre-existing)

- **`dashboard/business/[id]/page.tsx`** – Tab state from URL: `mainTab` and `subTab` are now explicitly typed as `(typeof BUSINESS_MAIN_TABS)[number]` and `(typeof BUSINESS_SETTINGS_SUB_TABS)[number]` so `setActiveTab`/`setSettingsSubTab` type-check.

### E. Dependencies

- **zod** – Added for request validation in API routes.

---

## 2. Why

- **Separation of concerns** – Route handlers are thin; business logic and external calls live in `config`, `services`, and `lib/validation`.
- **Testability** – Services and validation can be unit-tested without Next request/response.
- **Consistency** – One place for API base URL, headers, and error parsing; Zod for validated request bodies.
- **Next.js alignment** – App Router and existing data-fetching patterns kept; no change to routes or pages.
- **Reversibility** – Old paths (`@/lib/auth`, `@/components/auth-guard`) still work via re-exports; services can be inlined back into routes if needed.

---

## 3. Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| New import paths | Re-exports kept for `auth-guard`, `lib/types`; existing imports unchanged. |
| API behavior change | Services return same status/body; validation only adds 400 with same `{ error }` shape. |
| Env usage | Only `NEXT_PUBLIC_*` and existing vars; no new secrets in code. |
| Google Places mock | Fallback to `mock-places-data` when API key missing is preserved in `services/external/google-places.ts`. |

---

## 4. Validation Checklist

- [x] **`npm run build`** passes.
- [x] **No route changed** – All app and API routes unchanged.
- [x] **Same API payloads** – Success/error response shapes and status codes preserved.
- [x] **Same UI behavior** – AuthGuard and dashboard layout behavior unchanged; tab state fix is type-only.
- [x] **Backward compatibility** – `@/components/auth-guard`, `@/lib/types`, `@/lib/utils` still valid.

---

## 5. Suggested Next Steps (Optional)

- Add more Zod schemas for other POST bodies and use in route handlers.
- Move page-level logic (e.g. sales-dashboard state) into custom hooks or feature modules under `features/`.
- Add repository layer in `services/repositories/` if you introduce a data abstraction (e.g. DB or Tribly API wrappers).
- Add middleware for auth or request logging if needed.
- Gradually migrate imports from `@/lib/auth` to `@/hooks` or `@/features/auth` where it makes sense.
