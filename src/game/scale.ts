/**
 * Endless curve. Level 9 is tier 1. Health and count climb. Speed stops at 1.6×.
 * A naked board should die. This function does not decide that. It only scales.
 */

export function tierOf(level: number) {
  return Math.max(0, level - 8);
}

export function scaleAt(level: number) {
  const tier = tierOf(level);
  return {
    tier,
    hp: 1.12 ** tier,
    count: 1.06 ** tier,
    speed: Math.min(1.6, 1.04 ** tier),
  };
}
