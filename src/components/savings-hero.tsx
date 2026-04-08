import type { SavingsSummary } from "@/lib/types";

export function SavingsHero({ summary }: { summary: SavingsSummary }) {
  const isPositive = summary.net_savings >= 0;

  return (
    <div className="bg-gradient-to-br from-card to-card-alt rounded-xl px-4 py-4">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-[9px] text-gray-500 uppercase tracking-wide">Net Saved</div>
          <div className={`text-3xl font-extrabold leading-tight ${isPositive ? "text-accent" : "text-accent-red"}`}>
            {isPositive ? "+" : ""}${summary.net_savings.toFixed(2)}
          </div>
        </div>
        <div className="text-right text-[10px] text-gray-500 leading-relaxed">
          <div><span className="text-gray-400">${summary.total_ticket_value.toFixed(2)}</span> ticket value</div>
          <div><span className="text-gray-400">${summary.membership_cost.toFixed(2)}</span> membership</div>
        </div>
      </div>
    </div>
  );
}
