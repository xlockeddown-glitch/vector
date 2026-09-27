import type { HudState } from "@/game/store";
import { fmtCount } from "@/game/format";
import { WIN_WAVES } from "@/game/constants";

export function LoopScreen({
  hud,
  onKeep,
  onTitle,
}: {
  hud: HudState;
  onKeep: () => void;
  onTitle: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-ink/80 p-4 sm:items-center">
      <div className="glass-panel w-full max-w-md rounded-xl p-6">
        <p className="text-[11px] font-medium tracking-[0.18em] text-frost">Home held</p>
        <h2 className="mt-1 font-display text-3xl font-bold tracking-wide text-paper">You held {WIN_WAVES}</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          {WIN_WAVES} waves. Home is still up. Keep flying for a high score, or return and draft a new defense.
        </p>
        <p className="mt-3 text-[13px] text-steel">
          {fmtCount(hud.wavesCleared)} waves · {fmtCount(hud.runKills)} kills · {fmtCount(hud.runLeaks)} leaks
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onKeep}
            className="h-11 w-full rounded-md bg-ember text-[14px] font-medium text-ink"
          >
            Keep flying
          </button>
          <button
            type="button"
            onClick={onTitle}
            className="card-bevel h-11 w-full rounded-md border border-line text-[14px] font-medium text-paper"
          >
            Return
          </button>
        </div>
      </div>
    </div>
  );
}
