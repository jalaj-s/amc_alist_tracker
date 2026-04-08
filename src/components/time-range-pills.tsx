"use client";

import { useState } from "react";
import type { TimeRange } from "@/lib/types";

interface TimeRangePillsProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function isMonthRange(value: TimeRange): value is { type: "month"; year: number; month: number } {
  return typeof value === "object" && "type" in value && value.type === "month";
}

function isCustomRange(value: TimeRange): value is { from: string; to: string } {
  return typeof value === "object" && "from" in value;
}

function getCurrentMonth(): { type: "month"; year: number; month: number } {
  const now = new Date();
  return { type: "month", year: now.getFullYear(), month: now.getMonth() + 1 };
}

function getMonthLabel(year: number, month: number): string {
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  if (isCurrentMonth) return "This Month";
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

const presets: { label: string; value: TimeRange }[] = [
  { label: "90 Days", value: "90_days" },
  { label: "YTD", value: "ytd" },
  { label: "All Time", value: "all_time" },
];

export function TimeRangePills({ value, onChange }: TimeRangePillsProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const isMonth = value === "this_month" || isMonthRange(value);
  const activePreset = typeof value === "string" && value !== "this_month" ? value : null;

  // Get current month info for the arrows
  const currentMonthData = isMonthRange(value) ? value : getCurrentMonth();

  function handleMonthNav(delta: number) {
    let newMonth = currentMonthData.month + delta;
    let newYear = currentMonthData.year;
    if (newMonth < 1) { newMonth = 12; newYear--; }
    if (newMonth > 12) { newMonth = 1; newYear++; }

    const now = new Date();
    const isCurrentMonth = newYear === now.getFullYear() && newMonth === now.getMonth() + 1;
    if (isCurrentMonth) {
      onChange("this_month");
    } else {
      onChange({ type: "month", year: newYear, month: newMonth });
    }
  }

  function handleMonthClick() {
    setShowCustom(false);
    if (isMonth) return; // already on month view
    onChange("this_month");
  }

  function handleCustomApply() {
    if (customFrom && customTo) {
      onChange({ from: customFrom, to: customTo });
      setShowCustom(false);
    }
  }

  // Check if we're at current month (disable forward arrow)
  const now = new Date();
  const isAtCurrentMonth = currentMonthData.year === now.getFullYear() && currentMonthData.month === now.getMonth() + 1;

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {/* Month pill with arrows */}
        <div className={`shrink-0 flex items-center rounded-full transition-colors ${
          isMonth ? "bg-accent text-black" : "bg-card text-gray-500"
        }`}>
          {isMonth && (
            <button onClick={() => handleMonthNav(-1)} className="pl-2.5 pr-1 py-1.5 text-xs font-bold">
              ‹
            </button>
          )}
          <button onClick={handleMonthClick} className={`${isMonth ? "px-1" : "px-3"} py-1.5 text-xs font-semibold`}>
            {getMonthLabel(currentMonthData.year, currentMonthData.month)}
          </button>
          {isMonth && (
            <button
              onClick={() => handleMonthNav(1)}
              disabled={isAtCurrentMonth}
              className={`pr-2.5 pl-1 py-1.5 text-xs font-bold ${isAtCurrentMonth ? "opacity-30" : ""}`}
            >
              ›
            </button>
          )}
        </div>

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
            isCustomRange(value) ? "bg-accent text-black" : "bg-card text-gray-500"
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
