import { levelAt } from "./levels";
import { wavePay, type TowerId } from "./matchup";
import { offerGrey, type PartId } from "./grid-parts";
import type { SkillId } from "./skills";

const KEY = "vector-grid-meta";

export type GridMeta = {
  scrap: number;
  owned: PartId[];
  equipped: Partial<Record<TowerId, PartId>>;
  best: number;
  level: number;
  skills: SkillId[];
  heat: number;
  patrolAt: number;
};

export function freshMeta(): GridMeta {
  return { scrap: 0, owned: [], equipped: {}, best: 1, level: 1, skills: [], heat: 0, patrolAt: 0 };
}

export function loadMeta(): GridMeta {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshMeta();
    const parsed = JSON.parse(raw) as Partial<GridMeta>;
    return { ...freshMeta(), ...parsed, equipped: parsed.equipped ?? {}, owned: parsed.owned ?? [], skills: parsed.skills ?? [] };
  } catch {
    return freshMeta();
  }
}

export function saveMeta(meta: GridMeta) {
  localStorage.setItem(KEY, JSON.stringify(meta));
}

/** Fifteen percent of one clear, every ten minutes, six hours then it stops. */
export function settlePatrol(meta: GridMeta, now: number) {
  if (!meta.patrolAt) {
    meta.patrolAt = now;
    return { meta, gained: 0 };
  }
  const minutes = Math.min(360, Math.floor(Math.max(0, now - meta.patrolAt) / 60000));
  const ticks = Math.floor(minutes / 10);
  const pay = Math.round(0.15 * wavePay(levelAt(Math.max(1, meta.best)).waves));
  const gained = ticks * Math.max(1, pay);
  meta.scrap += gained;
  meta.patrolAt = now;
  return { meta, gained };
}

export function openGrey(meta: GridMeta, seed: number) {
  if (meta.scrap < 40) return null;
  meta.scrap -= 40;
  const part = offerGrey(seed)[0];
  if (!part) return null;
  const duplicate = meta.owned.includes(part);
  if (duplicate) meta.scrap += 15;
  else meta.owned.push(part);
  return { part, duplicate };
}
