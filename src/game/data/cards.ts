import type { CardDef, OpId, OpeningRound, RolledCard, SetId, TowerStats } from "../types";
import { PARAMS } from "../params";
import { OPERATORS, comboRank } from "./sets";
import { applyJobList, applyTunes } from "./tunes";
import { companionBars, craftHook } from "./companion";
import { coverHits, coverRangeMul } from "../cover";
import { TOWERS } from "./towers";
import { SKILLS } from "./skills";
import { SET_CARDS, SIGNAL_CARDS } from "./signals";
import "./gun-tree";

export const OPENING_ROUNDS: OpeningRound[] = [
  {
    kind: "set",
    title: "Pick two guns",
    sub: "Three pairs. Take one.",
  },
  {
    kind: "tower",
    title: "Pick a gun",
    sub: "Three cards. Take one.",
  },
  {
    kind: "tower",
    title: "Pick a gun",
    sub: "Three cards. Take one.",
  },
  {
    kind: "tower",
    title: "Pick a gun",
    sub: "Three cards. Take one. Then you plant.",
  },
  {
    kind: "signal",
    title: "Pick a rule",
    sub: "It lasts the whole run. Not a gun.",
  },
  {
    kind: "signal",
    title: "Pick a rule",
    sub: "One more. Then you plant.",
  },
];

const ENVS: CardDef[] = [
  { id: "blizzard", name: "Drift", kind: "environment", rarity: "rare", art: "env-blizzard", set: "cold", cost: 0, blurb: "The road is slow.", env: { slowMul: 0.58 } },
  { id: "gas", name: "Nebula", kind: "environment", rarity: "rare", art: "env-gas", set: "iron", cost: 0, blurb: "Poison.", env: { poisonDps: 8 } },
  { id: "hail", name: "Debris", kind: "environment", rarity: "uncommon", art: "env-hail", set: "cold", cost: 0, blurb: "Chips everyone.", env: { chipDps: 6 } },
  { id: "static", name: "Static", kind: "environment", rarity: "uncommon", art: "env-static", set: "spark", cost: 0, blurb: "Shots jump.", env: { shred: 0.08 } },
  { id: "ion", name: "Ion rain", kind: "environment", rarity: "rare", art: "env-ion", set: "heat", cost: 0, blurb: "A little burn.", env: { dmgAmp: 0.08 } },
  { id: "slick", name: "Slick", kind: "environment", rarity: "uncommon", art: "env-slick", set: "cold", cost: 0, blurb: "They crawl.", env: { slowMul: 0.7 } },
  { id: "solar", name: "Solar", kind: "environment", rarity: "rare", art: "env-solar", set: "heat", cost: 0, blurb: "Guns hit harder.", env: { dmgAmp: 0.1 } },
];

const MAPS: CardDef[] = [
  { id: "map-mare", name: "Mare", kind: "map", rarity: "rare", art: "map-mare", set: "cold", cost: 0, blurb: "Slow road.", map: { theme: "water", slowMul: 0.92 } },
  { id: "map-regolith", name: "Dust", kind: "map", rarity: "rare", art: "map-regolith", set: "heat", cost: 0, blurb: "Kills pay a bit more.", map: { theme: "earth", goldMul: 1.12 } },
  { id: "map-void", name: "Void", kind: "map", rarity: "rare", art: "map-void", set: "spark", cost: 0, blurb: "Fast enemies. Longer guns.", map: { theme: "space", rangeMul: 1.08 } },
  { id: "map-helios", name: "Helios", kind: "map", rarity: "epic", art: "map-helios", set: "heat", cost: 0, blurb: "The road burns.", map: { theme: "earth", burn: 4 } },
  { id: "map-lagrange", name: "Lagrange", kind: "map", rarity: "epic", art: "map-lagrange", set: "iron", cost: 0, blurb: "One extra moon.", map: { theme: "space", pads: 1 } },
];

const HOME: CardDef = {
  id: "home",
  name: "Home",
  kind: "defender",
  rarity: "legendary",
  art: "home",
  set: null,
  cost: 0,
  blurb: "Always shoots.",
  stats: { damage: 18, rate: 1.1, range: 240, projectile: "arrow", cover: "circle" },
};

function craft(
  id: string,
  name: string,
  rarity: CardDef["rarity"],
  set: SetId | null,
  blurb: string,
  companion: NonNullable<CardDef["companion"]>,
): CardDef {
  return { id, name, kind: "companion", rarity, art: id, set, cost: 0, blurb, companion };
}

