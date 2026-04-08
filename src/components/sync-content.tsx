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

  useEffect(() => {
    if (hasNew) markSynced();
  }, [hasNew]);

  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<LetterboxdEntry | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualMovie, setManualMovie] = useState<{ title: string; tmdb_id?: number; watched_date: string } | null>(null);
  const [toast, setToast] = useState("");
  const [importing, setImporting] = useState(false);

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

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setImporting(true);
    const text = await file.text();
    const entries = parseLetterboxdCsv(text);

    // Get fresh movie list for dedup
    await refetch();
    const loggedKeys = new Set(movies.map((m) => `${m.title.toLowerCase()}-${m.watched_date}`));
    const newOnes = entries.filter((e) => !loggedKeys.has(`${e.title.toLowerCase()}-${e.watched_date}`));

    // Bulk save all new entries as untagged (home venue, no format)
    let saved = 0;
    for (const entry of newOnes) {
      await addMovie({
        title: entry.title,
        watched_date: entry.watched_date,
        venue_type: "home", // default — user can re-tag AMC ones later
        is_discount_day: false,
        letterboxd_rating: entry.rating ?? undefined,
        letterboxd_url: entry.letterboxd_url || undefined,
        source: "letterboxd_sync",
      });
      saved++;
    }

    await refetch();
    setImporting(false);
    setToast(`Imported ${saved} new movies (${entries.length - saved} already logged)`);
  }

  function handleTmdbSelect(movie: TmdbSearchResult) {
    setManualMovie({ title: movie.title, tmdb_id: movie.id, watched_date: new Date().toISOString().split("T")[0] });
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Sync</h1>

      {/* RSS sync for new movies */}
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

      {/* New entries from RSS to triage */}
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

      {newEntries.length === 0 && !importing && (
        <div className="text-center py-4 text-gray-500 text-sm">All caught up — no new movies to log</div>
      )}

      <div className="border-t border-gray-800" />

      {/* CSV bulk import */}
      <label className={`block w-full bg-card border border-gray-700 rounded-xl py-3 text-sm font-semibold text-center ${importing ? "opacity-50" : "cursor-pointer"}`}>
        {importing ? "Importing..." : "Import Letterboxd CSV"}
        <input type="file" accept=".csv" onChange={handleCsvImport} disabled={importing} className="hidden" />
      </label>
      <p className="text-[10px] text-gray-600">Bulk imports your full history. Letterboxd → Settings → Import & Export → Export Your Data. Skips duplicates. Movies saved as "Home" by default — edit AMC ones on the Home tab.</p>

      <div className="border-t border-gray-800" />

      {/* Manual entry */}
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
