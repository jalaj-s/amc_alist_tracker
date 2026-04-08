"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/hooks/use-settings";
import { useMovies } from "@/hooks/use-movies";
import { useAutoSync } from "@/hooks/use-auto-sync";
import { BottomSheet } from "@/components/bottom-sheet";
import { MovieTriageSheet } from "@/components/movie-triage-sheet";
import { MovieSearch } from "@/components/movie-search";
import type { LetterboxdEntry } from "@/lib/types";
import type { TmdbSearchResult } from "@/lib/tmdb";
import { Toast } from "@/components/toast";
import { parseLetterboxdCsv } from "@/lib/letterboxd-csv";

export function SyncContent() {
  const { profile, pricing, locations, addLocation } = useSettings();
  const { movies, addMovie, refetch } = useMovies({ from: "2000-01-01", to: "2099-12-31" });
  const { newEntries, hasNew, markSynced, doSync } = useAutoSync();
  const newCount = newEntries.length;

  // Mark as synced when user visits the sync page (clears the badge dot)
  useEffect(() => {
    if (hasNew) markSynced();
  }, [hasNew]);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<LetterboxdEntry | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualMovie, setManualMovie] = useState<{ title: string; tmdb_id?: number; watched_date: string } | null>(null);
  const [toast, setToast] = useState("");
  const [csvEntries, setCsvEntries] = useState<LetterboxdEntry[]>([]);

  async function handleManualSync() {
    setSyncing(true); setSyncError("");
    try {
      await refetch();
      await doSync();
      await markSynced();
    } catch { setSyncError("Failed to connect"); }
    finally { setSyncing(false); }
  }

  async function handleSaveEntry(data: Parameters<typeof addMovie>[0]) {
    await addMovie(data);
    await refetch();
    setToast(`Saved "${data.title}"`);
    setSelectedEntry(null); setManualMovie(null); setShowManual(false);
  }

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const entries = parseLetterboxdCsv(text);
      // Refresh movies list first so filtering is accurate
      await refetch();
      setCsvEntries(entries);
      setToast(`Found ${entries.length} entries in CSV`);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleTmdbSelect(movie: TmdbSearchResult) {
    setManualMovie({ title: movie.title, tmdb_id: movie.id, watched_date: new Date().toISOString().split("T")[0] });
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Sync</h1>
      <div className="space-y-2">
        <button onClick={handleManualSync} disabled={syncing || !profile?.letterboxd_username}
          className="w-full bg-card border border-gray-700 rounded-xl py-3 text-sm font-semibold disabled:opacity-50">
          {syncing ? "Syncing..." : "Refresh from Letterboxd"}
        </button>
        <p className="text-[10px] text-gray-600">Auto-syncs when you open the app. Tap to refresh manually.</p>
        {!profile?.letterboxd_username && (
          <p className="text-xs text-gray-500">Set your Letterboxd username in <a href="/settings" className="text-accent">Settings</a> first</p>
        )}
        {syncError && <p className="text-xs text-accent-red">{syncError}</p>}
      </div>
      {/* CSV import */}
      <label className="block w-full bg-card border border-gray-700 rounded-xl py-3 text-sm font-semibold text-center cursor-pointer">
        Import Letterboxd CSV
        <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
      </label>
      <p className="text-[10px] text-gray-600">For full history: Letterboxd → Settings → Import & Export → Export Your Data</p>

      {/* Combined entries from RSS + CSV, deduplicated */}
      {(() => {
        const loggedKeys = new Set(movies.map((m) => `${m.title.toLowerCase()}-${m.watched_date}`));
        // Merge and deduplicate RSS + CSV entries
        const allEntries = new Map<string, LetterboxdEntry>();
        for (const e of newEntries) allEntries.set(`${e.title.toLowerCase()}-${e.watched_date}`, e);
        for (const e of csvEntries) {
          const key = `${e.title.toLowerCase()}-${e.watched_date}`;
          if (!allEntries.has(key)) allEntries.set(key, e);
        }
        // Filter out already logged
        const unlogged = Array.from(allEntries.values())
          .filter((e) => !loggedKeys.has(`${e.title.toLowerCase()}-${e.watched_date}`))
          .sort((a, b) => b.watched_date.localeCompare(a.watched_date));

        if (unlogged.length === 0) {
          return <div className="text-center py-6 text-gray-500 text-sm">All caught up — no new movies to log</div>;
        }
        return (
          <div className="space-y-1.5">
            <div className="text-xs text-gray-500">{unlogged.length} movie{unlogged.length !== 1 ? "s" : ""} to log</div>
            {unlogged.map((entry) => (
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
        );
      })()}
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
