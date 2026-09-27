import { abilityOf } from "@/game/data/cards";
import { displayName, KIND_LABEL } from "@/game/data/glossary";
import type { Action } from "@/game/runtime";
import type { HudState } from "@/game/store";
import { fmtQty } from "@/game/format";
import { cn } from "@/lib/utils";

export function LiveDraft({
  hud,
  onAction,
}: {
  hud: HudState;
  onAction: (a: Action) => void;
}) {
  const live = hud.live;
  if (!live || (hud.phase !== "combat" && hud.phase !== "placement")) return null;
  const pct = live.ttl > 0 ? Math.max(0, Math.min(1, live.left / live.ttl)) : 0;
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
      <div className="mx-auto max-w-5xl px-3">
        <div className="glass-panel rounded-xl px-3 pb-2 pt-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium tracking-[0.18em] text-ember">
              {live.title} · pick 1 of {live.cards.length}
            </p>
            <div className="flex items-center gap-2">
              <p className="tabular text-[12px] text-frost">{fmtQty(live.left, "s", 1)}</p>
              <button
                type="button"
                onClick={() => onAction({ type: "liveSkip" })}
                className="h-8 rounded-md border border-line px-2.5 text-[11px] text-paper"
              >
                Skip
              </button>
            </div>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-raised">
            <div className="h-full bg-ember" style={{ width: `${pct * 100}%` }} />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 pb-1">
            {live.cards.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onAction({ type: "livePick", id: c.id })}
                className="flex min-h-20 flex-col rounded-lg border border-line bg-ink/50 px-2.5 py-2 text-left hover:border-line-strong"
              >
                <p className={cn("text-[10px] tracking-wide", c.kind === "companion" ? "text-frost" : "text-faint")}>
                  {KIND_LABEL[c.kind]}
                </p>
                <p className="font-display text-[16px] font-bold leading-tight text-paper">{displayName(c)}</p>
                <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-muted">{abilityOf(c)}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
