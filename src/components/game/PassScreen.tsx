import { useEffect, useState } from "react";
import { PASS_TIERS, SEASON, passFill, passOf, questsOf, rewardKind, rewardLabel } from "@/game/data/pass";
import { fmtCount } from "@/game/format";
import type { MetaSave } from "@/game/types";
import { cn } from "@/lib/utils";

const SEEN_KEY = `vector.pass.seen.${SEASON.id}`;

function readSeen(): number {
  try {
    return Math.max(0, parseInt(localStorage.getItem(SEEN_KEY) ?? "0", 10) || 0);
  } catch {
    return 0;
  }
}

function writeSeen(n: number) {
  try {
    localStorage.setItem(SEEN_KEY, String(n));
  } catch {
    /* private mode */
  }
}

/** Season track: every tier pays out on its own when a run ends. */
export function PassScreen({ best, onClose }: { best: MetaSave; onClose: () => void }) {
  const pass = passOf(best.pass);
  const fill = passFill(pass.xp);
  const quests = questsOf(best.quests);
  const [seen] = useState(readSeen);
  const [revealOpen, setRevealOpen] = useState(pass.claimed > seen);
  const fresh = PASS_TIERS.filter((t) => t.tier > seen && t.tier <= pass.claimed);
  const nextTier = PASS_TIERS[pass.claimed];
  const nextLook = PASS_TIERS.find((t) => t.tier > pass.claimed && t.reward.kind !== "credit");
  const collect = () => {
    writeSeen(pass.claimed);
    setRevealOpen(false);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (revealOpen) {
        writeSeen(pass.claimed);
        setRevealOpen(false);
      } else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, revealOpen, pass.claimed]);

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
        <section className="pass-daily" aria-label="Daily challenges">
          <h3 className="pass-daily-title">Today&apos;s challenges</h3>
          <ul className="pass-quests">
            {quests.map((q) => (
              <li key={q.id} className={cn("pass-quest", q.done && "is-done")}>
                <div className="pass-quest-row">
                  <span className="pass-quest-name">{q.name}</span>
                  <span className="pass-quest-xp">{q.done ? "Done ✓" : `+${q.xp} XP`}</span>
                </div>
                <div className="pass-quest-bar" aria-hidden>
                  <span style={{ width: `${Math.round((q.progress / q.goal) * 100)}%` }} />
                </div>
                <span className="pass-quest-count">
                  {fmtCount(q.progress)}/{fmtCount(q.goal)}
                </span>
              </li>
            ))}
          </ul>
        </section>
        {nextTier ? (
          <div className="pass-nextup">
            <span className="pass-nextup-kicker">Next reward · tier {nextTier.tier}</span>
            <span className="pass-nextup-name">{rewardLabel(nextTier.reward)}</span>
            <span className="pass-nextup-sub">
              {fmtCount(fill.need - fill.have)} XP to go
              {nextLook && nextLook.tier !== nextTier.tier ? ` · next look: ${rewardLabel(nextLook.reward)} at tier ${nextLook.tier}` : ""}
            </span>
          </div>
        ) : null}
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
        {revealOpen && fresh.length ? (
          <div className="pass-reveal" role="dialog" aria-label="New pass rewards" onClick={collect}>
            <div className="pass-reveal-card" onClick={(e) => e.stopPropagation()}>
              <p className="pass-kicker">{fresh.length === 1 ? "Tier unlocked" : `${fresh.length} tiers unlocked`}</p>
              <ul className="pass-reveal-list">
                {fresh.map((t, i) => (
                  <li key={t.tier} className={cn("pass-reveal-item", t.reward.kind !== "credit" && "is-look")} style={{ animationDelay: `${Math.min(i, 12) * 90}ms` }}>
                    <span className="pass-tier-n">{t.tier}</span>
                    <span className="pass-tier-kind">{rewardKind(t.reward)}</span>
                    <span className="pass-tier-name">{rewardLabel(t.reward)}</span>
                  </li>
                ))}
              </ul>
              <button type="button" className="ui-btn ui-btn-primary card-bevel h-11 px-6" onClick={collect}>
                Collect
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
