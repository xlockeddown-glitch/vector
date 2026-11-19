import type { PlayMode } from "../types";
import { actOf } from "./themes";

export type { PlayMode };

export function isPlayMode(v: unknown): v is PlayMode {
  return v === "story" || v === "arcade" || v === "build";
}

export function storyWatchLine(wave: number) {
  return `${actOf(wave) + 1}/3`;
}
