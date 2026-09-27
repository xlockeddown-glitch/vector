import { PARAMS } from "../params";
import type { Grade } from "../types";

export const ORBIT_NAME = ["Cadet", "Pilot", "Captain", "Vector", "Lord"] as const;

export function orbitRank(xp: number): number {
  const need = PARAMS.orbitNeed;
  let r = 0;
  for (let i = 1; i < need.length; i++) {
    if (xp >= need[i]!) r = i;
  }
  return r;
}

export function orbitFill(xp: number) {
  const rank = orbitRank(xp);
  const need = PARAMS.orbitNeed;
  const cur = need[rank] ?? 0;
  const next = need[rank + 1];
  const name = ORBIT_NAME[Math.min(rank, ORBIT_NAME.length - 1)] ?? "Cadet";
  if (next == null) return { rank, name, have: 1, need: 1, maxed: true };
  return { rank, name, have: Math.max(0, xp - cur), need: next - cur, maxed: false };
}

export function orbitXpFromRun(wave: number, grade: Grade | null): number {
  const g = grade ? PARAMS.orbitGrade[grade] : 1;
  return g + Math.max(0, Math.floor(wave / 2));
}
