import type { CardDef, Rarity, RolledCard, SetId, TowerStats } from "../types";
import { PARAMS } from "../params";
import { freshSeed, jitter, mulberry32, pick } from "../rng";

const PREFIX: Record<SetId, string[]> = {
  heat: ["Ion", "Flare", "Nova", "Burn"],
  cold: ["Drift", "Void", "Still", "Ice"],
  spark: ["Peak", "Arc", "Pulse", "Live"],
  iron: ["Core", "Thin", "Mass", "Cut"],
};

const GENERIC_PREFIX = ["Tuned", "First", "Next"];

type Affix = { name: string; apply: (s: TowerStats) => void };

const AFFIXES: Affix[] = [
  { name: "Long", apply: (s) => { s.range *= 1.14; s.rate *= 0.94; } },
  { name: "Heavy", apply: (s) => { s.damage *= 1.18; s.rate *= 0.92; } },
  { name: "Light", apply: (s) => { s.rate *= 1.18; s.range *= 0.94; } },
  { name: "Split", apply: (s) => { s.splash = Math.max(s.splash ?? 36, 48); } },
  { name: "Jump", apply: (s) => { s.chain = (s.chain ?? 0) + 1; } },
  { name: "Hold", apply: (s) => { s.slowT = Math.max(s.slowT ?? 0, 1.15); s.slowMul = Math.min(s.slowMul ?? 1, 0.68); } },
  { name: "Saw", apply: (s) => { s.shred = (s.shred ?? 0) + 0.14; } },
  { name: "Mark", apply: (s) => { s.markGold = (s.markGold ?? 0) + 0.22; } },
  { name: "Hot", apply: (s) => { s.burnDps = (s.burnDps ?? 0) + 5; } },
  { name: "Deep", apply: (s) => { if (s.auraDps) s.auraDps *= 1.16; else s.damage *= 1.08; } },
  { name: "Glitch", apply: (s) => { s.damage *= 1.1; s.rate *= 1.08; } },
];

const JITTER: Record<Rarity, number> = {
  common: 0.1,
  uncommon: 0.16,
  rare: 0.22,
  epic: 0.28,
  legendary: 0.34,
};

const AFFIX_N: Record<Rarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 1,
  epic: 2,
  legendary: 2,
};

function cloneStats(s: TowerStats): TowerStats {
  return { ...s };
}

export function rollCard(template: CardDef, rarity: Rarity, seed = freshSeed(), forge = 0): RolledCard {
  const rng = mulberry32(seed);
  const amt = JITTER[rarity];
  const stats = template.stats ? cloneStats(template.stats) : undefined;
  const affixes: string[] = [];

  if (stats) {
    stats.damage = jitter(rng, stats.damage, amt);
    stats.rate = jitter(rng, stats.rate, amt * 0.7);
    stats.range = jitter(rng, stats.range, amt * 0.6);
    if (stats.auraDps) stats.auraDps = jitter(rng, stats.auraDps, amt);
    if (stats.splash) stats.splash = jitter(rng, stats.splash, amt);
    const n = AFFIX_N[rarity];
    const pool = AFFIXES.slice();
    for (let i = 0; i < n && pool.length; i++) {
      const idx = Math.floor(rng() * pool.length);
      const a = pool.splice(idx, 1)[0]!;
      a.apply(stats);
      affixes.push(a.name);
    }
    if (forge > 0) {
      const m = 1 + forge * PARAMS.forgeDmg;
      stats.damage *= m;
      if (stats.auraDps) stats.auraDps *= m;
      stats.range *= 1 + forge * 0.03;
    }
  }

  const env = template.env
    ? {
        ...template.env,
        slowMul: template.env.slowMul ? Math.min(0.95, jitter(rng, template.env.slowMul, amt * 0.4)) : undefined,
        poisonDps: template.env.poisonDps ? jitter(rng, template.env.poisonDps, amt) : undefined,
        chipDps: template.env.chipDps ? jitter(rng, template.env.chipDps, amt) : undefined,
        dmgAmp: template.env.dmgAmp ? jitter(rng, template.env.dmgAmp, amt) : undefined,
        shred: template.env.shred,
      }
    : undefined;

  const prefix = template.set ? pick(rng, PREFIX[template.set]) : pick(rng, GENERIC_PREFIX);

  return {
    ...template,
    id: `r${seed.toString(16)}`,
    templateId: template.id,
    name: template.name,
    rarity,
    blurb: template.blurb,
    stats,
    env,
    prefix,
    affixes,
    seed,
  };
}

export function addGlitch(card: RolledCard) {
  if (!card.stats) {
    card.affixes = [...card.affixes, "Glitch"];
    return card;
  }
  card.stats.damage *= 1.1;
  card.stats.rate *= 1.08;
  card.affixes = [...card.affixes, "Glitch"];
  return card;
}

export function addSpice(card: RolledCard) {
  const pool = AFFIXES.filter((a) => a.name !== "Glitch" && !card.affixes.includes(a.name));
  if (!pool.length) return addGlitch(card);
  const a = pool[Math.floor(Math.random() * pool.length)]!;
  if (card.stats) a.apply(card.stats);
  card.affixes = [...card.affixes, a.name];
  return card;
}

export function rollMany(
  templates: CardDef[],
  rarityFor: (t: CardDef) => Rarity,
  forge: Record<string, number>,
): RolledCard[] {
  return templates.map((t) => rollCard(t, rarityFor(t), freshSeed(), forge[t.id] ?? 0));
}
