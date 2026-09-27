import type { CardDef, TowerStats } from "../types";
import { TOWERS } from "./towers";
import { GUN_SETS } from "./signals";

export type StatBars = {
  hurt: number;
  speed: number;
  reach: number;
  trick: number;
  trickName: string;
};

function segs(value: number, min: number, max: number): number {
  if (!(max > min)) return 3;
  const t = (value - min) / (max - min);
  return Math.max(1, Math.min(5, Math.round(1 + t * 4)));
}

function hurtOf(s: TowerStats): number {
  return s.damage > 0 ? s.damage : (s.auraDps ?? 0);
}

function speedOf(s: TowerStats): number {
  if ((s.rate ?? 0) > 0) return s.rate;
  if (s.lure) return 0.7;
  if (s.mines) return 0.45;
  return 0.3;
}

function trickNameOf(s: TowerStats): string {
  if (s.splash) return "Blast";
  if (s.lure) return "Pull";
  if (s.mines) return "Mine";
  if (s.slowT) return "Freeze";
  if (s.dockPatch) return "Heal";
  if (s.markGold) return "Ore";
  if ((s.coverArc ?? 0) > 1.3) return "Sweep";
  if ((s.chain ?? 0) >= 2) return "Jump";
  if (s.chain) return "Twin";
  if ((s.split ?? 0) > 0 || (s.coverArc ?? 0) > 1) return "Pierce";
  return "Shot";
}

function trickScore(s: TowerStats): number {
  if (s.splash) return 5;
  if (s.lure) return 5;
  if (s.mines) return 4;
  if (s.slowT) return 4;
  if (s.dockPatch) return 4;
  if (s.markGold) return 3;
  if ((s.coverArc ?? 0) > 1.3) return 4;
  if ((s.chain ?? 0) >= 2) return 5;
  if (s.chain) return 3;
  if ((s.split ?? 0) > 0 || (s.coverArc ?? 0) > 1) return 3;
  return 2;
}

const HURT = TOWERS.map((t) => hurtOf(t.stats!));
const SPEED = TOWERS.map((t) => speedOf(t.stats!));
const REACH = TOWERS.map((t) => t.stats!.range);
const HURT_MIN = Math.min(...HURT);
const HURT_MAX = Math.max(...HURT);
const SPEED_MIN = Math.min(...SPEED);
const SPEED_MAX = Math.max(...SPEED);
const REACH_MIN = Math.min(...REACH);
const REACH_MAX = Math.max(...REACH);

export function barsOfStats(s: TowerStats): StatBars {
  return {
    hurt: segs(hurtOf(s), HURT_MIN, HURT_MAX),
    speed: segs(speedOf(s), SPEED_MIN, SPEED_MAX),
    reach: segs(s.range, REACH_MIN, REACH_MAX),
    trick: trickScore(s),
    trickName: trickNameOf(s),
  };
}

function templateId(card: CardDef): string {
  const rolled = card as CardDef & { templateId?: string };
  return rolled.templateId ?? card.id;
}

export function towerById(id: string): CardDef | undefined {
  return TOWERS.find((t) => t.id === id || t.stats?.role === id);
}

export function gunSheet(card: CardDef): { name: string; bars: StatBars } | null {
  const stats = card.stats;
  if (stats && (card.kind === "tower" || card.kind === "defender")) {
    return { name: card.name, bars: barsOfStats(stats) };
  }
  const gun = towerById(templateId(card));
  if (gun?.stats) return { name: gun.name, bars: barsOfStats(gun.stats) };
  return null;
}

export function setSheets(card: CardDef): { name: string; bars: StatBars }[] {
  const ids = card.setGuns ?? GUN_SETS.find((s) => s.id === templateId(card) || s.name === card.name)?.guns ?? [];
  return ids
    .map((id) => {
      const gun = towerById(id);
      if (!gun?.stats) return null;
      return { name: gun.name, bars: barsOfStats(gun.stats) };
    })
    .filter((row): row is { name: string; bars: StatBars } => !!row);
}
