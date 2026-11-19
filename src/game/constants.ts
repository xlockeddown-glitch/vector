import type { EnemyDef, EnemyType, Grade, Rarity } from "./types";
import { LOOP_WAVES, THEME_LEN, TOTAL_WAVES } from "./data/themes";
import { PARAMS } from "./params";
import { PALETTE } from "./data/palette";

export { TOTAL_WAVES, LOOP_WAVES, THEME_LEN, PARAMS, PALETTE };

export const WORLD = { w: 1280, h: 720 };
export const START_LIVES = PARAMS.lives;
export const MAX_TOWERS = PARAMS.padsMax;
export const HOME_PAD = "home";
export const OPENING_PICKS = PARAMS.openingPicks;
/** Hold this many waves to win. Then Keep flying or Return. */
export const WIN_WAVES = THEME_LEN;
export const MAX_COMPANIONS = PARAMS.craftsFly;
export const SKY_PAD = "sky";
export const WAVES_PER_ROUND = PARAMS.wavesPerRound;
export const MEGA_EVERY = PARAMS.megaEvery;

export const TOTAL_ROUNDS = TOTAL_WAVES / WAVES_PER_ROUND;
export const START_LEVEL = 1;
export const WAVE_XP = 14;
export const MEGA_XP = 16;
export const CACHE_XP = 8;
export const BASE_PADS = PARAMS.padsStart;
export const MAX_PADS = PARAMS.padsMax;
export const START_SWAP = PARAMS.swapsStart;
export const MAX_SWAP = PARAMS.swapsMax;

export const GRADE_XP: Record<Grade, number> = {
  S: 56,
  A: 38,
  B: 24,
  C: 12,
  D: 5,
  F: 0,
};

/** Early ranks are close. Later ones stretch. */
/**
 * XP for the next run Level. A 12-wave Arena win earns ~480 XP (measured),
 * so this lands around Level 9 by the last wave, about one Level per 1–2 waves,
 * and every Level perk (draft bump at 4, extra pick at 5, extra moon at 8) shows up in Arena.
 * Endless keeps climbing slower past 12.
 */
export function xpToNext(level: number): number {
  const lv = Math.max(1, Math.floor(level));
  if (lv <= 12) return 35 + (lv - 1) * 7;
  return Math.round(112 * Math.pow(1.12, lv - 12));
}

export function levelDraftBump(level: number): number {
  let n = 0;
  if (level >= 4) n += 1;
  if (level >= 9) n += 1;
  if (level >= 13) n += 1;
  return n;
}

export function levelExtraPicks(level: number): number {
  let n = 0;
  if (level >= 5) n += 1;
  if (level >= 11) n += 1;
  return Math.min(2, n);
}

export function levelPadBonus(level: number): number {
  return (level >= 8 ? 1 : 0) + (level >= 12 ? 1 : 0);
}

export function scrapMul(level: number): number {
  return level >= 6 ? 1.25 : 1;
}

export const ENEMIES: Record<EnemyType, EnemyDef> = {
  grunt: { hp: 190, speed: 56, gold: 10, armor: 0, radius: 17, scale: 0.9 },
  striker: { hp: 112, speed: 112, gold: 12, armor: 0, radius: 15, scale: 0.78 },
  plate: { hp: 422, speed: 41, gold: 20, armor: 0.44, radius: 20, scale: 0.92 },
  swarm: { hp: 50, speed: 90, gold: 5, armor: 0, radius: 11, scale: 0.62 },
  colossus: { hp: 2260, speed: 35, gold: 90, armor: 0.28, radius: 30, scale: 1.28 },
  titan: { hp: 5800, speed: 29, gold: 180, armor: 0.34, radius: 36, scale: 1.5 },
  cache: { hp: 242, speed: 78, gold: 48, armor: 0.08, radius: 16, scale: 0.86 },
  dart: { hp: 58, speed: 220, gold: 11, armor: 0, radius: 12, scale: 0.7 },
  medic: { hp: 310, speed: 38, gold: 28, armor: 0.12, radius: 18, scale: 0.95 },
  shard: { hp: 320, speed: 55, gold: 18, armor: 0, radius: 17, scale: 0.9 },
  warden: { hp: 450, speed: 40, gold: 30, armor: 0.2, radius: 19, scale: 0.98 },
  /** Blink: teleports forward on a timer (PARAMS.blink*). Fragile, medium speed. */
  blink: { hp: 130, speed: 70, gold: 14, armor: 0, radius: 14, scale: 0.8 },
  /** Jammer: pulses and silences nearby guns (PARAMS.jam*). Tanky, slow. */
  jammer: { hp: 620, speed: 34, gold: 34, armor: 0.15, radius: 20, scale: 1 },
};

export const ODDS: Record<Grade, Record<Rarity, number>> = {
  S: { legendary: 22, epic: 38, rare: 28, uncommon: 12, common: 0 },
  A: { legendary: 10, epic: 28, rare: 36, uncommon: 26, common: 0 },
  B: { legendary: 3, epic: 16, rare: 34, uncommon: 32, common: 15 },
  C: { legendary: 0, epic: 8, rare: 26, uncommon: 36, common: 30 },
  D: { legendary: 0, epic: 2, rare: 12, uncommon: 32, common: 54 },
  F: { legendary: 0, epic: 0, rare: 6, uncommon: 22, common: 72 },
};

export const OPENING_ODDS: Record<Rarity, number> = {
  legendary: 0,
  epic: 2,
  rare: 14,
  uncommon: 40,
  common: 44,
};
