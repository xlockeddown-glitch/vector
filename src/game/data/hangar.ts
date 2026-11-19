import { PARAMS } from "../params";
import type { Grade, HangarRanks, SkinId } from "../types";

export const SKIN_FLUX: Partial<Record<SkinId, number>> = {
  chrome: PARAMS.skinCost.chrome,
  ember: PARAMS.skinCost.ember,
  ion: PARAMS.skinCost.ion,
  gold: PARAMS.skinCost.gold,
  void: PARAMS.skinCost.void,
  synthwave: PARAMS.skinCost.synthwave,
  circuit: PARAMS.skinCost.circuit,
};

export const GOLD_PER_FLUX = PARAMS.goldPerFlux;
export const GOLD_PER_RANK = 15;

/** Credit paid when a bonus would have opened a pack. Spend it on the gun tree. */
/** Credit paid per run Level. About one cheap tree pick. */
export const BONUS_CREDIT = 100;

export function emptyHangar(): HangarRanks {
  return { life: 0, gold: 0, luck: 0, pad: 0 };
}

export function hangarOf(h: Partial<HangarRanks> | undefined): HangarRanks {
  return { ...emptyHangar(), ...h };
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
