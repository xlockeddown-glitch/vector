/**
 * Campaign. 3 campaign sectors × 5 stages. Each stage is a fixed map card + lane,
 * a mode (Arena = "story", or "build"), a wave count and fixed Threat toggles.
 * Stars (★) are scored at the end of a won stage from three rules.
 *
 * Naming: "campaign" and "stage" in code. "sector" already means the map + weather
 * roll (rollNewSector), "level" means gun level rungs, "stars" means Build merges.
 * Player-facing text says "Sector 1", "Stage 1-3" and ★.
 */
import { PARAMS } from "../params";
import { WAVES_PER_ROUND } from "../constants";
import type { ThreatId } from "./threat";
import type { EnemyType, SkinId } from "../types";
import { ENEMY_BRIEF, ENEMY_NAME } from "./enemies";

export type CampaignMode = "story" | "build";

/**
 * A star rule. Every rule reads a counter the run keeps:
 *   leaksMax       w.runLeaks <= n
 *   picksMax/Min   w.upgradesMade (gun and craft tree picks, infusions)
 *   gunsMax        most guns fielded at once (w.gunsPeak, from fieldedTowers)
 *   reactionsMin   w.reactions (element reactions)
 *   starsMadeMin   w.starsMade (Build merges into ★2/★3)
 *   timeMax        w.runTime (sim seconds of combat, summed per wave)
 *   creditSpentMax w.creditSpent (Credit spent on tree picks and infusions)
 */
export type StarRuleKind =
  | "leaksMax"
  | "picksMax"
  | "picksMin"
  | "gunsMax"
  | "reactionsMin"
  | "starsMadeMin"
  | "timeMax"
  | "creditSpentMax";

export type StarRule = { kind: StarRuleKind; n: number };

export type CampaignStage = {
  id: string;
  /** 0-based campaign sector index. */
  sector: number;
  /** 1-based number inside the sector. */
  n: number;
  name: string;
  mapId: string;
  lane: string;
  mode: CampaignMode;
  /** Must be a multiple of WAVES_PER_ROUND: the win check runs at round end. */
  waves: number;
  threat: ThreatId[];
  /** ★2 leak cap. ★1 is always "clear every wave". */
  leaks: number;
  /** ★3 twist. */
  twist: StarRule;
  /** Special enemies this stage brings (Blink, Jammer), from wave PARAMS.campaignFoesFrom + 1. Others stay out. */
  extra?: EnemyType[];
};

export type CampaignSector = {
  id: string;
  name: string;
  blurb: string;
  /** ★ needed to open it. */
  need: number;
  /** Paid once when all 15 ★ of the sector are earned. */
  reward: { kind: "skin"; id: SkinId } | { kind: "credit"; n: number };
};

/** Saved on the run so Continue and Retry keep the stage rules. */
export type CampaignRun = {
  stageId: string;
  waves: number;
  threat: ThreatId[];
  mapId: string;
  lane: string;
  /** Special enemies the wave builder adds (stage.extra). Always set on a Campaign run; [] = none. */
  foes: EnemyType[];
};

export type CampaignStageSave = { stars: 0 | 1 | 2 | 3; clears: number; bestLeaks?: number };

export type CampaignSave = {
  v: 1;
  stages: Record<string, CampaignStageSave>;
  /** Sector ids whose full-★ reward was paid. */
  claimed: string[];
};

export const CAMPAIGN_SECTORS: CampaignSector[] = [
  {
    id: "tide",
    name: "Tide Line",
    blurb: "Learn the lanes. No Threat, short holds.",
    need: PARAMS.campaignSectorNeed[0]!,
    reward: { kind: "skin", id: "ember" },
  },
  {
    id: "dark",
    name: "Dark Side",
    blurb: "One Threat each. Longer holds. Blinks jump the lane.",
    need: PARAMS.campaignSectorNeed[1]!,
    reward: { kind: "credit", n: PARAMS.campaignSectorCredit },
  },
  {
    id: "lagrange",
    name: "Lagrange",
    blurb: "Stacked Threat. Full 12-wave finales. Jammers silence guns.",
    need: PARAMS.campaignSectorNeed[2]!,
    reward: { kind: "skin", id: "gold" },
  },
];

