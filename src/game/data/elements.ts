import type { SetId, TowerStats } from "../types";
import { PARAMS } from "../params";

/**
 * Elements. Plasma (fire), Cryo (ice) and Volt (lightning) are the three
 * element sets. Any gun can be infused with one element it isn't already:
 * its shots carry that element and it counts toward that set's combo.
 *
 * Two elements on one enemy react:
 *   Plasma + Cryo  → Shatter   (burst damage)
 *   Cryo + Volt    → Brittle   (armor stripped)
 *   Plasma + Volt  → Overload  (blast hits enemies nearby)
 */

export type ElementId = "heat" | "cold" | "spark";
export const ELEMENT_ORDER: ElementId[] = ["heat", "cold", "spark"];

export const ELEMENTS: Record<ElementId, { id: ElementId; name: string; word: string; blurb: string; color: string }> = {
  heat: { id: "heat", name: "Plasma", word: "Fire", blurb: "Shots burn. Counts as Plasma.", color: "#ff7a3c" },
  cold: { id: "cold", name: "Cryo", word: "Ice", blurb: "Shots chill. Counts as Cryo.", color: "#7ecbff" },
  spark: { id: "spark", name: "Volt", word: "Shock", blurb: "Shots jump once. Counts as Volt.", color: "#c6a3ff" },
};

export type ReactionId = "shatter" | "brittle" | "overload";

export const REACTIONS: Record<ReactionId, { id: ReactionId; name: string; pair: [ElementId, ElementId]; blurb: string; color: string }> = {
  shatter: { id: "shatter", name: "Shatter", pair: ["heat", "cold"], blurb: "Fire meets ice: a burst of damage.", color: "#ffd2a8" },
  brittle: { id: "brittle", name: "Brittle", pair: ["cold", "spark"], blurb: "Ice meets shock: armor is stripped.", color: "#b9d8ff" },
  overload: { id: "overload", name: "Overload", pair: ["heat", "spark"], blurb: "Fire meets shock: a blast hits enemies nearby.", color: "#e3b8ff" },
};

export function isElement(id: unknown): id is ElementId {
  return id === "heat" || id === "cold" || id === "spark";
}

/** Elements a gun may be infused with: any element except its own set. */
export function infuseChoices(ownSet: SetId | null | undefined): ElementId[] {
  return ELEMENT_ORDER.filter((e) => e !== ownSet);
}

/** Adds the infused element's effect to a gun's stats. */
export function applyInfusion(stats: TowerStats, el: ElementId | null | undefined) {
  if (!el) return stats;
  if (el === "heat") {
    stats.burnDps = Math.max(stats.burnDps ?? 0, Math.round(stats.damage * PARAMS.infuseBurn));
  } else if (el === "cold") {
    stats.slowT = Math.max(stats.slowT ?? 0, PARAMS.infuseSlowT);
    stats.slowMul = Math.min(stats.slowMul ?? 1, PARAMS.infuseSlowMul);
  } else if (el === "spark") {
    stats.chain = (stats.chain ?? 0) + 1;
  }
  return stats;
}

/** Which elements a hit carries: the gun's own set (if elemental) plus its infusion. */
export function hitElements(stats: { tribe?: SetId; infuse?: ElementId | null; burnDps?: number; slowT?: number }): ElementId[] {
  const out = new Set<ElementId>();
  if (isElement(stats.tribe)) out.add(stats.tribe);
  if (stats.infuse) out.add(stats.infuse);
  return [...out];
}
