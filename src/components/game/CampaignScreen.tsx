import { useMemo, useState } from "react";
import type { MetaSave } from "@/game/types";
import {
  CAMPAIGN_MAX_STARS,
  CAMPAIGN_SECTORS,
  campaignOf,
  modeLabel,
  sectorOpen,
  sectorStars,
  stageLabel,
  stageOpen,
  stageRules,
  stagesOf,
  starsOfStage,
  totalStars,
  type CampaignStage,
} from "@/game/data/campaign";
import { THREATS } from "@/game/data/threat";
import { getCard } from "@/game/data/cards";
import { lanePoints } from "@/game/data/map";
import { WORLD } from "@/game/constants";
import { cn } from "@/lib/utils";

/** Node spots along the sector path, in % of the path box. A gentle zigzag. */
const NODE_POS = [
  { x: 9, y: 70 },
  { x: 29, y: 30 },
  { x: 50, y: 66 },
  { x: 71, y: 28 },
  { x: 91, y: 62 },
];

function mapName(id: string): string {
  try {
    return getCard(id).name;
  } catch {
    return id;
  }
}

export function StarPips({ n, max = 3, className }: { n: number; max?: number; className?: string }) {
  return (
    <span className={cn("camp-pips", className)} aria-label={`${n} of ${max} stars`}>
      {Array.from({ length: max }).map((_, i) => (
        <i key={i} className={i < n ? "is-lit" : ""} aria-hidden>
          ★
        </i>
      ))}
    </span>
  );
}

/** Small lane preview drawn from the hand-made lane points. */
export function LaneThumb({ lane, className }: { lane: string; className?: string }) {
  const pts = lanePoints(lane);
  const d = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const start = pts[0]!;
  const end = pts[pts.length - 1]!;
  return (
    <svg className={cn("camp-lane", className)} viewBox={`0 0 ${WORLD.w} ${WORLD.h}`} aria-hidden>
      <rect x="1" y="1" width={WORLD.w - 2} height={WORLD.h - 2} className="camp-lane-frame" />
      <polyline points={d} className="camp-lane-glow" />
      <polyline points={d} className="camp-lane-line" />
      <circle cx={start.x} cy={start.y} r="22" className="camp-lane-spawn" />
      <circle cx={end.x} cy={end.y} r="34" className="camp-lane-home" />
    </svg>
  );
}

export function CampaignScreen({
  best,
  onStart,
  onClose,
}: {
  best: MetaSave;
  onStart: (stageId: string) => void;
  onClose: () => void;
}) {
  const save = useMemo(() => campaignOf(best.campaign), [best.campaign]);
  const total = totalStars(save);
  // Open on the furthest open sector, at its first stage without 3 ★.
  const firstSector = useMemo(() => {
    let s = 0;
    for (let i = 0; i < CAMPAIGN_SECTORS.length; i++) if (sectorOpen(save, i)) s = i;
    return s;
  }, [save]);
  const [sector, setSector] = useState(firstSector);
  const stages = stagesOf(sector);
  const pick = (sec: number) =>
    stagesOf(sec).find((s) => stageOpen(save, s.id) && starsOfStage(save, s.id) < 3) ??
    [...stagesOf(sec)].reverse().find((s) => stageOpen(save, s.id)) ??
    stagesOf(sec)[0]!;
  const [selId, setSelId] = useState<string>(() => pick(firstSector).id);
  const sel = stages.find((s) => s.id === selId) ?? pick(sector);
  const secDef = CAMPAIGN_SECTORS[sector]!;
  const open = sectorOpen(save, sector);

  const polyPts = NODE_POS.map((p) => `${p.x * 10},${p.y * 2.2}`).join(" ");
  // How far the lit path runs: up to the last open stage.
  const litN = stages.filter((s) => stageOpen(save, s.id)).length;
  const litPts = NODE_POS.slice(0, Math.max(1, litN))
    .map((p) => `${p.x * 10},${p.y * 2.2}`)
    .join(" ");

  return (
    <div className="camp-screen neon-scrim absolute inset-0 z-30 overflow-x-hidden overflow-y-auto">
      <div className="camp-wrap mx-auto flex w-full max-w-3xl flex-col gap-3 px-3 pb-24 pt-4 sm:px-6 sm:pt-6">
        <header className="camp-head">
          <button type="button" className="neon-btn neon-btn-sm" onClick={onClose}>
            Back
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="neon-kicker">Campaign</p>
            <h2 className="camp-title">{secDef.name}</h2>
          </div>
          <span className="camp-total tabular" aria-label={`${total} of ${CAMPAIGN_MAX_STARS} stars`}>
            ★ {total}/{CAMPAIGN_MAX_STARS}
          </span>
        </header>

        <div className="camp-tabs" role="tablist" aria-label="Campaign sectors">
          {CAMPAIGN_SECTORS.map((s, i) => {
            const on = i === sector;
            const ok = sectorOpen(save, i);
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={on}
                className={cn("camp-tab", on && "is-on", !ok && "is-locked")}
                onClick={() => {
                  setSector(i);
                  setSelId(pick(i).id);
                }}
              >
                <span className="camp-tab-k">Sector {i + 1}</span>
                <span className="camp-tab-name">{s.name}</span>
                <span className="camp-tab-sub tabular">
                  {ok ? `★ ${sectorStars(save, i)}/15` : `Need ${s.need} ★`}
                </span>
              </button>
            );
          })}
        </div>

        <div className={cn("camp-map neon-panel", !open && "is-locked")}>
          <p className="camp-blurb">{open ? secDef.blurb : `Earn ${secDef.need} ★ to open. You have ${total}.`}</p>
          <div className="camp-path">
            <svg className="camp-path-svg" viewBox="0 0 1000 220" preserveAspectRatio="none" aria-hidden>
              <polyline points={polyPts} className="camp-path-dim" />
              {open && <polyline points={litPts} className="camp-path-lit" />}
            </svg>
            {stages.map((s, i) => {
              const p = NODE_POS[i]!;
              const ok = stageOpen(save, s.id);
              const stars = starsOfStage(save, s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  className={cn(
                    "camp-node",
                    s.id === sel.id && "is-sel",
                    !ok && "is-locked",
                    stars === 3 && "is-full",
                    s.mode === "build" && "is-build",
                  )}
                  style={{ left: `${p.x}%`, top: `${(p.y / 100) * 100}%` }}
                  onClick={() => setSelId(s.id)}
                  aria-label={`${stageLabel(s)} ${s.name}${ok ? `, ${stars} stars` : ", locked"}`}
                >
                  <span className="camp-node-ring">
                    <span className="camp-node-n">
                      {s.sector + 1}-{s.n}
                    </span>
                  </span>
                  <StarPips n={stars} className="camp-node-pips" />
                </button>
              );
            })}
          </div>
        </div>

        <StageCard
          stage={sel}
          stars={starsOfStage(save, sel.id)}
          clears={save.stages[sel.id]?.clears ?? 0}
          bestLeaks={save.stages[sel.id]?.bestLeaks}
          open={stageOpen(save, sel.id)}
          sectorOpen={open}
          onStart={() => onStart(sel.id)}
        />
        <p className="camp-foot">
          Each new ★ pays Vault Credit. First clear pays Pass XP. All 15 ★ in a sector pays a reward. Campaign stages use
          their own Threat; your Threat toggles stay as they are.
        </p>
      </div>
    </div>
  );
}

