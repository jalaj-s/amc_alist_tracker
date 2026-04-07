import { buildLetterboxdRssUrl, parseLetterboxdRss } from "@/lib/letterboxd";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "No Letterboxd username provided" }, { status: 400 });
  }

  const rssUrl = buildLetterboxdRssUrl(username);
  const res = await fetch(rssUrl);

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch Letterboxd feed" }, { status: 502 });
  }

  const xml = await res.text();
  const entries = parseLetterboxdRss(xml);
  return NextResponse.json(entries);
}
