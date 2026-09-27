import { PALETTE } from "./palette";
import { PARAMS } from "../params";
import type { TowerRole } from "../types";

/** Quiet hull glow. Extra. Shots stay. Dish is the full glow hull. */
export type HullGlow = {
  auraDps?: number;
  healAura?: number;
  burnDps?: number;
  slowMul?: number;
  slowT?: number;
  shred?: number;
  markGold?: number;
};

export const HULL_GLOW: Partial<Record<TowerRole, HullGlow>> = {
  spear: { shred: 0.05 },
  crater: { burnDps: 4 },
  frost: { slowMul: 0.78, slowT: 0.55 },
  rail: { healAura: 3 },
  umbra: {},
  cascade: { auraDps: 5 },
  sweep: { slowMul: 0.82, slowT: 0.4 },
  brand: { markGold: 0.18 },
  mine: { slowMul: 0.75, slowT: 0.6 },
  orbit: { auraDps: 6 },
};

export const GLOW_COLOR: Record<string, string> = {
  spear: PALETTE.steel,
  crater: PALETTE.ember,
  frost: PALETTE.frost,
  rail: PALETTE.sage,
  umbra: PALETTE.accent,
  cascade: PALETTE.frost,
  sweep: PALETTE.paper,
  brand: PALETTE.legend,
  mine: PALETTE.faint,
  orbit: PALETTE.accent,
};

export function hullGlow(role: TowerRole | string | null | undefined): HullGlow {
  if (!role) return {};
  return HULL_GLOW[role as TowerRole] ?? {};
}

export function glowColor(role: TowerRole | string | null | undefined): string {
  if (!role) return PALETTE.accent;
  return GLOW_COLOR[role] ?? PALETTE.accent;
}

export function isGlowHull(role?: string | null, projectile?: string | null): boolean {
  return projectile === "none" || role === "umbra";
}

/** Dish uses the full shade. Everyone else gets a lip smaller than cover. */
export function glowRadius(range: number, role?: string | null, projectile?: string | null): number {
  if (isGlowHull(role, projectile)) return range;
  return range * PARAMS.glowRMul;
}

export function glowHasFx(g: HullGlow | null | undefined): boolean {
  if (!g) return false;
  return !!(g.auraDps || g.healAura || g.burnDps || g.slowT || g.shred || g.markGold);
}
