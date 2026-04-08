"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { useSettings } from "@/hooks/use-settings";
import { useMovies } from "@/hooks/use-movies";
import type { LetterboxdEntry } from "@/lib/types";

interface AutoSyncState {
  newEntries: LetterboxdEntry[];
  newCount: number;
  clearEntries: () => void;
}

let globalEntries: LetterboxdEntry[] = [];
let globalListeners: Set<() => void> = new Set();

function notifyListeners() {
  globalListeners.forEach((fn) => fn());
}

export function useAutoSync(): AutoSyncState {
  const { user } = useAuth();
  const { profile } = useSettings();
  const { movies } = useMovies({ from: "2000-01-01", to: "2099-12-31" });
  const [, forceUpdate] = useState(0);
  const hasSynced = useRef(false);

  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    globalListeners.add(listener);
    return () => { globalListeners.delete(listener); };
  }, []);

  const loggedKeys = new Set(
    movies.map((m) => `${m.title.toLowerCase()}-${m.watched_date}`)
  );

  const doSync = useCallback(async () => {
    if (!profile?.letterboxd_username) return;

    try {
      const res = await fetch(`/api/letterboxd?username=${encodeURIComponent(profile.letterboxd_username)}`);
      if (!res.ok) return;
      const data: LetterboxdEntry[] = await res.json();
      globalEntries = data;
      notifyListeners();
    } catch {
      // silent fail on auto-sync
    }
  }, [profile?.letterboxd_username]);

  // Auto-sync once when user is logged in and profile is loaded
  useEffect(() => {
    if (user && profile?.letterboxd_username && movies.length >= 0 && !hasSynced.current) {
      hasSynced.current = true;
      doSync();
    }
  }, [user, profile?.letterboxd_username, movies.length, doSync]);

  const newEntries = globalEntries.filter(
    (e) => !loggedKeys.has(`${e.title.toLowerCase()}-${e.watched_date}`)
  );

  function clearEntries() {
    globalEntries = [];
    notifyListeners();
  }

  return { newEntries, newCount: newEntries.length, clearEntries };
}
