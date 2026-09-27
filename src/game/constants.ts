import type { EnemyDef, EnemyType, Grade, Rarity, ThemeId } from "./types";
import { LOOP_WAVES, THEME_LEN, TOTAL_WAVES } from "./data/themes";
import { PARAMS } from "./params";
import { PALETTE } from "./data/palette";

export { TOTAL_WAVES, LOOP_WAVES, THEME_LEN, PARAMS, PALETTE };

export const WORLD = { w: 1280, h: 720 };
export const START_GOLD = PARAMS.goldStart;
export const START_LIVES = PARAMS.lives;
export const MAX_TOWERS = PARAMS.padsMax;
export const MAX_LEVEL = PARAMS.gunLevelMax;
export const PATH_WIDTH = 24;
export const HOME_PAD = "home";
export const OPENING_PICKS = PARAMS.openingPicks;
/** Hold this many waves to win. Then Keep flying or Return. */
export const WIN_WAVES = THEME_LEN;
export const MAX_COMPANIONS = PARAMS.craftsFly;
export const SKY_PAD = "sky";
export const WAVES_PER_ROUND = PARAMS.wavesPerRound;
export const DRAFT_PICK_COST = PARAMS.draftPickCost;
export const MAX_EXTRA_PICKS = PARAMS.extraPicksMax;
export const MEGA_EVERY = PARAMS.megaEvery;
export const GAME_NAME = "VECTOR";

export const TOTAL_ROUNDS = TOTAL_WAVES / WAVES_PER_ROUND;
export const START_LEVEL = 1;
export const WAVE_XP = 14;
export const MEGA_XP = 16;
export const CACHE_XP = 8;
export const LIVE_DRAFT = 3;
export const LIVE_TTL = 8;
export const MAX_PACK = PARAMS.packSize;
export const BASE_PADS = PARAMS.padsStart;
export const MAX_PADS = PARAMS.padsMax;
export const START_SWAP = PARAMS.swapsStart;
export const MAX_SWAP = PARAMS.swapsMax;
export const SWAP_RATE = PARAMS.swapRate;
export const SWAP_PITY = PARAMS.swapPity;

export const GRADE_XP: Record<Grade, number> = {
  S: 56,
  A: 38,
  B: 24,
  C: 12,
  D: 5,
  F: 0,
};

/** Early ranks are close. Later ones stretch. */
export function xpToNext(level: number): number {
  if (level <= 1) return 72;
  if (level === 2) return 90;
  if (level === 3) return 112;
  if (level === 4) return 138;
  if (level === 5) return 168;
  return Math.round(168 * Math.pow(1.15, level - 5));
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

export function packSizeFor(_level: number): number {
  return MAX_PACK;
}

export function scrapMul(level: number): number {
  return level >= 6 ? 1.25 : 1;
}

export function levelAbility(_level: number): string {
  return "Fill Bonus for a run perk";
}

export const RARITY_COLOR: Record<Rarity, string> = {
  common: PALETTE.moonstone,
  uncommon: PALETTE.sapphire,
  rare: PALETTE.ruby,
  epic: PALETTE.epic,
  legendary: PALETTE.legend,
};

export const GRADE_COLOR: Record<Grade, string> = {
  S: "#f0f1f4",
  A: "#9aa0ab",
  B: PALETTE.accent,
  C: "#8b8e98",
  D: PALETTE.hot,
  F: PALETTE.hot,
};

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

export const ART = {
  title: "/game/map/title.jpg",
  crystal: "/game/fx/crystal.png",
  maps: {
    water: "/game/map/space.jpg",
    earth: "/game/map/space.jpg",
    space: "/game/map/space.jpg",
  } as Record<ThemeId, string>,
  towers: {
    longbow: "/game/towers/longbow.png",
    ember: "/game/towers/ember.png",
    rime: "/game/towers/rime.png",
    arc: "/game/towers/arc.png",
    hex: "/game/towers/hex.png",
    grove: "/game/towers/grove.png",
    captain: "/game/towers/captain.png",
  } as Record<string, string>,
  enemies: {
    grunt: [1, 2, 3, 4].map((n) => `/game/enemies/grunt-${n}.png`),
    striker: [1, 2, 3, 4].map((n) => `/game/enemies/striker-${n}.png`),
    plate: [1, 2, 3, 4].map((n) => `/game/enemies/plate-${n}.png`),
    swarm: [1, 2, 3, 4].map((n) => `/game/enemies/grunt-${n}.png`),
    colossus: [1, 2, 3, 4].map((n) => `/game/enemies/colossus-${n}.png`),
    titan: [1, 2, 3, 4].map((n) => `/game/enemies/colossus-${n}.png`),
    cache: [1, 2, 3, 4].map((n) => `/game/enemies/striker-${n}.png`),
    dart: [1, 2, 3, 4].map((n) => `/game/enemies/striker-${n}.png`),
    medic: [1, 2, 3, 4].map((n) => `/game/enemies/grunt-${n}.png`),
  } as Record<EnemyType, string[]>,
};
