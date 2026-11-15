/**
 * Threat. Opt-in difficulty toggles picked before a run.
 * Each toggle adds its points to the run's Threat; Threat raises the payout.
 * (Not "heat": that name belongs to the heat card set and gun heatXp.)
 */
export type ThreatId = "hardened" | "overdrive" | "glass" | "lean" | "bigmega" | "escort" | "mutant" | "silence";

export type ThreatDef = { id: ThreatId; name: string; blurb: string; points: number };

export const THREATS: ThreatDef[] = [
  { id: "hardened", name: "Hardened", blurb: "+20% enemy HP.", points: 1 },
  { id: "overdrive", name: "Overdrive", blurb: "+10% enemy speed.", points: 1 },
  { id: "glass", name: "Glass", blurb: "Start with 6 lives, not 10.", points: 1 },
  { id: "lean", name: "Lean", blurb: "Tree picks cost 25% more.", points: 1 },
  { id: "silence", name: "Radio Silence", blurb: "No Orders this run.", points: 1 },
  { id: "bigmega", name: "Big Megas", blurb: "Mega waves bring 1.5× enemies.", points: 2 },
  { id: "escort", name: "Escort", blurb: "A Patch joins every wave from wave 2.", points: 2 },
  { id: "mutant", name: "Mutant", blurb: "15% of enemies get a shield, speed or regen.", points: 3 },
];

/** Numbers for each toggle. Keep balance knobs here. */
export const THREAT_NUM = {
  hardenedHp: 1.2,
  overdriveSpeed: 1.1,
  glassLives: 6,
  leanCost: 1.25,
  /** Replaces PARAMS.megaCountMul on mega waves. */
  bigMegaCountMul: 1.5,
  /** Escort medic joins from this wave index (0-based; 1 = wave 2). */
  escortFrom: 1,
  escortDelay: 2.2,
  mutantOdds: 0.15,
  mutantShield: 0.2,
  mutantSpeed: 1.25,
  /** Regen per second, share of max HP. */
  mutantRegen: 0.02,
  /** Payout bonus per Threat point. */
  payPerPoint: 0.1,
} as const;

export type MutantAffix = "shield" | "swift" | "regen";
export const MUTANT_AFFIXES: MutantAffix[] = ["shield", "swift", "regen"];

const STORE_KEY = "vector-threat-v1";

export function cleanThreat(list: unknown): ThreatId[] {
  if (!Array.isArray(list)) return [];
  const ok = new Set(THREATS.map((t) => t.id));
  return [...new Set(list.filter((x): x is ThreatId => typeof x === "string" && ok.has(x as ThreatId)))];
}

export function threatPoints(list: readonly string[] | null | undefined): number {
  let n = 0;
  for (const t of THREATS) if (list?.includes(t.id)) n += t.points;
  return n;
}

export function hasThreat(list: readonly string[] | null | undefined, id: ThreatId): boolean {
  return !!list?.includes(id);
}

/** Vault Credit and Pass XP multiplier for a Threat score. */
export function threatPayMul(threat: number): number {
  return 1 + THREAT_NUM.payPerPoint * Math.max(0, threat || 0);
}

/** Gun and craft tree pick cost multiplier. */
export function threatCostMul(list: readonly string[] | null | undefined): number {
  return hasThreat(list, "lean") ? THREAT_NUM.leanCost : 1;
}

/** Last choice, remembered between runs. */
export function loadThreat(): ThreatId[] {
  if (typeof window === "undefined") return [];
  try {
    return cleanThreat(JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

export function saveThreat(list: readonly string[]): ThreatId[] {
  const clean = cleanThreat(list);
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(clean));
  } catch {
    /* storage off */
  }
  return clean;
}
