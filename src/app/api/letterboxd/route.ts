import { buildLetterboxdRssUrl, parseLetterboxdRss } from "@/lib/letterboxd";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles").select("letterboxd_username").eq("id", user.id).single();
  if (!profile?.letterboxd_username) {
    return NextResponse.json({ error: "No Letterboxd username configured" }, { status: 400 });
  }
  const rssUrl = buildLetterboxdRssUrl(profile.letterboxd_username);
  const res = await fetch(rssUrl);
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch Letterboxd feed" }, { status: 502 });
  }
  const xml = await res.text();
  const entries = parseLetterboxdRss(xml);
  return NextResponse.json(entries);
}
