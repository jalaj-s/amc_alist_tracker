import { parseLetterboxdRss } from "@/lib/letterboxd";

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:letterboxd="https://letterboxd.com">
  <channel>
    <title>Letterboxd - jalaj</title>
    <item>
      <title>Mission Impossible 8, 2026 - ★★★★½</title>
      <letterboxd:watchedDate>2026-04-04</letterboxd:watchedDate>
      <letterboxd:memberRating>4.5</letterboxd:memberRating>
      <link>https://letterboxd.com/jalaj/film/mission-impossible-8/</link>
      <letterboxd:filmTitle>Mission Impossible 8</letterboxd:filmTitle>
    </item>
    <item>
      <title>Dune: Part Three, 2026 - ★★★★★</title>
      <letterboxd:watchedDate>2026-04-01</letterboxd:watchedDate>
      <letterboxd:memberRating>5.0</letterboxd:memberRating>
      <link>https://letterboxd.com/jalaj/film/dune-part-three/</link>
      <letterboxd:filmTitle>Dune: Part Three</letterboxd:filmTitle>
    </item>
    <item>
      <title>Past Lives, 2023</title>
      <letterboxd:watchedDate>2026-03-30</letterboxd:watchedDate>
      <link>https://letterboxd.com/jalaj/film/past-lives/</link>
      <letterboxd:filmTitle>Past Lives</letterboxd:filmTitle>
    </item>
  </channel>
</rss>`;

describe("parseLetterboxdRss", () => {
  it("parses all entries from RSS feed", () => {
    const entries = parseLetterboxdRss(SAMPLE_RSS);
    expect(entries).toHaveLength(3);
  });
  it("extracts movie title from filmTitle tag", () => {
    const entries = parseLetterboxdRss(SAMPLE_RSS);
    expect(entries[0].title).toBe("Mission Impossible 8");
  });
  it("extracts watched date", () => {
    const entries = parseLetterboxdRss(SAMPLE_RSS);
    expect(entries[0].watched_date).toBe("2026-04-04");
  });
  it("extracts rating when present", () => {
    const entries = parseLetterboxdRss(SAMPLE_RSS);
    expect(entries[0].rating).toBe(4.5);
  });
  it("returns null rating when not present", () => {
    const entries = parseLetterboxdRss(SAMPLE_RSS);
    expect(entries[2].rating).toBeNull();
  });
  it("extracts letterboxd URL", () => {
    const entries = parseLetterboxdRss(SAMPLE_RSS);
    expect(entries[1].letterboxd_url).toBe("https://letterboxd.com/jalaj/film/dune-part-three/");
  });
  it("returns empty array for empty feed", () => {
    const empty = `<?xml version="1.0"?><rss><channel></channel></rss>`;
    expect(parseLetterboxdRss(empty)).toEqual([]);
  });
});
