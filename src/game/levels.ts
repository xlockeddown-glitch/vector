import type { Skin } from "./grid";
import type { WaveGroup } from "./matchup";
import { scaleAt } from "./scale";

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
    credit: 60,
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
    credit: 60,
    blurb: "They bunch. Sit Crater on a corner.",
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
    credit: 70,
    blurb: "A pack. Splash, or you are too slow.",
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
    credit: 60,
    blurb: "Armor. A straight line.",
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
    credit: 70,
    blurb: "Dirt. Same rules.",
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
    credit: 80,
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
    credit: 90,
    blurb: "One gun first. Kills pay for Beacon.",
    waves: [
      { tag: "grunt", count: 8 },
      { tag: "plate", count: 5 },
    ],
  },
  {
    level: 8,
    seed: 21,
    skin: "road",
    credit: 110,
    blurb: "All four. Then it keeps going.",
    waves: [
      { tag: "grunt", count: 6 },
      { tag: "swift", count: 5 },
      { tag: "swarm", count: 5 },
      { tag: "plate", count: 4 },
    ],
  },
];

export function levelAt(level: number): LevelDef {
  const n = Math.max(1, Math.floor(level));
  if (n <= CAMPAIGN.length) {
    const row = CAMPAIGN[n - 1]!;
    return { ...row, waves: row.waves.map((g) => ({ ...g })), hpMul: 1, speedMul: 1 };
  }
  const scale = scaleAt(n);
  const mix = CAMPAIGN[CAMPAIGN.length - 1]!;
  const skins: Skin[] = ["alloy", "road", "dirt"];
  return {
    level: n,
    seed: 40 + n,
    skin: skins[n % skins.length]!,
    credit: mix.credit,
    blurb: "Keep going.",
    waves: mix.waves.map((g) => ({
      tag: g.tag,
      count: Math.max(1, Math.round(g.count * scale.count)),
    })),
    hpMul: scale.hp,
    speedMul: scale.speed,
  };
}
