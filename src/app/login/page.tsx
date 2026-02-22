"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getStoredUser, setStoredUser, setAuthToken } from "@/lib/auth";
import { generateBusinessSlug } from "@/lib/business-slug";
import { getBusinessById } from "@/lib/mock-data";
import { loginViaAppRoute } from "@/services/api/auth";
import { LogIn, Mail, Lock, AlertCircle } from "lucide-react";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const qrId = searchParams.get("qr"); // QR ID from scan flow
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      if (qrId) {
        if (user.role === "sales-team" || user.userType === "sales_team") {
          router.push(`/sales-dashboard?qr=${qrId}`);
        } else {
          router.push(`/dashboard/business/${qrId}`);
        }
        return;
      }

      if (redirectUrl) {
        router.push(redirectUrl);
        return;
      }

      if (user.userType === "business_qr_user" && user.qrId) {
        router.push(`/dashboard/business/${user.qrId}`);
      } else if (user.userType === "admin") {
        router.push("/dashboard/admin");
      } else if (user.role === "business" && user.businessId) {
        const business = getBusinessById(user.businessId);
        if (business) {
          const slug = generateBusinessSlug(business);
          router.push(`/dashboard/business/${slug}`);
        }
      } else if (user.role === "sales-team") {
        router.push("/sales-dashboard");
      } else {
        router.push("/dashboard/admin");
      }
    }
  }, [router, redirectUrl, qrId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const trimmedEmail = email.trim();
      const result = await loginViaAppRoute(trimmedEmail, password);

      if (!result.ok) {
        const message =
          (result.error as { message?: string })?.message ||
          "Login failed. Please try again.";
        setError(message);
        setIsLoading(false);
        return;
      }

      const data = result.data;
      if (data?.status !== "success") {
        setError(data?.message || "Login failed. Please try again.");
        setIsLoading(false);
        return;
      }

      const userData = data.data;
      if (!userData) {
        setError("Login failed. Please try again.");
        setIsLoading(false);
        return;
      }

      if (userData.requires_password_reset && userData.token) {
        const params = new URLSearchParams({
          token: userData.token,
          email: userData.email || trimmedEmail,
        });
        router.push(`/reset-password?${params.toString()}`);
        return;
      }

      if (userData.token) {
        setAuthToken(userData.token);
      }

      // Create user object from API response

      // Determine role based on user_type from API (case-insensitive)
      let userRole: "admin" | "sales-team" | "business" = "business";
      const apiUserType = (userData.user_type || "").toLowerCase().trim();
      if (apiUserType === "admin") {
        userRole = "admin";
      } else if (apiUserType === "sales_team" || apiUserType === "sales-team") {
        userRole = "sales-team";
      }

      const user = {
        id: userData.user_id || userData.qr_id || `qr-user-${Date.now()}`,
        email: trimmedEmail,
        name: userData.name || trimmedEmail,
        role: userRole,
        businessId: userData.qr_id,
        qrId: userData.qr_id,
        userType: userData.user_type,
      };

      setStoredUser(user);

      // If there's a QR ID from scan, handle based on user type
      if (qrId) {
        if (userRole === "sales-team") {
          router.push(`/sales-dashboard?qr=${qrId}`);
        } else {
          router.push(`/dashboard/business/${qrId}`);
        }
        return;
      }

      // If there's a redirect URL, use it
      if (redirectUrl) {
        router.push(redirectUrl);
        return;
      }

      // Redirect based on user type
      if (userRole === "sales-team") {
        router.push("/sales-dashboard");
      } else if (userData.user_type === "business_qr_user" && userData.qr_id) {
        router.push(`/dashboard/business/${userData.qr_id}`);
      } else if (userData.user_type === "admin") {
        router.push("/dashboard/admin");
      } else if (userData.qr_id) {
        // Fallback: if qr_id exists, redirect to business dashboard
        router.push(`/dashboard/business/${userData.qr_id}`);
      } else {
        router.push("/dashboard/admin");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@tribly.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-[48px]"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-[48px]"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full gap-2 h-[48px]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
