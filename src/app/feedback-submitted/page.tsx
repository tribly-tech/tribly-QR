"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

const socialButtons = [
  {
    key: "instagram",
    cta: "Follow us on Instagram",
    subtext: "See behind the scenes and stay in the loop",
    buttonLabel: "Follow",
    icon: "/assets/instagram-logo.png",
    param: "instagram",
  },
  {
    key: "whatsapp",
    cta: "Get real-time offers & rewards on WhatsApp",
    subtext: "We’ll send you exclusive deals and updates",
    buttonLabel: "Join",
    icon: "/assets/whatsapp-logo.png",
    param: "whatsapp",
  },
  {
    key: "youtube",
    cta: "Subscribe on YouTube",
    subtext: "Tips, updates, and more—delivered to your feed",
    buttonLabel: "Subscribe",
    icon: "/assets/youtube-logo.png",
    param: "youtube",
  },
] as const;

export default function FeedbackSubmittedPage() {
  const searchParams = useSearchParams();

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF] p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            Thank you — we really mean it!
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Your feedback is in. We read every response and use it to get better.
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
                  Want to stay connected?
                </h2>
                <p className="text-muted-foreground">
                  Follow us, get offers, or subscribe—pick what works for you. We’d love to keep in touch.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social buttons */}
        <div className="space-y-3">
          <p className="text-center text-sm font-medium text-foreground/90">
            Choose how you’d like to stay in the loop:
          </p>
          {socialButtons.map(({ key, cta, subtext, buttonLabel, icon, param }) => {
            const url = searchParams.get(param);
            const href = url || "#";
            const hasUrl = Boolean(url?.startsWith("http"));
            return (
              <a
                key={key}
                href={hasUrl ? href : "#"}
                target={hasUrl ? "_blank" : undefined}
                rel={hasUrl ? "noopener noreferrer" : undefined}
                onClick={!hasUrl ? (e) => e.preventDefault() : undefined}
                aria-disabled={!hasUrl}
                className="flex items-start gap-4 w-full p-4 rounded-xl bg-white/80 backdrop-blur-sm border border-[#9747FF]/20 hover:bg-white hover:border-[#9747FF]/40 hover:shadow-sm transition-all text-left group"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden group-hover:bg-[#9747FF]/10 transition-colors">
                  <Image
                    src={icon}
                    alt=""
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="font-medium text-foreground">{cta}</p>
                  <p className="text-sm text-muted-foreground">{subtext}</p>
                  <span className="inline-block px-4 py-2 rounded-[4px] text-sm font-medium bg-white text-[#9747FF] border border-[#9747FF]/60 group-hover:border-[#9747FF] group-hover:bg-[#9747FF]/5 transition-colors">
                    {buttonLabel}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </main>
  );
}
