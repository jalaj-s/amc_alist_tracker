"use client";

import { useState } from "react";
import type { TimeRange } from "@/lib/types";

interface TimeRangePillsProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const presets: { label: string; value: TimeRange }[] = [
  { label: "This Month", value: "this_month" },
  { label: "90 Days", value: "90_days" },
  { label: "YTD", value: "ytd" },
  { label: "All Time", value: "all_time" },
];

export function TimeRangePills({ value, onChange }: TimeRangePillsProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const isCustom = typeof value === "object";
  const activePreset = typeof value === "string" ? value : null;

  function handleCustomApply() {
    if (customFrom && customTo) {
      onChange({ from: customFrom, to: customTo });
      setShowCustom(false);
    }
  }

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {presets.map((preset) => (
          <button key={preset.label} onClick={() => { setShowCustom(false); onChange(preset.value); }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activePreset === preset.value ? "bg-accent text-black" : "bg-card text-gray-500"
            }`}>
            {preset.label}
          </button>
        ))}
        <button onClick={() => setShowCustom(!showCustom)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            isCustom ? "bg-accent text-black" : "bg-card text-gray-500"
          }`}>
          Custom
        </button>
      </div>
      {showCustom && (
        <div className="flex gap-2 mt-2 items-center">
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
            className="flex-1 bg-card border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white" />
          <span className="text-gray-500 text-xs">to</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
            className="flex-1 bg-card border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white" />
          <button onClick={handleCustomApply}
            className="bg-accent text-black px-3 py-1.5 rounded-lg text-xs font-semibold">Go</button>
        </div>
      )}
    </div>
  );
}
