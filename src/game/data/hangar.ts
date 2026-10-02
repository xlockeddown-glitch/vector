import { PARAMS } from "../params";
import type { Grade, HangarId, HangarRanks, SkinId } from "../types";

export type HangarItem = {
  id: HangarId;
  name: string;
  blurb: string;
  cost: number;
  max: number;
  per: string;
};

export const HANGAR: HangarItem[] = [
  {
    id: "life",
    name: "Spare hatch",
    blurb: "Home starts with extra lives each run.",
    cost: PARAMS.keepCost.life,
    max: 4,
    per: "+1 life / rank",
  },
  {
    id: "gold",
    name: "Starter credit",
    blurb: "Each run banks more.",
    cost: PARAMS.keepCost.gold,
    max: 5,
    per: "+15 Credit / rank",
  },
  {
    id: "luck",
    name: "Hotter packs",
    blurb: "Every pack this run bumps one rarity.",
    cost: PARAMS.keepCost.luck,
    max: 2,
    per: "+1 rarity bump / rank",
  },
  {
    id: "pad",
    name: "Spare moon",
    blurb: "One extra moon on the field.",
    cost: PARAMS.keepCost.pad,
    max: 1,
    per: "+1 moon / rank",
  },
];

export const SKIN_FLUX: Partial<Record<SkinId, number>> = {
  chrome: PARAMS.skinCost.chrome,
  ember: PARAMS.skinCost.ember,
  ion: PARAMS.skinCost.ion,
  gold: PARAMS.skinCost.gold,
  void: PARAMS.skinCost.void,
};

export const GOLD_PER_FLUX = PARAMS.goldPerFlux;
export const GOLD_PER_RANK = 15;
export const CREDIT_SPARE = 5;
/** Credit paid when a bonus would have opened a pack. Spend it on the gun tree. */
export const BONUS_CREDIT = 20;

export function emptyHangar(): HangarRanks {
  return { life: 0, gold: 0, luck: 0, pad: 0 };
}

export function hangarOf(h: Partial<HangarRanks> | undefined): HangarRanks {
  return { ...emptyHangar(), ...h };
}

export function hangarItem(id: HangarId): HangarItem | undefined {
  return HANGAR.find((x) => x.id === id);
}

export function hangarCost(item: HangarItem, rank: number): number {
  return item.cost + rank * Math.round(item.cost * 0.35);
}

export function fluxFromRound(grade: Grade, kills: number, leaks: number): number {
  const g = PARAMS.fluxGrade[grade];
  return g + Math.floor(kills / PARAMS.fluxKillEvery) + (leaks === 0 ? PARAMS.fluxClean : 0);
}

export function fluxFromBank(points: number): number {
  return Math.max(0, Math.floor(points / GOLD_PER_FLUX));
}

export function hangarStartCredit(ranks: HangarRanks): number {
  return (ranks.gold ?? 0) * GOLD_PER_RANK;
}

/** @deprecated use hangarStartCredit */
export function hangarStartGold(ranks: HangarRanks): number {
  return hangarStartCredit(ranks);
}