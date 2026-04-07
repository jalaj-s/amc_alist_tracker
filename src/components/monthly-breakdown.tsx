import type { Movie } from "@/lib/types";

export function MonthlyBreakdown({ movies, membershipCost }: { movies: Movie[]; membershipCost: number }) {
  const amcMovies = movies.filter((m) => m.venue_type === "amc" && m.ticket_value);
  const monthMap = new Map<string, { total: number; count: number }>();
  for (const movie of amcMovies) {
    const month = movie.watched_date.substring(0, 7);
    const existing = monthMap.get(month) || { total: 0, count: 0 };
    existing.total += movie.ticket_value ?? 0; existing.count += 1;
    monthMap.set(month, existing);
  }
  const months = Array.from(monthMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  if (months.length === 0) return null;
  const maxTotal = Math.max(...months.map(([, d]) => d.total));

  return (
    <div className="bg-card rounded-xl p-3">
      <div className="text-[10px] text-gray-500 font-semibold mb-2">MONTHLY BREAKDOWN</div>
      <div className="space-y-1.5">
        {months.map(([month, data]) => {
          const isPositive = data.total >= membershipCost;
          return (
            <div key={month}>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-gray-400">{month}</span>
                <span className={isPositive ? "text-accent" : "text-accent-red"}>${data.total.toFixed(2)} · {data.count} movie{data.count !== 1 ? "s" : ""}</span>
              </div>
              <div className="bg-gray-800 rounded-sm h-1.5 overflow-hidden">
                <div className={`h-full rounded-sm ${isPositive ? "bg-accent" : "bg-accent-red"}`} style={{ width: `${(data.total / maxTotal) * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
