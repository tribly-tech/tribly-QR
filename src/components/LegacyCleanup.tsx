"use client";
import { useEffect } from "react";

export function LegacyCleanup() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Proactively remove legacy fake data
      localStorage.removeItem("tribly_sales_team");
      // Double check just in case
      if (localStorage.getItem("tribly_sales_team")) {
         console.warn("Legacy key tribly_sales_team persists? Attempting rigorous deletion.");
         localStorage.removeItem("tribly_sales_team");
      }
    }
  }, []);
  return null;
}
