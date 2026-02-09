/**
 * Base HTTP client for Tribly API.
 * Used by service modules to keep request/response logic in one place.
 */

import { getApiBaseUrl } from "@/config";

export type ApiResult<T = unknown> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: unknown };

export function getTriblyBaseUrl(): string {
  return getApiBaseUrl();
}

export function buildHeaders(authHeader: string | null): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (authHeader) {
    (headers as Record<string, string>)["Authorization"] = authHeader;
  }
  return headers;
}

/** Parse error response body (JSON or plain text). */
export async function parseErrorResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { message: text || response.statusText };
  }
}
