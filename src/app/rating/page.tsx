"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function RatingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF] p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            Thank You!
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Your feedback has been submitted successfully
          </p>
        </div>

        {/* Success Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-[#9747FF]/20">
          <CardContent className="pt-6 space-y-4">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-[#9747FF]/10 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-[#9747FF]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Feedback Submitted
                </h2>
                <p className="text-muted-foreground">
                  We appreciate you taking the time to share your experience with us.
                  Your feedback helps us improve our services.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="flex flex-col items-center pt-10">
          <Button
            variant="secondary"
            onClick={() => router.push("/review")}
            className="w-3/4 h-16 sm:h-20 rounded-full text-base font-medium bg-white border border-[#9747FF] text-[#9747FF] hover:bg-white/90 shadow-[0px_4px_0px_#9747FF]"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </main>
  );
}

