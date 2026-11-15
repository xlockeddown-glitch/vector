import type { SkinId } from "../types";
import { skinById } from "./skins";
import { VAULT } from "./vault";

/**
 * Battle pass. One free season track: play runs, earn Pass XP, climb tiers.
 * Every tier pays out automatically. Rewards are Vault Credit, Vault looks
 * (Outfit and Sky items, granted free) and craft skins. Looks only:
 * nothing on the pass makes guns stronger. Saved in the browser with the rest of the meta.
 */

export type PassReward =
  | { kind: "credit"; n: number }
  | { kind: "vault"; id: string }
  | { kind: "skin"; id: SkinId }
  | { kind: "badge"; name: string };

export type PassTier = { tier: number; reward: PassReward };

export type PassSave = { season: string; xp: number; claimed: number; badges: string[] };

export const SEASON = {
  id: "s1",
  name: "Season 1 · Neon Drift",
  tiers: 30,
  xpPerTier: 100,
};

/** Pass XP for a finished run: 10 per wave cleared, +50 for holding 12 (short campaign stages don't count), +5 per star made in Build. */
export function passXpFromRun(opts: { wavesCleared: number; won: boolean; starsMade?: number }): number {
  return Math.max(0, Math.floor(opts.wavesCleared)) * 10 + (opts.won && opts.wavesCleared >= 12 ? 50 : 0) + Math.max(0, opts.starsMade ?? 0) * 5;
}

const LOOK: Record<number, PassReward> = {
  3: { kind: "vault", id: "path_frost" },
  5: { kind: "badge", name: "Drifter" },
  6: { kind: "vault", id: "chrome_lip" },
  7: { kind: "skin", id: "synthwave" },
  9: { kind: "vault", id: "path_ion" },
  10: { kind: "skin", id: "chrome" },
  12: { kind: "vault", id: "frost_trail" },
  13: { kind: "skin", id: "circuit" },
  15: { kind: "badge", name: "Neon Ace" },
  16: { kind: "vault", id: "path_ember" },
  17: { kind: "badge", name: "Streaker" },
  18: { kind: "vault", id: "shooting_stars" },
  19: { kind: "skin", id: "prism" },
  20: { kind: "skin", id: "ion" },
  21: { kind: "badge", name: "Closer" },
  22: { kind: "vault", id: "amethyst_frame" },
  23: { kind: "skin", id: "ghost" },
  24: { kind: "vault", id: "distant_sun" },
  25: { kind: "badge", name: "Reactor" },
  26: { kind: "vault", id: "night_glass" },
  27: { kind: "skin", id: "holo" },
  28: { kind: "skin", id: "void" },
  29: { kind: "vault", id: "signature" },
  30: { kind: "skin", id: "nova" },
};

export const PASS_TIERS: PassTier[] = Array.from({ length: SEASON.tiers }, (_, i) => {
  const tier = i + 1;
  return { tier, reward: LOOK[tier] ?? { kind: "credit", n: 40 + Math.floor(tier / 5) * 20 } };
});

export function emptyPass(): PassSave {
  return { season: SEASON.id, xp: 0, claimed: 0, badges: [] };
}

export function passOf(p: Partial<PassSave> | undefined | null): PassSave {
  if (!p || p.season !== SEASON.id) return emptyPass();
  return {
    season: SEASON.id,
    xp: Math.max(0, Math.floor(p.xp ?? 0)),
    claimed: Math.max(0, Math.min(SEASON.tiers, Math.floor(p.claimed ?? 0))),
    badges: Array.isArray(p.badges) ? p.badges.filter((b) => typeof b === "string") : [],
  };
}

export function passTier(xp: number): number {
  return Math.min(SEASON.tiers, Math.floor(Math.max(0, xp) / SEASON.xpPerTier));
}

export function passFill(xp: number) {
  const tier = passTier(xp);
  if (tier >= SEASON.tiers) return { tier, have: 1, need: 1, maxed: true };
  return { tier, have: xp - tier * SEASON.xpPerTier, need: SEASON.xpPerTier, maxed: false };
}

const vaultName = (id: string) => {
  for (const nodes of Object.values(VAULT)) {
    const n = nodes.find((x) => x.id === id);
    if (n) return n.name;
  }
  return id;
};

const SKIN_NAME: Partial<Record<SkinId, string>> = {
  chrome: "Chrome",
  ion: "Ion edge",
  void: "Void matte",
  ember: "Heat shield",
  gold: "Gold foil",
  synthwave: "Synthwave",
  circuit: "Circuit",
  prism: "Prism",
  ghost: "Ghost",
  holo: "Holo",
  nova: "Nova",
};

export function rewardLabel(r: PassReward): string {
  if (r.kind === "credit") return `${r.n} Vault Credit`;
  if (r.kind === "vault") return vaultName(r.id);
  if (r.kind === "skin") return `${SKIN_NAME[r.id] ?? skinById(r.id).name} skin`;
  return `Badge: ${r.name}`;
}

export function rewardKind(r: PassReward): string {
  if (r.kind === "credit") return "Credit";
  if (r.kind === "vault") return "Look";
  if (r.kind === "skin") return "Skin";
  return "Badge";
}

/* ---------- Daily challenges ---------- */

