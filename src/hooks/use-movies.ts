"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Movie, VenueType, MovieFormat } from "@/lib/types";

export function useMovies(dateRange: { from: string; to: string }) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("movies")
      .select("*, amc_location:amc_locations(id, name)")
      .gte("watched_date", dateRange.from)
      .lte("watched_date", dateRange.to)
      .order("watched_date", { ascending: false });
    setMovies((data as Movie[]) || []);
    setLoading(false);
  }, [dateRange.from, dateRange.to]);

  useEffect(() => { fetchMovies(); }, [fetchMovies]);

  async function addMovie(movie: {
    title: string; tmdb_id?: number; watched_date: string; venue_type: VenueType;
    amc_location_id?: string; format?: MovieFormat; is_discount_day: boolean;
    ticket_value?: number; letterboxd_rating?: number; letterboxd_avg_rating?: number;
    letterboxd_url?: string; source: "letterboxd_sync" | "manual";
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("movies").insert({ ...movie, user_id: user.id });
    if (!error) await fetchMovies();
    return error;
  }

  async function checkDuplicate(title: string, watchedDate: string) {
    const { data } = await supabase
      .from("movies").select("id").eq("title", title).eq("watched_date", watchedDate).limit(1);
    return (data?.length ?? 0) > 0;
  }

  return { movies, loading, addMovie, checkDuplicate, refetch: fetchMovies };
}
