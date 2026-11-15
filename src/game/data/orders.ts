/**
 * Orders. Active abilities the player casts in combat from one shared Energy meter.
 * (Not "special", "boost", "slam" or "overclock": those names are taken.)
 *
 *   Stasis Net   (Cryo)   lane spot, short telegraph, freezes and marks Cryo.
 *   Lance Strike (Plasma) lane spot, longer telegraph, %-max-HP hit that ignores armor, marks Plasma.
 *   Surge        (Volt)   tap a placed gun: faster, jam-proof, Volt shots; then it overheats.
 *   Recall Gate           lane spot, knocks non-boss enemies back along the lane.
 *
 * Every run starts with Stasis Net. At run Level 3 the player picks a second Order.
 * Energy resets at each wave start (no hoarding). All timers run on sim time.
 */

export type OrderId = "stasis" | "lance" | "surge" | "recall";
export type OrderTarget = "lane" | "gun";

export type OrderDef = {
  id: OrderId;
  name: string;
  short: string;
  blurb: string;
  target: OrderTarget;
  cost: number;
  /** Seconds from cast to effect (lane Orders). */
  tell: number;
  /** Effect radius (lane Orders). */
  r: number;
  color: string;
  /** Element the Order marks enemies with, if any. */
  el: "heat" | "cold" | "spark" | null;
};

export const ORDERS: Record<OrderId, OrderDef> = {
  stasis: {
    id: "stasis",
    name: "Stasis Net",
    short: "Stasis",
    blurb: "Tap the lane. Freezes enemies in the net and marks them Cryo. Stops Blink jumps.",
    target: "lane",
    cost: 50,
    tell: 0.6,
    r: 90,
    color: "#7ecbff",
    el: "cold",
  },
  lance: {
    id: "lance",
    name: "Lance Strike",
    short: "Lance",
    blurb: "Tap the lane. After a second, hits for 12% max HP through armor and marks Plasma.",
    target: "lane",
    cost: 60,
    tell: 1.0,
    r: 70,
    color: "#ff7a3c",
    el: "heat",
  },
  surge: {
    id: "surge",
    name: "Surge",
    short: "Surge",
    blurb: "Tap a gun. 5s of fast, jam-proof Volt shots. Then it cools for 2s.",
    target: "gun",
    cost: 40,
    tell: 0,
    r: 0,
    color: "#ffd46b",
    el: "spark",
  },
  recall: {
    id: "recall",
    name: "Recall Gate",
    short: "Recall",
    blurb: "Tap the lane. Throws enemies in the gate back along the lane. Not bosses.",
    target: "lane",
    cost: 45,
    tell: 0.5,
    r: 80,
    color: "#ff5cf0",
    el: null,
  },
};

export const ORDER_IDS: OrderId[] = ["stasis", "lance", "surge", "recall"];

/** Tuning knobs. Keep balance numbers here. */
export const ORDER_NUM = {
  energyMax: 100,
  /** Energy at each wave start. 50 = one Stasis ready as the wave opens (was 40: first cast waited ~10s). */
  energyStart: 50,
  /** Energy per sim second in combat (while a wave runs). */
  trickle: 1,
  perKill: 1,
  /** Kills of Hulk / Titan / Jammer. */
  perBigKill: 8,
  perReaction: 2,
  /** Global lockout after any cast, sim seconds. */
  lockout: 3,
  /** Run Level that offers the second slot. */
  secondSlotLevel: 3,
  maxSlots: 2,
  /** Lane taps further than this from the lane do not cast (they disarm). */
  laneTap: 60,
  /** Gun taps within this of a moon pick that gun. */
  gunTap: 60,
  /**
   * Element marks from Orders last this long (guns: PARAMS.elementLinger = 2s).
   * Longer so Order → Order combos work through the 3s lockout: Stasis lands at 0.6s,
   * the next cast is at 3s and Lance lands at 4s; a 2s mark would be gone by then.
   */
  markLinger: 4.5,
  stasisFreeze: 1.6,
  stasisBossFreeze: 0.6,
  /** A Jammer this close to its pulse is "telegraphing": Stasis resets its pulse. */
  stasisJamTell: 0.6,
  lanceHp: 0.12,
  lanceBossHp: 0.04,
  surgeT: 5,
  surgeRate: 1.6,
  surgeHeat: 2,
  recallKnock: 160,
} as const;

export function orderOf(id: string | null | undefined): OrderDef | undefined {
  return id && id in ORDERS ? ORDERS[id as OrderId] : undefined;
}

export function cleanOrders(list: unknown): OrderId[] {
  if (!Array.isArray(list)) return ["stasis"];
  const out: OrderId[] = [];
  for (const x of list) if (typeof x === "string" && x in ORDERS && !out.includes(x as OrderId)) out.push(x as OrderId);
  if (!out.includes("stasis")) out.unshift("stasis");
  return out.slice(0, ORDER_NUM.maxSlots);
}

/** The second-slot choices: every Order not already slotted. */
export function orderChoices(have: readonly string[]): OrderId[] {
  return ORDER_IDS.filter((id) => !have.includes(id));
}

export const isBossFoe = (t: string) => t === "titan" || t === "colossus";
export const isBigFoe = (t: string) => t === "titan" || t === "colossus" || t === "jammer";
