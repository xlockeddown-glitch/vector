import type { CardDef, Rarity, RolledCard } from "../types";

export type ClimbBranch = "bay" | "pack" | "crew";

export type ClimbRanks = Record<ClimbBranch, number>;

/** MUT position line. Not an overall rating. */
export type PerkRole = "Credit" | "Guns" | "Crafts" | "Path" | "Bonus" | "Lives";

export type ClimbPerk = {
  id: string;
  branch: ClimbBranch;
  rank: 1 | 2 | 3;
  name: string;
  blurb: string;
  role: PerkRole;
};

export const CLIMB_BRANCH: Record<ClimbBranch, { name: string; job: string }> = {
  bay: { name: "Bay", job: "moons and home" },
  pack: { name: "Pack", job: "richer drafts" },
  crew: { name: "Crew", job: "crafts in the air" },
};

export const CLIMB: ClimbPerk[] = [
  { id: "climb-bay-1", branch: "bay", rank: 1, name: "Spare moon", blurb: "One extra moon on the field.", role: "Path" },
  { id: "climb-bay-2", branch: "bay", rank: 2, name: "Extra swap", blurb: "One extra move this game.", role: "Guns" },
  { id: "climb-bay-3", branch: "bay", rank: 3, name: "Home bite", blurb: "Home hits harder.", role: "Lives" },
  { id: "climb-pack-1", branch: "pack", rank: 1, name: "Richer packs", blurb: "Packs roll one gem up.", role: "Bonus" },
  { id: "climb-pack-2", branch: "pack", rank: 2, name: "Skip ready", blurb: "Start with one skip charge.", role: "Bonus" },
  { id: "climb-pack-3", branch: "pack", rank: 3, name: "Hotter rolls", blurb: "Packs bump one more gem.", role: "Bonus" },
  { id: "climb-crew-1", branch: "crew", rank: 1, name: "Fast stitch", blurb: "Hurt crafts heal faster at home.", role: "Crafts" },
  { id: "climb-crew-2", branch: "crew", rank: 2, name: "Lord limp", blurb: "A lord still works while walking home.", role: "Crafts" },
  { id: "climb-crew-3", branch: "crew", rank: 3, name: "Tough hulls", blurb: "Crafts can take more hits.", role: "Crafts" },
];

export const GOLD_CLIMB: ClimbPerk = {
  id: "climb-gold",
  branch: "bay",
  rank: 1,
  name: "Spare credit",
  blurb: "Bonus is full. Take 5 Credit.",
  role: "Credit",
};

export function emptyClimb(): ClimbRanks {
  return { bay: 0, pack: 0, crew: 0 };
}

export function climbFx(ranks: ClimbRanks | undefined) {
  const r = ranks ?? emptyClimb();
  return {
    pads: r.bay >= 1 ? 1 : 0,
    swap: r.bay >= 2 ? 1 : 0,
    coreDmg: r.bay >= 3 ? 1.18 : 1,
    luck: (r.pack >= 1 ? 1 : 0) + (r.pack >= 3 ? 1 : 0),
    skipStart: r.pack >= 2,
    healMul: r.crew >= 1 ? 1.5 : 1,
    lordLimp: r.crew >= 2,
    hpMul: r.crew >= 3 ? 1.22 : 1,
  };
}

export function climbMaxed(ranks: ClimbRanks | undefined) {
  const r = ranks ?? emptyClimb();
  return r.bay >= 3 && r.pack >= 3 && r.crew >= 3;
}

export function climbOffer(taken: ClimbRanks | undefined): ClimbPerk[] {
  const r = taken ?? emptyClimb();
  const out: ClimbPerk[] = [];
  for (const b of ["bay", "pack", "crew"] as ClimbBranch[]) {
    const next = (r[b] + 1) as 1 | 2 | 3;
    if (next > 3) continue;
    const perk = CLIMB.find((p) => p.branch === b && p.rank === next);
    if (perk) out.push(perk);
  }
  if (!out.length) out.push(GOLD_CLIMB);
  return out;
}

function perkCard(perk: ClimbPerk, rarity: Rarity): CardDef {
  return {
    id: perk.id,
    name: perk.name,
    kind: "climb",
    rarity,
    art: `climb-${perk.branch}`,
    set: null,
    cost: 0,
    blurb: perk.blurb,
    role: perk.role,
    climb: { branch: perk.branch, rank: perk.rank },
  };
}

export function dealClimbCards(taken: ClimbRanks | undefined, rarity: Rarity = "rare"): RolledCard[] {
  return climbOffer(taken).map((p) => ({
    ...perkCard(p, rarity),
    templateId: p.id,
    prefix: "",
    affixes: [],
    seed: (Math.random() * 1e9) | 0,
  }));
}

export function climbOf(id: string): ClimbPerk | undefined {
  if (id === GOLD_CLIMB.id) return GOLD_CLIMB;
  return CLIMB.find((p) => p.id === id);
}

export function climbSummary(ranks: ClimbRanks | undefined): string {
  const r = ranks ?? emptyClimb();
  const bits = [];
  if (r.bay) bits.push(CLIMB.find((p) => p.branch === "bay" && p.rank === r.bay)?.name);
  if (r.pack) bits.push(CLIMB.find((p) => p.branch === "pack" && p.rank === r.pack)?.name);
  if (r.crew) bits.push(CLIMB.find((p) => p.branch === "crew" && p.rank === r.crew)?.name);
  return bits.filter(Boolean).join(" · ") || "Bonus for a run perk";
}
