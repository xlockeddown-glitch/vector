/** This-game Level rungs. Arena caps at 4. Endless 5+ is extra hurt only. */

export type TrickId = "drones" | "lip" | "hotslam" | "wake" | "catch" | "wing" | "trail" | "hunt";

export type LevelRung = {
  lv: 1 | 2 | 3 | 4;
  name: string;
  gift: string;
};

export type TrickDef = {
  id: TrickId;
  name: string;
  blurb: string;
  kind: "gun" | "craft";
};

export const GUN_RUNGS: LevelRung[] = [
  { lv: 1, name: "Live", gift: "It's live." },
  { lv: 2, name: "Glow", gift: "Hull glows. Shots a bit faster." },
  { lv: 3, name: "Slam", gift: "Slam comes sooner." },
  { lv: 4, name: "Trick", gift: "Pick one trick." },
];

export const CRAFT_RUNGS: LevelRung[] = [
  { lv: 1, name: "Air", gift: "Flying this game." },
  { lv: 2, name: "Glow", gift: "Trail glows. Flies a bit faster." },
  { lv: 3, name: "Bite", gift: "Hits harder." },
  { lv: 4, name: "Trick", gift: "Pick one trick." },
];

export const GUN_TRICKS: TrickDef[] = [
  { id: "drones", name: "Drones", blurb: "Two little guns fly with it.", kind: "gun" },
  { id: "lip", name: "Lip", blurb: "A lip slows enemies that gets close.", kind: "gun" },
  { id: "hotslam", name: "Hot slam", blurb: "Slam hits a wider ring.", kind: "gun" },
  { id: "wake", name: "Wake", blurb: "Shade stretches farther.", kind: "gun" },
];

export const CRAFT_TRICKS: TrickDef[] = [
  { id: "catch", name: "Catch", blurb: "Eats grenades from farther.", kind: "craft" },
  { id: "wing", name: "Wing", blurb: "A small shield. Takes more hits.", kind: "craft" },
  { id: "trail", name: "Trail", blurb: "Burns enemies it flies over.", kind: "craft" },
  { id: "hunt", name: "Hunt", blurb: "Hunts farther off gun light.", kind: "craft" },
];

export const TRICK_CAP = 4;

export function rungOf(kind: "gun" | "craft", level: number): LevelRung {
  const list = kind === "craft" ? CRAFT_RUNGS : GUN_RUNGS;
  const lv = Math.max(1, Math.min(4, Math.floor(level) || 1)) as 1 | 2 | 3 | 4;
  return list[lv - 1] ?? list[0]!;
}

export function trickOf(id: string | null | undefined): TrickDef | undefined {
  if (!id) return undefined;
  return GUN_TRICKS.find((t) => t.id === id) ?? CRAFT_TRICKS.find((t) => t.id === id);
}

function hashUid(uid: string): number {
  let n = 0;
  for (let i = 0; i < uid.length; i++) n = (n * 33 + uid.charCodeAt(i)) >>> 0;
  return n;
}

export function dealTricks(kind: "gun" | "craft", uid: string): TrickId[] {
  const pool = kind === "craft" ? CRAFT_TRICKS : GUN_TRICKS;
  const start = hashUid(uid) % pool.length;
  const a = pool[start]!;
  const b = pool[(start + 1 + (hashUid(uid) % (pool.length - 1))) % pool.length]!;
  if (a.id === b.id) {
    const c = pool.find((t) => t.id !== a.id) ?? pool[0]!;
    return [a.id, c.id];
  }
  return [a.id, b.id];
}

export function tricksFor(kind: "gun" | "craft", ids: string[] | null | undefined): TrickDef[] {
  const pool = kind === "craft" ? CRAFT_TRICKS : GUN_TRICKS;
  const want = ids && ids.length ? ids : pool.slice(0, 2).map((t) => t.id);
  return want.map((id) => pool.find((t) => t.id === id)).filter((t): t is TrickDef => !!t);
}

export function levelFloat(name: string, level: number, kind: "gun" | "craft"): string {
  return `LEVEL ${level}`;
}

/** Bond forever floors the look, not the this-game Level stats. */
export function bondLookFloor(bondLevel: number): number {
  if (bondLevel >= 50) return 4;
  if (bondLevel >= 35) return 3;
  if (bondLevel >= 15) return 2;
  return 1;
}

export function craftLookLevel(runLevel: number, bound: boolean, bondLevel: number): number {
  const run = Math.max(1, Math.min(4, Math.floor(runLevel) || 1));
  if (!bound) return run;
  return Math.max(run, bondLookFloor(bondLevel));
}
