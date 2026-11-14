import type { HudState } from "@/game/store";
import { fmtCount, fmtFlux, fmtQty } from "@/game/format";
import { loadMeta } from "@/game/persist";
import { SEASON } from "@/game/data/pass";

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
    <div className="neon-scrim absolute inset-0 z-30 flex justify-center overflow-y-auto p-3 sm:p-4">
      <div className={`neon-panel ${win ? "" : "neon-panel-foe"} mt-auto h-fit w-full max-w-md p-5 sm:mb-auto sm:p-6`}>
        <p className={`neon-kicker ${win ? "" : "neon-kicker-foe"}`}>{win ? "Arena done" : "Home fell"}</p>
        <h2 className="mt-1 font-display text-3xl font-bold tracking-wide text-paper">
          {win ? "The lane is quiet" : "Run over"}
        </h2>
        <p className="mt-2 text-[14px] text-steel">
          {win
            ? `${hud.wavesCleared} waves. Home held.`
            : `${fmtCount(hud.wavesCleared)} waves. Draft again. Credit stays.`}
        </p>
        <div className="mt-5">
          <p className="neon-kicker neon-kicker-gold">Credit</p>
          <p className="num-glow-gold mt-1 font-display text-5xl font-bold tabular leading-none">{fmtCount(hud.flux)}</p>
          {hud.fluxEarned > 0 && (
            <p className="mt-1 text-[13px] text-steel">+{fmtCount(hud.fluxEarned)} this run</p>
          )}
        </div>
        <PassGain />
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
            className="neon-btn neon-btn-go w-full"
          >
            Play again
          </button>
          <button
            type="button"
            onClick={onTitle}
            className="neon-btn w-full"
          >
            Title
          </button>
          <button
            type="button"
            onClick={onHangar}
            className="neon-btn neon-btn-gold w-full"
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
    <div className={hot ? "end-stat end-stat-hot" : "end-stat"}>
      <dt>{label}</dt>
      <dd className="tabular">{value}</dd>
    </div>
  );
}

/** What this run added to the season pass. Read from the saved meta written when the run ended. */
function PassGain() {
  const last = typeof window === "undefined" ? null : loadMeta().lastPass;
  if (!last || last.xp <= 0) return null;
  return (
    <div className="pass-gain mt-4">
      <p className="text-[10px] font-medium tracking-[0.22em] text-epic">Season pass</p>
      <p className="text-[13px] text-paper">
        +{fmtCount(last.xp)} XP · tier {last.tier}/{SEASON.tiers}
      </p>
      {last.rewards.length ? (
        <ul className="mt-1 space-y-0.5 text-[12px] text-frost">
          {last.rewards.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
