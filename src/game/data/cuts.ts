/** Jersey-cut silhouettes. Same paths on the field and on the card. View 80. */

export type Cut = { d: string; neon?: string };

export const HULL_CUT: Record<string, Cut> = {
  cone: { d: "M40 8 L56 40 L24 40 Z M40 18 L46 36 L34 36 Z" },
  invert: { d: "M22 12 L58 12 L50 40 L30 40 Z M32 16 L48 16 L44 28 L36 28 Z" },
  mill: { d: "M40 22 L58 12 L52 26 Z M40 22 L28 8 L36 20 Z M40 22 L50 38 L30 36 Z M37 19 L43 19 L43 25 L37 25 Z" },
  spin: { d: "M40 8 L46 20 L58 22 L46 26 L40 38 L34 26 L22 22 L34 20 Z" },
  tube: { d: "M32 10 L48 10 L48 42 L32 42 Z M36 14 L44 14 L44 38 L36 38 Z" },
  halo: { d: "M40 10 A14 14 0 1 1 39.9 10 M40 18 A6 6 0 1 1 39.9 18" },
  dish: { d: "M40 10 A14 14 0 1 1 39.9 10 M40 18 A6 6 0 1 1 39.9 18" },
  drum: { d: "M28 16 A12 8 0 0 1 52 16 L52 36 A12 8 0 0 1 28 36 Z" },
  ember: { d: "M22 12 L58 12 L50 40 L30 40 Z" },
  mortar: { d: "M22 12 L58 12 L50 40 L30 40 Z" },
  fan: { d: "M40 22 L58 12 L52 26 Z M40 22 L28 8 L36 20 Z M40 22 L50 38 L30 36 Z" },
  saw: { d: "M40 8 L46 20 L58 22 L46 26 L40 38 L34 26 L22 22 L34 20 Z" },
  rail: { d: "M32 10 L48 10 L48 42 L32 42 Z" },
  rime: { d: "M40 8 L54 36 L26 36 Z" },
  crystal: { d: "M40 8 L54 36 L26 36 Z" },
  drill: { d: "M40 8 L56 40 L24 40 Z" },
  crane: { d: "M36 18 L44 18 L44 40 L36 40 Z M44 20 L62 12 L62 18 L44 26 Z M58 18 L58 38 M54 38 L62 38" },
  furnace: { d: "M26 22 L54 22 L54 42 L26 42 Z M32 28 L48 28 L48 38 L32 38 Z M30 16 L34 22 M46 14 L50 22" },
  lens: { d: "M36 18 L44 18 L44 42 L36 42 Z M40 8 A12 8 0 1 1 39.9 8" },
  stamp: { d: "M28 22 L52 22 L52 36 L28 36 Z M36 12 L44 12 L44 22 L36 22 Z" },
  coil: { d: "M40 12 A10 6 0 1 1 39.9 12 M40 22 A10 6 0 1 1 39.9 22 M40 32 A10 6 0 1 1 39.9 32 M36 38 L44 42" },
  prism: { d: "M40 8 L58 42 L22 42 Z M40 16 L50 36 L30 36 Z" },
  barrier: { d: "M22 42 L22 24 Q40 8 58 24 L58 42 M26 42 L26 28 Q40 14 54 28 L54 42" },
  twin: { d: "M24 12 L34 12 L34 42 L24 42 Z M46 12 L56 12 L56 42 L46 42 Z" },
  mast: { d: "M36 8 L44 8 L44 42 L36 42 Z" },
};

export const CRAFT_CUT: Record<string, Cut> = {
  boost: { d: "M40 6 L50 28 L46 28 L46 50 L34 50 L34 28 L30 28 Z M28 50 L40 70 L52 50", neon: "#ff5c2a" },
  shrike: { d: "M40 8 L62 36 L48 36 L48 52 L32 52 L32 36 L18 36 Z M24 52 L40 68 L56 52", neon: "#ff5c2a" },
  auger: { d: "M18 40 A22 22 0 1 1 17.9 40 M40 22 L44 38 L58 40 L44 42 L40 58 L36 42 L22 40 L36 38 Z", neon: "#9b6cff" },
  poppy: { d: "M40 18 L52 28 L46 40 L34 40 L28 28 Z M40 40 L48 62 L32 62 Z", neon: "#ff5c2a" },
  zeek: { d: "M16 40 A24 10 0 1 1 15.9 40 M32 40 A8 8 0 1 1 31.9 40", neon: "#ffe56a" },
  joule: { d: "M28 12 L52 12 L52 28 L44 28 L44 68 L36 68 L36 28 L28 28 Z", neon: "#7c6cf0" },
  kelvin: { d: "M24 28 L40 12 L56 28 L56 52 L40 68 L24 52 Z M32 36 L40 44 L48 36", neon: "#3cd6cc" },
  halo: { d: "M40 16 A20 20 0 1 1 39.9 16 M40 28 A8 8 0 1 1 39.9 28", neon: "#4aa8e8" },
  torr: { d: "M12 44 L40 16 L68 44 L54 44 L40 64 L26 44 Z", neon: "#e8c15a" },
  rook: { d: "M18 28 L62 28 L66 52 L14 52 Z M24 52 L24 64 L32 64 L32 52 M48 52 L48 64 L56 64 L56 52", neon: "#c5ccd3" },
  puck: { d: "M16 40 A24 24 0 1 1 15.9 40 M28 40 A12 12 0 1 1 27.9 40", neon: "#3cd6cc" },
  chis: { d: "M40 10 L58 34 L50 34 L50 62 L30 62 L30 34 L22 34 Z", neon: "#3ecf7a" },
  torch: { d: "M40 8 L60 40 L40 72 L20 40 Z M32 40 L40 28 L48 40 L40 52 Z", neon: "#ff5c2a" },
};

export function cutForHull(art: string | undefined): Cut {
  if (art && HULL_CUT[art]) return HULL_CUT[art]!;
  return HULL_CUT.cone!;
}

export function cutForCraft(id: string): Cut | null {
  const key = Object.keys(CRAFT_CUT).find((k) => id.includes(k));
  return key ? CRAFT_CUT[key]! : null;
}
