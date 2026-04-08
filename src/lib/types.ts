export type VenueType = "amc" | "other_theater" | "home";
export type MovieSource = "letterboxd_sync" | "manual";
export type MovieFormat =
  | "standard"
  | "imax"
  | "dolby_cinema"
  | "3d"
  | "prime"
  | "screenx";

export interface Movie {
  id: string;
  user_id: string;
  title: string;
  tmdb_id: number | null;
  watched_date: string;
  venue_type: VenueType;
  amc_location_id: string | null;
  format: MovieFormat | null;
  is_discount_day: boolean;
  ticket_value: number | null;
  letterboxd_rating: number | null;
  letterboxd_avg_rating: number | null;
  letterboxd_url: string | null;
  source: MovieSource;
  created_at: string;
  amc_location?: AmcLocation;
}

export interface AmcLocation {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface FormatPricing {
  id: string;
  user_id: string;
  format: MovieFormat;
  regular_price: number;
  discount_price: number;
}

export interface DiscountDay {
  id: string;
  user_id: string;
  day_of_week: number;
}

export interface Profile {
  id: string;
  email: string;
  letterboxd_username: string | null;
  membership_cost: number;
  created_at: string;
}

export interface LetterboxdEntry {
  title: string;
  watched_date: string;
  rating: number | null;
  letterboxd_url: string;
}

export type TimeRange =
  | "this_month"
  | "90_days"
  | "ytd"
  | "all_time"
  | { type: "month"; year: number; month: number }
  | { from: string; to: string };

export interface SavingsSummary {
  total_ticket_value: number;
  membership_cost: number;
  net_savings: number;
  movie_count: number;
  avg_rating: number | null;
  avg_ticket_value: number;
}
