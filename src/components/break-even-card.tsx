import type { SavingsSummary } from "@/lib/types";

export function BreakEvenCard({ summary }: { summary: SavingsSummary }) {
  const isPositive = summary.net_savings >= 0;
  return (
    <div>
      <div className="flex gap-2.5 mb-3">
        <div className="flex-1 bg-card rounded-xl p-3 text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-wide">You Paid</div>
          <div className="text-2xl font-extrabold text-accent-red mt-1">${summary.membership_cost.toFixed(2)}</div>
          <div className="text-[9px] text-gray-600 mt-0.5">membership</div>
        </div>
        <div className="flex-1 bg-card rounded-xl p-3 text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-wide">Ticket Value</div>
          <div className="text-2xl font-extrabold text-accent mt-1">${summary.total_ticket_value.toFixed(2)}</div>
          <div className="text-[9px] text-gray-600 mt-0.5">{summary.movie_count} movie{summary.movie_count !== 1 ? "s" : ""}</div>
        </div>
      </div>
      <div className={`rounded-xl p-3 text-center border ${
        isPositive ? "bg-green-950/50 border-accent/25" : "bg-red-950/50 border-accent-red/25"
      }`}>
        <div className="flex items-center justify-center gap-2">
          <span className={`text-xs uppercase tracking-wide ${isPositive ? "text-green-300" : "text-red-300"}`}>Net Savings</span>
          <span className={`text-xl font-extrabold ${isPositive ? "text-accent" : "text-accent-red"}`}>
            {isPositive ? "+" : ""}${summary.net_savings.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