const S = (
  sector: number,
  n: number,
  name: string,
  mapId: string,
  lane: string,
  mode: CampaignMode,
  waves: number,
  threat: ThreatId[],
  leaks: number,
  twist: StarRule,
  extra: EnemyType[] = [],
): CampaignStage => ({ id: `${sector + 1}-${n}`, sector, n, name, mapId, lane, mode, waves, threat, leaks, twist, extra });

/** Sector 2 brings Blink. Sector 3 brings Blink and Jammer. Sector 1 has neither. */
const BLINK: EnemyType[] = ["blink"];
const BLINK_JAM: EnemyType[] = ["blink", "jammer"];

/** Tuning: thresholds are first guesses. */
export const CAMPAIGN_STAGES: CampaignStage[] = [
  // Sector 1: Tide Line
  S(0, 1, "First Hold", "map-mare", "twin-s", "story", 6, [], 3, { kind: "leaksMax", n: 0 }),
  S(0, 2, "Staircase", "map-mare", "steps", "story", 6, [], 3, { kind: "picksMin", n: 6 }),
  S(0, 3, "Comb", "map-regolith", "shelf", "build", 6, [], 3, { kind: "starsMadeMin", n: 1 }),
  S(0, 4, "Keyhole", "map-regolith", "keyhole", "story", 9, ["overdrive"], 2, { kind: "reactionsMin", n: 25 }),
  S(0, 5, "Hook", "map-void", "hook", "build", 9, [], 2, { kind: "starsMadeMin", n: 2 }),
  // Sector 2: Dark Side
  S(1, 1, "Long Return", "map-void", "bracket", "story", 9, ["glass"], 2, { kind: "gunsMax", n: 4 }, BLINK),
  S(1, 2, "Furnace Steps", "map-helios", "steps", "build", 9, ["lean"], 2, { kind: "creditSpentMax", n: 2000 }, BLINK),
  S(1, 3, "Escort Duty", "map-void", "hook", "story", 9, ["escort"], 2, { kind: "reactionsMin", n: 40 }, BLINK),
  S(1, 4, "Hot Comb", "map-helios", "shelf", "build", 12, ["hardened"], 3, { kind: "starsMadeMin", n: 3 }, BLINK),
  S(1, 5, "Eclipse", "map-void", "keyhole", "story", 12, ["bigmega", "overdrive"], 2, { kind: "timeMax", n: 600 }, BLINK),
  // Sector 3: Lagrange
  S(2, 1, "Balance Point", "map-lagrange", "keyhole", "story", 9, ["mutant"], 2, { kind: "picksMax", n: 8 }, BLINK_JAM),
  S(2, 2, "Twin Pull", "map-lagrange", "twin-s", "build", 12, ["hardened", "lean"], 3, { kind: "gunsMax", n: 5 }, BLINK_JAM),
  S(2, 3, "Hookshot", "map-lagrange", "hook", "story", 12, ["escort", "glass"], 2, { kind: "creditSpentMax", n: 4000 }, BLINK_JAM),
  S(2, 4, "Gravity Well", "map-lagrange", "bracket", "build", 12, ["mutant", "bigmega"], 3, { kind: "starsMadeMin", n: 4 }, BLINK_JAM),
  S(2, 5, "L5 Gate", "map-lagrange", "steps", "story", 12, ["mutant", "overdrive", "hardened"], 2, { kind: "leaksMax", n: 0 }, BLINK_JAM),
];

for (const s of CAMPAIGN_STAGES) {
  if (s.waves % WAVES_PER_ROUND !== 0) throw new Error(`campaign stage ${s.id}: waves must be a multiple of ${WAVES_PER_ROUND}`);
}

export const CAMPAIGN_MAX_STARS = CAMPAIGN_STAGES.length * 3;

export function stageById(id: string | null | undefined): CampaignStage | undefined {
  return id ? CAMPAIGN_STAGES.find((s) => s.id === id) : undefined;
}

export function stagesOf(sector: number): CampaignStage[] {
  return CAMPAIGN_STAGES.filter((s) => s.sector === sector);
}

export function stageLabel(s: CampaignStage): string {
  return `Stage ${s.sector + 1}-${s.n}`;
}

export function modeLabel(m: CampaignMode): string {
  return m === "build" ? "Build" : "Arena";
}

