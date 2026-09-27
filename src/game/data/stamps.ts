import type { CardDef, Rarity, RolledCard } from "../types";
import { freshSeed } from "../rng";
import type { PerkRole } from "./climb";

export type StampLook = "gold-core" | "ion-path" | "void-pads" | "drift-orbit";

export type StampPerk = {
  dmg?: number;
  range?: number;
  rate?: number;
  lives?: number;
  pads?: number;
  xp?: number;
  luck?: number;
  cache?: number;
};

export type StampDef = {
  id: string;
  name: string;
  rarity: Rarity;
  blurb: string;
  role: PerkRole;
  perk?: StampPerk;
  look?: StampLook;
  unique?: boolean;
};

export const STAMPS: StampDef[] = [
  {
    id: "ion-edge",
    name: "Ion",
    rarity: "uncommon",
    blurb: "All guns bite a little more.",
    role: "Guns",
    perk: { dmg: 0.04 },
  },
  {
    id: "long-span",
    name: "Span",
    rarity: "uncommon",
    blurb: "All guns reach a little farther.",
    role: "Guns",
    perk: { range: 0.04 },
  },
  {
    id: "fast-cycle",
    name: "Cycle",
    rarity: "uncommon",
    blurb: "All guns shoot a little faster.",
    role: "Guns",
    perk: { rate: 0.04 },
  },
  {
    id: "spare-bay",
    name: "Bay",
    rarity: "rare",
    blurb: "+2 moons you can fill.",
    role: "Path",
    perk: { pads: 2 },
  },
  {
    id: "core-shield",
    name: "Shield",
    rarity: "rare",
    blurb: "Home starts with +2 lives.",
    role: "Lives",
    perk: { lives: 2 },
  },
  {
    id: "drift-gain",
    name: "Gain",
    rarity: "rare",
    blurb: "Bonus fills a little faster.",
    role: "Bonus",
    perk: { xp: 0.12 },
  },
  {
    id: "signal-boost",
    name: "Signal",
    rarity: "epic",
    blurb: "Packs roll one gem up.",
    role: "Bonus",
    perk: { luck: 1 },
  },
  {
    id: "cache-pull",
    name: "Pull",
    rarity: "epic",
    blurb: "Glyph caches give more Bonus.",
    role: "Bonus",
    perk: { cache: 0.5 },
  },
  {
    id: "gold-core",
    name: "Gold Core",
    rarity: "legendary",
    blurb: "Home burns gold.",
    role: "Lives",
    look: "gold-core",
    unique: true,
  },
  {
    id: "ion-lane",
    name: "Ion Lane",
    rarity: "epic",
    blurb: "The path runs brighter.",
    role: "Path",
    look: "ion-path",
    unique: true,
  },
  {
    id: "void-pads",
    name: "Void Pads",
    rarity: "rare",
    blurb: "Moons glow in the void.",
    role: "Path",
    look: "void-pads",
    unique: true,
  },
  {
    id: "drift-orbit",
    name: "Drift",
    rarity: "epic",
    blurb: "Guns carry an extra orbit.",
    role: "Guns",
    look: "drift-orbit",
    unique: true,
  },
];

const BY_ID = new Map(STAMPS.map((s) => [s.id, s]));
const GEM_ORDER: Rarity[] = ["uncommon", "rare", "epic", "legendary"];

export function getStamp(id: string): StampDef | undefined {
  return BY_ID.get(id);
}

export type StampState = {
  dmg: number;
  range: number;
  rate: number;
  lives: number;
  pads: number;
  xp: number;
  luck: number;
  cache: number;
  looks: StampLook[];
};

export function emptyStamps(): StampState {
  return { dmg: 1, range: 1, rate: 1, lives: 0, pads: 0, xp: 1, luck: 0, cache: 1, looks: [] };
}

export function foldStamps(ids: string[]): StampState {
  const out = emptyStamps();
  const looks = new Set<StampLook>();
  for (const id of ids) {
    const s = BY_ID.get(id);
    if (!s) continue;
    if (s.perk?.dmg) out.dmg += s.perk.dmg;
    if (s.perk?.range) out.range += s.perk.range;
    if (s.perk?.rate) out.rate += s.perk.rate;
    if (s.perk?.lives) out.lives += s.perk.lives;
    if (s.perk?.pads) out.pads += s.perk.pads;
    if (s.perk?.xp) out.xp += s.perk.xp;
    if (s.perk?.luck) out.luck += s.perk.luck;
    if (s.perk?.cache) out.cache += s.perk.cache;
    if (s.look) looks.add(s.look);
  }
  out.looks = [...looks];
  return out;
}

export function stampAsCard(s: StampDef): RolledCard {
  return {
    id: `s${s.id}-${freshSeed().toString(16)}`,
    templateId: s.id,
    name: s.name,
    kind: "stamp",
    rarity: s.rarity,
    art: s.look ? `look-${s.look}` : `stamp-${s.id}`,
    set: null,
    cost: 0,
    blurb: s.blurb,
    role: s.role,
    prefix: "",
    affixes: s.look ? ["look"] : ["perk"],
    seed: 0,
  };
}

/** One gem per pack. Mixed Moonstone next to Citrine is a bug. */
export function dealStampPack(owned: string[], count = 3): RolledCard[] {
  const have = new Set(owned);
  const pool = STAMPS.filter((s) => {
    if (s.unique && have.has(s.id)) return false;
    const n = owned.filter((id) => id === s.id).length;
    if (!s.unique && n >= 4) return false;
    return true;
  });
  const use = pool.length ? pool : STAMPS.filter((s) => !s.unique);
  const buckets = new Map<Rarity, StampDef[]>();
  for (const s of use) {
    const arr = buckets.get(s.rarity) ?? [];
    arr.push(s);
    buckets.set(s.rarity, arr);
  }
  const viable = GEM_ORDER.filter((r) => (buckets.get(r)?.length ?? 0) > 0);
  let pick: Rarity = viable[0] ?? "uncommon";
  if (viable.length) {
    const w = viable.map((r) => (r === "uncommon" ? 4 : r === "rare" ? 3 : r === "epic" ? 2 : 1));
    let n = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < viable.length; i++) {
      n -= w[i]!;
      if (n <= 0 || i === viable.length - 1) {
        pick = viable[i]!;
        break;
      }
    }
  } else {
    pick = GEM_ORDER.reduce((best, r) =>
      (buckets.get(r)?.length ?? 0) > (buckets.get(best)?.length ?? 0) ? r : best,
    );
  }
  const group = [...(buckets.get(pick) ?? use)].sort(() => Math.random() - 0.5);
  return group.slice(0, count).map(stampAsCard);
}

export function stampHint(_card: CardDef): string {
  return "Keeps across runs.";
}
