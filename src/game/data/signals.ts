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
  { id: "set-pierce", name: "Pierce", blurb: "A line, then ice.", guns: ["longbow", "rime"], rarity: "rare" },
  { id: "set-pull", name: "Pull", blurb: "Pile them. Then bomb it.", guns: ["grove", "nightglass"], rarity: "rare" },
  { id: "set-jump", name: "Jump", blurb: "Hops. Mines on the road.", guns: ["arc", "gun-pit"], rarity: "rare" },
  { id: "set-splash", name: "Splash", blurb: "Bombs. Those kills pay.", guns: ["ember", "commissioner"], rarity: "rare" },
];

export type SignalDef = {
  id: string;
  name: string;
  blurb: string;
  rarity: Rarity;
};

export const SIGNALS: SignalDef[] = [
  { id: "sig-twin", name: "Twin spark", blurb: "One extra jump.", rarity: "epic" },
  { id: "sig-lance", name: "Deep lance", blurb: "One extra pierce.", rarity: "rare" },
  { id: "sig-freeze", name: "Long freeze", blurb: "Freeze lasts.", rarity: "rare" },
  { id: "sig-crater", name: "Fat crater", blurb: "Bigger boom.", rarity: "uncommon" },
  { id: "sig-mine", name: "Extra mine", blurb: "Two mines.", rarity: "epic" },
  { id: "sig-well", name: "Hard well", blurb: "Harder pull.", rarity: "rare" },
  { id: "sig-slam", name: "Fat slam", blurb: "Slams hit harder.", rarity: "epic" },
  { id: "sig-dock", name: "Double dock", blurb: "Ships heal more on a gun.", rarity: "uncommon" },
  { id: "sig-fast", name: "Fast craft", blurb: "Ships fly faster.", rarity: "uncommon" },
  { id: "sig-ore", name: "Ore vein", blurb: "Every kill pays more.", rarity: "rare" },
  { id: "sig-ghost", name: "Ghost hull", blurb: "The first leak is free.", rarity: "epic" },
  { id: "sig-rim", name: "Slow rim", blurb: "They crawl near Home.", rarity: "rare" },
  { id: "sig-shade", name: "Wide shade", blurb: "Guns reach farther.", rarity: "uncommon" },
  { id: "sig-hot", name: "Hot lane", blurb: "Faster guns. Faster enemies.", rarity: "legendary" },
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
