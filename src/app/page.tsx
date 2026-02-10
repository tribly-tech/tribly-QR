"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/auth";
import LandingPage from "./landing-page";

export default function Home() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      const isAdmin = user.role === "admin" || user.userType === "admin";
      const isSalesTeam =
        user.role === "sales-team" || user.userType === "sales-team";
      if (isAdmin) {
        router.replace("/dashboard");
      } else if (isSalesTeam) {
        router.replace("/sales-dashboard");
      } else if (user.qrId) {
        router.replace(`/dashboard/business/${user.qrId}`);
      } else {
        router.replace("/login");
      }
    }
    setAuthChecked(true);
  }, [router]);

  // Don't render landing until we've checked auth on the client. This prevents
  // the landing page and sales dashboard (or other post-login page) from
  // appearing to merge when a logged-in user hits / or during redirects.
  if (!authChecked) {
    return (
      <div
        className="min-h-screen w-full bg-white"
        aria-hidden
        style={{ isolation: "isolate" }}
      />
    );
  }

  const user = getStoredUser();
  if (user) return null;

  return <LandingPage />;
}
