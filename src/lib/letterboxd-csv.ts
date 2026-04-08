import type { LetterboxdEntry } from "./types";

/**
 * Parse Letterboxd diary.csv export.
 * Expected columns: Date, Name, Year, Letterboxd URI, Rating, Rewatch, Tags
 * First row is header.
 */
export function parseLetterboxdCsv(csv: string): LetterboxdEntry[] {
  const lines = csv.split("\n");
  if (lines.length < 2) return [];

  // Parse header to find column indices
  const header = parseCsvLine(lines[0]);
  const dateIdx = header.findIndex((h) => h.toLowerCase() === "date");
  const nameIdx = header.findIndex((h) => h.toLowerCase() === "name");
  const uriIdx = header.findIndex((h) => h.toLowerCase().includes("letterboxd uri"));
  const ratingIdx = header.findIndex((h) => h.toLowerCase() === "rating");

  if (dateIdx === -1 || nameIdx === -1) return [];

  const entries: LetterboxdEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = parseCsvLine(line);
    const watchedDate = cols[dateIdx]?.trim();
    const title = cols[nameIdx]?.trim();
    const uri = uriIdx !== -1 ? cols[uriIdx]?.trim() : "";
    const ratingStr = ratingIdx !== -1 ? cols[ratingIdx]?.trim() : "";

    if (!watchedDate || !title) continue;

    entries.push({
      title,
      watched_date: watchedDate,
      rating: ratingStr ? parseFloat(ratingStr) : null,
      letterboxd_url: uri || "",
    });
  }

  return entries;
}

/** Simple CSV line parser that handles quoted fields with commas */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
