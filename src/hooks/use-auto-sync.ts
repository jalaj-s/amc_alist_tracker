"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { useSettings } from "@/hooks/use-settings";
import { useMovies } from "@/hooks/use-movies";
import type { LetterboxdEntry } from "@/lib/types";

let globalEntries: LetterboxdEntry[] = [];
let globalListeners: Set<() => void> = new Set();

function notifyListeners() {
  globalListeners.forEach((fn) => fn());
}

export function useAutoSync() {
  const { user } = useAuth();
  const { profile, updateProfile } = useSettings();
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
      // silent fail
    }
  }, [profile?.letterboxd_username]);

  useEffect(() => {
    if (user && profile?.letterboxd_username && !hasSynced.current) {
      hasSynced.current = true;
      doSync();
    }
  }, [user, profile?.letterboxd_username, doSync]);

  // Filter to entries not yet in DB
  const newEntries = globalEntries.filter(
    (e) => !loggedKeys.has(`${e.title.toLowerCase()}-${e.watched_date}`)
  );

  // Only show badge for entries newer than last sync date
  const lastSyncDate = profile?.last_sync_date || null;
  const hasNew = lastSyncDate
    ? newEntries.some((e) => e.watched_date > lastSyncDate)
    : newEntries.length > 0;

  async function markSynced() {
    const today = new Date().toISOString().split("T")[0];
    await updateProfile({ last_sync_date: today });
  }

  return { newEntries, hasNew, markSynced, doSync };
}
