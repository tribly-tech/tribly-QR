"use client";

import { AuthGuard } from "@/components/auth-guard";

export default function SalesDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}

