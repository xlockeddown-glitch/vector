import type { MetaSave, PlayMode, ProfilesSave } from "@/game/types";
import { SEASON, passFill, passOf } from "@/game/data/pass";
import { bondFill } from "@/game/data/bond";
import { fmtCount } from "@/game/format";
import { CARDS } from "@/game/data/cards";
import { craftHook, companionSpecialOf } from "@/game/data/companion";
import { SETS } from "@/game/data/sets";
import { useEffect, useState } from "react";
import { markTutorial } from "@/game/persist";
import { vaultHas, vaultOf } from "@/game/data/vault";
import { GAME_VERSION } from "@/game/version";
import { CAMPAIGN_MAX_STARS, campaignOf, totalStars } from "@/game/data/campaign";

/** Perspective floor: verticals fan out from a vanishing point, horizontals bunch toward the horizon. */
const FLOOR_FAN = Array.from({ length: 25 }, (_, i) => 400 + (i - 12) * 90);
const FLOOR_ROWS = Array.from({ length: 9 }, (_, i) => Math.round(300 * ((i + 1) / 9) ** 2.2));

/** Neon vector backdrop: grid, wireframe planet with an incoming lane, floor grid, two line-art ships. */
function TitleBackdrop() {
  return (
    <div className="title-void" aria-hidden>
      <svg className="title-art title-globe" viewBox="0 0 400 400">
        <circle cx="200" cy="200" r="150" />
        <ellipse cx="200" cy="200" rx="150" ry="52" />
        <ellipse cx="200" cy="140" rx="132" ry="34" />
        <ellipse cx="200" cy="260" rx="132" ry="34" />
        <ellipse cx="200" cy="200" rx="52" ry="150" />
        <ellipse cx="200" cy="200" rx="108" ry="150" />
        <path d="M200 50 V350" />
        <path className="is-lane" d="M-10 96 C70 60 120 80 150 120" />
        <path className="is-lane" d="M410 76 C330 50 285 78 256 112" />
        <path className="is-foe" d="M22 74 l8 8 -8 8 -8 -8 Z M58 66 l7 7 -7 7 -7 -7 Z M96 72 l6 6 -6 6 -6 -6 Z" />
        <path className="is-foe" d="M380 60 l8 8 -8 8 -8 -8 Z M344 56 l7 7 -7 7 -7 -7 Z M308 66 l6 6 -6 6 -6 -6 Z" />
      </svg>
      <svg className="title-art title-floor" viewBox="0 0 800 300" preserveAspectRatio="none">
        {FLOOR_FAN.map((x) => (
          <path key={x} d={`M400 -60 L${x} 300`} />
        ))}
        {FLOOR_ROWS.map((y) => (
          <path key={y} d={`M-400 ${y} H1200`} />
        ))}
        <path className="is-horizon" d="M-400 2 H1200" />
      </svg>
      <svg className="title-art title-ship title-ship-l" viewBox="0 0 100 220">
        <path d="M50 6 C66 30 71 70 70 118 L70 150 L30 150 L30 118 C29 70 34 30 50 6 Z" />
        <path d="M30 116 L10 166 L30 152 M70 116 L90 166 L70 152 M50 126 V150" />
        <path d="M38 150 L34 164 H66 L62 150" />
        <path className="is-core" d="M32 96 H68 M36 44 H64" />
        <circle className="is-core" cx="50" cy="66" r="10" />
        <circle className="is-core" cx="50" cy="66" r="4" />
        <path className="is-flame" d="M39 168 L50 208 L61 168 M45 168 L50 188 L55 168" />
      </svg>
      <svg className="title-art title-ship title-ship-r" viewBox="0 0 100 220">
        <path d="M50 6 L58 62 L60 150 L50 164 L40 150 L42 62 Z" />
        <path d="M43 72 L6 138 L8 150 L41 130 M57 72 L94 138 L92 150 L59 130" />
        <path d="M41 140 L26 164 L42 157 M59 140 L74 164 L58 157" />
        <path className="is-core" d="M50 28 L54 58 H46 Z M50 74 V140" />
        <path className="is-flame" d="M43 162 L46.5 196 L50 166 L53.5 196 L57 162" />
        <path className="is-trail" d="M8 152 V214 M92 152 V214" />
      </svg>
    </div>
  );
}

