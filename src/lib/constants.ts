import type { MovieFormat } from "./types";

export const DEFAULT_MEMBERSHIP_COST = 25.99;

export const DEFAULT_PRICING: {
  format: MovieFormat;
  regular_price: number;
  discount_price: number;
}[] = [
  { format: "standard", regular_price: 15.99, discount_price: 8.0 },
  { format: "imax", regular_price: 22.99, discount_price: 11.5 },
  { format: "dolby_cinema", regular_price: 22.99, discount_price: 11.5 },
];

export const DEFAULT_DISCOUNT_DAYS = [2, 3];

export const FORMAT_LABELS: Record<MovieFormat, string> = {
  standard: "Standard",
  imax: "IMAX",
  dolby_cinema: "Dolby Cinema",
  "3d": "3D",
  prime: "Prime",
  screenx: "ScreenX",
};

export const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
