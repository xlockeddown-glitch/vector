/** Quiet-level parts. RNG ranges. Held in the hand. Twin, bounce, and Echo are the crazy ones. */

export type PartKind = "gun" | "craft";
export type PartRarity = "common" | "rare" | "legendary";

export type PartDef = {
  id: string;
  name: string;
  kind: PartKind;
  rarity: PartRarity;
  gun?: {
    damageMul?: [number, number];
    rateMul?: [number, number];
    rangeMul?: [number, number];
    splash?: [number, number];
    burnDps?: [number, number];
    poisonDps?: [number, number];
    healAura?: [number, number];
    knock?: [number, number];
    slowMul?: [number, number];
    slowT?: [number, number];
    chain?: boolean;
    extraShot?: boolean;
  };
  craft?: {
    dpsMul?: [number, number];
    radiusMul?: [number, number];
    hpMul?: [number, number];
    speedMul?: [number, number];
    interceptMul?: [number, number];
    healMul?: [number, number];
    burnDps?: [number, number];
    clone?: boolean;
  };
};

export type PartRoll = {
  id: string;
  uid: string;
  name: string;
  blurb: string;
  kind: PartKind;
  rarity: PartRarity;
  gun?: {
    damageMul?: number;
    rateMul?: number;
    rangeMul?: number;
    splash?: number;
    burnDps?: number;
    poisonDps?: number;
    healAura?: number;
    knock?: number;
    slowMul?: number;
    slowT?: number;
    chain?: boolean;
    extraShot?: boolean;
  };
  craft?: {
    dpsMul?: number;
    radiusMul?: number;
    hpMul?: number;
    speedMul?: number;
    interceptMul?: number;
    healMul?: number;
    burnDps?: number;
    clone?: boolean;
  };
};

export const PARTS: PartDef[] = [
  { id: "p-bore", name: "Bore", kind: "gun", rarity: "common", gun: { damageMul: [1.18, 1.34] } },
  { id: "p-clip", name: "Clip", kind: "gun", rarity: "common", gun: { rateMul: [1.18, 1.34] } },
  { id: "p-scope", name: "Scope", kind: "gun", rarity: "common", gun: { rangeMul: [1.22, 1.4] } },
  { id: "p-slug", name: "Fat slug", kind: "gun", rarity: "common", gun: { damageMul: [1.3, 1.5] } },
  { id: "p-needle", name: "Needle", kind: "gun", rarity: "common", gun: { rateMul: [1.26, 1.44] } },
  { id: "p-splash", name: "Splash bit", kind: "gun", rarity: "rare", gun: { splash: [28, 64] } },
  { id: "p-hot", name: "Hot core", kind: "gun", rarity: "rare", gun: { burnDps: [8, 16], damageMul: [1.16, 1.28] } },
  { id: "p-cool", name: "Cooler", kind: "gun", rarity: "rare", gun: { rateMul: [1.16, 1.28], damageMul: [1.16, 1.24] } },
  { id: "p-ice", name: "Ice bit", kind: "gun", rarity: "rare", gun: { slowMul: [0.52, 0.7], slowT: [1.2, 2.2] } },
  { id: "p-sting", name: "Sting", kind: "gun", rarity: "rare", gun: { poisonDps: [8, 16] } },
  { id: "p-heart", name: "Heart bit", kind: "gun", rarity: "rare", gun: { healAura: [10, 18] } },
  { id: "p-shove", name: "Shove bit", kind: "gun", rarity: "rare", gun: { knock: [22, 48] } },
  { id: "p-twin", name: "Twin barrels", kind: "gun", rarity: "legendary", gun: { extraShot: true } },
  { id: "p-bounce", name: "Ricochet", kind: "gun", rarity: "legendary", gun: { chain: true } },
  { id: "p-thruster", name: "Thruster", kind: "craft", rarity: "common", craft: { speedMul: [1.18, 1.34] } },
  { id: "p-plate", name: "Hull plate", kind: "craft", rarity: "common", craft: { hpMul: [1.2, 1.38] } },
  { id: "p-bite", name: "Bite", kind: "craft", rarity: "common", craft: { dpsMul: [1.18, 1.34] } },
  { id: "p-reach", name: "Reach", kind: "craft", rarity: "rare", craft: { radiusMul: [1.18, 1.34] } },
  { id: "p-net", name: "Catch net", kind: "craft", rarity: "rare", craft: { interceptMul: [1.2, 1.5] } },
  { id: "p-patch", name: "Patch kit", kind: "craft", rarity: "rare", craft: { healMul: [1.2, 1.38] } },
  { id: "p-after", name: "Afterburn", kind: "craft", rarity: "rare", craft: { speedMul: [1.18, 1.32], burnDps: [8, 16] } },
  { id: "p-magnet", name: "Magnet", kind: "craft", rarity: "rare", craft: { interceptMul: [1.18, 1.38], radiusMul: [1.16, 1.26] } },
  { id: "p-clone", name: "Echo", kind: "craft", rarity: "legendary", craft: { clone: true } },
  { id: "p-void", name: "Void plate", kind: "craft", rarity: "legendary", craft: { hpMul: [1.28, 1.42], interceptMul: [1.2, 1.38] } },
];

