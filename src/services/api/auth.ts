/**
 * Business QR login API (Tribly backend: business_qr/login).
 */

import { getTriblyBaseUrl, buildHeaders, ApiResult } from "./client";

export type LoginResponseBody = {
  status?: string;
  message?: string;
  data?: {
    token?: string;
    user_id?: string;
    qr_id?: string;
    user_type?: string;
    name?: string;
    email?: string;
    requires_password_reset?: boolean;
  };
};

export type ResetPasswordResponseBody = {
  status?: string;
  message?: string;
};

export async function loginBusinessQr(
  email: string,
  password: string
): Promise<ApiResult<LoginResponseBody>> {
  const trimmedEmail = email.trim();
  if (!trimmedEmail || !password) {
    return {
      ok: false,
      status: 400,
      error: { message: "Email and password are required" },
    };
  }

  try {
    const response = await fetch(
      `${getTriblyBaseUrl()}/dashboard/v1/business_qr/login`,
      {
        method: "POST",
        headers: buildHeaders(null),
        body: JSON.stringify({
          email: trimmedEmail,
          password,
        }),
      }
    );

    const data: LoginResponseBody = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data ?? { message: "Login failed" },
      };
    }

    return { ok: true, status: response.status, data };
  } catch (error) {
    console.error("Login error:", error);
    return {
      ok: false,
      status: 500,
      error: { message: "An error occurred. Please try again." },
    };
  }
}

/**
 * Server-side reset password: calls backend directly.
 */
export async function resetPassword(
  newPassword: string,
  token: string
): Promise<ApiResult<ResetPasswordResponseBody>> {
  if (!newPassword || !token) {
    return {
      ok: false,
      status: 400,
      error: { message: "New password and token are required" },
    };
  }

  try {
    const response = await fetch(
      `${getTriblyBaseUrl()}/dashboard/v1/business_qr/reset-password`,
      {
        method: "POST",
        headers: buildHeaders(`Bearer ${token}`),
        body: JSON.stringify({ new_password: newPassword }),
      }
    );

    const data: ResetPasswordResponseBody = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data ?? { message: "Password reset failed" },
      };
    }

    return { ok: true, status: response.status, data };
  } catch (error) {
    console.error("Reset password error:", error);
    return {
      ok: false,
      status: 500,
      error: { message: "An error occurred. Please try again." },
    };
  }
}

/**
 * Client-side login: calls the app route /api/auth/login so the backend URL
 * is never exposed to the browser.
 */
export async function loginViaAppRoute(
  email: string,
  password: string
): Promise<ApiResult<LoginResponseBody>> {
  const trimmedEmail = email.trim();
  if (!trimmedEmail || !password) {
    return {
      ok: false,
      status: 400,
      error: { message: "Email and password are required" },
    };
  }

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmedEmail, password }),
    });

    const data: LoginResponseBody = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data ?? { message: "Login failed" },
      };
    }

    return { ok: true, status: response.status, data };
  } catch (error) {
    console.error("Login error:", error);
    return {
      ok: false,
      status: 500,
      error: { message: "An error occurred. Please try again." },
    };
  }
}

/**
 * Client-side reset password: calls the app route /api/auth/reset-password so
 * the backend URL is never exposed to the browser.
 */
export async function resetPasswordViaAppRoute(
  newPassword: string,
  token: string
): Promise<ApiResult<ResetPasswordResponseBody>> {
  if (!newPassword || !token) {
    return {
      ok: false,
      status: 400,
      error: { message: "New password and token are required" },
    };
  }

  try {
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_password: newPassword, token }),
    });

    const data: ResetPasswordResponseBody = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data ?? { message: "Password reset failed" },
      };
    }

    return { ok: true, status: response.status, data };
  } catch (error) {
    console.error("Reset password error:", error);
    return {
      ok: false,
      status: 500,
      error: { message: "An error occurred. Please try again." },
    };
  }
}
