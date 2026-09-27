import { HOME_PAD } from "@/game/constants";
import { displayName } from "@/game/data/glossary";
import type { Action } from "@/game/runtime";
import type { HudState } from "@/game/store";
import { cn } from "@/lib/utils";

export function EngraveScreen({
  hud,
  onAction,
}: {
  hud: HudState;
  onAction: (a: Action) => void;
}) {
  const guns = hud.roster.filter((r) => r.placedPad && r.card.kind !== "socket");
  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-ink/80 p-3 sm:items-center sm:p-5">
      <div className="glass-panel flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-xl">
        <div className="shrink-0 border-b border-line p-5">
          <p className="text-[11px] font-medium tracking-[0.18em] text-ember">Loop {hud.loop} complete</p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-wide text-paper">Engrave a gun</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Pick one. That gun stays stronger in every new game. Then the warp lane shifts.
          </p>
        </div>
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
          {guns.map((r) => {
            const rank = hud.forge[r.card.templateId] ?? 0;
            return (
              <li key={r.uid}>
                <button
                  type="button"
                  onClick={() => onAction({ type: "engrave", uid: r.uid })}
                  className="flex w-full items-center justify-between gap-3 rounded-md border border-line bg-raised px-3 py-3 text-left hover:border-line-strong"
                >
                  <div>
                    <p className="font-display text-[16px] font-bold text-paper">{displayName(r.card)}</p>
                    <p className="text-[12px] text-muted">
                      Gun{r.placedPad === HOME_PAD ? " · home gun" : ""}
                      {rank ? ` · forge ${rank}` : " · unforged"}
                    </p>
                  </div>
                  <span className={cn("text-[12px] tracking-wide text-ember")}>Engrave</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