/** What a finished run reports. Quests count progress from these. */
export type RunStats = {
  wave?: number;
  wavesCleared?: number;
  won?: boolean;
  starsMade?: number;
  upgradesMade?: number;
  runKills?: number;
  runLeaks?: number;
  reactions?: number;
  /** Orders cast, and element reactions triggered directly by Orders (data/orders.ts). */
  ordersUsed?: number;
  orderReacts?: number;
  playMode?: string;
};

export type QuestDef = {
  id: string;
  name: string;
  goal: number;
  xp: number;
  /** Mixing group: a day never holds two quests from the same group. */
  group: string;
  /** Progress one run adds. */
  measure: (s: RunStats) => number;
};

const n = (v: number | undefined) => Math.max(0, Math.floor(v ?? 0));

export const QUEST_POOL: QuestDef[] = [
  { id: "waves20", name: "Clear 20 waves", goal: 20, xp: 60, group: "waves", measure: (s) => n(s.wavesCleared) },
  { id: "buildwin", name: "Win a Build run", goal: 1, xp: 80, group: "win", measure: (s) => (s.playMode === "build" && s.won && (s.wavesCleared ?? 0) >= 12 ? 1 : 0) },
  { id: "win", name: "Hold all 12 waves", goal: 1, xp: 70, group: "win", measure: (s) => (s.won && (s.wavesCleared ?? 0) >= 12 ? 1 : 0) },
  { id: "react50", name: "Trigger 50 reactions", goal: 50, xp: 50, group: "react", measure: (s) => n(s.reactions) },
  { id: "react150", name: "Trigger 150 reactions", goal: 150, xp: 75, group: "react", measure: (s) => n(s.reactions) },
  { id: "star1", name: "Make a ★ gun", goal: 1, xp: 45, group: "star", measure: (s) => n(s.starsMade) },
  { id: "star3", name: "Make 3 ★ guns", goal: 3, xp: 70, group: "star", measure: (s) => n(s.starsMade) },
  { id: "noleak", name: "Clear 8 waves with no leaks", goal: 1, xp: 65, group: "noleak", measure: (s) => (n(s.runLeaks) === 0 && n(s.wavesCleared) >= 8 ? 1 : 0) },
  { id: "picks8", name: "Buy 8 tree picks", goal: 8, xp: 40, group: "picks", measure: (s) => n(s.upgradesMade) },
  { id: "picks20", name: "Buy 20 tree picks", goal: 20, xp: 65, group: "picks", measure: (s) => n(s.upgradesMade) },
  { id: "kills400", name: "Defeat 400 enemies", goal: 400, xp: 45, group: "kills", measure: (s) => n(s.runKills) },
  { id: "orders6", name: "Cast 6 Orders", goal: 6, xp: 40, group: "orders", measure: (s) => n(s.ordersUsed) },
  { id: "orderreact5", name: "Trigger 5 reactions with Orders", goal: 5, xp: 55, group: "orderreact", measure: (s) => n(s.orderReacts) },
  { id: "arcade15", name: "Reach wave 15 in Arcade", goal: 1, xp: 70, group: "arcade", measure: (s) => (s.playMode === "arcade" && n(s.wave) >= 15 ? 1 : 0) },
];

export type QuestSave = { day: string; list: { id: string; progress: number; done: boolean }[] };
export type QuestView = QuestDef & { progress: number; done: boolean };

/** Local calendar day, YYYY-MM-DD. */
export function localDay(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dd}`;
}

function seeded(day: string) {
  let h = 2166136261;
  for (let i = 0; i < day.length; i++) h = Math.imul(h ^ day.charCodeAt(i), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The 3 challenges for a day. Same day, same three. */
export function dailyQuestIds(day: string): string[] {
  const rnd = seeded(day);
  const pool = [...QUEST_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const out: QuestDef[] = [];
  for (const q of pool) {
    if (out.length >= 3) break;
    if (out.some((o) => o.group === q.group)) continue;
    out.push(q);
  }
  return out.map((q) => q.id);
}

/** Today's challenges with saved progress (fresh at zero when the day changed). */
export function questsOf(save: QuestSave | undefined | null, day: string = localDay()): QuestView[] {
  const saved = save && save.day === day && Array.isArray(save.list) ? save.list : [];
  return dailyQuestIds(day).map((id) => {
    const def = QUEST_POOL.find((q) => q.id === id)!;
    const row = saved.find((r) => r.id === id);
    const progress = Math.min(def.goal, Math.max(0, Math.floor(row?.progress ?? 0)));
    return { ...def, progress, done: !!row?.done || progress >= def.goal };
  });
}

/** Adds one finished run to today's challenges. Returns the new save, the ones finished now and their XP. */
export function applyRunToQuests(save: QuestSave | undefined | null, stats: RunStats, day: string = localDay()) {
  const before = questsOf(save, day);
  const finished: QuestView[] = [];
  const after = before.map((q) => {
    if (q.done) return q;
    const progress = Math.min(q.goal, q.progress + q.measure(stats));
    const done = progress >= q.goal;
    const next = { ...q, progress, done };
    if (done) finished.push(next);
    return next;
  });
  const quests: QuestSave = { day, list: after.map((q) => ({ id: q.id, progress: q.progress, done: q.done })) };
  return { quests, finished, xp: finished.reduce((a, q) => a + q.xp, 0) };
}
