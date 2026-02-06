"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/auth";
import LandingPage from "./landing-page";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user) return;
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
  }, [router]);

  const user = getStoredUser();
  if (user) return null;

  return <LandingPage />;
}
