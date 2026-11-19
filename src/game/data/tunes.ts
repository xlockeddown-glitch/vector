import type { TowerRole, TowerStats } from "../types";

export type TuneDef = {
  id: string;
  name: string;
  blurb: string;
  cap: boolean;
  apply: (s: TowerStats) => void;
};

export function makeTune(id: string, name: string, blurb: string, cap: boolean, apply: (s: TowerStats) => void): TuneDef {
  return { id, name, blurb, cap, apply };
}

const t = makeTune;

const FALLBACK: [TuneDef, TuneDef] = [
  t("any-hard", "Harder hit", "Hits harder.", false, (s) => {
    s.damage *= 1.2;
  }),
  t("any-fast", "Faster shot", "Shoots more often.", false, (s) => {
    s.rate *= 1.2;
  }),
];

const ALL: TuneDef[] = [];

export function registerTunes(list: TuneDef[]) {
  for (const n of list) {
    if (!ALL.some((x) => x.id === n.id)) ALL.push(n);
  }
}

export function tuneById(id: string | null | undefined, _role?: TowerRole | undefined): TuneDef | undefined {
  if (!id) return undefined;
  return ALL.find((n) => n.id === id) ?? FALLBACK.find((n) => n.id === id);
}

export function applyTunes(
  stats: TowerStats,
  job: string | null | undefined,
  cap: string | null | undefined,
  role: TowerRole | undefined,
): TowerStats {
  const out = { ...stats };
  tuneById(job, role)?.apply(out);
  tuneById(cap, role)?.apply(out);
  return out;
}

export function applyJobList(stats: TowerStats, jobs: string[] | null | undefined, role: TowerRole | undefined): TowerStats {
  const out = { ...stats };
  for (const id of jobs ?? []) tuneById(id, role)?.apply(out);
  return out;
}
