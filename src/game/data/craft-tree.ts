import type { CompanionFx } from "./companion";
import { PARAMS } from "../params";

/**
 * Craft skill trees. Same shape as gun trees: 3 branches × 3 nodes.
 * A craft walks at most 2 branches and takes CRAFT_PICKS nodes per run.
 * Bought with Credit, like gun jobs.
 *
 * Auger, Torch and Boost have their own trees. Every other craft uses DEFAULT_CRAFT_TREE.
 * The Hull branch replaces the old Climb "Crew" perks (Fast stitch, Tough hulls).
 */

export type CraftNode = {
  id: string;
  name: string;
  blurb: string;
  cap: boolean;
  /** Changes combat numbers. Runs after kits. */
  apply?: (fx: CompanionFx) => void;
  /** Multiplies max hull when bought. */
  hull?: number;
  /** Multiplies heal rate while docked at home. */
  dockHeal?: number;
};

export type CraftBranch = {
  id: string;
  name: string;
  nodes: [CraftNode, CraftNode, CraftNode];
};

export type CraftTreeDef = {
  id: string;
  branches: [CraftBranch, CraftBranch, CraftBranch];
};

export const CRAFT_PICKS = 3;
export const CRAFT_BRANCHES_MAX = 2;

function n(id: string, name: string, blurb: string, extra: Omit<CraftNode, "id" | "name" | "blurb" | "cap">, cap = false): CraftNode {
  return { id, name, blurb, cap, ...extra };
}

const HULL_BRANCH = (prefix: string): CraftBranch => ({
  id: "hull",
  name: "Hull",
  nodes: [
    n(`${prefix}-hull-1`, "Fast stitch", "Heals faster at home.", { dockHeal: 1.5 }),
    n(`${prefix}-hull-2`, "Tough hull", "More hull.", { hull: 1.22 }),
    n(`${prefix}-hull-3`, "Iron hull", "A lot more hull.", { hull: 1.3 }, true),
  ],
});

export const DEFAULT_CRAFT_TREE: CraftTreeDef = {
  id: "default",
  branches: [
    {
      id: "bite",
      name: "Bite",
      nodes: [
        n("craft-bite-1", "Sharper bite", "Hits harder.", { apply: (f) => void (f.dps *= 1.2) }),
        n("craft-bite-2", "Armor bite", "Hits strip plates.", { apply: (f) => void (f.shred = (f.shred ?? 0) + 0.12) }),
        n("craft-bite-3", "Big bite", "Hits much harder. Special comes sooner.", {
          apply: (f) => {
            f.dps *= 1.35;
            f.specialPeriodMul *= 0.8;
          },
        }, true),
      ],
    },
    {
      id: "reach",
      name: "Reach",
      nodes: [
        n("craft-reach-1", "Wide reach", "Reaches farther.", { apply: (f) => void (f.radius *= 1.15) }),
        n("craft-reach-2", "Quick wings", "Flies faster.", { apply: (f) => void (f.speedMul *= 1.2) }),
        n("craft-reach-3", "Far reach", "Reaches much farther.", { apply: (f) => void (f.radius *= 1.25) }, true),
      ],
    },
    HULL_BRANCH("craft"),
  ],
};

export const CRAFT_TREES: Record<string, CraftTreeDef> = {
  "comp-auger": {
    id: "comp-auger",
    branches: [
      {
        id: "bore",
        name: "Bore",
        nodes: [
          n("auger-bore-1", "Deep bore", "The hole chips harder.", { apply: (f) => void (f.cutDps *= 1.3) }),
          n("auger-bore-2", "Wide bore", "Bigger hole. They slog more.", {
            apply: (f) => {
              f.radius *= 1.15;
              f.cutSlow = Math.max(0.3, f.cutSlow * 0.85);
            },
          }),
          n("auger-bore-3", "Storm bore", "The hole bites hard and strips plates.", {
            apply: (f) => {
              f.cutDps *= 1.5;
              f.shred = (f.shred ?? 0) + 0.15;
            },
          }, true),
        ],
      },
      {
        id: "plunge",
        name: "Plunge",
        nodes: [
          n("auger-plunge-1", "Fast plunge", "Plunge comes sooner.", { apply: (f) => void (f.specialPeriodMul *= 0.8) }),
          n("auger-plunge-2", "Ore well", "Kills near her pay more Credit.", { apply: (f) => void (f.goldMul = (f.goldMul ?? 1) * 1.25) }),
          n("auger-plunge-3", "Sun pit", "The hole burns.", { apply: (f) => void (f.burnDps += 10) }, true),
        ],
      },
      HULL_BRANCH("auger"),
    ],
  },
  "comp-torch": {
    id: "comp-torch",
    branches: [
      {
        id: "sol",
        name: "Sol",
        nodes: [
          n("torch-sol-1", "Hotter sun", "Burns hotter.", { apply: (f) => void (f.burnDps *= 1.4) }),
          n("torch-sol-2", "Wide sun", "More of the lane is on fire.", { apply: (f) => void (f.radius *= 1.2) }),
          n("torch-sol-3", "Solar roar", "Burns much hotter and hits harder.", {
            apply: (f) => {
              f.burnDps *= 1.6;
              f.dps *= 1.2;
            },
          }, true),
        ],
      },
      {
        id: "dive",
        name: "Dive",
        nodes: [
          n("torch-dive-1", "Fast dive", "Dive comes sooner.", { apply: (f) => void (f.specialPeriodMul *= 0.8) }),
          n("torch-dive-2", "Quick wings", "Flies faster.", { apply: (f) => void (f.speedMul *= 1.2) }),
          n("torch-dive-3", "Dive sun", "Hits much harder and strips plates.", {
            apply: (f) => {
              f.dps *= 1.4;
              f.shred = (f.shred ?? 0) + 0.15;
            },
          }, true),
        ],
      },
      HULL_BRANCH("torch"),
    ],
  },
  "comp-boost": {
    id: "comp-boost",
    branches: [
      {
        id: "drive",
        name: "Drive",
        nodes: [
          n("boost-drive-1", "Hot drive", "Guns under her shoot even faster.", { apply: (f) => void (f.buffRate *= 1.3) }),
          n("boost-drive-2", "Wide light", "Lights guns from farther.", { apply: (f) => void (f.radius *= 1.2) }),
          n("boost-drive-3", "All-pad storm", "Guns under her shoot much faster.", { apply: (f) => void (f.buffRate *= 1.4) }, true),
        ],
      },
      {
        id: "wake",
        name: "Wake",
        nodes: [
          n("boost-wake-1", "Burn wake", "Enemies she hits cook.", { apply: (f) => void (f.burnDps += 6) }),
          n("boost-wake-2", "Spark ride", "Flies faster.", { apply: (f) => void (f.speedMul *= 1.2) }),
          n("boost-wake-3", "Sun flare", "Burns much hotter and hits harder.", {
            apply: (f) => {
              f.burnDps *= 1.8;
              f.dps *= 1.2;
            },
          }, true),
        ],
      },
      HULL_BRANCH("boost"),
    ],
  },
};

