import type { SavingsSummary } from "@/lib/types";

export function QuickStats({ summary }: { summary: SavingsSummary }) {
  return (
    <div className="flex gap-1.5">
      <div className="flex-1 bg-card rounded-lg p-2 text-center">
        <div className="text-lg font-bold">{summary.movie_count}</div>
        <div className="text-[9px] text-gray-500">Movies</div>
      </div>
      <div className="flex-1 bg-card rounded-lg p-2 text-center">
        <div className="text-lg font-bold">{summary.avg_rating !== null ? summary.avg_rating.toFixed(1) : "—"}</div>
        <div className="text-[9px] text-gray-500">Avg Rating</div>
      </div>
      <div className="flex-1 bg-card rounded-lg p-2 text-center">
        <div className="text-lg font-bold">{summary.avg_ticket_value > 0 ? `$${summary.avg_ticket_value.toFixed(2)}` : "—"}</div>
        <div className="text-[9px] text-gray-500">Avg Ticket</div>
      </div>
    </div>
  );
}
