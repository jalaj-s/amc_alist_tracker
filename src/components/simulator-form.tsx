"use client";

import { useState } from "react";
import { DEFAULT_PRICING, DEFAULT_MEMBERSHIP_COST, FORMAT_LABELS } from "@/lib/constants";

type SimFormat = "standard" | "imax" | "dolby_cinema" | "mix";

interface SimulationInput {
  moviesPerMonth: number;
  format: SimFormat;
  isDiscountDay: boolean;
}

interface SimulationResult {
  monthlySpend: number;
  monthlySavings: number;
  yearlySavings: number;
  membershipCost: number;
}

export function calculateSimulation({ moviesPerMonth, format, isDiscountDay }: SimulationInput): SimulationResult {
  let pricePerMovie: number;

  if (format === "mix") {
    const avg = DEFAULT_PRICING.reduce((sum, p) => sum + (isDiscountDay ? p.discount_price : p.regular_price), 0) / DEFAULT_PRICING.length;
    pricePerMovie = avg;
  } else {
    const entry = DEFAULT_PRICING.find((p) => p.format === format);
    if (!entry) throw new Error(`Unknown format: ${format}`);
    pricePerMovie = isDiscountDay ? entry.discount_price : entry.regular_price;
  }

  const monthlySpend = pricePerMovie * moviesPerMonth;
  const membershipCost = DEFAULT_MEMBERSHIP_COST;
  const monthlySavings = monthlySpend - membershipCost;
  const yearlySavings = monthlySavings * 12;

  return { monthlySpend, monthlySavings, yearlySavings, membershipCost };
}

type Step = "amc_check" | "movies" | "format" | "discount" | "results" | "no_amc";

const FORMAT_OPTIONS: { value: SimFormat; label: string }[] = [
  { value: "standard", label: FORMAT_LABELS["standard"] },
  { value: "imax", label: FORMAT_LABELS["imax"] },
  { value: "dolby_cinema", label: FORMAT_LABELS["dolby_cinema"] },
  { value: "mix", label: "Mix of formats" },
];

export function SimulatorForm() {
  const [step, setStep] = useState<Step>("amc_check");
  const [moviesPerMonth, setMoviesPerMonth] = useState(3);
  const [format, setFormat] = useState<SimFormat>("standard");
  const [isDiscountDay, setIsDiscountDay] = useState(false);

  const result = step === "results" ? calculateSimulation({ moviesPerMonth, format, isDiscountDay }) : null;

  if (step === "no_amc") {
    return (
      <div className="bg-card rounded-xl p-6 text-center space-y-2">
        <div className="text-2xl">🎬</div>
        <p className="font-semibold">A-List isn&apos;t for you</p>
        <p className="text-sm text-gray-400">A-List requires an AMC theater nearby to be worthwhile.</p>
        <button onClick={() => setStep("amc_check")} className="text-xs text-gray-500 underline mt-2">Start over</button>
      </div>
    );
  }

  if (step === "amc_check") {
    return (
      <div className="bg-card rounded-xl p-6 space-y-4">
        <p className="font-semibold text-center">Is there an AMC theater near you?</p>
        <div className="flex gap-3">
          <button
            onClick={() => setStep("movies")}
            className="flex-1 bg-accent text-black py-3 rounded-xl font-semibold text-sm"
          >
            Yes
          </button>
          <button
            onClick={() => setStep("no_amc")}
            className="flex-1 bg-card-alt py-3 rounded-xl font-semibold text-sm"
          >
            No
          </button>
        </div>
      </div>
    );
  }

  if (step === "movies") {
    return (
      <div className="bg-card rounded-xl p-6 space-y-4">
        <p className="font-semibold text-center">How many movies do you see per month?</p>
        <div className="text-center text-3xl font-bold text-accent">{moviesPerMonth}</div>
        <input
          type="range"
          min={1}
          max={8}
          value={moviesPerMonth}
          onChange={(e) => setMoviesPerMonth(Number(e.target.value))}
          className="w-full accent-[var(--color-accent)]"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>1</span>
          <span>8</span>
        </div>
        <button
          onClick={() => setStep("format")}
          className="w-full bg-accent text-black py-3 rounded-xl font-semibold text-sm"
        >
          Next
        </button>
      </div>
    );
  }

  if (step === "format") {
    return (
      <div className="bg-card rounded-xl p-6 space-y-4">
        <p className="font-semibold text-center">What format do you usually see?</p>
        <div className="space-y-2">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setFormat(opt.value); setStep("discount"); }}
              className={`w-full py-3 rounded-xl font-semibold text-sm border ${
                format === opt.value
                  ? "bg-accent text-black border-accent"
                  : "bg-card-alt border-gray-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === "discount") {
    return (
      <div className="bg-card rounded-xl p-6 space-y-4">
        <p className="font-semibold text-center">Do you usually go on a discount day?</p>
        <p className="text-xs text-gray-400 text-center">Discount days (Tue/Wed) have lower ticket prices</p>
        <div className="flex gap-3">
          <button
            onClick={() => { setIsDiscountDay(true); setStep("results"); }}
            className="flex-1 bg-card-alt py-3 rounded-xl font-semibold text-sm border border-gray-700"
          >
            Yes, usually
          </button>
          <button
            onClick={() => { setIsDiscountDay(false); setStep("results"); }}
            className="flex-1 bg-card-alt py-3 rounded-xl font-semibold text-sm border border-gray-700"
          >
            No, full price
          </button>
        </div>
      </div>
    );
  }

  if (step === "results" && result) {
    const worthIt = result.monthlySavings > 0;
    return (
      <div className="space-y-3">
        <div className="bg-card rounded-xl p-6 space-y-4">
          <p className="font-semibold text-center text-lg">
            {worthIt ? "A-List would save you money!" : "A-List might not be worth it"}
          </p>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">You'd spend without A-List</span>
              <span className="font-semibold">${result.monthlySpend.toFixed(2)}/mo</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">A-List membership</span>
              <span className="font-semibold">${result.membershipCost.toFixed(2)}/mo</span>
            </div>
            <div className="border-t border-gray-700 pt-2 flex justify-between text-sm">
              <span className="text-gray-400">Monthly savings</span>
              <span className={`font-bold ${worthIt ? "text-accent" : "text-accent-red"}`}>
                {worthIt ? "+" : ""}${result.monthlySavings.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Yearly savings</span>
              <span className={`font-bold ${worthIt ? "text-accent" : "text-accent-red"}`}>
                {worthIt ? "+" : ""}${result.yearlySavings.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => { setStep("amc_check"); setMoviesPerMonth(3); setFormat("standard"); setIsDiscountDay(false); }}
          className="w-full bg-card-alt border border-gray-700 rounded-xl py-3 text-sm font-semibold"
        >
          Start over
        </button>
      </div>
    );
  }

  return null;
}
