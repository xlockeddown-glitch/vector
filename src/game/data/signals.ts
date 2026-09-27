import type { CardDef, Rarity, RolledCard } from "../types";
import { rollCard } from "./roll";
import { freshSeed } from "../rng";

export type GunSet = {
  id: string;
  name: string;
  blurb: string;
  guns: [string, string];
  rarity: Rarity;
};

/** First pick: two guns that already work together. */
export const GUN_SETS: GunSet[] = [
  { id: "set-pierce", name: "Pierce", blurb: "Goes through a line. Ice slows the rest.", guns: ["longbow", "rime"], rarity: "rare" },
  { id: "set-pull", name: "Pull", blurb: "Drags enemies into a pile, then blasts the pile.", guns: ["grove", "nightglass"], rarity: "rare" },
  { id: "set-jump", name: "Jump", blurb: "Lightning hops the pack. Mines sit on the road.", guns: ["arc", "gun-pit"], rarity: "rare" },
  { id: "set-splash", name: "Splash", blurb: "Bombs the path. Kills drop extra Credit.", guns: ["ember", "commissioner"], rarity: "rare" },
];

export type SignalDef = {
  id: string;
  name: string;
  blurb: string;
  rarity: Rarity;
};

export const SIGNALS: SignalDef[] = [
  { id: "sig-twin", name: "Twin spark", blurb: "Shots jump to one extra enemy.", rarity: "epic" },
  { id: "sig-lance", name: "Deep lance", blurb: "Shots go through one extra enemy.", rarity: "rare" },
  { id: "sig-freeze", name: "Long freeze", blurb: "Freeze lasts longer.", rarity: "rare" },
  { id: "sig-crater", name: "Fat crater", blurb: "Explosions cover more ground.", rarity: "uncommon" },
  { id: "sig-mine", name: "Extra mine", blurb: "Each drop leaves two mines.", rarity: "epic" },
  { id: "sig-well", name: "Hard well", blurb: "Enemies get dragged in harder.", rarity: "rare" },
  { id: "sig-slam", name: "Fat slam", blurb: "Slamming a ship into a gun hits harder.", rarity: "epic" },
  { id: "sig-dock", name: "Double dock", blurb: "Hurt ships heal more when they rest on a gun.", rarity: "uncommon" },
  { id: "sig-fast", name: "Fast craft", blurb: "Your ships fly faster.", rarity: "uncommon" },
  { id: "sig-ore", name: "Ore vein", blurb: "Kills drop extra Credit.", rarity: "rare" },
  { id: "sig-ghost", name: "Ghost hull", blurb: "The first enemy that gets past does not count.", rarity: "epic" },
  { id: "sig-rim", name: "Slow rim", blurb: "Enemies crawl on the last stretch to home.", rarity: "rare" },
  { id: "sig-shade", name: "Wide shade", blurb: "All guns shoot farther.", rarity: "uncommon" },
  { id: "sig-hot", name: "Hot lane", blurb: "Guns shoot faster. Enemies also walk faster.", rarity: "legendary" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a;
}

export function setToCard(s: GunSet): CardDef {
  return {
    id: s.id,
    name: s.name,
    kind: "set",
    rarity: s.rarity,
    art: s.guns[0],
    set: null,
    cost: 0,
    blurb: s.blurb,
    setGuns: s.guns,
  };
}

export function signalToCard(s: SignalDef): CardDef {
  return {
    id: s.id,
    name: s.name,
    kind: "signal",
    rarity: s.rarity,
    art: s.id,
    set: null,
    cost: 0,
    blurb: s.blurb,
  };
}

export const SET_CARDS: CardDef[] = GUN_SETS.map(setToCard);
export const SIGNAL_CARDS: CardDef[] = SIGNALS.map(signalToCard);

export function dealSetOpening(count = 3): RolledCard[] {
  return shuffle(GUN_SETS)
    .slice(0, count)
    .map((s) => rollCard(setToCard(s), s.rarity, freshSeed(), 0));
}

export function dealSignalOpening(count = 3, skip: Set<string> = new Set()): RolledCard[] {
  const pool = shuffle(SIGNALS.filter((s) => !skip.has(s.id)));
  const byR = new Map<Rarity, SignalDef[]>();
  for (const s of pool) {
    const list = byR.get(s.rarity) ?? [];
    list.push(s);
    byR.set(s.rarity, list);
  }
  const full = [...byR.values()].find((list) => list.length >= count);
  const take = (full ?? pool).slice(0, count);
  const rarity = take[0]?.rarity ?? "rare";
  return take.map((s) => rollCard(signalToCard(s), rarity, freshSeed(), 0));
}

export function hasSig(ids: string[] | undefined, id: string): boolean {
  return !!ids?.includes(id);
}
