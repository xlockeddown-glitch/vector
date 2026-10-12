import type { Skin } from "./grid";
import type { WaveGroup } from "./matchup";
import { scaleAt } from "./scale";
import { TOP_UP } from "./matchup";

export type LevelDef = {
  level: number;
  seed: number;
  skin: Skin;
  credit: number;
  blurb: string;
  waves: WaveGroup[];
  hpMul: number;
  speedMul: number;
};

const CAMPAIGN: Omit<LevelDef, "hpMul" | "speedMul">[] = [
  {
    level: 1,
    seed: 1,
    skin: "alloy",
    credit: 110,
    blurb: "Grunts, then a few fast ones.",
    waves: [
      { tag: "grunt", count: 6 },
      { tag: "swift", count: 4 },
      { tag: "grunt", count: 4 },
    ],
  },
  {
    level: 2,
    seed: 11,
    skin: "alloy",
    credit: 110,
    blurb: "Swifts. Halo on a corner.",
    waves: [
      { tag: "swift", count: 6 },
      { tag: "grunt", count: 4 },
      { tag: "swift", count: 6 },
    ],
  },
  {
    level: 3,
    seed: 9,
    skin: "alloy",
    credit: 120,
    blurb: "A pack of small ones.",
    waves: [
      { tag: "grunt", count: 4 },
      { tag: "swarm", count: 6 },
      { tag: "swarm", count: 6 },
    ],
  },
  {
    level: 4,
    seed: 14,
    skin: "alloy",
    credit: 110,
    blurb: "Armor. Lance or Rail on a straight pad.",
    waves: [
      { tag: "grunt", count: 4 },
      { tag: "plate", count: 4 },
      { tag: "plate", count: 3 },
    ],
  },
  {
    level: 5,
    seed: 3,
    skin: "dirt",
    credit: 120,
    blurb: "Beacon is jammed.",
    waves: [
      { tag: "grunt", count: 6 },
      { tag: "swift", count: 4 },
      { tag: "swarm", count: 4 },
    ],
  },
  {
    level: 6,
    seed: 6,
    skin: "road",
    credit: 130,
    blurb: "Two bends. More than one gun.",
    waves: [
      { tag: "swift", count: 5 },
      { tag: "plate", count: 3 },
      { tag: "swarm", count: 5 },
    ],
  },
  {
    level: 7,
    seed: 18,
    skin: "alloy",
    credit: 150,
    blurb: "Plates on a straight line.",
    waves: [
      { tag: "grunt", count: 8 },
      { tag: "plate", count: 5 },
    ],
  },
  {
    level: 8,
    seed: 21,
    skin: "road",
    credit: 170,
    blurb: "All four. Then it keeps going.",
    waves: [
      { tag: "grunt", count: 6 },
      { tag: "swift", count: 5 },
      { tag: "swarm", count: 5 },
      { tag: "plate", count: 4 },
    ],
  },
];

export type Rule = "none" | "jam" | "armor" | "lock";

export function ruleAt(level: number): Rule {
  if (level % 5 !== 0) return "none";
  const which = (level / 5) % 3;
  if (which === 1) return "jam";
  if (which === 2) return "armor";
  return "lock";
}

const RULE_LINE: Record<Rule, string> = {
  none: "Keep going.",
  jam: "Beacon is jammed.",
  armor: "Plates ignore frost.",
  lock: "Pads lock when the round starts.",
};

export function stretchAt(level: number): "debris" | "convoy" | "swarm" | null {
  if (level <= 8) return null;
  const names = ["debris", "convoy", "swarm"] as const;
  return names[Math.floor((level - 9) / 3) % names.length]!;
}

const STRETCHES: Record<NonNullable<ReturnType<typeof stretchAt>>, { name: string; skin: Skin; waves: WaveGroup[] }> = {
  debris: {
    name: "Debris",
    skin: "dirt",
    waves: [
      { tag: "grunt", count: 6 },
      { tag: "swift", count: 5 },
      { tag: "swarm", count: 5 },
      { tag: "plate", count: 4 },
    ],
  },
  convoy: {
    name: "Convoy",
    skin: "road",
    waves: [
      { tag: "grunt", count: 4 },
      { tag: "plate", count: 5 },
      { tag: "plate", count: 3 },
    ],
  },
  swarm: {
    name: "Swarm dump",
    skin: "alloy",
    waves: [
      { tag: "swarm", count: 8 },
      { tag: "grunt", count: 4 },
      { tag: "swarm", count: 6 },
    ],
  },
};

export function levelAt(level: number): LevelDef {
  const n = Math.max(1, Math.floor(level));
  if (n <= CAMPAIGN.length) {
    const row = CAMPAIGN[n - 1]!;
    return { ...row, credit: n === 1 ? row.credit : TOP_UP, waves: row.waves.map((g) => ({ ...g })), hpMul: 1, speedMul: 1 };
  }
  const scale = scaleAt(n);
  const stretch = STRETCHES[stretchAt(n)!];
  const rule = ruleAt(n);
  return {
    level: n,
    seed: 40 + n,
    skin: stretch.skin,
    credit: TOP_UP,
    blurb: rule === "none" ? `${stretch.name}.` : `${stretch.name}. ${RULE_LINE[rule]}`,
    waves: stretch.waves.map((g) => ({
      tag: g.tag,
      count: Math.max(1, Math.round(g.count * scale.count)),
    })),
    hpMul: scale.hp,
    speedMul: scale.speed,
  };
}
