/** One character, one pixel. Agents share this sheet. Do not invent new letters. */

export const GLYPH: Record<string, string | null> = {
  ".": null,
  o: "#070b12",
  b: "#141c2a",
  m: "#3d4b60",
  h: "#8b98ab",
  f: "#147a78",
  F: "#7ef6ee",
  e: "#c43a16",
  E: "#ffb089",
  g: "#a8842e",
  G: "#ffe08a",
  p: "#eef3f7",
  u: "#6a48c4",
  U: "#d4c4ff",
  s: "#1f8f52",
  S: "#8dffb8",
  d: "#4a2a1c",
  y: "#c47a3a",
  r: "#2c3548",
  w: "#d7e4ef",
};

export type Sprite = readonly string[];

export const CELL_PX = 12;
