import { HOME_PAD } from "@/game/constants";
import { partFitScore, previewPartOnGun } from "@/game/data/cards";
import { displayName } from "@/game/data/glossary";
import type { Action } from "@/game/runtime";
import type { HudState } from "@/game/store";
import { cn } from "@/lib/utils";
import { CardView } from "./CardView";

export function FitBoard({
  hud,
  onAction,
}: {
  hud: HudState;
  onAction: (a: Action) => void;
}) {
  const part = hud.pendingPart;
  const guns = hud.roster
    .filter((r) => r.card.kind === "tower" || r.card.kind === "defender")
    .map((r) => ({
      item: r,
      fit: part ? partFitScore(r.card, part) : { score: 0, match: false, lines: [] as string[] },
      preview: part ? previewPartOnGun(r.card, part) : null,
    }))
    .sort((a, b) => b.fit.score - a.fit.score);
  const best = guns[0];

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/50 p-3 sm:p-5">
      <div className="glass-panel flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl p-4 sm:p-5">
        <p className="text-[11px] font-medium tracking-[0.18em] text-ember">Part</p>
        <h2 className="mt-0.5 font-display text-2xl font-bold tracking-wide text-paper sm:text-3xl">
          {part ? displayName(part) : "Part"}
        </h2>
        <p className="mt-1 text-[13px] text-muted">
          {part?.blurb ?? "Snaps onto one gun."} Numbers below are before → after. Recommended is marked.
        </p>
        {part && (
          <div className="mt-3 max-w-[11rem]">
            <CardView card={part} compact />
          </div>
        )}
        {best && (
          <button
            type="button"
            onClick={() => onAction({ type: "fit", uid: best.item.uid })}
            className="mt-4 h-11 w-full rounded-md bg-ember text-[14px] font-medium text-ink"
          >
            Fit to {displayName(best.item.card)}
          </button>
        )}
        <p className="mt-4 text-[11px] tracking-wide text-faint">Or pick another gun</p>
        <ul className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto">
          {guns.length === 0 && <li className="text-[13px] text-muted">No guns to fit yet.</li>}
          {guns.map(({ item: r, fit, preview }, i) => {
            const rec = i === 0;
            return (
              <li key={r.uid}>
                <button
                  type="button"
                  onClick={() => onAction({ type: "fit", uid: r.uid })}
                  className={cn(
                    "flex w-full items-start justify-between gap-3 rounded-md border bg-raised px-3 py-3 text-left hover:border-line-strong",
                    rec ? "border-ember" : fit.match ? "border-accent" : "border-line",
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-display text-[16px] font-bold text-paper">{displayName(r.card)}</p>
                    <p className="text-[12px] text-muted">
                      {r.card.kind === "defender" ? "Home" : "Gun"}
                      {r.placedPad === HOME_PAD ? " · home" : r.placedPad ? " · placed" : " · bench"}
                    </p>
                    {preview && (
                      <p className="mt-1 tabular text-[11px] leading-snug text-steel">
                        <span className="text-faint">{preview.before}</span>
                        <span className="mx-1 text-frost">→</span>
                        <span className="text-paper">{preview.after}</span>
                      </p>
                    )}
                    {fit.lines.length > 0 && (
                      <p className="mt-1 text-[12px] text-frost">{fit.lines.join(" · ")}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-[12px] font-medium tracking-wide text-ember">
                    {rec ? "Best" : fit.match ? "Same set" : "Fit"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
