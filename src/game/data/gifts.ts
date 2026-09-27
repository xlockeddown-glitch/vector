import type { CardDef, PackGift, SetId } from "../types";

export type { PackGift };

export const GIFT_IDS: PackGift[] = ["road", "freeze", "jump", "peel"];

export const GIFTS: Record<
  PackGift,
  { id: PackGift; name: string; line: string; token: "ember" | "frost" | "accent" | "steel"; set: SetId }
> = {
  road: { id: "road", name: "Road", line: "All three light the path.", token: "ember", set: "heat" },
  freeze: { id: "freeze", name: "Freeze", line: "All three slow.", token: "frost", set: "cold" },
  jump: { id: "jump", name: "Jump", line: "Hits hop.", token: "accent", set: "spark" },
  peel: { id: "peel", name: "Peel", line: "All three strip plates.", token: "steel", set: "iron" },
};

export type GiftHints = {
  lastGift?: PackGift | null;
  hasRoad?: boolean;
  hasFreeze?: boolean;
  hasJump?: boolean;
  hasPeel?: boolean;
};

export type PackLean = {
  skipGift?: boolean;
  preferred?: PackGift | null;
  lastGift?: PackGift | null;
  hints?: GiftHints;
};

const SET_GIFT: Record<SetId, PackGift> = {
  heat: "road",
  cold: "freeze",
  spark: "jump",
  iron: "peel",
};

/** 2+ means the card really leans this job, not just a tint. */
export function giftScore(card: CardDef, gift: PackGift): number {
  let n = 0;
  if (card.set && SET_GIFT[card.set] === gift) n += card.kind === "companion" || card.kind === "kit" ? 2 : 1;
  const s = card.stats;
  const kit = card.kit;
  const comp = card.companion;
  if (gift === "road") {
    if (s?.splash) n += 3;
    if ((s?.burnDps ?? 0) > 0) n += 2;
    if (s?.projectile === "ember") n += 1;
    if ((kit?.burnDps ?? 0) > 0) n += 2;
  }
  if (gift === "freeze") {
    if ((s?.slowT ?? 0) > 0 || (s?.slowMul ?? 1) < 1) n += 3;
    if (s?.projectile === "frost") n += 1;
    if ((comp?.slowMul ?? 1) < 1) n += 2;
    if ((kit?.slowMul ?? 1) < 1 || (kit?.cutSlow ?? 0) > 0) n += 2;
  }
  if (gift === "jump") {
    if ((s?.chain ?? 0) > 0) n += 3;
    if ((s?.knock ?? 0) > 0) n += 2;
    if (s?.projectile === "spark") n += 1;
    if ((comp?.knock ?? 0) > 0) n += 2;
    if ((kit?.knockMul ?? 0) > 1) n += 2;
  }
  if (gift === "peel") {
    if ((s?.shred ?? 0) > 0) n += 3;
    if ((s?.markGold ?? 0) > 0) n += 2;
    if (s?.projectile === "hex") n += 1;
    if ((kit?.shred ?? 0) > 0 || (kit?.cutDps ?? 0) > 0) n += 2;
  }
  return n;
}

export function cardLeans(card: CardDef, gift: PackGift): boolean {
  return giftScore(card, gift) >= 2;
}

export function rollPackGift(hints?: GiftHints): PackGift {
  const w: Record<PackGift, number> = { road: 1, freeze: 1, jump: 1, peel: 1 };
  if (hints?.hasRoad === false) w.road *= 1.55;
  if (hints?.hasFreeze === false) w.freeze *= 1.55;
  if (hints?.hasJump === false) w.jump *= 1.45;
  if (hints?.hasPeel === false) w.peel *= 1.45;
  if (hints?.lastGift) w[hints.lastGift] *= 0.42;
  const total = GIFT_IDS.reduce((s, g) => s + w[g], 0);
  let n = Math.random() * (total || 1);
  for (const g of GIFT_IDS) {
    n -= w[g];
    if (n <= 0) return g;
  }
  return "road";
}

export function giftOrder(lean?: PackLean): PackGift[] {
  if (lean?.skipGift) return [];
  const rest = (skip: PackGift) => {
    const out = GIFT_IDS.filter((g) => g !== skip);
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = out[i]!;
      out[i] = out[j]!;
      out[j] = t;
    }
    return out;
  };
  if (lean?.preferred) return [lean.preferred, ...rest(lean.preferred)];
  const first = rollPackGift({ ...lean?.hints, lastGift: lean?.lastGift ?? lean?.hints?.lastGift ?? null });
  return [first, ...rest(first)];
}

export function packGiftOf(cards: CardDef[]): PackGift | null {
  if (cards.length < 2) return null;
  let best: PackGift | null = null;
  let bestN = 0;
  for (const g of GIFT_IDS) {
    const n = cards.filter((c) => cardLeans(c, g)).length;
    if (n > bestN) {
      best = g;
      bestN = n;
    }
  }
  return bestN === cards.length ? best : null;
}

export function giftLead(gift: PackGift | null | undefined): string {
  if (!gift) return "";
  const g = GIFTS[gift];
  return `${g.name} pack. ${g.line}`;
}

export function giftChip(gift: PackGift | null | undefined): string {
  if (!gift) return "";
  return `${GIFTS[gift].name} pack`;
}
