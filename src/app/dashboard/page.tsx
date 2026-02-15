"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/auth";

/**
 * Dashboard root: redirects to the appropriate destination based on user role.
 * - Admin → /dashboard/admin
 * - Sales team → /sales-dashboard
 * - Business user (with qrId) → /dashboard/business/[qrId]
 * - Otherwise → /login
 */
export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const currentUser = getStoredUser();
    if (!currentUser) {
      router.replace("/login");
      return;
    }

    const isAdmin = currentUser.role === "admin" || currentUser.userType === "admin";
    const isSalesTeam = currentUser.role === "sales-team" || currentUser.userType === "sales-team" || currentUser.userType === "sales_team";

    if (isAdmin) {
      router.replace("/dashboard/admin");
      return;
    }
    if (isSalesTeam) {
      router.replace("/sales-dashboard");
      return;
    }
    if (currentUser.qrId) {
      router.replace(`/dashboard/business/${currentUser.qrId}`);
      return;
    }

    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF] flex items-center justify-center">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-hidden />
    </div>
  );
}