const COMPANIONS: CardDef[] = [
  craft("comp-auger", "Auger", "legendary", "iron", "A hole in the road. They slog in it.", { role: "borer", dps: 28, radius: 96, tauntRate: 1, intercept: 0.2, cutDps: 16, cutSlow: 0.62 }),
  craft("comp-boost", "Boost", "epic", "heat", "Guns under her shoot faster.", { role: "rocket", dps: 23, radius: 84, tauntRate: 1, intercept: 1, buffRate: 0.35, burnDps: 4 }),
  craft("comp-shrike", "Shrike", "epic", "heat", "Peels armor. Eats grenades.", { role: "jet", dps: 21, radius: 90, tauntRate: 1.1, intercept: 0.9, shred: 0.16 }),
  craft("comp-torch", "Torch", "rare", "heat", "Fire. It hops.", { role: "hunter", dps: 18, radius: 86, tauntRate: 1, burnDps: 10 }),
  craft("comp-kelvin", "Kelvin", "rare", "cold", "Freezes.", { role: "ship", dps: 16, radius: 88, tauntRate: 1, slowMul: 0.62 }),
  craft("comp-joule", "Joule", "rare", "spark", "Knocks them back.", { role: "racer", dps: 17, radius: 82, tauntRate: 1.15, knock: 18 }),
  craft("comp-rook", "Hauler", "rare", "iron", "Guns near her reach farther.", { role: "ship", dps: 15, radius: 80, tauntRate: 0.9, coreGuard: 0.1, intercept: 0.7 }),
  craft("comp-zeek", "Zeek", "rare", "spark", "Drags them back.", { role: "ufo", dps: 14, radius: 78, tauntRate: 1, knock: 36 }),
  craft("comp-torr", "Torr", "rare", "heat", "Torr's kills pay.", { role: "hunter", dps: 16, radius: 84, tauntRate: 1, goldMul: 1.18 }),
  craft("comp-halo", "Gyre", "uncommon", "spark", "A ring. Guns in it shoot faster.", { role: "orb", dps: 10, radius: 70, tauntRate: 0.6, buffRate: 0.55 }),
  craft("comp-poppy", "Poppy", "uncommon", null, "Heals. Guns near her hurry.", { role: "spinner", dps: 12, radius: 76, tauntRate: 0.8, heal: 14, buffRate: 0.2 }),
  craft("comp-puck", "Bumper", "uncommon", "iron", "Shoves the clump home.", { role: "puck", dps: 13, radius: 72, tauntRate: 1, knock: 28 }),
  craft("comp-chis", "Chis", "uncommon", "spark", "Heals them and walks them home.", { role: "medic", dps: 9, radius: 92, tauntRate: 0.7, heal: 18 }),
  craft("comp-sink", "Sink", "legendary", "iron", "Throws their grenades back.", { role: "lens", dps: 10, radius: 110, tauntRate: 0.4, intercept: 48 }),
];

export const CARDS: CardDef[] = [...ENVS, ...MAPS, HOME, ...TOWERS, ...COMPANIONS, ...SKILLS, ...SET_CARDS, ...SIGNAL_CARDS];

const BY_ID = new Map(CARDS.map((c) => [c.id, c]));

export function getCard(id: string): CardDef {
  const c = BY_ID.get(id);
  if (!c) throw new Error(`unknown card ${id}`);
  return c;
}

export type CardBar = { key: string; label: string; value: number };

function twoBars(a: CardBar, b?: CardBar): CardBar[] {
  if (!b) return [{ ...a, value: 5 }];
  const total = a.value + b.value;
  if (total === 5) return [a, b];
  const s = 5 / Math.max(1, total);
  return [
    { ...a, value: Math.max(1, Math.round(a.value * s)) },
    { ...b, value: 0 },
  ].map((row, i, arr) => (i === arr.length - 1 ? { ...row, value: 5 - arr[0]!.value } : row));
}

export function cardBars(c: CardDef): CardBar[] {
  if (c.kind === "tower" && c.stats) {
    const s = c.stats;
    if ((s.splash ?? 0) > 0 || (s.burnDps ?? 0) > 0) return twoBars({ key: "splash", label: "Splash", value: 3 }, { key: "power", label: "Power", value: 2 });
    if ((s.slowMul ?? 1) < 1 || (s.slowT ?? 0) > 0) return twoBars({ key: "slow", label: "Slow", value: 3 }, { key: "power", label: "Power", value: 2 });
    if ((s.chain ?? 0) > 0 || (s.knock ?? 0) > 0) return twoBars({ key: "jump", label: "Jump", value: 3 }, { key: "power", label: "Power", value: 2 });
    if ((s.shred ?? 0) > 0) return twoBars({ key: "peel", label: "Peel", value: 3 }, { key: "power", label: "Power", value: 2 });
    if ((s.auraDps ?? 0) > 0) return twoBars({ key: "aura", label: "Aura", value: 3 }, { key: "power", label: "Power", value: 2 });
    if (s.mines) return twoBars({ key: "pit", label: "Mine", value: 3 }, { key: "power", label: "Power", value: 2 });
    return twoBars({ key: "power", label: "Power", value: 5 });
  }
  if (c.kind === "companion" && c.companion) {
    const b = companionBars(c);
    if (!b) return twoBars({ key: "power", label: "Power", value: 5 });
    return twoBars({ key: "power", label: "Power", value: Math.min(4, b.power) }, { key: "bite", label: "Bite", value: 5 - Math.min(4, b.power) });
  }
  if (c.kind === "kit" && c.kit) {
    const k = c.kit;
    if (k.healMul) return twoBars({ key: "heal", label: "Heal", value: 5 });
    if (k.slowMul || k.cutSlow) return twoBars({ key: "slow", label: "Slow", value: 3 }, { key: "power", label: "Power", value: 2 });
    if (k.shred || k.cutDps) return twoBars({ key: "peel", label: "Peel", value: 3 }, { key: "power", label: "Power", value: 2 });
    if (k.knockMul) return twoBars({ key: "jump", label: "Jump", value: 3 }, { key: "power", label: "Power", value: 2 });
    if (k.burnDps) return twoBars({ key: "splash", label: "Splash", value: 3 }, { key: "power", label: "Power", value: 2 });
    return twoBars({ key: "power", label: "Power", value: 5 });
  }
  return [];
}

