import type { CardDef, CoverShape, Rarity, TowerHull, TowerRole, TowerStats } from "../types";

type Job = {
  role: TowerRole;
  hull: TowerHull;
  cover: CoverShape;
  projectile: TowerStats["projectile"];
  damage: number;
  rate: number;
  range: number;
  blurb: string;
  coverArc?: number;
  coverInner?: number;
  splash?: number;
  slowMul?: number;
  slowT?: number;
  chain?: number;
  shred?: number;
  auraDps?: number;
  burnDps?: number;
  bend?: number;
  markGold?: number;
  knock?: number;
  nova?: number;
  mines?: boolean;
  beam?: boolean;
  split?: number;
  healAura?: number;
  shock?: number;
  lure?: number;
  dockPatch?: { pct: number; rest: number; yank?: number; split?: boolean };
  healPulse?: { pct: number; period: number };
};

const JOBS: Job[] = [
  { role: "spear", hull: "cone", cover: "cone", projectile: "arrow", damage: 24, rate: 1.15, range: 250, coverArc: 1.22, blurb: "Goes through the next one." },
  { role: "crater", hull: "invert", cover: "ring", projectile: "ember", damage: 22, rate: 0.64, range: 255, splash: 82, coverInner: 0.38, blurb: "Explodes. Not on the road." },
  { role: "frost", hull: "crystal", cover: "circle", projectile: "frost", damage: 14, rate: 1.05, range: 228, slowMul: 0.48, slowT: 2.2, healPulse: { pct: 0.12, period: 8 }, blurb: "Freezes." },
  { role: "rail", hull: "tube", cover: "lane", projectile: "arrow", damage: 12, rate: 2.1, range: 230, dockPatch: { pct: 0.16, rest: 7 }, blurb: "A straight line. Hurt ships can sit." },
  { role: "umbra", hull: "dish", cover: "circle", projectile: "none", damage: 0, rate: 0, range: 200, auraDps: 18, bend: 26, lure: 42, blurb: "Doesn't shoot. It pulls." },
  { role: "cascade", hull: "coil", cover: "diamond", projectile: "spark", damage: 22, rate: 0.95, range: 230, chain: 3, blurb: "Jumps." },
  { role: "sweep", hull: "mill", cover: "cone", projectile: "hex", damage: 15, rate: 0.85, range: 310, coverArc: 1.45, blurb: "Everything in the cone." },
  { role: "brand", hull: "stamp", cover: "circle", projectile: "arrow", damage: 28, rate: 1.2, range: 270, markGold: 0.5, blurb: "Marked kills pay." },
  { role: "mine", hull: "drill", cover: "diamond", projectile: "none", damage: 10, rate: 0.45, range: 160, mines: true, blurb: "They walk into it." },
  { role: "orbit", hull: "twin", cover: "circle", projectile: "spark", damage: 16, rate: 1.85, range: 236, chain: 1, blurb: "Two shots." },
];

const NAMES: Record<string, string> = {
  spear: "Lance",
  crater: "Crater",
  frost: "Halo",
  rail: "Rail",
  umbra: "Well",
  cascade: "Ion",
  sweep: "Corona",
  brand: "Beacon",
  mine: "Mine",
  orbit: "Helix",
};

const ORIG: Record<string, string> = {
  spear: "longbow",
  crater: "ember",
  frost: "rime",
  rail: "bolt",
  umbra: "grove",
  cascade: "arc",
  sweep: "nightglass",
  brand: "commissioner",
  mine: "gun-pit",
  orbit: "gun-helix",
};

const ORIG_ART: Record<string, string> = {
  longbow: "longbow",
  ember: "ember",
  rime: "rime",
  bolt: "longbow",
  grove: "grove",
  arc: "arc",
  nightglass: "hex",
  commissioner: "captain",
  "gun-pit": "drill",
  "gun-helix": "arc",
};

const JOB_RARITY: Record<string, Rarity> = {
  spear: "common",
  crater: "common",
  rail: "common",
  frost: "uncommon",
  mine: "epic",
  sweep: "rare",
  cascade: "epic",
  brand: "legendary",
  umbra: "legendary",
  orbit: "legendary",
};

const COST: Record<Rarity, number> = {
  common: 70,
  uncommon: 100,
  rare: 130,
  epic: 165,
  legendary: 200,
};

function statsOf(job: Job): TowerStats {
  return {
    damage: job.damage,
    rate: job.rate,
    range: job.range,
    projectile: job.projectile,
    cover: job.cover,
    coverArc: job.coverArc,
    coverInner: job.coverInner,
    splash: job.splash,
    slowMul: job.slowMul,
    slowT: job.slowT,
    chain: job.chain,
    shred: job.shred,
    auraDps: job.auraDps,
    burnDps: job.burnDps,
    bend: job.bend,
    markGold: job.markGold,
    role: job.role,
    hull: job.hull,
    knock: job.knock,
    nova: job.nova,
    mines: job.mines,
    beam: job.beam,
    split: job.split,
    healAura: job.healAura,
    shock: job.shock,
    lure: job.lure,
    dockPatch: job.dockPatch,
    healPulse: job.healPulse,
  };
}

export const TOWERS: CardDef[] = JOBS.map((job) => {
  const id = ORIG[job.role] ?? `gun-${job.role}`;
  const rarity = JOB_RARITY[job.role] ?? "common";
  return {
    id,
    name: NAMES[job.role] ?? job.role,
    kind: "tower" as const,
    rarity,
    art: ORIG_ART[id] ?? job.hull,
    set: null,
    cost: COST[rarity],
    blurb: job.blurb,
    stats: statsOf(job),
  };
});
