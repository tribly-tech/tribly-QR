"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBusinessById } from "@/lib/mock-data";

export default function ManualFeedbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [feedback, setFeedback] = useState("");
  const [name, setName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const ratingParam = searchParams.get("rating");
  const rating = ratingParam === "excellent" ? "Excellent" : ratingParam === "good" ? "Good" : ratingParam === "average" ? "Average" : null;

  const handleSubmit = () => {
    if (feedback.trim() && name.trim() && contactInfo.trim()) {
      // Get business ID from sessionStorage or URL
      const codeParam = searchParams.get("code");
      const businessId = sessionStorage.getItem("businessId");
      
      // Get Google Business review link
      let googleReviewLink = null;
      if (businessId) {
        const business = getBusinessById(businessId);
        googleReviewLink = business?.googleBusinessReviewLink;
      }
      
      // Redirect to Google Business review if available, otherwise to rating page
      if (googleReviewLink) {
        window.location.href = googleReviewLink;
      } else {
        router.push("/rating");
      }
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

        {/* Feedback Form Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-[#9747FF]/20">
          <CardContent className="pt-6 space-y-4">
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
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="flex flex-col items-center pt-10">
          <Button
            variant="secondary"
            onClick={handleSubmit}
            disabled={!feedback.trim() || !name.trim() || !contactInfo.trim()}
            className="w-3/4 h-16 sm:h-20 rounded-full text-base font-medium bg-white border border-[#9747FF] text-[#9747FF] hover:bg-white/90 shadow-[0px_4px_0px_#9747FF] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Feedback
          </Button>
        </div>
      </div>
    </main>
  );
}

