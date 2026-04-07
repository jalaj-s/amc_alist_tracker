import type { Movie } from "@/lib/types";

export function LetterboxdInsights({ movies }: { movies: Movie[] }) {
  const amcMovies = movies.filter((m) => m.venue_type === "amc");
  const userRatings = amcMovies.map((m) => m.letterboxd_rating).filter((r): r is number => r !== null);
  const avgRatings = amcMovies.map((m) => m.letterboxd_avg_rating).filter((r): r is number => r !== null);
  if (userRatings.length === 0) return null;

  const userAvg = userRatings.reduce((a, b) => a + b, 0) / userRatings.length;
  const lbAvg = avgRatings.length > 0 ? avgRatings.reduce((a, b) => a + b, 0) / avgRatings.length : null;
  const diff = lbAvg !== null ? userAvg - lbAvg : null;

  const distribution = [0, 0, 0, 0, 0];
  for (const r of userRatings) { const bucket = Math.min(Math.max(Math.ceil(r) - 1, 0), 4); distribution[bucket]++; }
  const maxDist = Math.max(...distribution, 1);

  return (
    <div className="bg-card rounded-xl p-3">
      <div className="text-[10px] text-gray-500 font-semibold mb-2">LETTERBOXD INSIGHTS</div>
      <div className="flex gap-1.5 mb-3">
        <div className="flex-1 bg-gray-800 rounded-lg p-2 text-center"><div className="text-base font-bold text-accent-yellow">{userAvg.toFixed(1)}</div><div className="text-[9px] text-gray-500">Your Avg</div></div>
        <div className="flex-1 bg-gray-800 rounded-lg p-2 text-center"><div className="text-base font-bold text-gray-400">{lbAvg !== null ? lbAvg.toFixed(1) : "—"}</div><div className="text-[9px] text-gray-500">LB Avg</div></div>
        <div className="flex-1 bg-gray-800 rounded-lg p-2 text-center"><div className={`text-base font-bold ${diff !== null && diff >= 0 ? "text-accent-cyan" : "text-accent-red"}`}>{diff !== null ? `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}` : "—"}</div><div className="text-[9px] text-gray-500">Diff</div></div>
      </div>
      <div className="flex items-end gap-1 h-12">
        {distribution.map((count, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div className="bg-accent-yellow rounded-sm w-4/5" style={{ height: `${(count / maxDist) * 100}%`, minHeight: count > 0 ? 4 : 0 }} />
            <div className="text-[8px] text-gray-500 mt-0.5">{i + 1}</div>
          </div>
        ))}
      </div>
      <div className="text-[9px] text-gray-600 text-center mt-1">Your rating distribution</div>
    </div>
  );
}