export function abilityOf(card: CardDef): string {
  if (card.kind === "companion") {
    const rolled = card as CardDef & { templateId?: string };
    for (const id of [rolled.templateId, card.id, card.art]) {
      if (!id) continue;
      const hook = craftHook(id);
      if (hook !== "Flies. Makes a mess.") return hook;
    }
    return card.blurb || "Flies. Makes a mess.";
  }
  if (card.kind === "set" || card.kind === "signal") return card.blurb;
  if (card.kind === "kit" && card.kit) {
    const k = card.kit;
    const bits = [
      k.dpsMul && k.dpsMul > 1 ? `+${Math.round((k.dpsMul - 1) * 100)}% bite` : null,
      k.radiusMul && k.radiusMul > 1 ? "Wider reach" : null,
      k.healMul && k.healMul > 1 ? "Heals more" : null,
      k.burnDps ? "Burns" : null,
      k.shred ? "Peels armor" : null,
      k.knockMul && k.knockMul > 1 ? "Knocks farther" : null,
      k.slowMul ? "Slows more" : null,
      k.specialPeriodMul && k.specialPeriodMul < 1 ? "Job comes sooner" : null,
      k.interceptMul && k.interceptMul > 1 ? "Eats grenades from farther" : null,
      k.goldMul && k.goldMul > 1 ? "Kills pay extra" : null,
      k.buffMul && k.buffMul > 1 ? "Guns shoot faster" : null,
      k.hpMul && k.hpMul > 1 ? "Tougher hull" : null,
      k.cutDps ? "Cuts harder" : null,
    ].filter(Boolean);
    return bits.slice(0, 2).join(" · ") || card.blurb;
  }
  return card.blurb;
}

const AFFIX_JOB: Record<string, string> = {
  Long: "Farther",
  Heavy: "Harder hits",
  Light: "Faster shots",
  Split: "Splash",
  Jump: "Shots jump",
  Hold: "Slows",
  Saw: "Peels armor",
  Mark: "Kills pay extra",
  Hot: "Burns",
  Deep: "Stronger glow",
  Glitch: "Extra bite",
};

export function gunCardFields(card: CardDef): { does: string; hits: string; extra: string | null } {
  const rolled = card as CardDef & { affixes?: string[] };
  const extra = (rolled.affixes ?? []).map((a) => AFFIX_JOB[a] ?? a).filter(Boolean);
  return {
    does: abilityOf(card),
    hits: coverHits(card.stats?.cover),
    extra: extra.length ? extra.join(" · ") : null,
  };
}

export function upgradeCost(_card: CardDef, slotsUsed: number): number {
  if (slotsUsed <= 0) return 20;
  if (slotsUsed === 1) return 35;
  if (slotsUsed === 2) return 50;
  if (slotsUsed === 3) return 70;
  return 90;
}

export type CombatAmp = { dmg?: number; range?: number; rate?: number };

/** Level power. 1–4 match the old fuse table. Endless keeps climbing. */
export const GUN_LEVEL_MUL: Record<number, { dmg: number; rate: number; range: number; job: number }> = {
  1: { dmg: 1, rate: 1, range: 1, job: 1 },
  2: { dmg: 1.18, rate: 1.06, range: 1, job: 1 },
  3: { dmg: 1.36, rate: 1.12, range: 1.08, job: 1.1 },
  4: { dmg: 1.55, rate: 1.18, range: 1.12, job: 1.1 },
};

