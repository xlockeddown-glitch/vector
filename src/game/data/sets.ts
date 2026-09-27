import type { CardDef, OpId, SetBonusLine, SetId } from "../types";
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
export const COLOR_MODS = OPERATORS;

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

export type PickHint = {
  set: SetId;
  after: number;
  label: string;
  sub: string;
  hot: boolean;
};

/** Extra copies past 2 and 3 still pay. Caps so a huge pile is strong, not broken. */
export function comboRank(count: number, need: number): number {
  if (count < need) return 0;
  return Math.min(6, count - need + 1);
}

export function pickHint(set: SetId | null, counts: Record<SetId, number>): PickHint | null {
  if (!set) return null;
  const after = (counts[set] ?? 0) + 1;
  const def = SETS[set];
  if (after === 1) {
    return { set, after, label: `${def.name} combo`, sub: `Need 1 more for ${def.two}`, hot: false };
  }
  if (after === 2) {
    return { set, after, label: `${def.name} combo · ${def.two}`, sub: "", hot: true };
  }
  if (after === 3) {
    return { set, after, label: `${def.name} combo · ${def.three}`, sub: "", hot: true };
  }
  return { set, after, label: `${def.name} combo · stronger`, sub: "", hot: true };
}

export function cardRole(card: CardDef): string {
  if (card.kind === "environment") {
    if (card.env?.slowMul) return "Slows all";
    if (card.env?.poisonDps) return "Poisons all";
    if (card.env?.chipDps) return "Chips all";
    if (card.env?.shred) return "Strips armor";
    if (card.env?.dmgAmp) return "All guns hit harder";
    return "Weather";
  }
  if (card.kind === "relic") return "Bonus";
  if (card.kind === "part") return "Part";
  if (card.kind === "socket") {
    const s = card.socket;
    if (s?.rangeMul) return "Reach pad";
    if (s?.rateMul) return "Rate pad";
    if (s?.burnDps) return "Burn pad";
    if (s?.slowMul) return "Slow pad";
    if (s?.splash) return "Splash pad";
    if (s?.shred) return "Shred pad";
    if (s?.killGold) return "Ledger pad";
    if (s?.gemMul) return "Facet pad";
    return "Pad boost";
  }
  if (card.kind === "stamp") {
    const rolled = card as { affixes?: string[] };
    return rolled.affixes?.includes("look") ? "Look" : "Perk";
  }
  const s = card.stats;
  if (!s) return "Card";
  if ((s.auraDps ?? 0) > 0) return "Aura · circle";
  if (s.cover === "cone") return "Cone";
  if (s.cover === "ring") return "Ring";
  if (s.cover === "lane") return "Lane";
  if (s.cover === "diamond") return "Diamond";
  if (s.splash) return "Splash";
  if (s.chain) return "Chain";
  if (s.slowT) return "Slow";
  if (s.shred) return "Shred";
  if (s.markGold) return "Beacon";
  if (s.range >= 280) return "Long range";
  if (s.rate >= 2) return "Fast shot";
  return "Shot";
}

export function cardsForSets(
  environment: CardDef | null,
  roster: { card: CardDef }[],
): CardDef[] {
  const list: CardDef[] = [];
  if (environment) list.push(environment);
  for (const r of roster) list.push(r.card);
  return list;
}
