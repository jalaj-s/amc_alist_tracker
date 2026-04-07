import type { LetterboxdEntry } from "./types";

export function parseLetterboxdRss(xml: string): LetterboxdEntry[] {
  const entries: LetterboxdEntry[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const filmTitle = extractTag(item, "letterboxd:filmTitle");
    const watchedDate = extractTag(item, "letterboxd:watchedDate");
    const ratingStr = extractTag(item, "letterboxd:memberRating");
    const link = extractTag(item, "link");

    if (!filmTitle || !watchedDate) continue;

    entries.push({
      title: filmTitle,
      watched_date: watchedDate,
      rating: ratingStr ? parseFloat(ratingStr) : null,
      letterboxd_url: link || "",
    });
  }
  return entries;
}

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`);
  const match = regex.exec(xml);
  return match ? match[1].trim() : null;
}

export function buildLetterboxdRssUrl(username: string): string {
  return `https://letterboxd.com/${username}/rss/`;
}
