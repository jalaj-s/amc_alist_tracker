"use client";

import { useState } from "react";
import type { VenueType, MovieFormat, AmcLocation, FormatPricing, LetterboxdEntry } from "@/lib/types";
import { FORMAT_LABELS } from "@/lib/constants";
import { calculateTicketValue } from "@/lib/savings";

interface MovieTriageSheetProps {
  entry: LetterboxdEntry | { title: string; watched_date: string };
  pricing: FormatPricing[];
  locations: AmcLocation[];
  onSave: (data: {
    title: string; watched_date: string; venue_type: VenueType;
    format?: MovieFormat; amc_location_id?: string; is_discount_day: boolean;
    ticket_value?: number; letterboxd_rating?: number; letterboxd_url?: string;
    source: "letterboxd_sync" | "manual";
  }) => void;
  onAddLocation: (name: string) => Promise<AmcLocation | undefined>;
  source: "letterboxd_sync" | "manual";
}

export function MovieTriageSheet({ entry, pricing, locations, onSave, onAddLocation, source }: MovieTriageSheetProps) {
  const [venueType, setVenueType] = useState<VenueType | null>(null);
  const [format, setFormat] = useState<MovieFormat | null>(null);
  const [locationId, setLocationId] = useState("");
  const [isDiscountDay, setIsDiscountDay] = useState(false);
  const [isMatinee, setIsMatinee] = useState(false);
  const [manualRating, setManualRating] = useState<string>("");
  const [newLocationName, setNewLocationName] = useState("");
  const [showNewLocation, setShowNewLocation] = useState(false);

  const lbEntry = "rating" in entry ? (entry as LetterboxdEntry) : null;
  const watchedDay = new Date(entry.watched_date + "T12:00:00").getDay();
  const suggestDiscount = watchedDay === 2 || watchedDay === 3;
  const availableFormats = pricing.map((p) => p.format);

  async function handleSave() {
    if (!venueType) return;
    const rating = lbEntry?.rating ?? (manualRating ? parseFloat(manualRating) : undefined);

    if (venueType !== "amc") {
      onSave({
        title: entry.title, watched_date: entry.watched_date, venue_type: venueType,
        is_discount_day: false, letterboxd_rating: rating,
        letterboxd_url: lbEntry?.letterboxd_url, source,
      });
      return;
    }
    const ticketValue = format ? calculateTicketValue(format, isDiscountDay, pricing, isMatinee) : undefined;
    onSave({
      title: entry.title, watched_date: entry.watched_date, venue_type: "amc",
      format: format ?? undefined, amc_location_id: locationId || undefined,
      is_discount_day: isDiscountDay, ticket_value: ticketValue,
      letterboxd_rating: rating, letterboxd_url: lbEntry?.letterboxd_url, source,
    });
  }

  async function handleAddLocation() {
    if (!newLocationName.trim()) return;
    const loc = await onAddLocation(newLocationName.trim());
    if (loc) { setLocationId(loc.id); setShowNewLocation(false); setNewLocationName(""); }
  }

  return (
    <div>
      <div className="text-center mb-4">
        <div className="text-base font-bold">{entry.title}</div>
        <div className="text-xs text-gray-500">
          {entry.watched_date}
          {lbEntry?.rating && <span className="text-accent-yellow"> · ★ {lbEntry.rating}</span>}
        </div>
      </div>

      {/* Rating input for manual entries (Letterboxd entries already have one) */}
      {!lbEntry && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 font-semibold mb-2">Your Rating</div>
          <div className="flex items-center gap-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => {
                const currentRating = parseFloat(manualRating || "0");
                const isFull = currentRating >= star;
                const isHalf = !isFull && currentRating >= star - 0.5;
                return (
                  <div key={star} className="relative w-10 h-10 cursor-pointer flex">
                    {/* Left half — sets half star */}
                    <button
                      onClick={() => {
                        const halfVal = star - 0.5;
                        setManualRating(currentRating === halfVal ? "" : String(halfVal));
                      }}
                      className="absolute left-0 top-0 w-1/2 h-full z-10"
                    />
                    {/* Right half — sets full star */}
                    <button
                      onClick={() => {
                        setManualRating(currentRating === star ? "" : String(star));
                      }}
                      className="absolute right-0 top-0 w-1/2 h-full z-10"
                    />
                    {/* Star visual */}
                    <svg viewBox="0 0 24 24" className="w-10 h-10">
                      <defs>
                        <clipPath id={`half-${star}`}>
                          <rect x="0" y="0" width="12" height="24" />
                        </clipPath>
                      </defs>
                      {/* Empty star background */}
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                        fill="none" stroke="#555" strokeWidth="1.5" />
                      {/* Full star */}
                      {isFull && (
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                          fill="#fbbf24" />
                      )}
                      {/* Half star */}
                      {isHalf && (
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                          fill="#fbbf24" clipPath={`url(#half-${star})`} />
                      )}
                    </svg>
                  </div>
                );
              })}
            </div>
            {manualRating && (
              <span className="text-accent-yellow text-sm font-semibold ml-2">{manualRating}</span>
            )}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 font-semibold mb-2">Where did you see this?</div>
      <div className="flex gap-2 mb-4">
        {([
          { value: "amc" as const, label: "AMC Theater", icon: "🎬" },
          { value: "other_theater" as const, label: "Other Theater", icon: "🎥" },
          { value: "home" as const, label: "Home", icon: "🏠" },
        ]).map((opt) => (
          <button key={opt.value} onClick={() => setVenueType(opt.value)}
            className={`flex-1 rounded-xl p-3 text-center border-2 transition-colors ${
              venueType === opt.value ? "border-accent bg-accent/10" : "border-gray-700 bg-card"
            }`}>
            <div className="text-lg mb-0.5">{opt.icon}</div>
            <div className={`text-[11px] ${venueType === opt.value ? "text-accent font-semibold" : "text-gray-500"}`}>{opt.label}</div>
          </button>
        ))}
      </div>

      {venueType === "amc" && (
        <>
          <div className="text-xs text-gray-500 font-semibold mb-2">Format</div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {availableFormats.map((f) => (
              <button key={f} onClick={() => setFormat(f)}
                className={`rounded-lg px-3.5 py-2 text-xs border transition-colors ${
                  format === f ? "border-accent bg-accent/10 text-accent font-semibold" : "border-gray-700 bg-card text-gray-400"
                }`}>
                {FORMAT_LABELS[f]}
              </button>
            ))}
          </div>

          <div className="text-xs text-gray-500 font-semibold mb-2">Location</div>
          {locations.length > 0 && !showNewLocation && (
            <select value={locationId} onChange={(e) => setLocationId(e.target.value)}
              className="w-full bg-card border border-gray-700 rounded-xl px-3 py-2.5 text-xs text-white mb-2">
              <option value="">Select location</option>
              {locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
            </select>
          )}
          {showNewLocation ? (
            <div className="flex gap-2 mb-4">
              <input value={newLocationName} onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="e.g. AMC Boston Common"
                className="flex-1 bg-card border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600" />
              <button onClick={handleAddLocation} className="bg-accent text-black px-3 py-2 rounded-lg text-xs font-semibold">Add</button>
              <button onClick={() => setShowNewLocation(false)} className="text-gray-500 text-xs px-2">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setShowNewLocation(true)} className="text-accent text-xs mb-4">+ Add new location</button>
          )}

          <div className="text-xs text-gray-500 font-semibold mb-2">Pricing</div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-xs text-gray-400">Discount day (Tue/Wed)</div>
              <div className="text-[9px] text-gray-600">
                50% off
                {suggestDiscount && " · This was a " + ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][watchedDay]}
              </div>
            </div>
            <button onClick={() => { setIsDiscountDay(!isDiscountDay); if (!isDiscountDay) setIsMatinee(false); }}
              className={`w-10 h-6 rounded-full transition-colors relative ${isDiscountDay ? "bg-accent" : "bg-gray-700"}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isDiscountDay ? "left-5" : "left-1"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-gray-400">Matinee</div>
              <div className="text-[9px] text-gray-600">20% off afternoon showing</div>
            </div>
            <button onClick={() => { setIsMatinee(!isMatinee); if (!isMatinee) setIsDiscountDay(false); }}
              className={`w-10 h-6 rounded-full transition-colors relative ${isMatinee ? "bg-accent" : "bg-gray-700"}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isMatinee ? "left-5" : "left-1"}`} />
            </button>
          </div>
        </>
      )}

      {venueType && (
        <button onClick={handleSave} className="w-full bg-accent text-black font-bold py-3 rounded-xl text-sm">Save</button>
      )}
    </div>
  );
}
