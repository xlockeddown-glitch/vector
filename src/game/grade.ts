import { ODDS } from "./constants";
import { PATH_LEN } from "./data/map";
import type { Grade, GradeResult, Rarity } from "./types";

const GRADE_POINTS: Record<Grade, number> = {
  S: 80,
  A: 58,
  B: 42,
  C: 28,
  D: 16,
  F: 8,
};

export function gradeWave(input: {
  leaks: number;
  kills: number;
  gold: number;
  duration: number;
  expected: number;
}): GradeResult {
  const { leaks, kills, gold, duration, expected } = input;
  let grade: Grade;
  if (leaks >= 6) grade = "F";
  else if (leaks >= 4) grade = "D";
  else if (leaks >= 2) grade = "C";
  else if (leaks === 1) grade = "B";
  else if (duration <= expected * 0.78) grade = "S";
  else grade = "A";

  const stars =
    grade === "S" ? 5 : grade === "A" ? 4 : grade === "B" ? 3 : grade === "C" ? 2 : 1;

  const perfect = leaks === 0 ? 22 : 0;
  const points = GRADE_POINTS[grade] + Math.floor(kills * 0.35) + perfect;

  return {
    grade,
    stars,
    leaks,
    kills,
    gold,
    duration,
    points,
    odds: { ...ODDS[grade] } as Record<Rarity, number>,
  };
}

export function expectedWaveTime(enemyCount: number, avgSpeed: number) {
  const travel = PATH_LEN / Math.max(24, avgSpeed);
  const spawn = Math.max(4, enemyCount * 0.35);
  return travel + spawn * 0.25;
}
