import { useEffect } from "react";
import { PASS_TIERS, SEASON, passFill, passOf, rewardKind, rewardLabel } from "@/game/data/pass";
import { fmtCount } from "@/game/format";
import type { MetaSave } from "@/game/types";
import { cn } from "@/lib/utils";

/** Season track: every tier pays out on its own when a run ends. */
export function PassScreen({ best, onClose }: { best: MetaSave; onClose: () => void }) {
  const pass = passOf(best.pass);
  const fill = passFill(pass.xp);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="pass-scrim" role="presentation" onClick={onClose}>
      <div className="pass-panel glass-panel" role="dialog" aria-modal="true" aria-label="Season pass" onClick={(e) => e.stopPropagation()}>
        <header className="pass-head">
          <div className="min-w-0">
            <p className="pass-kicker">Season pass · free</p>
            <h2 className="pass-title">{SEASON.name}</h2>
            <p className="pass-sub">
              Tier {fill.tier}/{SEASON.tiers}
              {fill.maxed ? " · season complete" : ` · ${fmtCount(fill.have)}/${fmtCount(fill.need)} XP to tier ${fill.tier + 1}`}
              {pass.badges.length ? ` · ${pass.badges.join(", ")}` : ""}
            </p>
            <div className="pass-bar" aria-hidden>
              <span style={{ width: `${Math.round((fill.have / Math.max(1, fill.need)) * 100)}%` }} />
            </div>
          </div>
          <button type="button" className="ui-btn ui-btn-primary card-bevel h-11 shrink-0 px-4" onClick={onClose}>
            Close
          </button>
        </header>
        <p className="pass-how">10 XP per wave cleared · +50 for holding 12 · +5 per ★ made in Build. Rewards pay out at the end of a run. Looks only — nothing here makes guns stronger.</p>
        <ol className="pass-track">
          {PASS_TIERS.map((t) => {
            const got = t.tier <= pass.claimed;
            const next = t.tier === pass.claimed + 1;
            const look = t.reward.kind !== "credit";
            return (
              <li key={t.tier} className={cn("pass-tier", got && "is-got", next && "is-next", look && "is-look")}>
                <span className="pass-tier-n">{t.tier}</span>
                <span className="pass-tier-kind">{rewardKind(t.reward)}</span>
                <span className="pass-tier-name">{rewardLabel(t.reward)}</span>
                <span className="pass-tier-mark" aria-label={got ? "Earned" : "Locked"}>{got ? "✓" : ""}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
