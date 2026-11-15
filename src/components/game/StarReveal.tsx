import type { HudState } from "@/game/store";
import { fmtCount } from "@/game/format";
import { loadMeta } from "@/game/persist";
import { campaignOf, nextStage, stageById, stageLabel, stageOpen } from "@/game/data/campaign";
import { PARAMS } from "@/game/params";
import { cn } from "@/lib/utils";

/** Delay between stars lighting, ms. The CSS animation reads --d. */
const STEP = 650;

/** Shown after a campaign stage is won: stars light one by one, then the rewards. */
export function StarReveal({
  hud,
  onNext,
  onRetry,
  onMap,
}: {
  hud: HudState;
  onNext: (stageId: string) => void;
  onRetry: () => void;
  onMap: () => void;
}) {
  const res = hud.campaignResult;
  const stage = stageById(res?.stageId ?? hud.campaign?.stageId);
  if (!res || !stage) return null;
  const save = campaignOf(typeof window === "undefined" ? null : loadMeta().campaign);
  const next = nextStage(stage.id);
  const nextOk = !!next && stageOpen(save, next.id);
  const rewardsAt = STEP * 3 + 250;
  const rewards: string[] = [];
  if (res.newStars > 0) rewards.push(`+${fmtCount(res.newStars * PARAMS.campaignStarCredit)} Vault Credit · ${res.newStars} new ★`);
  if (res.passXp > 0) rewards.push(`+${fmtCount(res.passXp)} Pass XP · first clear`);
  if (res.sectorReward) rewards.push(res.sectorReward);
  return (
    <div className="neon-scrim absolute inset-0 z-30 flex justify-center overflow-y-auto p-3 sm:p-4">
      <div className="star-reveal neon-panel neon-panel-gold mt-auto h-fit w-full max-w-md p-5 sm:mb-auto sm:p-6">
        <p className="neon-kicker neon-kicker-gold">{stageLabel(stage)} held</p>
        <h2 className="mt-1 font-display text-3xl font-bold tracking-wide text-paper">{stage.name}</h2>
        <div className="star-row" aria-label={`${res.stars} of 3 stars`}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn("star-big", res.checks[i]?.ok && "is-lit")}
              style={{ ["--d" as string]: `${i * STEP + 200}ms` }}
              aria-hidden
            >
              ★
            </span>
          ))}
        </div>
        <ol className="star-checks">
          {res.checks.map((c, i) => (
            <li
              key={i}
              className={cn("star-check", c.ok ? "is-ok" : "is-miss")}
              style={{ ["--d" as string]: `${i * STEP + 200}ms` }}
            >
              <span className="star-check-mark" aria-hidden>
                ★
              </span>
              <span className="star-check-rule">{c.rule}</span>
              <span className="star-check-val tabular">{c.label}</span>
            </li>
          ))}
        </ol>
        <div className="star-rewards" style={{ ["--d" as string]: `${rewardsAt}ms` }}>
          <p className="neon-kicker">Rewards</p>
          {rewards.length ? (
            <ul className="mt-1 space-y-0.5 text-[13px] text-paper">
              {rewards.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-[13px] text-steel">
              Best kept at {res.prevStars} ★. Replays pay normal run rewards.
            </p>
          )}
          <p className="mt-2 text-[12px] text-steel">
            Vault Credit {fmtCount(hud.flux)}
            {hud.fluxEarned > 0 ? ` · +${fmtCount(hud.fluxEarned)} this run` : ""}
          </p>
        </div>
        <div className="mt-5 flex flex-col gap-2">
          {next && (
            <button
              type="button"
              className="neon-btn neon-btn-go w-full"
              disabled={!nextOk}
              onClick={() => onNext(next.id)}
            >
              {nextOk ? `Next · ${stageLabel(next)}` : `${stageLabel(next)} locked`}
            </button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="neon-btn w-full" onClick={onRetry}>
              Retry
            </button>
            <button type="button" className="neon-btn neon-btn-gold w-full" onClick={onMap}>
              Campaign map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
