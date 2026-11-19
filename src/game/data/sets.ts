import type { OpId, SetBonusLine, SetId } from "../types";
import { PALETTE } from "../constants";

export const SETS: Record<
  SetId,
  { id: SetId; name: string; job: string; glyph: string; two: string; three: string; color: string; token: string }
> = {
  heat: {
    id: "heat",
    name: "Plasma",
    job: "splash",
    glyph: "◆",
    two: "lights the road",
    three: "burning enemies pop",
    color: PALETTE.ember,
    token: "ember",
  },
  cold: {
    id: "cold",
    name: "Cryo",
    job: "slow",
    glyph: "●",
    two: "freezes",
    three: "ice on the path",
    color: PALETTE.frost,
    token: "frost",
  },
  spark: {
    id: "spark",
    name: "Volt",
    job: "chain",
    glyph: "△",
    two: "jumps",
    three: "jumps through Volt guns",
    color: PALETTE.accent,
    token: "accent",
  },
  iron: {
    id: "iron",
    name: "Current",
    job: "range",
    glyph: "▸",
    two: "share range",
    three: "longest gun feeds the rest",
    color: PALETTE.steel,
    token: "steel",
  },
};

export const SET_ORDER: SetId[] = ["heat", "cold", "spark", "iron"];

export const OPERATORS: Record<
  OpId,
  { id: OpId; name: string; glyph: string; blurb: string; color: string; token: string; match: SetId }
> = {
  mul: {
    id: "mul",
    name: "Splash",
    glyph: "◆",
    blurb: "Hits a group.",
    color: PALETTE.ember,
    token: "ember",
    match: "heat",
  },
  add: {
    id: "add",
    name: "Slow",
    glyph: "●",
    blurb: "Buys time.",
    color: PALETTE.frost,
    token: "frost",
    match: "cold",
  },
  raise: {
    id: "raise",
    name: "Jump",
    glyph: "△",
    blurb: "Hits a neighbor.",
    color: PALETTE.accent,
    token: "accent",
    match: "spark",
  },
  take: {
    id: "take",
    name: "Armor",
    glyph: "▸",
    blurb: "Breaks plates.",
    color: PALETTE.steel,
    token: "steel",
    match: "iron",
  },
};

/** @deprecated old name */

export function emptySets(): Record<SetId, number> {
  return { heat: 0, cold: 0, spark: 0, iron: 0 };
}

export function countSets(cards: { set: SetId | null }[]): Record<SetId, number> {
  const n = emptySets();
  for (const c of cards) {
    if (c.set) n[c.set] += 1;
  }
  return n;
}

export function setLines(
  counts: Record<SetId, number>,
  lords?: Partial<Record<SetId, string>>,
): SetBonusLine[] {
  const out: SetBonusLine[] = [];
  for (const id of SET_ORDER) {
    const c = counts[id] ?? 0;
    const def = SETS[id];
    let text =
      c >= 3 ? `${def.two} · ${def.three}` : c >= 2 ? def.two : c === 1 ? `Need 1 more for ${def.two}` : "";
    if (c >= 2 && lords?.[id]) text = text ? `${text} · ${lords[id]}` : lords[id]!;
    out.push({ id, name: def.name, count: c, text });
  }
  return out;
}

/** Extra copies past 2 and 3 still pay. Caps so a huge pile is strong, not broken. */
export function comboRank(count: number, need: number): number {
  if (count < need) return 0;
  return Math.min(6, count - need + 1);
}
