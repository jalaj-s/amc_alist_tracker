"use client";

import { useState, useMemo } from "react";
import type { TimeRange } from "@/lib/types";

export function useTimeRange(membershipStartDate?: string | null) {
  const [range, setRange] = useState<TimeRange>("this_month");

  const dateRange = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    if (range === "this_month") {
      const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      return { from, to: today };
    }
    if (range === "90_days") {
      const from = new Date(now);
      from.setDate(from.getDate() - 90);
      return { from: from.toISOString().split("T")[0], to: today };
    }
    if (range === "1_year") {
      const from = new Date(now);
      from.setFullYear(from.getFullYear() - 1);
      return { from: from.toISOString().split("T")[0], to: today };
    }
    if (range === "ytd") {
      return { from: `${now.getFullYear()}-01-01`, to: today };
    }
    if (range === "all_time") {
      const from = membershipStartDate || "2020-01-01";
      return { from, to: today };
    }
    if (typeof range === "object" && "type" in range && range.type === "month") {
      const daysInMonth = new Date(range.year, range.month, 0).getDate();
      const from = `${range.year}-${String(range.month).padStart(2, "0")}-01`;
      const to = `${range.year}-${String(range.month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
      return { from, to };
    }
    return range as { from: string; to: string };
  }, [range, membershipStartDate]);

  return { range, setRange, dateRange };
}
