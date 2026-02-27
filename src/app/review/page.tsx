"use client";

/**
 * Review Page (public scan flow — reached via /qr/[shortCode] redirect)
 *
 * IMPORTANT: Never redirect to login. Customers scanning QR codes are not logged in.
 * - API success → show review/rating UI
 * - API failure → show error page (never login)
 * Exception: logged-in sales-team users are redirected to /sales-dashboard?qr=...
 */

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { getStoredUser } from "@/lib/auth";
import { QrCode } from "lucide-react";

function ReviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const qrId = searchParams.get("qr");
  const [isChecking, setIsChecking] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    const checkQRConfiguration = async () => {
      if (!qrId) {
        setIsChecking(false);
        return;
      }

      setIsChecking(true);

      // Check if logged-in user is a sales team member
      const currentUser = getStoredUser();
      if (currentUser && (currentUser.role === "sales-team" || currentUser.userType === "sales_team")) {
        // Redirect sales team members to the sales dashboard with QR ID
        router.push(`/sales-dashboard?qr=${qrId}`);
        return;
      }

      try {
        const response = await fetch(`/api/business/${encodeURIComponent(qrId)}`);

        if (!response.ok) {
          console.error("Failed to fetch QR configuration");
          setIsChecking(false);
          setFetchError(true);
          return;
        }

        // API success — show the review page (backend fails if business not configured)
        setIsChecking(false);
      } catch (error) {
        console.error("Error checking QR configuration:", error);
        setIsChecking(false);
        setFetchError(true);
      }
    };

    checkQRConfiguration();
  }, [qrId, router]);

  const handleRatingClick = (rating: "excellent" | "good" | "average" | "need-improvement") => {
    if (rating === "excellent" || rating === "good" || rating === "average") {
      const params = new URLSearchParams();
      params.set("rating", rating);
      if (code) params.set("code", code);
      if (qrId) params.set("qr", qrId);
      const feedbackUrl = `/feedback?${params.toString()}`;
      router.push(feedbackUrl);
    } else {
      const params = new URLSearchParams();
      if (code) params.set("code", code);
      if (qrId) params.set("qr", qrId);
      const manualFeedbackUrl = `/manual-feedback${params.toString() ? `?${params.toString()}` : ""}`;
      router.push(manualFeedbackUrl);
    }
  };

  // No QR: show scan prompt instead of rating options (avoids dead flow from rating without QR)
  if (!qrId) {
    return (
      <main className="h-screen sm:min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF] flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="flex justify-center">
            <div className="rounded-2xl bg-white/80 border border-[#9747FF]/20 p-8">
              <QrCode className="w-24 h-24 text-[#9747FF]" strokeWidth={1.5} />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
              Scan to share feedback
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Use the QR code at the business to leave your feedback.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="text-[#9747FF] border-[#9747FF]/30 hover:bg-[#9747FF]/10"
          >
            Back to Home
          </Button>
        </div>
      </main>
    );
  }

  // Show loading state while checking QR configuration
  if (isChecking) {
    return (
      <main className="h-screen sm:min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF] flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    );
  }

  // API failed (e.g. business not configured — backend returns error in that case)
  if (fetchError) {
    return (
      <main className="h-screen sm:min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF] flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
              Unable to load
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              This QR code is invalid or not set up yet. Please try again later.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="text-[#9747FF] border-[#9747FF]/30 hover:bg-[#9747FF]/10"
          >
            Back to Home
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen sm:min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF] flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="w-full max-w-md space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            How was your experience?
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Share your feedback with us
          </p>
        </div>

        {/* Rating Buttons */}
        <div className="flex flex-col items-center space-y-6">
          <Button
            variant="secondary"
            onClick={() => handleRatingClick("excellent")}
            className="w-3/4 h-16 sm:h-20 rounded-full text-base font-medium bg-white border border-[#9747FF] text-[#9747FF] hover:bg-white/90 shadow-[0px_4px_0px_#9747FF]"
          >
            <span className="text-xl mr-2">😍</span>
            Excellent
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2 !w-6 !h-6 flex-shrink-0">
              <path d="M15.9935 12.0016C15.0763 12.4669 13.5958 13.6091 12.4909 14.7323C11.1066 16.1396 10.3179 17.0455 9.86719 18L8 17.0782C8.18243 16.5174 9.91589 14.1017 11.2193 13.05C12.3653 12.1254 12.5653 12.0137 12.5969 12.0002C12.5636 11.9888 12.3504 11.8854 11.2193 10.95C9.94763 9.89834 8.18243 7.48264 8 6.92183L9.86719 6C10.3179 6.95446 11.1066 7.86039 12.4909 9.2677C13.5958 10.3909 15.0763 11.5331 15.9935 11.9984H16L15.9968 12L16 12.0016H15.9935Z" fill="#9747FF"/>
            </svg>
          </Button>

          <Button
            variant="secondary"
            onClick={() => handleRatingClick("good")}
            className="w-3/4 h-16 sm:h-20 rounded-full text-base font-medium bg-white border border-[#9747FF] text-[#9747FF] hover:bg-white/90 shadow-[0px_4px_0px_#9747FF]"
          >
            <span className="text-xl mr-2">👍</span>
            Good
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2 !w-6 !h-6 flex-shrink-0">
              <path d="M15.9935 12.0016C15.0763 12.4669 13.5958 13.6091 12.4909 14.7323C11.1066 16.1396 10.3179 17.0455 9.86719 18L8 17.0782C8.18243 16.5174 9.91589 14.1017 11.2193 13.05C12.3653 12.1254 12.5653 12.0137 12.5969 12.0002C12.5636 11.9888 12.3504 11.8854 11.2193 10.95C9.94763 9.89834 8.18243 7.48264 8 6.92183L9.86719 6C10.3179 6.95446 11.1066 7.86039 12.4909 9.2677C13.5958 10.3909 15.0763 11.5331 15.9935 11.9984H16L15.9968 12L16 12.0016H15.9935Z" fill="#9747FF"/>
            </svg>
          </Button>

          <Button
            variant="secondary"
            onClick={() => handleRatingClick("average")}
            className="w-3/4 h-16 sm:h-20 rounded-full text-base font-medium bg-white border border-[#9747FF] text-[#9747FF] hover:bg-white/90 shadow-[0px_4px_0px_#9747FF]"
          >
            <span className="text-xl mr-2">😐</span>
            Average
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2 !w-6 !h-6 flex-shrink-0">
              <path d="M15.9935 12.0016C15.0763 12.4669 13.5958 13.6091 12.4909 14.7323C11.1066 16.1396 10.3179 17.0455 9.86719 18L8 17.0782C8.18243 16.5174 9.91589 14.1017 11.2193 13.05C12.3653 12.1254 12.5653 12.0137 12.5969 12.0002C12.5636 11.9888 12.3504 11.8854 11.2193 10.95C9.94763 9.89834 8.18243 7.48264 8 6.92183L9.86719 6C10.3179 6.95446 11.1066 7.86039 12.4909 9.2677C13.5958 10.3909 15.0763 11.5331 15.9935 11.9984H16L15.9968 12L16 12.0016H15.9935Z" fill="#9747FF"/>
            </svg>
          </Button>

          <Button
            variant="secondary"
            onClick={() => handleRatingClick("need-improvement")}
            className="w-3/4 h-16 sm:h-20 rounded-full text-base font-medium bg-white border border-[#9747FF] text-[#9747FF] hover:bg-white/90 shadow-[0px_4px_0px_#9747FF]"
          >
            <span className="text-xl mr-2">😕</span>
            Need Improvement
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2 !w-6 !h-6 flex-shrink-0">
              <path d="M15.9935 12.0016C15.0763 12.4669 13.5958 13.6091 12.4909 14.7323C11.1066 16.1396 10.3179 17.0455 9.86719 18L8 17.0782C8.18243 16.5174 9.91589 14.1017 11.2193 13.05C12.3653 12.1254 12.5653 12.0137 12.5969 12.0002C12.5636 11.9888 12.3504 11.8854 11.2193 10.95C9.94763 9.89834 8.18243 7.48264 8 6.92183L9.86719 6C10.3179 6.95446 11.1066 7.86039 12.4909 9.2677C13.5958 10.3909 15.0763 11.5331 15.9935 11.9984H16L15.9968 12L16 12.0016H15.9935Z" fill="#9747FF"/>
            </svg>
          </Button>
        </div>
      </div>
    </main>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    }>
      <ReviewPageContent />
    </Suspense>
  );
}
