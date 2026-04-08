import type { Movie } from "@/lib/types";
import { MovieRow } from "./movie-row";

export function MovieList({ movies, onDelete }: { movies: Movie[]; onDelete?: (id: string) => void }) {
  const amcMovies = movies.filter((m) => m.venue_type === "amc");
  if (amcMovies.length === 0) {
    return <div className="text-center py-6 text-gray-600 text-sm">No AMC movies in this period</div>;
  }
  return (
    <div className="space-y-1.5">
      <div className="text-[11px] text-gray-500">Recent Movies</div>
      {amcMovies.map((movie) => <MovieRow key={movie.id} movie={movie} onDelete={onDelete} />)}
    </div>
  );
}
