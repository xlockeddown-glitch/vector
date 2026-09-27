import type { ThemeId } from "../types";

export const THEME_LEN = 12;
export const THEME_ORDER: ThemeId[] = ["water", "earth", "space"];
export const LOOP_WAVES = THEME_LEN * THEME_ORDER.length;
/** One loop is 12 rounds. Then the lane shifts. They'll be back. */
export const TOTAL_WAVES = LOOP_WAVES;

export type ThemeDef = {
  id: ThemeId;
  name: string;
  short: string;
  blurb: string;
  ground: string;
  plot: string;
  path: string;
  pathLine: string;
  glow: string;
  particle: "stars" | "rain" | "dust";
};

export const THEMES: Record<ThemeId, ThemeDef> = {
  water: {
    id: "water",
    name: "Mare",
    short: "Mare",
    blurb: "A lunar sea. Enemies slog. Shots linger.",
    ground: "#050c12",
    plot: "#0c1c24",
    path: "#163f48",
    pathLine: "#3cd6cc",
    glow: "#3cd6cc",
    particle: "rain",
  },
  earth: {
    id: "earth",
    name: "Regolith",
    short: "Dust",
    blurb: "Grey basin. Heavy feet. Enemies pays.",
    ground: "#0c0807",
    plot: "#1c1410",
    path: "#3a2e24",
    pathLine: "#ff5c2a",
    glow: "#ff5c2a",
    particle: "dust",
  },
  space: {
    id: "space",
    name: "Void",
    short: "Void",
    blurb: "Deep black. Fast enemies. Guns reach.",
    ground: "#05060b",
    plot: "#101018",
    path: "#1c1830",
    pathLine: "#9aa3b2",
    glow: "#c5ccd6",
    particle: "stars",
  },
};

export function themeAt(wave: number, locked?: ThemeId | null): ThemeDef {
  if (locked && THEMES[locked]) return THEMES[locked];
  const i = Math.floor(Math.max(0, wave) / THEME_LEN) % THEME_ORDER.length;
  return THEMES[THEME_ORDER[i]!];
}

export function actOf(wave: number) {
  return Math.floor(Math.max(0, wave) / THEME_LEN);
}

export function loopOf(wave: number) {
  return Math.floor(Math.max(0, wave) / LOOP_WAVES);
}

export function driveOf(wave: number) {
  return (wave % THEME_LEN) + 1;
}
