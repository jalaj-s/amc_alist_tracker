"use client";
import type { Movie } from "@/lib/types";

export function SavingsChart({ movies, membershipCost }: { movies: Movie[]; membershipCost: number }) {
  const amcMovies = movies.filter((m) => m.venue_type === "amc" && m.ticket_value)
    .sort((a, b) => a.watched_date.localeCompare(b.watched_date));
  if (amcMovies.length === 0) return <div className="bg-card rounded-xl p-3 text-center text-gray-600 text-sm">No data yet</div>;

  const monthMap = new Map<string, number>();
  let cumulative = 0;
  for (const movie of amcMovies) {
    const month = movie.watched_date.substring(0, 7);
    cumulative += movie.ticket_value ?? 0;
    if (!monthMap.has(month)) cumulative -= membershipCost;
    monthMap.set(month, cumulative);
  }

  const points = Array.from(monthMap.entries());
  const values = points.map(([, v]) => v);
  const maxVal = Math.max(...values, 0);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;
  const width = 280, height = 80, padding = 4;

  const svgPoints = points.map(([, val], i) => {
    const x = padding + (i / Math.max(points.length - 1, 1)) * (width - 2 * padding);
    const y = padding + ((maxVal - val) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="bg-card rounded-xl p-3">
      <div className="text-[10px] text-gray-500 font-semibold mb-2">SAVINGS OVER TIME</div>
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20">
          <defs><linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4ade80" stopOpacity="0.3" /><stop offset="100%" stopColor="#4ade80" stopOpacity="0" /></linearGradient></defs>
          <polyline points={svgPoints} fill="none" stroke="#4ade80" strokeWidth="2" />
        </svg>
        <div className="absolute top-0 right-1 text-[8px] text-gray-500">${maxVal.toFixed(0)}</div>
        <div className="absolute bottom-0 right-1 text-[8px] text-gray-500">${minVal.toFixed(0)}</div>
      </div>
      <div className="flex justify-between text-[8px] text-gray-600 mt-1">
        <span>{points[0]?.[0]}</span><span>{points[points.length - 1]?.[0]}</span>
      </div>
    </div>
  );
}