export function partOf(id: string | null | undefined): PartDef | undefined {
  if (!id) return undefined;
  const base = id.split(":")[0];
  return PARTS.find((p) => p.id === base);
}

function hashStr(s: string): number {
  let n = 2166136261;
  for (let i = 0; i < s.length; i++) n = Math.imul(n ^ s.charCodeAt(i), 16777619);
  return n >>> 0;
}

function rollRange(min: number, max: number, seed: number): number {
  const t = ((seed >>> 0) % 1000) / 1000;
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return lo + (hi - lo) * t;
}

/** Player buffs never go under +16%. Signed seeds used to undershoot. */
function rollBuff(min: number, max: number, seed: number): number {
  const lo = Math.max(1.16, min);
  const hi = Math.max(lo + 0.08, max);
  return +Math.max(lo, rollRange(lo, hi, seed)).toFixed(2);
}

function pct(n: number): number {
  return Math.round((n - 1) * 100);
}

function plusPct(n: number): string {
  return `+${Math.max(16, pct(n))}%`;
}

function blurbOf(def: PartDef, roll: PartRoll): string {
  if (def.gun?.extraShot) return "Two barrels. This gun shoots twice.";
  if (def.gun?.chain) return "Shots jump to one more scrap.";
  if (def.craft?.clone) return "One small clone. Half as strong.";
  const bits: string[] = [];
  const g = roll.gun;
  const c = roll.craft;
  if (g?.damageMul && g.damageMul > 1) bits.push(`Hurt ${plusPct(g.damageMul)}`);
  if (g?.rateMul && g.rateMul > 1) bits.push(`Shots ${plusPct(g.rateMul)}`);
  if (g?.rangeMul && g.rangeMul > 1) bits.push(`Reach ${plusPct(g.rangeMul)}`);
  if (g?.splash) bits.push(`Splash +${Math.round(g.splash)}`);
  if (g?.burnDps) bits.push(`Burn +${Math.round(g.burnDps)}`);
  if (g?.poisonDps) bits.push(`Sting +${Math.round(g.poisonDps)}`);
  if (g?.healAura) bits.push(`Heal crafts +${Math.round(g.healAura)}`);
  if (g?.knock) bits.push(`Shove +${Math.round(g.knock)}`);
  if (g?.slowMul) bits.push(`Slow +${Math.round((1 - g.slowMul) * 100)}%`);
  if (c?.dpsMul && c.dpsMul > 1) bits.push(`Bite ${plusPct(c.dpsMul)}`);
  if (c?.speedMul && c.speedMul > 1) bits.push(`Fly ${plusPct(c.speedMul)}`);
  if (c?.hpMul && c.hpMul > 1) bits.push(`Hull ${plusPct(c.hpMul)}`);
  if (c?.radiusMul && c.radiusMul > 1) bits.push(`Reach ${plusPct(c.radiusMul)}`);
  if (c?.interceptMul && c.interceptMul > 1) bits.push(`Catch ${plusPct(c.interceptMul)}`);
  if (c?.healMul && c.healMul > 1) bits.push(`Heal ${plusPct(c.healMul)}`);
  if (c?.burnDps) bits.push(`Burn +${Math.round(c.burnDps)}`);
  return bits.slice(0, 2).join(". ") + ".";
}

