import type { SavingsSummary } from "@/lib/types";

export function SavingsHero({ summary }: { summary: SavingsSummary }) {
  return (
    <div className="text-center py-5 bg-gradient-to-br from-card to-card-alt rounded-xl">
      <div className="text-[10px] text-gray-500 uppercase tracking-widest">Total Saved</div>
      <div className="text-4xl font-extrabold text-accent mt-1">${summary.total_ticket_value.toFixed(2)}</div>
      <div className="text-xs text-gray-400 mt-1">
        {summary.movie_count} movie{summary.movie_count !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