/** The run fields for a stage. */
export function campaignRunFor(s: CampaignStage): CampaignRun {
  return { stageId: s.id, waves: s.waves, threat: [...s.threat], mapId: s.mapId, lane: s.lane, foes: [...(s.extra ?? [])] };
}

/**
 * Stage card chips for special enemies. fresh = the first stage (campaign order) that brings it,
 * shown as "New: Blink"; later stages show "Blink".
 */
export function stageFoes(s: CampaignStage): { type: EnemyType; label: string; brief: string; fresh: boolean }[] {
  const at = CAMPAIGN_STAGES.indexOf(s);
  const before = CAMPAIGN_STAGES.slice(0, Math.max(0, at));
  return (s.extra ?? []).map((type) => {
    const fresh = !before.some((p) => p.extra?.includes(type));
    return { type, fresh, label: fresh ? `New: ${ENEMY_NAME[type]}` : ENEMY_NAME[type], brief: ENEMY_BRIEF[type] ?? "" };
  });
}

/** Coerce a saved run's campaign block. Unknown stage ids drop the block. */
export function campaignRunOf(raw: unknown): CampaignRun | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<CampaignRun>;
  const s = stageById(r.stageId);
  if (!s) return null;
  return campaignRunFor(s);
}

// ── Saves ────────────────────────────────────────────────────────────────

export function emptyCampaign(): CampaignSave {
  return { v: 1, stages: {}, claimed: [] };
}

/** Coerce whatever is stored into a valid CampaignSave. */
export function campaignOf(raw: unknown): CampaignSave {
  const out = emptyCampaign();
  if (!raw || typeof raw !== "object") return out;
  const p = raw as Partial<CampaignSave>;
  const stages = p.stages && typeof p.stages === "object" ? p.stages : {};
  for (const s of CAMPAIGN_STAGES) {
    const got = (stages as Record<string, Partial<CampaignStageSave>>)[s.id];
    if (!got) continue;
    const stars = Math.max(0, Math.min(3, Math.floor(Number(got.stars) || 0))) as 0 | 1 | 2 | 3;
    const clears = Math.max(0, Math.floor(Number(got.clears) || 0));
    const rec: CampaignStageSave = { stars, clears };
    if (Number.isFinite(got.bestLeaks)) rec.bestLeaks = Math.max(0, Math.floor(got.bestLeaks as number));
    out.stages[s.id] = rec;
  }
  const ids = new Set(CAMPAIGN_SECTORS.map((x) => x.id));
  out.claimed = Array.isArray(p.claimed) ? [...new Set(p.claimed.filter((x): x is string => typeof x === "string" && ids.has(x)))] : [];
  return out;
}

export function starsOfStage(save: CampaignSave, id: string): number {
  return save.stages[id]?.stars ?? 0;
}

export function totalStars(save: CampaignSave): number {
  let n = 0;
  for (const s of CAMPAIGN_STAGES) n += starsOfStage(save, s.id);
  return n;
}

export function sectorStars(save: CampaignSave, sector: number): number {
  let n = 0;
  for (const s of stagesOf(sector)) n += starsOfStage(save, s.id);
  return n;
}

export function sectorOpen(save: CampaignSave, sector: number): boolean {
  const def = CAMPAIGN_SECTORS[sector];
  return !!def && totalStars(save) >= def.need;
}

/** Open when its sector is open and the stage before it (same sector) has ≥1 ★. */
export function stageOpen(save: CampaignSave, id: string): boolean {
  const s = stageById(id);
  if (!s || !sectorOpen(save, s.sector)) return false;
  if (s.n === 1) return true;
  const prev = stagesOf(s.sector).find((x) => x.n === s.n - 1);
  return !!prev && starsOfStage(save, prev.id) >= 1;
}

/** The stage after this one, if any (may still be locked). */
export function nextStage(id: string): CampaignStage | undefined {
  const i = CAMPAIGN_STAGES.findIndex((s) => s.id === id);
  return i >= 0 ? CAMPAIGN_STAGES[i + 1] : undefined;
}

// ── Scoring ──────────────────────────────────────────────────────────────

/** What the run measured. Read from the World at stage end. */
export type CampaignStats = {
  wavesCleared: number;
  runLeaks: number;
  upgradesMade: number;
  gunsPeak: number;
  reactions: number;
  starsMade: number;
  runTime: number;
  creditSpent: number;
};

