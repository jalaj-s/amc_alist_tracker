export interface TmdbSearchResult {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
}

export async function searchMovies(query: string, apiKey: string): Promise<TmdbSearchResult[]> {
  if (!query.trim()) return [];
  const url = new URL("https://api.themoviedb.org/3/search/movie");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("page", "1");
  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || []).slice(0, 8).map((r: any) => ({
    id: r.id, title: r.title, release_date: r.release_date || "", poster_path: r.poster_path,
  }));
}
