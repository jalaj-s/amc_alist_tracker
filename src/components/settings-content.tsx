"use client";

import { useState } from "react";
import { useSettings } from "@/hooks/use-settings";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import { FORMAT_LABELS, DAY_LABELS } from "@/lib/constants";

export function SettingsContent() {
  const { profile, pricing, discountDays, locations, loading, updateProfile, updatePricing, addLocation, removeLocation } = useSettings();
  const router = useRouter();
  const [letterboxdUsername, setLetterboxdUsername] = useState("");
  const [membershipCost, setMembershipCost] = useState("");
  const [newLocationName, setNewLocationName] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (profile && !initialized) {
    setLetterboxdUsername(profile.letterboxd_username || "");
    setMembershipCost(profile.membership_cost.toString());
    setInitialized(true);
  }

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  if (loading) return <div className="p-4 text-center text-gray-600 text-sm pt-12">Loading...</div>;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">Settings</h1>

      <section>
        <label className="text-xs text-gray-500 font-semibold block mb-1.5">Letterboxd Username</label>
        <div className="flex gap-2">
          <input value={letterboxdUsername} onChange={(e) => setLetterboxdUsername(e.target.value)} placeholder="your-username"
            className="flex-1 bg-card border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600" />
          <button onClick={() => updateProfile({ letterboxd_username: letterboxdUsername || null })}
            className="bg-accent text-black px-4 py-2 rounded-lg text-sm font-semibold">Save</button>
        </div>
      </section>

      <section>
        <label className="text-xs text-gray-500 font-semibold block mb-1.5">Monthly Membership Cost</label>
        <div className="flex gap-2">
          <div className="flex items-center bg-card border border-gray-700 rounded-lg px-3 flex-1">
            <span className="text-gray-500 mr-1">$</span>
            <input type="number" step="0.01" value={membershipCost} onChange={(e) => setMembershipCost(e.target.value)}
              className="bg-transparent py-2 text-sm text-white flex-1 focus:outline-none" />
          </div>
          <button onClick={() => updateProfile({ membership_cost: parseFloat(membershipCost) || 25.99 })}
            className="bg-accent text-black px-4 py-2 rounded-lg text-sm font-semibold">Save</button>
        </div>
      </section>

      <section>
        <div className="text-xs text-gray-500 font-semibold mb-1.5">Format Pricing</div>
        <div className="space-y-2">
          {pricing.map((p) => (
            <div key={p.id} className="bg-card rounded-lg p-3">
              <div className="text-xs font-semibold mb-2">{FORMAT_LABELS[p.format]}</div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="text-[9px] text-gray-500 mb-0.5">Regular</div>
                  <input type="number" step="0.01" defaultValue={p.regular_price}
                    onBlur={(e) => updatePricing(p.format, parseFloat(e.target.value), p.discount_price)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-[9px] text-gray-500 mb-0.5">Discount</div>
                  <input type="number" step="0.01" defaultValue={p.discount_price}
                    onBlur={(e) => updatePricing(p.format, p.regular_price, parseFloat(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="text-xs text-gray-500 font-semibold mb-1.5">AMC Locations</div>
        <div className="space-y-1.5 mb-2">
          {locations.map((loc) => (
            <div key={loc.id} className="bg-card rounded-lg px-3 py-2 flex justify-between items-center">
              <span className="text-sm">{loc.name}</span>
              <button onClick={() => removeLocation(loc.id)} className="text-gray-600 text-xs hover:text-accent-red">Remove</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newLocationName} onChange={(e) => setNewLocationName(e.target.value)} placeholder="e.g. AMC Boston Common"
            className="flex-1 bg-card border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600" />
          <button onClick={async () => { if (newLocationName.trim()) { await addLocation(newLocationName.trim()); setNewLocationName(""); } }}
            className="bg-accent text-black px-4 py-2 rounded-lg text-sm font-semibold">Add</button>
        </div>
      </section>

      <section>
        <div className="text-xs text-gray-500 font-semibold mb-1.5">Discount Days</div>
        <div className="text-xs text-gray-400">{discountDays.map((d) => DAY_LABELS[d.day_of_week]).join(", ") || "None set"}</div>
      </section>

      <button onClick={handleLogout} className="w-full bg-card border border-gray-700 rounded-xl py-3 text-sm text-accent-red font-semibold">Log Out</button>
    </div>
  );
}
