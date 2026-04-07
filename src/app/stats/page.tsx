"use client";

import { useTimeRange } from "@/hooks/use-time-range";
import { useMovies } from "@/hooks/use-movies";
import { useSettings } from "@/hooks/use-settings";
import { TimeRangePills } from "@/components/time-range-pills";
import { SavingsChart } from "@/components/savings-chart";
import { MonthlyBreakdown } from "@/components/monthly-breakdown";
import { LetterboxdInsights } from "@/components/letterboxd-insights";
import { FormatLocationStats } from "@/components/format-location-stats";

export default function StatsPage() {
  const { range, setRange, dateRange } = useTimeRange();
  const { movies, loading: moviesLoading } = useMovies(dateRange);
  const { profile, loading: settingsLoading } = useSettings();
  const loading = moviesLoading || settingsLoading;
  const membershipCost = profile?.membership_cost ?? 25.99;

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-bold">Stats</h1>
      <TimeRangePills value={range} onChange={setRange} />
      {loading ? (
        <div className="text-center py-12 text-gray-600 text-sm">Loading...</div>
      ) : (
        <div className="space-y-3">
          <SavingsChart movies={movies} membershipCost={membershipCost} />
          <MonthlyBreakdown movies={movies} membershipCost={membershipCost} />
          <LetterboxdInsights movies={movies} />
          <FormatLocationStats movies={movies} />
        </div>
      )}
    </div>
  );
}
