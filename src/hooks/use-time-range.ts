"use client";

import { useState, useMemo } from "react";
import type { TimeRange } from "@/lib/types";

export function useTimeRange() {
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
    if (range === "ytd") {
      return { from: `${now.getFullYear()}-01-01`, to: today };
    }
    if (range === "all_time") {
      return { from: "2000-01-01", to: today };
    }
    return range;
  }, [range]);

  return { range, setRange, dateRange };
}
