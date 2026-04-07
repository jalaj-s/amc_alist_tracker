import type { Movie } from "@/lib/types";
import { FORMAT_LABELS } from "@/lib/constants";

export function FormatLocationStats({ movies }: { movies: Movie[] }) {
  const amcMovies = movies.filter((m) => m.venue_type === "amc");
  const formatCounts = new Map<string, number>();
  for (const m of amcMovies) { if (m.format) formatCounts.set(m.format, (formatCounts.get(m.format) || 0) + 1); }
  const locationCounts = new Map<string, number>();
  for (const m of amcMovies) { const name = m.amc_location?.name; if (name) locationCounts.set(name, (locationCounts.get(name) || 0) + 1); }
  const sortedLocations = Array.from(locationCounts.entries()).sort((a, b) => b[1] - a[1]);
  if (amcMovies.length === 0) return null;

  return (
    <div className="bg-card rounded-xl p-3">
      <div className="text-[10px] text-gray-500 font-semibold mb-2">FORMATS & LOCATIONS</div>
      {formatCounts.size > 0 && (
        <div className="flex gap-1.5 mb-3">
          {Array.from(formatCounts.entries()).map(([format, count]) => (
            <div key={format} className="flex-1 bg-gray-800 rounded-lg p-2 text-center">
              <div className="text-sm font-bold">{count}</div>
              <div className="text-[9px] text-gray-500">{FORMAT_LABELS[format as keyof typeof FORMAT_LABELS] || format}</div>
            </div>
          ))}
        </div>
      )}
      {sortedLocations.length > 0 && (
        <div className="space-y-1">
          {sortedLocations.map(([name, count]) => (
            <div key={name} className="flex justify-between text-[10px]">
              <span className="text-gray-400">{name}</span>
              <span className="text-gray-500">{count} visit{count !== 1 ? "s" : ""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
