/** This-game Level rungs. Arena caps at 4. Endless 5+ is extra hurt only. */

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
