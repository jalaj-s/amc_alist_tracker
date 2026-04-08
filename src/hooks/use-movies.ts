"use client";

import { useEffect, useState, useCallback } from "react";
import { collection, query, where, orderBy, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/auth-context";
import type { Movie, VenueType, MovieFormat } from "@/lib/types";

export function useMovies(dateRange: { from: string; to: string }) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMovies = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const moviesRef = collection(db, "profiles", user.uid, "movies");
    const q = query(
      moviesRef,
      where("watched_date", ">=", dateRange.from),
      where("watched_date", "<=", dateRange.to),
      orderBy("watched_date", "desc")
    );

    const snapshot = await getDocs(q);
    const results: Movie[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      // Resolve location name if we have a location_id
      let amc_location = undefined;
      if (data.amc_location_id) {
        const { getDoc, doc } = await import("firebase/firestore");
        const locSnap = await getDoc(doc(db, "profiles", user.uid, "amc_locations", data.amc_location_id));
        if (locSnap.exists()) {
          amc_location = { id: locSnap.id, ...locSnap.data() } as any;
        }
      }

      results.push({
        id: docSnap.id,
        user_id: user.uid,
        title: data.title,
        tmdb_id: data.tmdb_id || null,
        watched_date: data.watched_date,
        venue_type: data.venue_type,
        amc_location_id: data.amc_location_id || null,
        format: data.format || null,
        is_discount_day: data.is_discount_day || false,
        ticket_value: data.ticket_value || null,
        letterboxd_rating: data.letterboxd_rating || null,
        letterboxd_avg_rating: data.letterboxd_avg_rating || null,
        letterboxd_url: data.letterboxd_url || null,
        source: data.source || "manual",
        created_at: data.created_at || "",
        amc_location,
      });
    }

    setMovies(results);
    setLoading(false);
  }, [user, dateRange.from, dateRange.to]);

  useEffect(() => { fetchMovies(); }, [fetchMovies]);

  async function addMovie(movie: {
    title: string; tmdb_id?: number; watched_date: string; venue_type: VenueType;
    amc_location_id?: string; format?: MovieFormat; is_discount_day: boolean;
    ticket_value?: number; letterboxd_rating?: number; letterboxd_avg_rating?: number;
    letterboxd_url?: string; source: "letterboxd_sync" | "manual";
  }) {
    if (!user) return;
    const moviesRef = collection(db, "profiles", user.uid, "movies");
    await addDoc(moviesRef, {
      ...movie,
      created_at: new Date().toISOString(),
    });
    await fetchMovies();
  }

  async function checkDuplicate(title: string, watchedDate: string) {
    if (!user) return false;
    const moviesRef = collection(db, "profiles", user.uid, "movies");
    const q = query(moviesRef, where("title", "==", title), where("watched_date", "==", watchedDate));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  async function deleteMovie(movieId: string) {
    if (!user) return;
    await deleteDoc(doc(db, "profiles", user.uid, "movies", movieId));
    await fetchMovies();
  }

  return { movies, loading, addMovie, deleteMovie, checkDuplicate, refetch: fetchMovies };
}
