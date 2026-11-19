import { PARAMS } from "../params";
import type { Grade } from "../types";

export function orbitRank(xp: number): number {
  const need = PARAMS.orbitNeed;
  let r = 0;
  for (let i = 1; i < need.length; i++) {
    if (xp >= need[i]!) r = i;
  }
  return r;
}

export function orbitXpFromRun(wave: number, grade: Grade | null): number {
  const g = grade ? PARAMS.orbitGrade[grade] : 1;
  return g + Math.max(0, Math.floor(wave / 2));
}
