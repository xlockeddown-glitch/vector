import type { CoverShape } from "./types";

/** Geometric knobs. Areas at equal range stay within ~40% of the largest (circle). */
export const COVER = {
  coneArc: 1.36,
  coneInner: 8,
  ringInner: 0.42,
  diamond: 1.12,
  laneBack: 0.22,
  laneFwd: 1.08,
  laneHalf: 0.5,
};

export function coverLabel(shape: CoverShape | undefined): string {
  if (shape === "cone") return "Cone";
  if (shape === "ring") return "Ring";
  if (shape === "lane") return "Lane";
  if (shape === "diamond") return "Diamond";
  return "Circle";
}

export function coverHint(shape: CoverShape | undefined): string {
  if (shape === "cone") return "A wide wedge that faces the path. Great on a long run. Weak beside you.";
  if (shape === "ring") return "A doughnut. Hits far, skips what is next to the moon. Plant in a pocket.";
  if (shape === "lane") return "A fat strip along the path. Hold a spawn. Thin off the track.";
  if (shape === "diamond") return "A diamond. Reaches farther on the corners. Plant on a bend.";
  return "A circle around the moon. Safe anywhere close.";
}

export function coverRangeMul(shape: CoverShape | undefined): number {
  if (shape === "cone") return 1.19;
  if (shape === "lane") return 1.22;
  return 1;
}

export function inCover(
  shape: CoverShape | undefined,
  ox: number,
  oy: number,
  ex: number,
  ey: number,
  range: number,
  aim: number,
  innerFrac = COVER.ringInner,
  halfArc = COVER.coneArc,
): boolean {
  const dx = ex - ox;
  const dy = ey - oy;
  const dist = Math.hypot(dx, dy);
  if (range <= 0) return false;
  const kind = shape ?? "circle";
  if (kind === "circle") return dist <= range;
  if (kind === "ring") {
    const inner = range * (innerFrac || COVER.ringInner);
    return dist <= range && dist >= inner;
  }
  if (kind === "diamond") return Math.abs(dx) + Math.abs(dy) <= range * COVER.diamond;
  if (kind === "cone") {
    if (dist > range || dist < COVER.coneInner) return false;
    const ang = Math.atan2(dy, dx);
    let d = ang - aim;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return Math.abs(d) <= (halfArc || COVER.coneArc);
  }
  if (kind === "lane") {
    const c = Math.cos(aim);
    const s = Math.sin(aim);
    const along = dx * c + dy * s;
    const perp = -dx * s + dy * c;
    return along >= -range * COVER.laneBack && along <= range * COVER.laneFwd && Math.abs(perp) <= range * COVER.laneHalf;
  }
  return dist <= range;
}
