"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getStoredUser,
  setStoredUser,
  getAuthToken,
  setAuthToken,
  logout as authLogout,
  type User,
} from "@/lib/auth";

export interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

/**
 * Client-side auth state: stored user and loading flag.
 * Use in layout/guards and pages that need current user.
 */
export function useAuth(): UseAuthReturn {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUserState(getStoredUser());
    setIsLoading(false);
  }, []);

  const setUser = useCallback((next: User | null) => {
    setStoredUser(next);
    setUserState(next);
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    setUserState(null);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    setUser,
  };
}

/** Get auth token (for API calls). Safe to call from client. */
export function useAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return getAuthToken();
}
