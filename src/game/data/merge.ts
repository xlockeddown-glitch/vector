import { PARAMS } from "../params";

/**
 * Build mode merging. Every copy of a gun you draft folds into the gun you
 * already have. 3 copies make ★2, 9 copies make ★3 (three ★2s' worth).
 * Stars multiply the gun's stats and open more tree picks.
 */

export const STAR_AT = [1, 3, 9] as const;
export const MAX_STARS = 3;

export function starsOf(copies: number | null | undefined): 1 | 2 | 3 {
  const n = Math.max(1, Math.floor(copies ?? 1));
  if (n >= STAR_AT[2]) return 3;
  if (n >= STAR_AT[1]) return 2;
  return 1;
}

/** Copies still needed for the next star, or null at max. */
export function copiesToNext(copies: number | null | undefined): { have: number; need: number; star: number } | null {
  const n = Math.max(1, Math.floor(copies ?? 1));
  const s = starsOf(n);
  if (s >= MAX_STARS) return null;
  const need = s === 1 ? STAR_AT[1] : STAR_AT[2];
  return { have: n, need, star: s + 1 };
}

export function starLabel(copies: number | null | undefined): string {
  return "★".repeat(starsOf(copies));
}

/** Stat multipliers for a star level. Tunable in PARAMS. */
export function starMul(copies: number | null | undefined) {
  const s = starsOf(copies) - 1;
  return {
    damage: PARAMS.starDamage[s]!,
    rate: PARAMS.starRate[s]!,
    range: PARAMS.starRange[s]!,
  };
}

/** Short line for a draft card that would merge into a gun you own. */
export function copyTag(copies: number | null | undefined): string {
  const next = copiesToNext((copies ?? 1) + 1);
  const after = (copies ?? 1) + 1;
  if (starsOf(after) > starsOf(copies)) return `Copy · makes ${starLabel(after)}`;
  if (!next) return "Copy · max ★";
  return `Copy · ${after}/${next.need} to ${"★".repeat(next.star)}`;
}
