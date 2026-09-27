import { PARAMS } from "../params";
import type { Grade } from "../types";
import { skillsForCraft } from "./skills";
import type { CompanionState } from "./companion";

export const BOND_MAX = PARAMS.bondMax;
export const BOND_SPLIT = PARAMS.bondSplit;

export function xpToBond(level: number): number {
  if (level >= BOND_MAX) return 0;
  return Math.max(1, Math.round(PARAMS.bondBase * PARAMS.bondGrow ** (level - 1)));
}

export function bondLevelOf(xp: number): number {
  let lv = 1;
  let left = Math.max(0, Math.floor(xp));
  while (lv < BOND_MAX) {
    const need = xpToBond(lv);
    if (left < need) break;
    left -= need;
    lv += 1;
  }
  return lv;
}

export function bondFill(xp: number) {
  const level = bondLevelOf(xp);
  const need = xpToBond(level);
  let used = 0;
  for (let i = 1; i < level; i++) used += xpToBond(i);
  const have = Math.max(0, Math.floor(xp) - used);
  return { level, have, need: need || 1 };
}

export function bondMul(level: number) {
  const n = Math.max(0, Math.min(BOND_MAX, level) - 1);
  const soft = 1 + n * 0.005;
  return { hp: soft, dps: soft };
}

export function bondJobCount(level: number) {
  if (level >= 40) return 3;
  if (level >= 25) return 2;
  if (level >= 10) return 1;
  return 0;
}

export function bondLookCount(level: number) {
  if (level >= 50) return 3;
  if (level >= 35) return 2;
  if (level >= 15) return 1;
  return 0;
}

export function bondKits(craftId: string, level: number) {
  return skillsForCraft(craftId).slice(0, bondJobCount(level));
}

export function xpFromCraft(c: CompanionState, grade: Grade | null): number {
  const g = grade === "S" ? 5 : grade === "A" ? 4 : grade === "B" ? 3 : grade === "C" ? 2 : grade === "D" ? 1 : 0;
  const score =
    (c.roundKills ?? 0) * 1.2 +
    (c.roundSpecials ?? 0) * 2 +
    (c.roundHeals ?? 0) / 20 +
    (c.roundDmg ?? 0) / 500;
  return Math.max(1, Math.min(22, Math.round(2 + score + g)));
}