const CRAFTS = CARDS.filter((c) => c.kind === "companion");
const GEM_RANK: Record<string, number> = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
const PICK_CRAFTS = [...CRAFTS].sort(
  (a, b) => (GEM_RANK[a.rarity] ?? 9) - (GEM_RANK[b.rarity] ?? 9) || a.name.localeCompare(b.name),
);

export function TitleScreen({
  onPlay,
  onContinue,
  onHelp,
  onHangar,
  onPass,
  onCampaign,
  onSlot,
  onBind,
  best,
  ready,
  hasRun,
  profiles,
}: {
  onPlay: (opts?: { tutorial?: boolean; mode?: PlayMode }) => void;
  onContinue?: () => void;
  onHelp: () => void;
  onHangar: () => void;
  onPass: () => void;
  onCampaign: () => void;
  onSlot: (id: number) => void;
  onBind: (id: string) => void;
  best: MetaSave;
  ready: boolean;
  hasRun: boolean;
  profiles: ProfilesSave;
}) {
  const [bindOpen, setBindOpen] = useState(false);
  const [gate, setGate] = useState(false);
  const [pendingMode, setPendingMode] = useState<PlayMode>("story");
  const needGate = !best.tutorialDone && !best.tutorialSkipped;
  const slots = profiles?.slots?.length ? profiles.slots : [];
  const active = slots[profiles?.active ?? 0] ?? slots[0] ?? { id: 0, boundId: null, xp: 0, jobs: 0 };
  const bound = CRAFTS.find((c) => c.id === active.boundId);
  const vault = vaultOf(best.vault);
  const pickCrafts = PICK_CRAFTS.filter((c) => c.id !== "comp-sink" || vaultHas(vault, "myth_sink"));
  const fill = bondFill(active.xp);
  // Read after mount: the server render has no save, so a first-frame count would not hydrate.
  const [campStars, setCampStars] = useState(0);
  useEffect(() => {
    setCampStars(totalStars(campaignOf(best.campaign)));
  }, [best.campaign]);
  const startMode = (mode: PlayMode) => {
    setPendingMode(mode);
    if (!active.boundId) onBind("comp-auger");
    onPlay({ mode, tutorial: false });
  };
  return (
    <div className="absolute inset-0 z-20 overflow-x-hidden overflow-y-auto bg-ink">
      <TitleBackdrop />

      <div className="title-stack relative z-10 flex min-h-full flex-col items-center px-5 pb-6 pt-8 text-center sm:px-10">
        <p className="ui-kicker rise-in">Tower Defense</p>
        <div className="title-lockup rise-in" style={{ animationDelay: "60ms" }}>
          <h1
            data-text="Vector"
            className="title-chrome relative font-display text-[clamp(3.6rem,14vw,9rem)] font-bold uppercase leading-[0.84]"
          >
            Vector
          </h1>
          <div className="title-rule" aria-hidden />
          <p className="title-tag">Hold the lane. Keep the planet.</p>
        </div>
        <div className="title-cta relative z-20 mt-6 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "180ms" }}>
          {hasRun && onContinue && (
            <button
              type="button"
              onClick={onContinue}
              className="ui-btn ui-btn-primary card-bevel min-w-36"
            >
              Continue
            </button>
          )}
          <button
            type="button"
            onClick={() => startMode("story")}
            className="ui-btn ui-btn-primary card-bevel min-w-36"
          >
            Arena
          </button>
          <button
            type="button"
            onClick={() => startMode("build")}
            className="ui-btn ui-btn-primary card-bevel min-w-36"
            title="Draft a gun after every wave. Copies merge into stars."
          >
            Build
          </button>
          <button
            type="button"
            onClick={onCampaign}
            className="ui-btn ui-btn-primary card-bevel camp-cta min-w-36"
            title="15 stages with fixed maps and Threat. Earn ★."
          >
            Campaign
            <span className="camp-cta-pill tabular" aria-label={`${campStars} of ${CAMPAIGN_MAX_STARS} stars`}>
              ★ {campStars}/{CAMPAIGN_MAX_STARS}
            </span>
          </button>
          <button
            type="button"
            onClick={onHelp}
            className="ui-btn help-btn"
          >
            Briefing
          </button>
        </div>
        <p className="title-start-hint">Arena: draft once, hold 12. Build: draft every wave, merge copies.</p>
        <p className="title-version">v{GAME_VERSION}</p>
        {(best.runs > 0 || hasRun) && (
        <div className="title-banks rise-in" style={{ animationDelay: "190ms" }}>
          <button type="button" onClick={onPass} aria-label="Season pass" className="keep-bank pass-bank">
            <p className="keep-bank-kicker">Pass</p>
            <div className="keep-bank-head">
              <span className="keep-bank-title">Tier</span>
              <span className="keep-bank-flux tabular">
                {passFill(passOf(best.pass).xp).tier}/{SEASON.tiers}
              </span>
            </div>
          </button>
          <button type="button" onClick={onHangar} aria-label="Vault" className="keep-bank">
            <p className="keep-bank-kicker">Vault</p>
            <div className="keep-bank-head">
              <span className="keep-bank-mark" aria-hidden>
                <i />
              </span>
              <span className="keep-bank-title">Credit</span>
              <span className="keep-bank-flux tabular">{fmtCount(best.flux ?? 0)}</span>
            </div>
          </button>
          <div className="save-bank">
          <p className="save-kicker">Saves</p>
          <div className="save-row">
            {(slots.length ? slots : []).map((s) => {
              const craft = CRAFTS.find((c) => c.id === s.boundId);
              const lv = bondFill(s.xp).level;
              const on = s.id === profiles.active;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={on ? "save-slot save-slot-on" : "save-slot"}
                  onClick={() => {
                    onSlot(s.id);
                    if (!s.boundId) setBindOpen(true);
                  }}
                >
                  <span className="save-gem" aria-hidden />
                  <span className="save-name">{craft?.name ?? "Empty"}</span>
                  <span className="save-lv">{craft ? `${craft.name} ${fmtCount(lv)} · keeps forever` : "Pick a main"}</span>
                </button>
              );
            })}
          </div>
          {bound && (
            <p className="save-note">
              {bound.name} {fmtCount(fill.level)} · keeps forever · {fmtCount(fill.have)}/{fmtCount(fill.need)} XP
            </p>
          )}
        </div>
        </div>
        )}
        {(best.runs > 0 || (best.bestWave ?? 0) > 0) && (
          <p className="mt-6 tabular text-[12px] text-steel">
            {[
              best.runs > 0 ? `${best.runs} run${best.runs === 1 ? "" : "s"}` : null,
              best.bestWave ? `wave ${best.bestWave}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </div>
      {gate && (
        <div className="tutorial-gate">
          <div className="tutorial-gate-panel neon-ticks">
            <p className="neon-kicker">First run</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-paper">A short how-to?</h2>
            <p className="mt-2 text-[14px] text-steel">Tips while you play. You can skip any time.</p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="ui-btn ui-btn-primary card-bevel flex-1"
                onClick={() => {
                  setGate(false);
                  onPlay({ tutorial: true, mode: pendingMode });
                }}
              >
                Show me
              </button>
              <button
                type="button"
                className="ui-btn ui-btn-ghost card-bevel flex-1"
                onClick={() => {
                  markTutorial(false, true);
                  setGate(false);
                  onPlay({ mode: pendingMode });
                }}
              >
                Just play
              </button>
            </div>
          </div>
        </div>
      )}
      {bindOpen && (
        <div className="save-bind">
          <div className="save-bind-panel">
            <p className="save-kicker">Save {profiles.active + 1}</p>
            <h2 className="save-bind-title">Pick your main</h2>
            <p className="save-note">This craft stays every game and keeps its level.</p>
            <div className="save-bind-grid">
              {pickCrafts.map((c) => {
                const spec = companionSpecialOf(c.companion?.role ?? "hunter");
                const tone = c.set ? SETS[c.set].color : "#9b6cff";
                return (
                  <button
                    key={c.id}
                    type="button"
                    className="save-bind-card"
                    onClick={() => {
                      onBind(c.id);
                      setBindOpen(false);
                      if (pendingMode === "story" && needGate) setGate(true);
                      else onPlay({ mode: pendingMode });
                    }}
                  >
                    <span className="save-bind-gem" style={{ background: tone }} aria-hidden />
                    <span className="save-bind-name">{c.name}</span>
                    <span className="save-bind-job">{spec.name}</span>
                    <span className="save-bind-hook">{craftHook(c.id)}</span>
                  </button>
                );
              })}
            </div>
            <button type="button" className="ui-btn ui-btn-ghost card-bevel mt-3" onClick={() => setBindOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
      <p className="title-made">Made by: Grok Build & Ryan Gray</p>
    </div>
  );
}
