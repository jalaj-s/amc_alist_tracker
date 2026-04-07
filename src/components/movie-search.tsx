"use client";

import { useState, useEffect, useRef } from "react";
import type { TmdbSearchResult } from "@/lib/tmdb";

interface MovieSearchProps { onSelect: (movie: TmdbSearchResult) => void; }

export function MovieSearch({ onSelect }: MovieSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}`);
      if (res.ok) { const data = await res.json(); setResults(data); setOpen(true); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  return (
    <div className="relative">
      <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a movie..."
        className="w-full bg-card border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent" />
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-card border border-gray-700 rounded-xl mt-1 max-h-60 overflow-y-auto z-10">
          {results.map((movie) => (
            <button key={movie.id} onClick={() => { onSelect(movie); setQuery(movie.title); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-800 border-b border-gray-800 last:border-0">
              <div className="text-sm font-medium">{movie.title}</div>
              {movie.release_date && <div className="text-xs text-gray-500">{movie.release_date.split("-")[0]}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
