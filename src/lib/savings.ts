import type { Movie, MovieFormat, FormatPricing, SavingsSummary } from "./types";

export function calculateTicketValue(
  format: MovieFormat | null,
  isDiscountDay: boolean,
  pricing: FormatPricing[],
  isMatinee: boolean = false
): number {
  if (!format) return 0;
  const formatPricing = pricing.find((p) => p.format === format);
  if (!formatPricing) return 0;
  if (isDiscountDay) return formatPricing.discount_price;
  if (isMatinee) return Math.round(formatPricing.regular_price * 0.8 * 100) / 100;
  return formatPricing.regular_price;
}

export function calculateSavings(movies: Movie[], membershipCost: number): SavingsSummary {
  const amcMovies = movies.filter((m) => m.venue_type === "amc");
  const totalTicketValue = amcMovies.reduce((sum, m) => sum + (m.ticket_value ?? 0), 0);
  const ratingsWithValues = amcMovies.map((m) => m.letterboxd_rating).filter((r): r is number => r !== null);
  const avgRating =
    ratingsWithValues.length > 0
      ? ratingsWithValues.reduce((a, b) => a + b, 0) / ratingsWithValues.length
      : null;
  const avgTicketValue = amcMovies.length > 0 ? totalTicketValue / amcMovies.length : 0;

  return {
    total_ticket_value: totalTicketValue,
    membership_cost: membershipCost,
    net_savings: totalTicketValue - membershipCost,
    movie_count: amcMovies.length,
    avg_rating: avgRating,
    avg_ticket_value: avgTicketValue,
  };
}

export function prorateMembershipCost(monthlyCost: number, fromDate: string, toDate: string): number {
  const from = new Date(fromDate + "T00:00:00");
  const to = new Date(toDate + "T00:00:00");
  let totalCost = 0;
  const current = new Date(from);

  while (current <= to) {
    const year = current.getFullYear();
    const month = current.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month, daysInMonth);
    const rangeStart = current > monthStart ? current : monthStart;
    const rangeEnd = to < monthEnd ? to : monthEnd;
    const daysInRange =
      Math.round((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    totalCost += (monthlyCost * daysInRange) / daysInMonth;
    current.setMonth(current.getMonth() + 1);
    current.setDate(1);
  }
  return totalCost;
}
