"use client";

import { useTimeRange } from "@/hooks/use-time-range";
import { useMovies } from "@/hooks/use-movies";
import { useSettings } from "@/hooks/use-settings";
import { calculateSavings, prorateMembershipCost } from "@/lib/savings";
import { TimeRangePills } from "@/components/time-range-pills";
import { SavingsHero } from "@/components/savings-hero";
import { QuickStats } from "@/components/quick-stats";
import { MovieList } from "@/components/movie-list";
import Link from "next/link";

export function HomeDashboard() {
  const { range, setRange, dateRange } = useTimeRange();
  const { movies, loading: moviesLoading, deleteMovie } = useMovies(dateRange);
  const { profile, loading: settingsLoading } = useSettings();
  const loading = moviesLoading || settingsLoading;
  const membershipCost = profile?.membership_cost ?? 25.99;
  const proratedCost = range === "this_month"
    ? membershipCost
    : prorateMembershipCost(membershipCost, dateRange.from, dateRange.to);
  const summary = calculateSavings(movies, proratedCost);

  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="font-semibold text-sm">AMC Tracker</span>
        <Link href="/settings" className="text-gray-500 text-sm">⚙</Link>
      </div>
      <TimeRangePills value={range} onChange={setRange} />
      {loading ? (
        <div className="text-center py-12 text-gray-600 text-sm">Loading...</div>
      ) : (
        <>
          <SavingsHero summary={summary} />
          <QuickStats summary={summary} />
          <MovieList movies={movies} onDelete={deleteMovie} />
        </>
      )}
    </div>
  );
}
