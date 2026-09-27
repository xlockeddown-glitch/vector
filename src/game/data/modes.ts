import type { PlayMode } from "../types";
import { actOf, themeAt } from "./themes";

export type { PlayMode };

export const MODES: Record<
  PlayMode,
  { id: PlayMode; name: string; kicker: string; blurb: string }
> = {
  story: {
    id: "story",
    name: "Arena",
    kicker: "Draft, then 12",
    blurb: "Draft once. Plant. Hold 12 waves. Then keep flying, or return.",
  },
  arcade: {
    id: "arcade",
    name: "Keep flying",
    kicker: "After 12",
    blurb: "You already won. Waves do not stop. Cash out whenever.",
  },
};

export function isPlayMode(v: unknown): v is PlayMode {
  return v === "story" || v === "arcade";
}

export function storyWatchName(wave: number) {
  const n = actOf(wave) + 1;
  return `Watch ${n} · ${themeAt(wave).short}`;
}

export function storyWatchLine(wave: number) {
  return `${actOf(wave) + 1}/3`;
}
