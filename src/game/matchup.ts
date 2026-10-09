/** Five towers, four enemy tags. A tag is a multiplier, not a hidden system. */

export type TowerId = "lance" | "halo" | "crater" | "rail" | "beacon";
export type EnemyTag = "grunt" | "swift" | "plate" | "swarm";

export const TOWER_IDS: TowerId[] = ["lance", "halo", "crater", "rail", "beacon"];
export const ENEMY_TAGS: EnemyTag[] = ["grunt", "swift", "plate", "swarm"];

export const START_CREDIT = 110;

type Tower = {
  name: string;
  damage: number;
  rate: number;
  /** Move speed multiplier while hit. 1 means no slow. */
  slow: number;
  /** Crater hits the whole pack at once. */
  splash: boolean;
  cost: number;
};

export const TOWERS: Record<TowerId, Tower> = {
  lance: { name: "Lance", damage: 28, rate: 1, slow: 1, splash: false, cost: 50 },
  halo: { name: "Halo", damage: 10, rate: 1.1, slow: 0.55, splash: false, cost: 55 },
  crater: { name: "Crater", damage: 18, rate: 0.7, slow: 1, splash: true, cost: 50 },
  rail: { name: "Rail", damage: 11, rate: 2.2, slow: 1, splash: false, cost: 50 },
  beacon: { name: "Beacon", damage: 6, rate: 0.6, slow: 1, splash: false, cost: 70 },
};

/** How hard this tower's shots land. 1 is neutral. */
export const MATCHUP: Record<TowerId, Record<EnemyTag, number>> = {
  lance: { grunt: 1, swift: 0.55, plate: 1.5, swarm: 0.5 },
  halo: { grunt: 0.75, swift: 1.7, plate: 0.35, swarm: 0.9 },
  crater: { grunt: 1, swift: 0.8, plate: 0.4, swarm: 1.85 },
  rail: { grunt: 1.25, swift: 0.4, plate: 1.5, swarm: 0.65 },
  beacon: { grunt: 0.4, swift: 0.4, plate: 0.4, swarm: 0.4 },
};

export const ENEMIES: Record<EnemyTag, { hp: number; pack: number; pay: number; speed: number }> = {
  grunt: { hp: 100, pack: 1, pay: 6, speed: 1 },
  swift: { hp: 70, pack: 1, pay: 5, speed: 1.45 },
  plate: { hp: 200, pack: 1, pay: 14, speed: 0.72 },
  swarm: { hp: 45, pack: 4, pay: 2, speed: 1.1 },
};

/** Other towers hurt a marked target this much harder. Beacon itself does not get it. */
export const MARK_BONUS = 0.25;

export const RANK_COST = { 2: 45, 3: 90 } as const;

export type WaveGroup = { tag: EnemyTag; count: number };

/** Grunts, then a few fast ones, then grunts. No plates yet. */
export const LEVEL_1: WaveGroup[] = [
  { tag: "grunt", count: 6 },
  { tag: "swift", count: 4 },
  { tag: "grunt", count: 4 },
];

export function baseDps(tower: TowerId) {
  const t = TOWERS[tower];
  return t.damage * t.rate;
}

export function effectiveDps(tower: TowerId, tag: EnemyTag, marked = false) {
  const mark = marked && tower !== "beacon" ? 1 + MARK_BONUS : 1;
  return baseDps(tower) * MATCHUP[tower][tag] * mark;
}

/** Seconds to clear one encounter of this tag. Swarm is a pack. Crater hits the pack together. */
export function timeToClear(tower: TowerId, tag: EnemyTag, marked = false) {
  const dps = effectiveDps(tower, tag, marked);
  if (!(dps > 0)) return Number.POSITIVE_INFINITY;
  const e = ENEMIES[tag];
  const covered = TOWERS[tower].splash ? e.pack : 1;
  return ((e.pack / covered) * e.hp) / dps;
}

export function bestTower(tag: EnemyTag): TowerId {
  return TOWER_IDS.reduce((best, id) => (timeToClear(id, tag) < timeToClear(best, tag) ? id : best));
}

export function killPay(tag: EnemyTag, marked = false) {
  const base = ENEMIES[tag].pay;
  return marked ? Math.round(base * 1.5) : base;
}

export function wavePay(groups: WaveGroup[], marked = false) {
  return groups.reduce((sum, group) => sum + killPay(group.tag, marked) * group.count, 0);
}

export function canAfford(credit: number, tower: TowerId) {
  return credit >= TOWERS[tower].cost;
}

export type SheetRow = {
  tag: EnemyTag;
  winner: TowerId;
  seconds: Record<TowerId, number>;
};

export function matchupSheet(): SheetRow[] {
  return ENEMY_TAGS.map((tag) => ({
    tag,
    winner: bestTower(tag),
    seconds: Object.fromEntries(TOWER_IDS.map((id) => [id, timeToClear(id, tag)])) as Record<TowerId, number>,
  }));
}
