/**
 * VECTOR color library. Single source for canvas + chrome.
 * CSS `@theme` in src/styles.css must match these hexes.
 *
 * Glow GSh: frost, ember, accent, legend (prestige), sage (heal-only live FX).
 * Path is not a neon tube. Empty moons stay dim. Title CTAs do not leak outer glow.
 */

export const PALETTE = {
  ink: "#05060b",
  ink2: "#0a0e16",
  surface: "#10151f",
  raised: "#171e2a",
  paper: "#eef3f7",
  muted: "#8b93a3",
  faint: "#5a6270",
  steel: "#9aa3b2",
  accent: "#7c6cf0",
  ember: "#ff5c2a",
  sage: "#3ecf7a",
  frost: "#3cd6cc",
  rare: "#3d9bff",
  sapphire: "#3d9bff",
  ruby: "#e14d5c",
  epic: "#9b6cff",
  legend: "#e8c15a",
  moonstone: "#d7e4ef",
  /** SPACEU hull / Canaveral tile. Paint, not glow. */
  tile: "#4aa8e8",
  /** Grade D/F. Hurt, not a glow. */
  hot: "#c45c3e",
} as const;

export type PaletteKey = keyof typeof PALETTE;

/** Exclusive bloom lanes (GSh). Sage never on cards at rest. */
export const GLOW = {
  frost: PALETTE.frost,
  ember: PALETTE.ember,
  accent: PALETTE.accent,
  legend: PALETTE.legend,
  sage: PALETTE.sage,
} as const;

/** Gem face colors. Common reads as paper, not a sixth glow. Ruby is paint, not ember. */
export const GEM = {
  moonstone: PALETTE.moonstone,
  sapphire: PALETTE.sapphire,
  ruby: PALETTE.ruby,
  amethyst: PALETTE.epic,
  citrine: PALETTE.legend,
} as const;

/** Quiet frost pip on puck / lightbar. Not a glow color. */
export const FROST_PIP = "#7ef0ea";

/** Banned candy. Do not reintroduce. */
export const BANNED = {
  nvidia: "#76b900",
  candyLilac: "#e4d8ff",
  candyViolet: "#c9b6ff",
  candySapphire: "#8ec7ff",
  candyMagenta: "#ff4fd8",
  googleBlue: "#4285f4",
} as const;