function StageCard({
  stage,
  stars,
  clears,
  bestLeaks,
  open,
  sectorOpen: secOpen,
  onStart,
}: {
  stage: CampaignStage;
  stars: number;
  clears: number;
  bestLeaks?: number;
  open: boolean;
  sectorOpen: boolean;
  onStart: () => void;
}) {
  const rules = stageRules(stage);
  const threats = THREATS.filter((t) => stage.threat.includes(t.id));
  const lockLine = !secOpen ? "Sector locked" : `Earn ★ on Stage ${stage.sector + 1}-${stage.n - 1} first`;
  return (
    <section className="camp-card neon-panel" aria-label={`${stageLabel(stage)} ${stage.name}`}>
      <div className="camp-card-top">
        <LaneThumb lane={stage.lane} className="camp-card-lane" />
        <div className="min-w-0 flex-1">
          <p className="neon-kicker">{stageLabel(stage)}</p>
          <h3 className="camp-card-name">{stage.name}</h3>
          <p className="camp-card-meta">
            <span>{mapName(stage.mapId)}</span>
            <span className={cn("camp-chip", stage.mode === "build" ? "is-build" : "is-arena")}>{modeLabel(stage.mode)}</span>
            <span className="tabular">{stage.waves} waves</span>
          </p>
          <div className="camp-card-best">
            <StarPips n={stars} />
            <span className="tabular">
              {clears > 0 ? `${clears} clear${clears === 1 ? "" : "s"}${bestLeaks != null ? ` · best ${bestLeaks} leaks` : ""}` : "Not cleared"}
            </span>
          </div>
        </div>
      </div>
      <div className="camp-threats">
        {threats.length ? (
          threats.map((t) => (
            <span key={t.id} className="camp-threat" title={t.blurb}>
              <b>{t.name}</b> {t.blurb}
            </span>
          ))
        ) : (
          <span className="camp-threat is-none">No Threat</span>
        )}
      </div>
      <ol className="camp-rules">
        {rules.map((r, i) => (
          <li key={i} className={cn("camp-rule", i < stars && "is-lit")}>
            <span className="camp-rule-star" aria-hidden>
              ★
            </span>
            <span>{r.text}</span>
          </li>
        ))}
      </ol>
      <button type="button" className="neon-btn neon-btn-go camp-start w-full" disabled={!open} onClick={onStart}>
        {open ? (clears > 0 ? "Play again" : "Start") : lockLine}
      </button>
    </section>
  );
}
