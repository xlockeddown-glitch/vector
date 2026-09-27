import type { SetBonusLine, SetId } from "@/game/types";
import { SETS, SET_ORDER } from "@/game/data/sets";
import { cn } from "@/lib/utils";

const DOT: Record<SetId, string> = {
  heat: "bg-ember",
  cold: "bg-frost",
  spark: "bg-accent",
  iron: "bg-steel",
};

export function SetStrip({ lines }: { lines: SetBonusLine[] }) {
  if (lines.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {lines.map((l) => {
        const on = l.count >= 2;
        if (l.count <= 0) return null;
        return (
          <span
            key={l.id}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px]",
              on ? "border-line-strong text-paper" : "border-line text-faint",
            )}
          >
            <span className={cn("size-1.5 rounded-full", DOT[l.id])} />
            {l.name} {l.count}
            {l.text ? ` · ${l.text}` : ""}
          </span>
        );
      })}
    </div>
  );
}

export function SetLegend({ counts }: { counts: Record<SetId, number> }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
      {SET_ORDER.map((id) => {
        const s = SETS[id];
        const n = counts[id] ?? 0;
        const on = n >= 2;
        return (
          <div
            key={id}
            className={cn(
              "rounded-md border px-2 py-1.5",
              on ? "border-line-strong bg-raised" : "border-line bg-ink-2",
            )}
          >
            <p className="flex items-center gap-1.5 text-[12px] font-medium text-paper">
              <span className={cn("size-2 rounded-full", DOT[id])} />
              {s.name}
              {n > 0 ? <span className="tabular text-faint">{n}</span> : null}
            </p>
            {n > 0 ? (
              <p className="mt-0.5 text-[10px] text-muted">
                {n >= 3 ? `${s.two} · ${s.three}` : n >= 2 ? s.two : `Need 1 more for ${s.two}`}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
