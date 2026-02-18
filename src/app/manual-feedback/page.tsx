"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBusinessById } from "@/lib/mock-data";
import { QrCode } from "lucide-react";

function ManualFeedbackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [feedback, setFeedback] = useState("");
  const [name, setName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const ratingParam = searchParams.get("rating");
  const qrId = searchParams.get("qr");
  const rating = ratingParam === "excellent" ? "Excellent" : ratingParam === "good" ? "Good" : ratingParam === "average" ? "Average" : null;

  // No QR: show QR required message and Back to review so user can leave
  if (!qrId) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF] flex flex-col items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 pb-6 space-y-6 text-center">
            <div className="flex justify-center">
              <div className="rounded-2xl bg-white/80 border border-[#9747FF]/20 p-6">
                <QrCode className="w-16 h-16 text-[#9747FF]" strokeWidth={1.5} />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-foreground">QR code required</h1>
              <p className="text-sm text-muted-foreground">
                To share feedback, please scan the QR code at the business. This links your response to the right place.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push("/review")}
              className="w-full text-[#9747FF] border-[#9747FF]/30 hover:bg-[#9747FF]/10"
            >
              Back
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!feedback.trim() || !name.trim() || !contactInfo.trim()) {
      return;
    }

    if (!qrId) {
      setError("QR ID is missing. Please scan the QR code again.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.tribly.ai";
      const requestBody = {
        qr_id: qrId,
        name: name.trim(),
        contact: contactInfo.trim(),
        feedback: feedback.trim(),
      };

      const response = await fetch(`${apiBaseUrl}/dashboard/v1/business_qr/capture_manual_review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to submit feedback. Please try again.");
      }

      // Get business ID from sessionStorage (set by review page when code is used)
      const businessId = sessionStorage.getItem("businessId");

      // Get Google Business review link and social URLs for thank-you page
      let googleReviewLink: string | null = null;
      let business: ReturnType<typeof getBusinessById> = undefined;
      if (businessId) {
        business = getBusinessById(businessId);
        googleReviewLink = business?.googleBusinessReviewLink ?? null;
      }

      // Build feedback-submitted URL with social profile params
      const socialParams = new URLSearchParams();
      if (business?.instagramUrl) socialParams.set("instagram", business.instagramUrl);
      if (business?.youtubeUrl) socialParams.set("youtube", business.youtubeUrl);
      if (business?.whatsappNumber) {
        const { getWhatsAppLinkWithMessage } = await import("@/lib/whatsapp-utils");
        socialParams.set("whatsapp", getWhatsAppLinkWithMessage(business.whatsappNumber));
      } else if (business?.whatsappUrl) socialParams.set("whatsapp", business.whatsappUrl);
      const feedbackSubmittedQuery = socialParams.toString();
      const feedbackSubmittedUrl = feedbackSubmittedQuery
        ? `/feedback-submitted?${feedbackSubmittedQuery}`
        : "/feedback-submitted";

      // Redirect to Google Business review if available, otherwise to thank-you page
      if (googleReviewLink) {
        window.location.href = googleReviewLink;
      } else {
        router.push(feedbackSubmittedUrl);
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF] p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            Share Your Feedback
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {rating ? `We'd love to hear about your ${rating.toLowerCase()} experience` : "We'd love to hear about your experience"}
          </p>
          {ratingParam && (
            <Button
              variant="link"
              onClick={() => {
                const codeParam = searchParams.get("code");
                router.push(`/feedback?rating=${ratingParam}${codeParam ? `&code=${codeParam}` : ""}`);
              }}
              className="text-[#9747FF] hover:text-[#9747FF]/80 text-sm"
            >
              ← Back to AI suggestions
            </Button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="pt-4">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Feedback Form Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-[#9747FF]/20">
          <CardContent className="pt-6 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-medium">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-[#9747FF]/30 focus-visible:ring-[#9747FF]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactInfo" className="text-base font-medium">
                Phone number/Email ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contactInfo"
                type="text"
                placeholder="Enter your phone number or email"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="border-[#9747FF]/30 focus-visible:ring-[#9747FF]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback" className="text-base font-medium">
                Your Feedback
              </Label>
              <Textarea
                id="feedback"
                placeholder="Tell us about your experience..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[150px] border-[#9747FF]/30 focus-visible:ring-[#9747FF] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {feedback.length} characters
              </p>
            </div>

            {/* Action Button */}
            <div className="flex flex-col items-center pt-6">
              <Button
                type="submit"
                variant="secondary"
                disabled={!feedback.trim() || !name.trim() || !contactInfo.trim() || isSubmitting || !qrId}
                className="w-3/4 h-16 sm:h-20 rounded-full text-base font-medium bg-white border border-[#9747FF] text-[#9747FF] hover:bg-white/90 shadow-[0px_4px_0px_#9747FF] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function ManualFeedbackPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF] flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </main>
    }>
      <ManualFeedbackPageContent />
    </Suspense>
  );
}
