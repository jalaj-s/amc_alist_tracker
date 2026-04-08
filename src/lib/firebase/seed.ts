import { doc, getDoc, setDoc, collection, addDoc } from "firebase/firestore";
import { db } from "./config";

export async function ensureUserProfile(userId: string, email: string) {
  const profileRef = doc(db, "profiles", userId);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    // Create profile
    await setDoc(profileRef, {
      email,
      letterboxd_username: null,
      membership_cost: 25.99,
      membership_start_date: null,
      created_at: new Date().toISOString(),
    });

    // Seed default pricing
    const pricingRef = collection(db, "profiles", userId, "format_pricing");
    await Promise.all([
      addDoc(pricingRef, { format: "standard", regular_price: 15.99, discount_price: 8.0 }),
      addDoc(pricingRef, { format: "imax", regular_price: 22.99, discount_price: 11.5 }),
      addDoc(pricingRef, { format: "dolby_cinema", regular_price: 22.99, discount_price: 11.5 }),
    ]);

    // Seed default discount days
    const daysRef = collection(db, "profiles", userId, "discount_days");
    await Promise.all([
      addDoc(daysRef, { day_of_week: 2 }),
      addDoc(daysRef, { day_of_week: 3 }),
    ]);
  }
}
