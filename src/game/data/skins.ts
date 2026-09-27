import type { SkinId } from "../types";

export type SkinDef = {
  id: SkinId;
  name: string;
  blurb: string;
  unlock: string;
  need: (s: SkinProgress) => boolean;
  progress: (s: SkinProgress) => { n: number; of: number };
  stroke: string;
  glow: string;
};

export type SkinProgress = {
  kills: number;
  leakless: number;
  runs: number;
  bestWave: number;
};

export const SKINS: SkinDef[] = [
  {
    id: "stock",
    name: "Stock",
    blurb: "Bare stainless. What you launch with.",
    unlock: "Default",
    need: () => true,
    progress: () => ({ n: 1, of: 1 }),
    stroke: "#9aa3b2",
    glow: "rgba(154,163,178,0.35)",
  },
  {
    id: "chrome",
    name: "Chrome",
    blurb: "Mirror panels. Unlocks after 40 kills.",
    unlock: "40 kills",
    need: (s) => s.kills >= 40,
    progress: (s) => ({ n: s.kills, of: 40 }),
    stroke: "#eef3f7",
    glow: "rgba(238,243,247,0.45)",
  },
  {
    id: "ember",
    name: "Heat shield",
    blurb: "Orange reentry flare. 120 kills.",
    unlock: "120 kills",
    need: (s) => s.kills >= 120,
    progress: (s) => ({ n: s.kills, of: 120 }),
    stroke: "#ff5c2a",
    glow: "rgba(255,92,42,0.55)",
  },
  {
    id: "ion",
    name: "Ion edge",
    blurb: "Cyan telemetry. Three rounds with zero leaks.",
    unlock: "3 leakless rounds",
    need: (s) => s.leakless >= 3,
    progress: (s) => ({ n: s.leakless, of: 3 }),
    stroke: "#3cd6cc",
    glow: "rgba(60,214,204,0.5)",
  },
  {
    id: "gold",
    name: "Gold foil",
    blurb: "Flight-qualified. Eight finished runs.",
    unlock: "8 runs",
    need: (s) => s.runs >= 8,
    progress: (s) => ({ n: s.runs, of: 8 }),
    stroke: "#e8c15a",
    glow: "rgba(232,193,90,0.55)",
  },
  {
    id: "void",
    name: "Void matte",
    blurb: "Blacker than the lane. Reach wave 12.",
    unlock: "Wave 12",
    need: (s) => s.bestWave >= 12,
    progress: (s) => ({ n: s.bestWave, of: 12 }),
    stroke: "#5a6270",
    glow: "rgba(124,108,240,0.4)",
  },
];

export function skinById(id: SkinId | string | undefined): SkinDef {
  return SKINS.find((s) => s.id === id) ?? SKINS[0]!;
}

export function unlockedIds(p: SkinProgress): SkinId[] {
  return SKINS.filter((s) => s.need(p)).map((s) => s.id);
}