export type CraftJobState = {
  jobs?: string[] | null;
  card: { id: string; templateId?: string };
};

export function craftTreeOf(card: { id: string; templateId?: string }): CraftTreeDef {
  return CRAFT_TREES[card.templateId ?? card.id] ?? CRAFT_TREES[card.id] ?? DEFAULT_CRAFT_TREE;
}

function nodeIndex(tree: CraftTreeDef): Map<string, { branch: CraftBranch; node: CraftNode; rank: number }> {
  const m = new Map<string, { branch: CraftBranch; node: CraftNode; rank: number }>();
  for (const b of tree.branches) b.nodes.forEach((node, i) => m.set(node.id, { branch: b, node, rank: i + 1 }));
  return m;
}

export function craftNodes(c: CraftJobState): CraftNode[] {
  const idx = nodeIndex(craftTreeOf(c.card));
  return (c.jobs ?? []).map((id) => idx.get(id)?.node).filter((x): x is CraftNode => !!x);
}

export function craftRankInBranch(c: CraftJobState, branchId: string): number {
  const branch = craftTreeOf(c.card).branches.find((b) => b.id === branchId);
  if (!branch) return 0;
  const have = new Set(c.jobs ?? []);
  let rank = 0;
  for (let i = 0; i < branch.nodes.length; i++) {
    if (have.has(branch.nodes[i]!.id)) rank = i + 1;
    else break;
  }
  return rank;
}

export function craftStartedBranches(c: CraftJobState): string[] {
  return craftTreeOf(c.card)
    .branches.filter((b) => craftRankInBranch(c, b.id) > 0)
    .map((b) => b.id);
}

export function craftPicksLeft(c: CraftJobState): number {
  return Math.max(0, CRAFT_PICKS - (c.jobs ?? []).length);
}

export function offerCraftJobs(c: CraftJobState): CraftNode[] {
  if (craftPicksLeft(c) <= 0) return [];
  const started = craftStartedBranches(c);
  const out: CraftNode[] = [];
  for (const b of craftTreeOf(c.card).branches) {
    const rank = craftRankInBranch(c, b.id);
    if (rank >= 3) continue;
    if (rank === 0 && started.length >= CRAFT_BRANCHES_MAX) continue;
    const node = b.nodes[rank];
    if (node) out.push(node);
  }
  return out;
}

export function canTakeCraftJob(c: CraftJobState, id: string): boolean {
  return offerCraftJobs(c).some((x) => x.id === id);
}

/** Applies bought craft nodes to combat numbers. */
export function applyCraftJobs(fx: CompanionFx, jobs: string[] | null | undefined, card: { id: string; templateId?: string }) {
  if (!jobs?.length) return fx;
  for (const node of craftNodes({ jobs, card })) node.apply?.(fx);
  return fx;
}

/** Credit for the next craft tree pick. Table lives in PARAMS.craftJobCost. */
export function craftUpgradeCost(picksTaken: number): number {
  const t = PARAMS.craftJobCost;
  return t[Math.max(0, Math.min(t.length - 1, picksTaken))]!;
}

export function craftHullMul(c: CraftJobState): number {
  return craftNodes(c).reduce((m, node) => m * (node.hull ?? 1), 1);
}

export function craftDockHealMul(c: CraftJobState): number {
  return craftNodes(c).reduce((m, node) => m * (node.dockHeal ?? 1), 1);
}
