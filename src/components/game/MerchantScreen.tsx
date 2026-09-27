import { CHARMS, GEM_META, GEM_ORDER, canAfford } from "@/game/data/charms";
import type { Action } from "@/game/runtime";
import type { HudState } from "@/game/store";
import type { GemId } from "@/game/types";
import { cn } from "@/lib/utils";

export function MerchantScreen({
  hud,
  onAction,
}: {
  hud: HudState;
  onAction: (a: Action) => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-ink/80 p-3 sm:items-center sm:p-4">
      <div className="glass-panel flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-xl">
        <div className="shrink-0 border-b border-line p-5">
          <p className="text-[11px] font-medium tracking-[0.18em] text-frost">Merchant docks</p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-wide text-paper">
            Trade gemstones
          </h2>
          <p className="mt-1 text-[13px] text-muted">
            Rare visitor. Charms last several rounds. Bosses drop gems; this stall spends them.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {GEM_ORDER.map((g) => (
              <GemChip key={g} id={g} n={hud.gems[g] ?? 0} />
            ))}
          </div>
          {hud.charms.length > 0 && (
            <p className="mt-3 text-[12px] text-steel">
              Armed: {hud.charms.map((c) => `${c.name} ${c.rounds}r`).join(" · ")}
            </p>
          )}
        </div>

        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-5">
          {CHARMS.map((c) => {
            const ok = canAfford(hud.gems, c.cost);
            const armed = hud.charms.find((a) => a.id === c.id);
            return (
              <li key={c.id} className="rounded-md border border-line bg-raised px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-[16px] font-bold text-paper">{c.name}</p>
                    <p className="mt-0.5 text-[12px] leading-snug text-muted">{c.blurb}</p>
                    <p className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] tracking-wide">
                      {GEM_ORDER.filter((g) => (c.cost[g] ?? 0) > 0).map((g) => (
                        <span key={g} className={GEM_META[g].tone}>
                          {c.cost[g]} {GEM_META[g].name}
                        </span>
                      ))}
                      {armed ? <span className="text-faint">+{c.rounds}r stacked</span> : null}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!ok}
                    onClick={() => onAction({ type: "buyCharm", id: c.id })}
                    className="h-10 shrink-0 rounded-md bg-ember px-3 text-[12px] font-medium text-ink disabled:opacity-40"
                  >
                    {ok ? "Trade" : "Need gems"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="shrink-0 border-t border-line p-4">
          <button
            type="button"
            onClick={() => onAction({ type: "leaveMerchant" })}
            className="h-11 w-full rounded-md bg-ember text-[14px] font-medium text-ink"
          >
            Leave stall · open draft
          </button>
        </div>
      </div>
    </div>
  );
}

function GemChip({ id, n }: { id: GemId; n: number }) {
  return (
    <span
      className={cn(
        "rounded-md border border-line bg-ink/60 px-2 py-1 tabular text-[12px] font-medium",
        n > 0 ? GEM_META[id].tone : "text-faint",
      )}
    >
      {n} {GEM_META[id].name}
    </span>
  );
}
