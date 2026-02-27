"use client";

/**
 * QR Lookup Page (public scan flow)
 *
 * IMPORTANT: This route is unprotected. Never redirect to login.
 * - API success → redirect to /review?qr=business_id
 * - API failure → show error page (never login)
 */

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { AlertCircle, Loader2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QrLookupPage() {
  const router = useRouter();
  const params = useParams();
  const shortCode = params.shortCode as string;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shortCode) return;

    let cancelled = false;

    async function resolve() {
      try {
        const res = await fetch(
          `/api/qr/${encodeURIComponent(shortCode)}`
        );

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (!cancelled) {
            setError(
              (body as { detail?: string }).detail ??
                (body as { message?: string }).message ??
                "This QR code is invalid or not linked to a business."
            );
          }
          return;
        }

        const data = await res.json();

        if (cancelled) return;

        if (data.business_id) {
          router.replace(`/review?qr=${encodeURIComponent(data.business_id)}`);
        } else {
          setError("Unable to resolve this QR code. Please try again.");
        }
      } catch {
        if (!cancelled) {
          setError("Something went wrong. Please check your connection and try again.");
        }
      }
    }

    resolve();

    return () => {
      cancelled = true;
    };
  }, [shortCode, router]);

  if (error) {
    return (
      <main className="h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex justify-center">
            <div className="rounded-2xl bg-white/80 border border-destructive/20 p-6">
              <AlertCircle className="w-16 h-16 text-destructive" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-foreground">
              QR Code Error
            </h1>
            <p className="text-sm text-muted-foreground">{error}</p>
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
    <main className="h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <div className="rounded-2xl bg-white/80 border border-[#9747FF]/20 p-6">
            <QrCode className="w-16 h-16 text-[#9747FF] animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-[#9747FF]" />
            <h1 className="text-lg font-semibold text-foreground">
              Resolving QR code&hellip;
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Please wait while we look up this business.
          </p>
        </div>
      </div>
    </main>
  );
}