export type StarCheck = { ok: boolean; label: string; rule: string; value: number };

function ruleValue(kind: StarRuleKind, st: CampaignStats): number {
  switch (kind) {
    case "leaksMax":
      return st.runLeaks;
    case "picksMax":
    case "picksMin":
      return st.upgradesMade;
    case "gunsMax":
      return st.gunsPeak;
    case "reactionsMin":
      return st.reactions;
    case "starsMadeMin":
      return st.starsMade;
    case "timeMax":
      return Math.round(st.runTime);
    case "creditSpentMax":
      return Math.round(st.creditSpent);
  }
}

const RULE_NAME: Record<StarRuleKind, string> = {
  leaksMax: "Leaks",
  picksMax: "Picks",
  picksMin: "Picks",
  gunsMax: "Guns",
  reactionsMin: "Reactions",
  starsMadeMin: "Merges",
  timeMax: "Time",
  creditSpentMax: "Credit spent",
};

function isMax(kind: StarRuleKind): boolean {
  return kind.endsWith("Max");
}

function fmtTime(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function fmtVal(kind: StarRuleKind, v: number): string {
  return kind === "timeMax" ? fmtTime(v) : String(v);
}

/** Plain sentence for a rule, for the stage card. */
export function ruleText(r: StarRule): string {
  switch (r.kind) {
    case "leaksMax":
      return r.n === 0 ? "No leaks" : `Leak ${r.n} or fewer`;
    case "picksMax":
      return `${r.n} tree picks or fewer`;
    case "picksMin":
      return `Make ${r.n}+ tree picks`;
    case "gunsMax":
      return `Field ${r.n} guns or fewer`;
    case "reactionsMin":
      return `Trigger ${r.n}+ reactions`;
    case "starsMadeMin":
      return `Merge ${r.n}+ ★ guns`;
    case "timeMax":
      return `Clear in ${fmtTime(r.n)} or less`;
    case "creditSpentMax":
      return `Spend ${r.n} Credit or less`;
  }
}

/** The three rules of a stage, in ★ order. */
export function stageRules(s: CampaignStage): { text: string; rule: StarRule | null }[] {
  const leak: StarRule = { kind: "leaksMax", n: s.leaks };
  return [
    { text: `Hold all ${s.waves} waves`, rule: null },
    { text: ruleText(leak), rule: leak },
    { text: ruleText(s.twist), rule: s.twist },
  ];
}

function check(r: StarRule, st: CampaignStats): StarCheck {
  const value = ruleValue(r.kind, st);
  const ok = isMax(r.kind) ? value <= r.n : value >= r.n;
  return { ok, value, rule: ruleText(r), label: `${RULE_NAME[r.kind]} ${fmtVal(r.kind, value)} / ${fmtVal(r.kind, r.n)}` };
}

/**
 * Score a finished stage. Returns one check per ★ rule, and the stars earned.
 * Stars only count on a win (★1 = cleared every wave). ★2 and ★3 are independent.
 */
export function scoreStages(stage: CampaignStage, st: CampaignStats): { checks: StarCheck[]; stars: 0 | 1 | 2 | 3 } {
  const won = st.wavesCleared >= stage.waves;
  const c1: StarCheck = {
    ok: won,
    value: st.wavesCleared,
    rule: `Hold all ${stage.waves} waves`,
    label: `Waves ${Math.min(st.wavesCleared, stage.waves)} / ${stage.waves}`,
  };
  const c2 = check({ kind: "leaksMax", n: stage.leaks }, st);
  const c3 = check(stage.twist, st);
  const checks = [c1, { ...c2, ok: won && c2.ok }, { ...c3, ok: won && c3.ok }];
  const stars = (checks.filter((c) => c.ok).length as 0 | 1 | 2 | 3);
  return { checks, stars };
}

/** Alias: stars only. */
export function scoreStars(stage: CampaignStage, st: CampaignStats): 0 | 1 | 2 | 3 {
  return scoreStages(stage, st).stars;
}

/** What a finished stage paid, for the star reveal. */
export type CampaignResult = {
  stageId: string;
  stars: 0 | 1 | 2 | 3;
  prevStars: number;
  checks: StarCheck[];
  newStars: number;
  credit: number;
  passXp: number;
  firstClear: boolean;
  sectorReward: string | null;
};
