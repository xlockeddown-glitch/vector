import { OPERATORS, SETS } from "@/game/data/sets";
import type { OpId, SetId } from "@/game/types";
import { cn } from "@/lib/utils";

const TONE: Record<OpId, { border: string; glyph: string; bar: string }> = {
  mul: { border: "border-ember/70 hover:border-ember", glyph: "text-ember", bar: "bg-ember" },
  add: { border: "border-frost/70 hover:border-frost", glyph: "text-frost", bar: "bg-frost" },
  raise: { border: "border-accent/70 hover:border-accent", glyph: "text-accent", bar: "bg-accent" },
  take: { border: "border-steel/70 hover:border-steel", glyph: "text-steel", bar: "bg-steel" },
};

export function ColorPick({
  cost,
  disabled,
  onPick,
  compact,
  matchSet,
}: {
  cost: number;
  disabled: boolean;
  onPick: (id: OpId) => void;
  compact?: boolean;
  matchSet?: SetId | null;
}) {
  return (
    <div>
      <p className="text-[11px] tracking-wide text-faint">
        Pick a mode · {cost} Credit
      </p>
      <p className="mt-1 text-[11px] leading-snug text-muted">
        This paints the gun. Same color guns make a combo.
      </p>
      <div className={cn("mt-2 grid gap-2", compact ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2")}>
        {(Object.values(OPERATORS) as (typeof OPERATORS)[OpId][]).map((m) => {
          const fits = !!matchSet && m.match === matchSet;
          return (
            <button
              key={m.id}
              type="button"
              disabled={disabled}
              onClick={() => onPick(m.id)}
              className={cn(
                "card-bevel relative flex min-h-16 flex-col items-start overflow-hidden rounded-md border bg-raised px-2.5 py-2 pl-3.5 text-left disabled:opacity-40",
                TONE[m.id].border,
                fits && "ring-1 ring-paper/35",
              )}
            >
              <span className={cn("absolute inset-y-0 left-0 w-1.5", TONE[m.id].bar)} />
              <span className="flex items-end gap-2">
                <span className={cn("op-glyph text-[22px] leading-none", TONE[m.id].glyph)}>{m.glyph}</span>
                <span className="pb-0.5 text-[13px] font-medium text-paper">{m.name}</span>
              </span>
              <span className="mt-0.5 text-[11px] leading-snug text-muted">{m.blurb}</span>
              {fits && (
                <span className="mt-1 text-[10px] tracking-wide text-paper">
                  Fits {SETS[m.match].name} · +8% dmg
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
