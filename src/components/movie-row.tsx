import type { Movie } from "@/lib/types";
import { FORMAT_LABELS } from "@/lib/constants";

export function MovieRow({ movie, onDelete }: { movie: Movie; onDelete?: (id: string) => void }) {
  const locationName = movie.amc_location?.name || "";
  const formatLabel = movie.format ? FORMAT_LABELS[movie.format] : "";
  const detail = [movie.watched_date, formatLabel, locationName].filter(Boolean).join(" · ");
  return (
    <div className="bg-card rounded-lg px-3 py-2.5 flex justify-between items-center">
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold truncate">{movie.title}</div>
        <div className="text-[10px] text-gray-500 truncate">{detail}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {movie.letterboxd_rating && <span className="text-[10px] text-accent-yellow">★ {movie.letterboxd_rating}</span>}
        {movie.ticket_value && <span className="text-xs text-accent font-bold">+${movie.ticket_value.toFixed(0)}</span>}
        {onDelete && (
          <button
            onClick={() => { if (confirm(`Delete "${movie.title}"?`)) onDelete(movie.id); }}
            className="text-gray-600 hover:text-accent-red text-xs ml-1"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
