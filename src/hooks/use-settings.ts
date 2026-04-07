"use client";

import { useEffect, useState, useCallback } from "react";
import { doc, getDoc, updateDoc, collection, getDocs, addDoc, deleteDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/auth-context";
import type { Profile, FormatPricing, DiscountDay, AmcLocation } from "@/lib/types";

export function useSettings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pricing, setPricing] = useState<FormatPricing[]>([]);
  const [discountDays, setDiscountDays] = useState<DiscountDay[]>([]);
  const [locations, setLocations] = useState<AmcLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const profileRef = doc(db, "profiles", user.uid);
    const profileSnap = await getDoc(profileRef);
    if (profileSnap.exists()) {
      setProfile({ id: user.uid, ...profileSnap.data() } as Profile);
    }

    const pricingSnap = await getDocs(collection(db, "profiles", user.uid, "format_pricing"));
    setPricing(pricingSnap.docs.map((d) => ({ id: d.id, user_id: user.uid, ...d.data() } as FormatPricing)));

    const daysSnap = await getDocs(collection(db, "profiles", user.uid, "discount_days"));
    setDiscountDays(daysSnap.docs.map((d) => ({ id: d.id, user_id: user.uid, ...d.data() } as DiscountDay)));

    const locsSnap = await getDocs(collection(db, "profiles", user.uid, "amc_locations"));
    const locs = locsSnap.docs.map((d) => ({ id: d.id, user_id: user.uid, ...d.data() } as AmcLocation));
    locs.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    setLocations(locs);

    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function updateProfile(updates: Partial<Profile>) {
    if (!user) return;
    const profileRef = doc(db, "profiles", user.uid);
    await updateDoc(profileRef, updates);
    await fetchAll();
  }

  async function updatePricing(format: string, regularPrice: number, discountPrice: number) {
    if (!user) return;
    const pricingRef = collection(db, "profiles", user.uid, "format_pricing");
    const q = query(pricingRef, where("format", "==", format));
    const snap = await getDocs(q);

    if (snap.empty) {
      await addDoc(pricingRef, { format, regular_price: regularPrice, discount_price: discountPrice });
    } else {
      await updateDoc(snap.docs[0].ref, { regular_price: regularPrice, discount_price: discountPrice });
    }
    await fetchAll();
  }

  async function addLocation(name: string) {
    if (!user) return;
    const locsRef = collection(db, "profiles", user.uid, "amc_locations");
    const docRef = await addDoc(locsRef, { name, created_at: new Date().toISOString() });
    await fetchAll();
    return { id: docRef.id, user_id: user.uid, name, created_at: new Date().toISOString() } as AmcLocation;
  }

  async function removeLocation(id: string) {
    if (!user) return;
    await deleteDoc(doc(db, "profiles", user.uid, "amc_locations", id));
    await fetchAll();
  }

  return { profile, pricing, discountDays, locations, loading, updateProfile, updatePricing, addLocation, removeLocation, refetch: fetchAll };
}
