"use client";

import { AuthGuard } from "@/components/auth-guard";

export default function SalesDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div
        className="min-h-screen w-full relative"
        style={{ isolation: "isolate" }}
      >
        {children}
      </div>
    </AuthGuard>
  );
}

