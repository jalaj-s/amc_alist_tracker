"use client";

import { useState } from "react";
import { useSettings } from "@/hooks/use-settings";
import { useMovies } from "@/hooks/use-movies";
import { BottomSheet } from "@/components/bottom-sheet";
import { MovieTriageSheet } from "@/components/movie-triage-sheet";
import { MovieSearch } from "@/components/movie-search";
import type { LetterboxdEntry } from "@/lib/types";
import type { TmdbSearchResult } from "@/lib/tmdb";
import { Toast } from "@/components/toast";

export function SyncContent() {
  const { profile, pricing, locations, addLocation } = useSettings();
  const { movies, addMovie, checkDuplicate, refetch } = useMovies({ from: "2000-01-01", to: "2099-12-31" });
  const [entries, setEntries] = useState<LetterboxdEntry[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<LetterboxdEntry | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualMovie, setManualMovie] = useState<{ title: string; tmdb_id?: number; watched_date: string } | null>(null);
  const [toast, setToast] = useState("");

  // Build a set of already-logged movies for fast lookup
  const loggedMovieKeys = new Set(
    movies.map((m) => `${m.title.toLowerCase()}-${m.watched_date}`)
  );

  async function handleSync() {
    setSyncing(true); setSyncError("");
    try {
      // Refresh movies list first so we have latest data
      await refetch();
      const res = await fetch(`/api/letterboxd?username=${encodeURIComponent(profile!.letterboxd_username!)}`);
      if (!res.ok) { const data = await res.json(); setSyncError(data.error || "Sync failed"); return; }
      const data: LetterboxdEntry[] = await res.json();
      setEntries(data);
    } catch { setSyncError("Failed to connect"); }
    finally { setSyncing(false); }
  }

  async function handleSaveEntry(data: Parameters<typeof addMovie>[0]) {
    await addMovie(data);
    setToast(`Saved "${data.title}"`);
    setSelectedEntry(null); setManualMovie(null); setShowManual(false);
  }

  function handleTmdbSelect(movie: TmdbSearchResult) {
    setManualMovie({ title: movie.title, tmdb_id: movie.id, watched_date: new Date().toISOString().split("T")[0] });
  }

  // Filter out entries already in the database
  const newEntries = entries.filter(
    (e) => !loggedMovieKeys.has(`${e.title.toLowerCase()}-${e.watched_date}`)
  );

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Sync</h1>
      <div className="space-y-2">
        <button onClick={handleSync} disabled={syncing || !profile?.letterboxd_username}
          className="w-full bg-card border border-gray-700 rounded-xl py-3 text-sm font-semibold disabled:opacity-50">
          {syncing ? "Syncing..." : "Sync from Letterboxd"}
        </button>
        {!profile?.letterboxd_username && (
          <p className="text-xs text-gray-500">Set your Letterboxd username in <a href="/settings" className="text-accent">Settings</a> first</p>
        )}
        {syncError && <p className="text-xs text-accent-red">{syncError}</p>}
      </div>
      {entries.length > 0 && newEntries.length === 0 && (
        <div className="text-center py-6 text-gray-500 text-sm">All caught up — no new movies to log</div>
      )}
      {newEntries.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs text-gray-500">{newEntries.length} new movie{newEntries.length !== 1 ? "s" : ""} to log</div>
          {newEntries.map((entry) => (
            <button key={`${entry.title}-${entry.watched_date}`} onClick={() => setSelectedEntry(entry)}
              className="w-full bg-card rounded-lg px-3 py-2.5 flex items-center gap-3 border-2 border-gray-800 text-left">
              <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center text-sm">🎬</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate">{entry.title}</div>
                <div className="text-[10px] text-gray-500">{entry.watched_date}{entry.rating && <span className="text-accent-yellow"> · ★ {entry.rating}</span>}</div>
              </div>
              <span className="text-gray-600 text-sm">›</span>
            </button>
          ))}
        </div>
      )}
      <div className="border-t border-gray-800" />
      <button onClick={() => setShowManual(true)} className="w-full bg-card border border-gray-700 rounded-xl py-3 text-sm font-semibold">+ Add Manually</button>
      <BottomSheet open={!!selectedEntry} onClose={() => setSelectedEntry(null)}>
        {selectedEntry && <MovieTriageSheet entry={selectedEntry} pricing={pricing} locations={locations} onSave={handleSaveEntry} onAddLocation={addLocation} source="letterboxd_sync" />}
      </BottomSheet>
      <BottomSheet open={showManual} onClose={() => { setShowManual(false); setManualMovie(null); }}>
        <div className="space-y-4">
          {!manualMovie ? (
            <><div className="text-sm font-semibold text-center">Add a Movie</div><MovieSearch onSelect={handleTmdbSelect} /></>
          ) : (
            <>
              <div><div className="text-xs text-gray-500 font-semibold mb-2">When did you watch it?</div>
                <input type="date" value={manualMovie.watched_date} onChange={(e) => setManualMovie({ ...manualMovie, watched_date: e.target.value })}
                  className="w-full bg-card border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white" />
              </div>
              <MovieTriageSheet entry={{ title: manualMovie.title, watched_date: manualMovie.watched_date }}
                pricing={pricing} locations={locations} onSave={(data) => handleSaveEntry({ ...data, tmdb_id: manualMovie.tmdb_id })}
                onAddLocation={addLocation} source="manual" />
            </>
          )}
        </div>
      </BottomSheet>
      <Toast message={toast} visible={!!toast} onClose={() => setToast("")} />
    </div>
  );
}
