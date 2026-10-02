import type { CharmDef, GemId } from "../types";

export const GEM_ORDER: GemId[] = ["ruby", "emerald", "sapphire", "diamond"];

export const GEM_META: Record<GemId, { name: string; tone: string; token: string }> = {
  ruby: { name: "Ruby", tone: "text-ember", token: "ember" },
  emerald: { name: "Emerald", tone: "text-sage", token: "sage" },
  sapphire: { name: "Sapphire", tone: "text-rare", token: "rare" },
  diamond: { name: "Diamond", tone: "text-frost", token: "frost" },
};

export const CHARMS: CharmDef[] = [
  {
    id: "overclock",
    name: "Overclock",
    blurb: "Every gun fires 2× for 3 rounds.",
    rounds: 3,
    cost: { ruby: 2 },
    rateMul: 2,
  },
  {
    id: "firerain",
    name: "Fire Rain",
    blurb: "Ember rain across every lane for 2 rounds.",
    rounds: 2,
    cost: { ruby: 2, emerald: 1 },
    fireRain: 11,
  },
  {
    id: "meteor",
    name: "Magnitude Storm",
    blurb: "Meteors strike clustered enemies for 2 rounds.",
    rounds: 2,
    cost: { sapphire: 2, ruby: 1 },
    meteor: 48,
  },
  {
    id: "ledger",
    name: "Double Ledger",
    blurb: "Kills pay more for 3 rounds.",
    rounds: 3,
    cost: { emerald: 2 },
    pointMul: 2,
  },
  {
    id: "facet",
    name: "Facet",
    blurb: "Bosses drop 2× gems for 4 rounds.",
    rounds: 4,
    cost: { sapphire: 2 },
    gemMul: 2,
  },
  {
    id: "dilate",
    name: "Time Dilate",
    blurb: "All enemies 30% slower for 2 rounds.",
    rounds: 2,
    cost: { diamond: 1 },
    slowMul: 0.7,
  },
];

export function emptyGems(): Record<GemId, number> {
  return { ruby: 0, emerald: 0, sapphire: 0, diamond: 0 };
}

export function canAfford(have: Record<GemId, number>, cost: Partial<Record<GemId, number>>) {
  return GEM_ORDER.every((g) => (have[g] ?? 0) >= (cost[g] ?? 0));
}

export function payGems(have: Record<GemId, number>, cost: Partial<Record<GemId, number>>): Record<GemId, number> {
  const next = { ...have };
  for (const g of GEM_ORDER) next[g] = Math.max(0, (next[g] ?? 0) - (cost[g] ?? 0));
  return next;
}

export function rollGem(bias: "boss" | "titan"): GemId {
  const n = Math.random();
  if (bias === "titan") {
    if (n < 0.12) return "diamond";
    if (n < 0.38) return "sapphire";
    if (n < 0.68) return "emerald";
    return "ruby";
  }
  if (n < 0.04) return "diamond";
  if (n < 0.2) return "sapphire";
  if (n < 0.48) return "emerald";
  return "ruby";
}
