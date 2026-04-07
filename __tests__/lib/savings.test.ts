import {
  calculateTicketValue,
  calculateSavings,
  prorateMembershipCost,
} from "@/lib/savings";
import type { Movie, FormatPricing } from "@/lib/types";

const pricing: FormatPricing[] = [
  { id: "1", user_id: "u1", format: "standard", regular_price: 15.99, discount_price: 8.0 },
  { id: "2", user_id: "u1", format: "imax", regular_price: 22.99, discount_price: 11.5 },
  { id: "3", user_id: "u1", format: "dolby_cinema", regular_price: 22.99, discount_price: 11.5 },
];

describe("calculateTicketValue", () => {
  it("returns regular price for non-discount day", () => {
    expect(calculateTicketValue("imax", false, pricing)).toBe(22.99);
  });
  it("returns discount price for discount day", () => {
    expect(calculateTicketValue("imax", true, pricing)).toBe(11.5);
  });
  it("returns standard price for standard format", () => {
    expect(calculateTicketValue("standard", false, pricing)).toBe(15.99);
  });
  it("returns 0 if format not found in pricing", () => {
    expect(calculateTicketValue("3d", false, pricing)).toBe(0);
  });
  it("returns 0 for null format", () => {
    expect(calculateTicketValue(null, false, pricing)).toBe(0);
  });
});

describe("calculateSavings", () => {
  const makeMovie = (overrides: Partial<Movie>): Movie => ({
    id: "m1", user_id: "u1", title: "Test", tmdb_id: null,
    watched_date: "2026-04-01", venue_type: "amc", amc_location_id: null,
    format: "standard", is_discount_day: false, ticket_value: 15.99,
    letterboxd_rating: 4.0, letterboxd_avg_rating: 3.5, letterboxd_url: null,
    source: "manual", created_at: "2026-04-01T00:00:00Z", ...overrides,
  });

  it("calculates total ticket value from AMC movies only", () => {
    const movies = [
      makeMovie({ ticket_value: 15.99 }),
      makeMovie({ ticket_value: 22.99 }),
      makeMovie({ venue_type: "home", ticket_value: null }),
    ];
    const result = calculateSavings(movies, 25.99);
    expect(result.total_ticket_value).toBe(38.98);
  });
  it("calculates net savings as ticket value minus membership", () => {
    const movies = [makeMovie({ ticket_value: 15.99 }), makeMovie({ ticket_value: 22.99 })];
    const result = calculateSavings(movies, 25.99);
    expect(result.net_savings).toBeCloseTo(12.99, 2);
  });
  it("returns negative net savings when below break-even", () => {
    const movies = [makeMovie({ ticket_value: 15.99 })];
    const result = calculateSavings(movies, 25.99);
    expect(result.net_savings).toBeCloseTo(-10.0, 2);
  });
  it("counts only AMC movies", () => {
    const movies = [
      makeMovie({ venue_type: "amc" }),
      makeMovie({ venue_type: "home" }),
      makeMovie({ venue_type: "other_theater" }),
    ];
    const result = calculateSavings(movies, 25.99);
    expect(result.movie_count).toBe(1);
  });
  it("calculates average rating from AMC movies with ratings", () => {
    const movies = [
      makeMovie({ letterboxd_rating: 4.0 }),
      makeMovie({ letterboxd_rating: 5.0 }),
      makeMovie({ letterboxd_rating: null }),
    ];
    const result = calculateSavings(movies, 25.99);
    expect(result.avg_rating).toBe(4.5);
  });
  it("returns null avg_rating when no movies have ratings", () => {
    const movies = [makeMovie({ letterboxd_rating: null })];
    const result = calculateSavings(movies, 25.99);
    expect(result.avg_rating).toBeNull();
  });
  it("calculates average ticket value", () => {
    const movies = [makeMovie({ ticket_value: 15.99 }), makeMovie({ ticket_value: 22.99 })];
    const result = calculateSavings(movies, 25.99);
    expect(result.avg_ticket_value).toBeCloseTo(19.49, 2);
  });
  it("handles empty movie list", () => {
    const result = calculateSavings([], 25.99);
    expect(result.total_ticket_value).toBe(0);
    expect(result.net_savings).toBe(-25.99);
    expect(result.movie_count).toBe(0);
    expect(result.avg_rating).toBeNull();
    expect(result.avg_ticket_value).toBe(0);
  });
});

describe("prorateMembershipCost", () => {
  it("returns full cost for a complete month", () => {
    expect(prorateMembershipCost(25.99, "2026-04-01", "2026-04-30")).toBeCloseTo(25.99, 2);
  });
  it("prorates for partial month (15 of 30 days)", () => {
    expect(prorateMembershipCost(25.99, "2026-04-01", "2026-04-15")).toBeCloseTo(12.995, 1);
  });
  it("handles multi-month ranges", () => {
    expect(prorateMembershipCost(25.99, "2026-01-01", "2026-03-31")).toBeCloseTo(77.97, 2);
  });
});
