import type { HudState } from "@/game/store";
import { fmtCount, fmtFlux, fmtQty } from "@/game/format";

export function EndScreen({
  hud,
  onRetry,
  onHangar,
  onTitle,
}: {
  hud: HudState;
  onRetry: () => void;
  onHangar: () => void;
  onTitle: () => void;
}) {
  const win = hud.phase === "victory";
  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-ink/80 p-4 sm:items-center">
      <div className="glass-panel w-full max-w-md rounded-xl p-6">
        <p className="text-[11px] font-medium tracking-[0.18em] text-ember">{win ? "Arena done" : "Home fell"}</p>
        <h2 className="mt-1 font-display text-3xl font-bold tracking-wide text-paper">
          {win ? "The lane is quiet" : "Run over"}
        </h2>
        <p className="mt-2 text-[14px] text-muted">
          {win
            ? `${hud.wavesCleared} waves. Home held.`
            : `${fmtCount(hud.wavesCleared)} waves. Draft again. Credit stays.`}
        </p>
        <div className="mt-5">
          <p className="text-[10px] font-medium tracking-[0.22em] text-epic">Credit</p>
          <p className="font-display text-5xl font-bold tabular leading-none text-paper">{fmtCount(hud.flux)}</p>
          {hud.fluxEarned > 0 && (
            <p className="mt-1 text-[12px] text-muted">+{fmtCount(hud.fluxEarned)} this run</p>
          )}
        </div>
        <dl className="mt-5 grid grid-cols-3 gap-2 text-[13px]">
          <EndStat label="Kills" value={fmtCount(hud.runKills)} />
          <EndStat label="Waves" value={fmtCount(hud.wavesCleared)} />
          <EndStat label="Shots" value={fmtCount(hud.shotsFired)} />
          <EndStat label="Upgrades" value={fmtCount(hud.upgradesMade)} />
          <EndStat label="Leaks" value={fmtCount(hud.runLeaks)} hot={hud.runLeaks > 0} />
          <EndStat label="Pay" value={hud.bonusPct ? `+${fmtQty(hud.bonusPct, "%")}` : "—"} />
          <EndStat label="Cover" value={fmtQty(hud.coverPct, "%")} />
          <EndStat label="Lives left" value={fmtCount(hud.lives)} />
          <EndStat label="Bonus" value={fmtCount(hud.runLevel)} />
        </dl>
        {(hud.mapName || hud.companionName || hud.environmentName) && (
          <p className="mt-4 text-[12px] text-steel">
            {[
              hud.mapName && `Map ${hud.mapName}`,
              hud.companionName && `Craft ${hud.companionName}`,
              hud.environmentName && `Weather ${hud.environmentName}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="h-11 w-full rounded-md bg-ember text-[14px] font-medium text-ink"
          >
            Play again
          </button>
          <button
            type="button"
            onClick={onTitle}
            className="card-bevel h-11 w-full rounded-md border border-line text-[14px] font-medium text-paper"
          >
            Title
          </button>
          <button
            type="button"
            onClick={onHangar}
            className="card-bevel h-11 w-full rounded-md border border-line text-[14px] font-medium text-paper"
          >
            Vault · {fmtFlux(hud.flux)}
          </button>
        </div>
      </div>
    </div>
  );
}

function EndStat({ label, value, hot }: { label: string; value: string; hot?: boolean }) {
  return (
    <div className="rounded-md border border-line bg-raised px-2.5 py-2">
      <dt className="text-[10px] tracking-wide text-faint">{label}</dt>
      <dd className={`tabular text-[16px] font-medium leading-none ${hot ? "text-ember" : "text-paper"}`}>
        {value}
      </dd>
    </div>
  );
}