export function rollPart(def: PartDef, seed: string): PartRoll {
  const n = hashStr(seed + def.id);
  const roll: PartRoll = {
    id: `${def.id}:${n.toString(16).slice(0, 5)}`,
    uid: seed,
    name: def.name,
    blurb: "",
    kind: def.kind,
    rarity: def.rarity,
  };
  if (def.gun) {
    roll.gun = {};
    if (def.gun.damageMul) roll.gun.damageMul = rollBuff(def.gun.damageMul[0], def.gun.damageMul[1], n);
    if (def.gun.rateMul) roll.gun.rateMul = rollBuff(def.gun.rateMul[0], def.gun.rateMul[1], n >>> 3);
    if (def.gun.rangeMul) roll.gun.rangeMul = rollBuff(def.gun.rangeMul[0], def.gun.rangeMul[1], n >>> 6);
    if (def.gun.splash) roll.gun.splash = Math.round(rollRange(def.gun.splash[0], def.gun.splash[1], n >>> 2));
    if (def.gun.burnDps) roll.gun.burnDps = Math.round(rollRange(def.gun.burnDps[0], def.gun.burnDps[1], n >>> 4));
    if (def.gun.poisonDps) roll.gun.poisonDps = Math.round(rollRange(def.gun.poisonDps[0], def.gun.poisonDps[1], n >>> 5));
    if (def.gun.healAura) roll.gun.healAura = Math.round(rollRange(def.gun.healAura[0], def.gun.healAura[1], n >>> 7));
    if (def.gun.knock) roll.gun.knock = Math.round(rollRange(def.gun.knock[0], def.gun.knock[1], n >>> 1));
    if (def.gun.slowMul) roll.gun.slowMul = +rollRange(def.gun.slowMul[0], def.gun.slowMul[1], n >>> 8).toFixed(2);
    if (def.gun.slowT) roll.gun.slowT = +rollRange(def.gun.slowT[0], def.gun.slowT[1], n >>> 9).toFixed(1);
    if (def.gun.extraShot) roll.gun.extraShot = true;
    if (def.gun.chain) roll.gun.chain = true;
  }
  if (def.craft) {
    roll.craft = {};
    if (def.craft.dpsMul) roll.craft.dpsMul = rollBuff(def.craft.dpsMul[0], def.craft.dpsMul[1], n);
    if (def.craft.radiusMul) roll.craft.radiusMul = rollBuff(def.craft.radiusMul[0], def.craft.radiusMul[1], n >>> 3);
    if (def.craft.hpMul) roll.craft.hpMul = rollBuff(def.craft.hpMul[0], def.craft.hpMul[1], n >>> 6);
    if (def.craft.speedMul) roll.craft.speedMul = rollBuff(def.craft.speedMul[0], def.craft.speedMul[1], n >>> 2);
    if (def.craft.interceptMul) roll.craft.interceptMul = rollBuff(def.craft.interceptMul[0], def.craft.interceptMul[1], n >>> 4);
    if (def.craft.healMul) roll.craft.healMul = rollBuff(def.craft.healMul[0], def.craft.healMul[1], n >>> 5);
    if (def.craft.burnDps) roll.craft.burnDps = Math.round(rollRange(def.craft.burnDps[0], def.craft.burnDps[1], n >>> 7));
    if (def.craft.clone) roll.craft.clone = true;
  }
  roll.blurb = blurbOf(def, roll);
  return roll;
}

export function partPackGem(level: number, seed: number): PartRarity {
  const t = seed % 100;
  const bump = Math.min(28, Math.max(0, level - 1) * 4);
  if (t < 8 + bump * 0.35) return "legendary";
  if (t < 38 + bump) return "rare";
  return "common";
}

export function dealParts(kind: PartKind, uid: string, have: string[] = [], level = 1): PartRoll[] {
  const taken = new Set(have.map((id) => id.split(":")[0]));
  const pool = PARTS.filter((p) => p.kind === kind && !taken.has(p.id));
  const seed = hashStr(uid + String(level));
  const packGem = partPackGem(level, seed);
  const preferred = pool.filter((p) => p.rarity === packGem);
  const rest = pool.filter((p) => p.rarity !== packGem);
  const out: PartDef[] = [];
  const takeUnique = (list: PartDef[], salt: number) => {
    const shuffled = list.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = (seed + salt + i * 31) % (i + 1);
      const a = shuffled[i]!;
      shuffled[i] = shuffled[j]!;
      shuffled[j] = a;
    }
    for (const x of shuffled) {
      if (out.length >= 3) break;
      if (!out.includes(x)) out.push(x);
    }
  };
  takeUnique(preferred, 3);
  takeUnique(rest, 11);
  return out.slice(0, 3).map((d, i) => {
    const roll = rollPart(d, `${uid}:${level}:${i}`);
    roll.rarity = packGem;
    return roll;
  });
}

/** Tiny percents and minuses are leftover from old rolls. */
export function partOfferWeak(rolls: PartRoll[] | null | undefined): boolean {
  if (!rolls?.length) return false;
  return rolls.some((p) => {
    const b = p.blurb ?? "";
    if (/-\d/.test(b)) return true;
    if (/\+[0-9] ?%/.test(b)) return true;
    const muls = [
      p.gun?.damageMul,
      p.gun?.rateMul,
      p.gun?.rangeMul,
      p.craft?.dpsMul,
      p.craft?.speedMul,
      p.craft?.hpMul,
      p.craft?.radiusMul,
      p.craft?.interceptMul,
      p.craft?.healMul,
    ];
    return muls.some((n) => typeof n === "number" && n > 0 && n < 1.16);
  });
}

export function refreshPartOffer(
  kind: PartKind,
  uid: string,
  have: string[],
  level: number,
  current?: PartRoll[] | null,
): PartRoll[] {
  if (current?.length && !partOfferWeak(current)) return current;
  return dealParts(kind, uid, have, level);
}

export function partName(id: string | null | undefined): string {
  return partOf(id)?.name ?? "Part";
}
