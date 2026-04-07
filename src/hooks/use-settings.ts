"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, FormatPricing, DiscountDay, AmcLocation } from "@/lib/types";

export function useSettings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pricing, setPricing] = useState<FormatPricing[]>([]);
  const [discountDays, setDiscountDays] = useState<DiscountDay[]>([]);
  const [locations, setLocations] = useState<AmcLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [profileRes, pricingRes, daysRes, locsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("format_pricing").select("*").eq("user_id", user.id),
      supabase.from("discount_days").select("*").eq("user_id", user.id),
      supabase.from("amc_locations").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setProfile(profileRes.data as Profile);
    setPricing((pricingRes.data as FormatPricing[]) || []);
    setDiscountDays((daysRes.data as DiscountDay[]) || []);
    setLocations((locsRes.data as AmcLocation[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function updateProfile(updates: Partial<Profile>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update(updates).eq("id", user.id);
    await fetchAll();
  }

  async function updatePricing(format: string, regularPrice: number, discountPrice: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("format_pricing").upsert(
      { user_id: user.id, format, regular_price: regularPrice, discount_price: discountPrice },
      { onConflict: "user_id,format" }
    );
    await fetchAll();
  }

  async function addLocation(name: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("amc_locations").insert({ user_id: user.id, name }).select().single();
    await fetchAll();
    return data as AmcLocation;
  }

  async function removeLocation(id: string) {
    await supabase.from("amc_locations").delete().eq("id", id);
    await fetchAll();
  }

  return { profile, pricing, discountDays, locations, loading, updateProfile, updatePricing, addLocation, removeLocation, refetch: fetchAll };
}