export function gunLevelMul(level: number) {
  const lv = Math.max(1, Math.floor(level) || 1);
  if (lv <= 4) return GUN_LEVEL_MUL[lv] ?? GUN_LEVEL_MUL[1]!;
  const over = lv - 4;
  const soft = over <= 8 ? over : 8 + (over - 8) * 0.4;
  return {
    dmg: 1.55 + 0.045 * soft,
    rate: 1.18 + 0.012 * soft,
    range: 1.12 + 0.008 * soft,
    job: 1.1,
  };
}

export function combatStats(
  card: CardDef,
  level: number,
  mod: OpId | null,
  sets: Record<SetId, number>,
  forge = 0,
  amp?: CombatAmp,
  tuneJob?: string | null,
  tuneCap?: string | null,
  jobs?: string[] | null,
): TowerStats | null {
  const s = card.stats;
  if (!s) return null;
  const lv = gunLevelMul(level);
  const stats: TowerStats = {
    ...s,
    damage: s.damage * lv.dmg,
    rate: s.rate * lv.rate,
    range: s.range * lv.range * coverRangeMul(s.cover),
    auraDps: s.auraDps ? s.auraDps * lv.dmg : s.auraDps,
    burnDps: s.burnDps ? s.burnDps * lv.job : s.burnDps,
    healAura: s.healAura ? s.healAura * lv.job : s.healAura,
    poisonDps: s.poisonDps ? s.poisonDps * lv.job : s.poisonDps,
    tribe: s.tribe ?? card.set ?? undefined,
  };

  if (mod && OPERATORS[mod]) {
    if (mod === "mul") stats.splash = (stats.splash ?? 0) + 28;
    if (mod === "add") {
      stats.slowMul = Math.min(stats.slowMul ?? 1, 0.72);
      stats.slowT = Math.max(stats.slowT ?? 0, 1.4);
    }
    if (mod === "raise") stats.chain = (stats.chain ?? 0) + 1;
    if (mod === "take") stats.shred = (stats.shred ?? 0) + 0.14;
  }

  const heat = comboRank(sets.heat ?? 0, 2);
  const spark = comboRank(sets.spark ?? 0, 2);
  if (card.set === "heat" && heat) stats.splash = (stats.splash ?? 0) + 14 * heat;
  if (card.set === "spark" && spark) stats.chain = (stats.chain ?? 0) + spark;

  if (forge > 0) {
    const m = 1 + forge * PARAMS.forgeDmg;
    stats.damage *= m;
    if (stats.auraDps) stats.auraDps *= m;
    stats.range *= 1 + forge * 0.03;
  }
  if (amp?.dmg) stats.damage *= amp.dmg;
  if (amp?.rate) stats.rate *= amp.rate;
  if (amp?.range) stats.range *= amp.range;

  const withJobs = applyJobList(stats, jobs, s.role);
  return applyTunes(withJobs, tuneJob, tuneCap, s.role);
}

export function partFitScore(gun: CardDef, part: CardDef): { score: number; match: boolean; lines: string[] } {
  const p = part.part;
  const match = !!(gun.set && part.set && gun.set === part.set);
  let score = match ? 4 : 1;
  const lines: string[] = [];
  if (match) lines.push("Same family");
  if (p?.damageMul && p.damageMul > 1) {
    score += 2;
    lines.push("More hurt");
  }
  if (p?.rateMul && p.rateMul > 1) {
    score += 2;
    lines.push("Faster shots");
  }
  if (p?.rangeMul && p.rangeMul > 1) {
    score += 1;
    lines.push("Farther");
  }
  if (p?.splash && gun.stats?.splash) {
    score += 3;
    lines.push("Splash on splash");
  }
  if (p?.chain && (gun.stats?.chain || gun.set === "spark")) {
    score += 3;
    lines.push("Jumps more");
  }
  if (p?.slowMul && gun.set === "cold") {
    score += 3;
    lines.push("Colder");
  }
  if (p?.burnDps && gun.set === "heat") {
    score += 3;
    lines.push("Hotter");
  }
  return { score, match, lines: lines.slice(0, 2) };
}

export function previewPartOnGun(gun: CardDef, part: CardDef): { before: string; after: string } | null {
  const s = gun.stats;
  const p = part.part;
  if (!s || !p) return null;
  const hurt = Math.round(s.damage);
  const hurt2 = Math.round(s.damage * (p.damageMul ?? 1));
  const bitsB = [`Hurt ${hurt}`];
  const bitsA = [`Hurt ${hurt2}`];
  if (p.rateMul) {
    bitsB.push(`Shots ${s.rate.toFixed(1)}`);
    bitsA.push(`Shots ${(s.rate * p.rateMul).toFixed(1)}`);
  }
  if (p.rangeMul) {
    bitsB.push(`Reach ${Math.round(s.range)}`);
    bitsA.push(`Reach ${Math.round(s.range * p.rangeMul)}`);
  }
  return { before: bitsB.join(" · "), after: bitsA.join(" · ") };
}
