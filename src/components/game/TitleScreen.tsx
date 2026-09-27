import type { MetaSave, PlayMode, ProfilesSave } from "@/game/types";
import { bondFill } from "@/game/data/bond";
import { fmtCount } from "@/game/format";
import { CARDS } from "@/game/data/cards";
import { craftHook, companionSpecialOf } from "@/game/data/companion";
import { SETS } from "@/game/data/sets";
import { BoostRocket } from "./BoostRocket";
import { ShrikeJet } from "./ShrikeJet";
import { BoreAuger } from "./BoreAuger";
import { useState } from "react";
import { markTutorial } from "@/game/persist";
import { vaultHas, vaultOf } from "@/game/data/vault";
import { GAME_VERSION } from "@/game/version";

const EXHAUST = [
  { g: "◆", x: 6, y: 42, d: "0ms", c: "text-steel" },
  { g: "●", x: -10, y: 58, d: "220ms", c: "text-steel" },
  { g: "△", x: 14, y: 70, d: "480ms", c: "text-muted" },
  { g: "▸", x: -4, y: 52, d: "700ms", c: "text-steel" },
  { g: "◆", x: 2, y: 84, d: "980ms", c: "text-muted" },
  { g: "●", x: 16, y: 46, d: "1200ms", c: "text-steel" },
  { g: "△", x: -16, y: 76, d: "1460ms", c: "text-steel" },
  { g: "▸", x: 8, y: 62, d: "1680ms", c: "text-muted" },
] as const;

const JET_EXHAUST = [
  { g: "◆", x: 8, y: 44, d: "80ms", c: "text-frost" },
  { g: "●", x: -12, y: 60, d: "300ms", c: "text-sage" },
  { g: "△", x: 16, y: 72, d: "540ms", c: "text-frost" },
  { g: "▸", x: -6, y: 54, d: "780ms", c: "text-sage" },
  { g: "◆", x: 4, y: 86, d: "1040ms", c: "text-frost" },
  { g: "●", x: 18, y: 48, d: "1280ms", c: "text-sage" },
] as const;

const BORE_EXHAUST = [
  { g: "◆", x: -18, y: 8, d: "60ms", c: "bore-dust" },
  { g: "●", x: -28, y: 22, d: "280ms", c: "bore-cyan" },
  { g: "△", x: -12, y: 30, d: "520ms", c: "bore-dust" },
  { g: "▸", x: -34, y: 14, d: "760ms", c: "text-frost" },
  { g: "◆", x: -22, y: 36, d: "1020ms", c: "bore-cyan" },
  { g: "●", x: -8, y: 18, d: "1280ms", c: "bore-dust" },
] as const;

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
  const startMode = (mode: PlayMode) => {
    setPendingMode(mode);
    if (!active.boundId) onBind("comp-auger");
    onPlay({ mode, tutorial: false });
  };
  return (
    <div className="absolute inset-0 z-20 overflow-x-hidden overflow-y-auto bg-ink">
      <img
        src="/game/map/title-cyber.jpg"
        alt=""
        className="title-photo pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div className="title-neon" aria-hidden>
        <div className="title-pips">
          {Array.from({ length: 24 }).map((_, i) => (
            <i key={i} style={{ animationDelay: `${(i % 8) * 180}ms` }} />
          ))}
        </div>
      </div>
      <div className="rocket-sky" aria-hidden>
        <div className="rocket-craft">
          <div className="relative">
            <BoostRocket className="rocket-pose rocket-toned relative z-10" />
            <div className="rocket-reflect-well">
              <BoostRocket compact puddle className="rocket-reflect" />
            </div>
            {EXHAUST.map((p, i) => (
              <span
                key={`${p.g}-${i}`}
                className={`exhaust-glyph text-lg sm:text-2xl ${p.c}`}
                style={{
                  animationDelay: p.d,
                  ["--ex" as string]: `${p.x}px`,
                  ["--ey" as string]: `${p.y}px`,
                }}
              >
                {p.g}
              </span>
            ))}
          </div>
        </div>
        <div className="jet-craft">
          <div className="relative">
            <ShrikeJet className="rocket-pose jet-toned relative z-10" />
            <div className="rocket-reflect-well jet-reflect-well">
              <ShrikeJet compact puddle className="rocket-reflect" />
            </div>
            {JET_EXHAUST.map((p, i) => (
              <span
                key={`j-${p.g}-${i}`}
                className={`exhaust-glyph text-lg sm:text-2xl ${p.c}`}
                style={{
                  animationDelay: p.d,
                  ["--ex" as string]: `${p.x}px`,
                  ["--ey" as string]: `${p.y}px`,
                }}
              >
                {p.g}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="title-stack relative z-10 flex min-h-full flex-col items-center px-5 pb-6 pt-8 text-center sm:px-10">
        <p className="ui-kicker rise-in text-steel">
          Tower Defense
        </p>
        <div className="title-lockup rise-in" style={{ animationDelay: "60ms" }}>
          <h1 className="title-chrome relative font-display text-[clamp(3.6rem,14vw,9rem)] font-bold uppercase leading-[0.84] tracking-[0.05em]">
            Vector
          </h1>
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
            onClick={onHelp}
            className="ui-btn help-btn"
          >
            Briefing
          </button>
        </div>
        <p className="title-start-hint">Draft once. Hold 12. Then keep flying, or return.</p>
        <p className="title-version">v{GAME_VERSION}</p>
        <div className="title-banks rise-in" style={{ animationDelay: "190ms" }}>
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
        <div className="bore-craft rise-in" style={{ animationDelay: "200ms" }}>
          <div className="relative">
            <BoreAuger className="rocket-pose bore-toned relative z-10" />
            <div className="rocket-reflect-well bore-reflect-well">
              <BoreAuger compact puddle className="rocket-reflect" />
            </div>
            {BORE_EXHAUST.map((p, i) => (
              <span
                key={`b-${p.g}-${i}`}
                className={`exhaust-glyph text-lg sm:text-2xl ${p.c}`}
                style={{
                  animationDelay: p.d,
                  ["--ex" as string]: `${p.x}px`,
                  ["--ey" as string]: `${p.y}px`,
                }}
              >
                {p.g}
              </span>
            ))}
          </div>
        </div>
        {(best.runs > 0 || (best.bestWave ?? 0) > 0) && (
          <p className="mt-6 tabular text-[12px] text-faint">
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
          <div className="tutorial-gate-panel">
            <p className="text-[11px] font-medium tracking-[0.18em] text-frost">First run</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-paper">A short how-to?</h2>
            <p className="mt-2 text-[14px] text-muted">Tips while you play. You can skip any time.</p>
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
