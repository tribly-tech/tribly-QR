"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  AlertCircle,
  Loader2,
  ExternalLink,
  Building2,
  Lock,
  BarChart3,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

function GoogleBusinessAuthContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  // Business name passed from WhatsApp link for display purposes
  const businessNameParam = searchParams.get("business");

  const [isRedirecting, setIsRedirecting] = useState(false);

  // Handle Google OAuth authorization - redirect to backend auth endpoint
  const handleAuthorize = () => {
    if (!sessionId) return;

    setIsRedirecting(true);

    // Redirect to backend auth endpoint which will:
    // 1. Validate the session (exists, pending, not expired)
    // 2. Redirect to Google OAuth consent screen
    // The backend handles all validation and error pages
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL || "https://api.tribly.ai";
    const authUrl = `${apiBaseUrl}/dashboard/v1/gbp/auth?session_id=${encodeURIComponent(
      sessionId,
    )}`;

    window.location.href = authUrl;
  };

  // No session_id provided
  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF] flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">Invalid Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              This authorization link is invalid. Please request a new link from
              your Tribly representative.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main authorization page
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF] flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 text-white mb-4">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Connect Your Business
          </h1>
          <p className="text-muted-foreground">
            Authorize Tribly to help improve your Google Business Profile
          </p>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-purple-600" />
              Google Business Profile Authorization
            </CardTitle>
            {businessNameParam && (
              <CardDescription>
                <span className="font-medium text-gray-900">
                  {decodeURIComponent(businessNameParam)}
                </span>
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Benefits */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                What Tribly will help you with:
              </p>
              <div className="grid gap-3">
                <div className="flex items-start gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Performance Analytics</p>
                    <p className="text-muted-foreground text-xs">
                      Track your profile views, searches, and customer actions
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Review Management</p>
                    <p className="text-muted-foreground text-xs">
                      Get notified about new reviews and respond faster
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Visibility Optimization</p>
                    <p className="text-muted-foreground text-xs">
                      Improve your ranking in Google Maps and local searches
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Note */}
            <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600">
              <Lock className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>
                Your data is secure. We only request read access to your
                business profile. You can revoke access at any time from your
                Google account settings.
              </p>
            </div>

            {/* Authorize Button */}
            <Button
              onClick={handleAuthorize}
              disabled={isRedirecting}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-6"
            >
              {isRedirecting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Connecting to Google...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Connect with Google</span>
                  <ExternalLink className="h-4 w-4 ml-1" />
                </div>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By connecting, you agree to Tribly&apos;s{" "}
              <a href="/terms" className="underline hover:text-purple-600">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="underline hover:text-purple-600">
                Privacy Policy
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-xs text-center text-muted-foreground">
          Powered by Tribly • Helping businesses grow online
        </p>
      </div>
    </div>
  );
}

export default function GoogleBusinessAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <GoogleBusinessAuthContent />
    </Suspense>
  );
}
