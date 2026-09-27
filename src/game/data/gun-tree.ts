import { PARAMS } from "../params";
import type { OpId, TowerRole, TowerStats } from "../types";
import { makeTune, registerTunes, type TuneDef } from "./tunes";

const t = makeTune;

export type GunBranch = {
  id: string;
  name: string;
  nodes: [TuneDef, TuneDef, TuneDef];
};

export type GunTreeDef = {
  role: TowerRole;
  line: string;
  branches: [GunBranch, GunBranch, GunBranch];
};

function n(id: string, name: string, blurb: string, apply: (s: TowerStats) => void, cap = false): TuneDef {
  return t(id, name, blurb, cap, apply);
}

export const GUN_TREES: Record<string, GunTreeDef> = {
  spear: {
    role: "spear",
    line: "pierce",
    branches: [
      {
        id: "pierce",
        name: "Pierce",
        nodes: [
          n("spear-pierce", "Deeper pierce", "Hits farther down the cone.", (s) => {
            s.range *= 1.2;
          }),
          n("spear-four", "Fourth pierce", "Hits one more enemy in line.", (s) => {
            s.split = (s.split ?? 1) + 1;
          }, true),
          n("spear-crack", "Armor crack", "Also strips plates.", (s) => {
            s.shred = (s.shred ?? 0) + 0.22;
          }, true),
        ],
      },
      {
        id: "throw",
        name: "Throw",
        nodes: [
          n("spear-fast", "Faster throw", "Shoots more often.", (s) => {
            s.rate *= 1.22;
          }),
          n("spear-hot", "Hot spike", "Shots also burn.", (s) => {
            s.burnDps = (s.burnDps ?? 0) + 6;
          }),
          n("spear-hurt", "Harder spike", "Hits harder.", (s) => {
            s.damage *= 1.22;
          }, true),
        ],
      },
      {
        id: "peel",
        name: "Peel",
        nodes: [
          n("scour-peel", "Harder peel", "Strips more armor.", (s) => {
            s.shred = (s.shred ?? 0) + 0.18;
          }),
          n("scour-fast", "Faster saw", "The saw spins more.", (s) => {
            s.rate *= 1.2;
          }),
          n("scour-hurt", "Peeled pain", "Hurt stripped enemies more.", (s) => {
            s.damage *= 1.22;
          }, true),
        ],
      },
    ],
  },
  crater: {
    role: "crater",
    line: "fire",
    branches: [
      {
        id: "bowl",
        name: "Bowl",
        nodes: [
          n("crater-bowl", "Bigger bowl", "Splash covers more enemies.", (s) => {
            s.splash = (s.splash ?? 70) * 1.28;
          }),
          n("crater-wide", "Wide bowl", "Even bigger splash.", (s) => {
            s.splash = (s.splash ?? 80) * 1.22;
          }, true),
          n("crater-fire", "Fire bowl", "The splash also burns.", (s) => {
            s.burnDps = (s.burnDps ?? 0) + 8;
          }, true),
        ],
      },
      {
        id: "drop",
        name: "Drop",
        nodes: [
          n("crater-drop", "Faster drop", "The bowl drops more often.", (s) => {
            s.rate *= 1.2;
          }),
          n("pulse-big", "Bigger boom", "The boom is wider.", (s) => {
            s.nova = (s.nova ?? 80) * 1.28;
          }),
          n("pulse-knock", "Knock boom", "The boom shoves enemies back.", (s) => {
            s.knock = (s.knock ?? 0) + 48;
          }, true),
        ],
      },
      {
        id: "kiln",
        name: "Kiln",
        nodes: [
          n("kiln-hot", "Hotter pad", "Burns harder.", (s) => {
            s.burnDps = (s.burnDps ?? 6) + 8;
            s.auraDps = (s.auraDps ?? 18) * 1.15;
          }),
          n("kiln-wide", "Wider pad", "The heat covers more path.", (s) => {
            s.range *= 1.2;
          }),
          n("kiln-hop", "Burn hop", "Burning enemies light neighbors.", (s) => {
            s.burnDps = (s.burnDps ?? 8) + 6;
            s.splash = Math.max(s.splash ?? 0, 40);
          }, true),
        ],
      },
    ],
  },
  frost: {
    role: "frost",
    line: "ice",
    branches: [
      {
        id: "cold",
        name: "Cold",
        nodes: [
          n("frost-cold", "Colder bolt", "Enemies crawls more.", (s) => {
            s.slowMul = Math.min(s.slowMul ?? 1, 0.42);
          }),
          n("frost-freeze", "Freeze once", "First hit can freeze.", (s) => {
            s.slowT = Math.max(s.slowT ?? 0, 3.2);
            s.slowMul = Math.min(s.slowMul ?? 1, 0.36);
          }, true),
          n("frost-wall", "Ice wall", "The patch is a wall.", (s) => {
            s.splash = Math.max(s.splash ?? 0, 54);
          }, true),
        ],
      },
      {
        id: "patch",
        name: "Patch",
        nodes: [
          n("frost-patch", "Longer patch", "Ice stays on the path.", (s) => {
            s.slowT = Math.max(s.slowT ?? 0, 2.8);
          }),
          n("wall-long", "Longer wall", "Ice stays longer.", (s) => {
            s.slowT = Math.max(s.slowT ?? 0, 2.6);
            s.range *= 1.1;
          }),
          n("wall-freeze", "Freeze wall", "First hit can freeze.", (s) => {
            s.slowMul = Math.min(s.slowMul ?? 1, 0.34);
          }, true),
        ],
      },
      {
        id: "gate",
        name: "Gate",
        nodes: [
          n("wall-ice", "Harder ice", "Enemies crawls more on the wall.", (s) => {
            s.slowMul = Math.min(s.slowMul ?? 1, 0.42);
          }),
          n("wall-wide", "Wider wall", "The ice strip is longer.", (s) => {
            s.range *= 1.2;
          }, true),
          n("mine-ice", "Ice pit", "Pits also slow.", (s) => {
            s.slowMul = Math.min(s.slowMul ?? 1, 0.55);
            s.slowT = Math.max(s.slowT ?? 0, 1.6);
          }, true),
        ],
      },
    ],
  },
  rail: {
    role: "rail",
    line: "lane",
    branches: [
      {
        id: "zip",
        name: "Zip",
        nodes: [
          n("rail-long", "Longer zip", "The strip reaches farther.", (s) => {
            s.range *= 1.22;
          }),
          n("rail-fast", "Faster zip", "Zips more often.", (s) => {
            s.rate *= 1.2;
          }),
          n("rail-double", "Double zip", "Two zips close together.", (s) => {
            s.split = (s.split ?? 1) + 1;
          }, true),
        ],
      },
      {
        id: "hook",
        name: "Hook",
        nodes: [
          n("hook-yank", "Longer yank", "Pulls enemies farther back.", (s) => {
            s.knock = (s.knock ?? 50) * 1.35;
          }),
          n("hook-fast", "Faster grab", "Grabs more often.", (s) => {
            s.rate *= 1.2;
          }),
          n("hook-two", "Yank two", "Pulls a neighbor too.", (s) => {
            s.splash = Math.max(s.splash ?? 0, 48);
          }, true),
        ],
      },
      {
        id: "twin",
        name: "Twin",
        nodes: [
          n("split-third", "Third shot", "One more shot each beat.", (s) => {
            s.split = (s.split ?? 2) + 1;
          }),
          n("split-mark", "Mark split", "Shots mark enemies.", (s) => {
            s.markGold = (s.markGold ?? 0) + 0.35;
          }, true),
          n("split-slow", "Slow split", "Shots also slow.", (s) => {
            s.slowMul = Math.min(s.slowMul ?? 1, 0.72);
            s.slowT = Math.max(s.slowT ?? 0, 1);
          }, true),
        ],
      },
    ],
  },
  umbra: {
    role: "umbra",
    line: "fold",
    branches: [
      {
        id: "fold",
        name: "Fold",
        nodes: [
          n("umbra-deep", "Deeper fold", "Enemies walks a longer path.", (s) => {
            s.bend = (s.bend ?? 20) * 1.35;
          }),
          n("umbra-wide", "Wider fold", "The fold covers more path.", (s) => {
            s.range *= 1.18;
          }),
          n("umbra-slow", "Slow fold", "Folded enemies crawl.", (s) => {
            s.slowMul = Math.min(s.slowMul ?? 1, 0.7);
            s.slowT = Math.max(s.slowT ?? 0, 1.2);
          }, true),
        ],
      },
      {
        id: "chip",
        name: "Chip",
        nodes: [
          n("umbra-chip", "Chip fold", "The fold chips enemies.", (s) => {
            s.auraDps = (s.auraDps ?? 20) * 1.25;
          }, true),
          n("umbra-hot", "Hot fold", "The fold also burns.", (s) => {
            s.burnDps = (s.burnDps ?? 0) + 6;
          }),
          n("umbra-hurt", "Harder fold", "The dish hits harder.", (s) => {
            s.auraDps = (s.auraDps ?? 20) * 1.18;
          }, true),
        ],
      },
      {
        id: "pull",
        name: "Pull",
        nodes: [
          n("umbra-pull", "Stronger pull", "Pulls enemies closer.", (s) => {
            s.lure = (s.lure ?? 40) * 1.28;
          }),
          n("umbra-far", "Longer pull", "The pull reaches farther.", (s) => {
            s.range *= 1.16;
          }),
          n("umbra-hold", "Sticky pull", "Pulled enemies crawl.", (s) => {
            s.slowMul = Math.min(s.slowMul ?? 1, 0.68);
            s.slowT = Math.max(s.slowT ?? 0, 1.1);
          }, true),
        ],
      },
    ],
  },
  cascade: {
    role: "cascade",
    line: "spark",
    branches: [
      {
        id: "jump",
        name: "Jump",
        nodes: [
          n("cascade-hop", "Extra jump", "Jumps one more enemy.", (s) => {
            s.chain = (s.chain ?? 1) + 1;
          }),
          n("cascade-far", "Far jump", "Jumps reach farther.", (s) => {
            s.range *= 1.16;
            s.chain = (s.chain ?? 2) + 1;
          }, true),
          n("cascade-hot", "Hot spark", "Jumps also burn.", (s) => {
            s.burnDps = (s.burnDps ?? 0) + 6;
          }, true),
        ],
      },
      {
        id: "bounce",
        name: "Bounce",
        nodes: [
          n("bounce-hop", "Extra hop", "One more bounce.", (s) => {
            s.chain = (s.chain ?? 3) + 1;
          }),
          n("bounce-fast", "Faster bounce", "Bounces more often.", (s) => {
            s.rate *= 1.2;
          }),
          n("bounce-armor", "Armor hop", "Bounces strip plates.", (s) => {
            s.shred = (s.shred ?? 0) + 0.18;
          }, true),
        ],
      },
      {
        id: "beam",
        name: "Beam",
        nodes: [
          n("beam-long", "Longer beam", "The beam reaches farther.", (s) => {
            s.range *= 1.2;
          }),
          n("beam-fast", "Faster beam", "Beams more often.", (s) => {
            s.rate *= 1.18;
          }),
          n("beam-pierce", "Pierce beam", "Hits more enemies in the strip.", (s) => {
            s.split = (s.split ?? 1) + 1;
          }, true),
        ],
      },
    ],
  },
  sweep: {
    role: "sweep",
    line: "wide",
    branches: [
      {
        id: "fan",
        name: "Fan",
        nodes: [
          n("sweep-wide", "Wider fan", "The cone is wider.", (s) => {
            s.coverArc = (s.coverArc ?? 1.2) * 1.18;
            s.range *= 1.08;
          }),
          n("sweep-fast", "Faster fan", "The fan hits more often.", (s) => {
            s.rate *= 1.2;
          }),
          n("sweep-burn", "Burn fan", "The fan also burns.", (s) => {
            s.burnDps = (s.burnDps ?? 0) + 6;
          }, true),
        ],
      },
      {
        id: "swarm",
        name: "Wide",
        nodes: [
          n("orbit-more", "Fat corona", "Hits more of the clump.", (s) => {
            s.split = (s.split ?? 3) + 1;
          }),
          n("orbit-fast", "Faster sting", "Hits more often.", (s) => {
            s.rate *= 1.2;
          }),
          n("orbit-slow", "Slow sting", "Also slows.", (s) => {
            s.slowMul = Math.min(s.slowMul ?? 1, 0.72);
            s.slowT = Math.max(s.slowT ?? 0, 0.9);
          }, true),
        ],
      },
      {
        id: "slow",
        name: "Slow",
        nodes: [
          n("sweep-slow", "Slow fan", "The fan also slows.", (s) => {
            s.slowMul = Math.min(s.slowMul ?? 1, 0.7);
            s.slowT = Math.max(s.slowT ?? 0, 1.1);
          }, true),
          n("orbit-burn", "Burn sting", "Drones also burn.", (s) => {
            s.burnDps = (s.burnDps ?? 0) + 5;
          }, true),
          n("sweep-far", "Longer fan", "The fan reaches farther.", (s) => {
            s.range *= 1.18;
          }, true),
        ],
      },
    ],
  },
  brand: {
    role: "brand",
    line: "mark",
    branches: [
      {
        id: "mark",
        name: "Mark",
        nodes: [
          n("brand-mark", "Bigger mark", "Kills pay more.", (s) => {
            s.markGold = (s.markGold ?? 0.4) + 0.25;
          }),
          n("brand-fast", "Faster mark", "Marks more often.", (s) => {
            s.rate *= 1.2;
          }),
          n("brand-pay", "Rich mark", "Marked kills pay a lot.", (s) => {
            s.markGold = (s.markGold ?? 0.5) + 0.4;
          }, true),
        ],
      },
      {
        id: "burn",
        name: "Burn",
        nodes: [
          n("brand-burn", "Burn mark", "Marks also burn.", (s) => {
            s.burnDps = (s.burnDps ?? 0) + 6;
          }, true),
          n("brand-hot", "Hotter mark", "Burn lasts.", (s) => {
            s.burnDps = (s.burnDps ?? 0) + 8;
          }),
          n("brand-pop", "Pop mark", "Marked enemies splash.", (s) => {
            s.splash = Math.max(s.splash ?? 0, 44);
          }, true),
        ],
      },
      {
        id: "strip",
        name: "Strip",
        nodes: [
          n("brand-strip", "Strip mark", "Marks peel armor.", (s) => {
            s.shred = (s.shred ?? 0) + 0.16;
          }),
          n("brand-hurt", "Harder mark", "Hits marked enemies more.", (s) => {
            s.damage *= 1.18;
          }),
          n("brand-long", "Longer mark", "The stamp reaches farther.", (s) => {
            s.range *= 1.16;
          }, true),
        ],
      },
    ],
  },
  mine: {
    role: "mine",
    line: "pit",
    branches: [
      {
        id: "pit",
        name: "Pit",
        nodes: [
          n("mine-deep", "Deeper pit", "Pits chip more.", (s) => {
            s.damage *= 1.25;
          }),
          n("mine-fast", "Faster drop", "Drops pits more often.", (s) => {
            s.rate *= 1.22;
          }),
          n("mine-big", "Bigger pit", "The pit is wider.", (s) => {
            s.nova = Math.max(s.nova ?? 0, 52);
          }, true),
        ],
      },
      {
        id: "ice",
        name: "Ice",
        nodes: [
          n("mine-chill", "Ice pit", "Pits also slow.", (s) => {
            s.slowMul = Math.min(s.slowMul ?? 1, 0.55);
            s.slowT = Math.max(s.slowT ?? 0, 1.6);
          }, true),
          n("mine-hold", "Longer ice", "The slow stays.", (s) => {
            s.slowT = Math.max(s.slowT ?? 0, 2.2);
          }),
          n("mine-freeze", "Freeze pit", "First step can freeze.", (s) => {
            s.slowMul = Math.min(s.slowMul ?? 1, 0.38);
          }, true),
        ],
      },
      {
        id: "fire",
        name: "Fire",
        nodes: [
          n("mine-burn", "Burn pit", "Pits also burn.", (s) => {
            s.burnDps = (s.burnDps ?? 0) + 7;
          }, true),
          n("mine-hot", "Hotter pit", "Burn hits harder.", (s) => {
            s.burnDps = (s.burnDps ?? 0) + 8;
          }),
          n("mine-pop", "Pop pit", "Pits splash neighbors.", (s) => {
            s.splash = Math.max(s.splash ?? 0, 40);
          }, true),
        ],
      },
    ],
  },
  orbit: {
    role: "orbit",
    line: "twin",
    branches: [
      {
        id: "twin",
        name: "Twin",
        nodes: [
          n("helix-hop", "Extra hop", "Both sparks jump one more.", (s) => {
            s.chain = (s.chain ?? 1) + 1;
          }),
          n("helix-fast", "Faster helix", "Sparks fire more often.", (s) => {
            s.rate *= 1.2;
          }),
          n("helix-storm", "Twin storm", "Both sparks hop the clump.", (s) => {
            s.chain = (s.chain ?? 2) + 1;
            s.split = (s.split ?? 2) + 1;
          }, true),
        ],
      },
      {
        id: "pay",
        name: "Ore",
        nodes: [
          n("helix-mark", "Ore sting", "Hopped enemies drop extra Credit.", (s) => {
            s.markGold = (s.markGold ?? 0) + 0.3;
          }),
          n("helix-far", "Far helix", "Sparks reach farther.", (s) => {
            s.range *= 1.16;
          }),
          n("helix-burst", "Ore burst", "The clump drops a Credit burst.", (s) => {
            s.markGold = (s.markGold ?? 0.3) + 0.4;
            s.splash = Math.max(s.splash ?? 0, 40);
          }, true),
        ],
      },
      {
        id: "peel",
        name: "Strip",
        nodes: [
          n("helix-strip", "Armor hop", "Hops strip plates.", (s) => {
            s.shred = (s.shred ?? 0) + 0.16;
          }),
          n("helix-hurt", "Harder spark", "Hits harder.", (s) => {
            s.damage *= 1.2;
          }),
          n("helix-bare", "Bare hull", "Stripped hulls take real hurt.", (s) => {
            s.shred = (s.shred ?? 0.16) + 0.14;
            s.damage *= 1.12;
          }, true),
        ],
      },
    ],
  },
};

registerTunes(
  Object.values(GUN_TREES).flatMap((tree) => tree.branches.flatMap((b) => [...b.nodes])),
);

export type GunJobState = {
  mod: OpId | null;
  jobs?: string[] | null;
  jobSlots?: number | null;
  tuneJob?: string | null;
  tuneCap?: string | null;
  card?: { stats?: { role?: TowerRole } | null };
};

export function treeOf(role: TowerRole | undefined | null): GunTreeDef | null {
  if (!role) return null;
  return GUN_TREES[role] ?? null;
}

export function gunJobs(r: GunJobState): string[] {
  if (r.jobs && r.jobs.length) return r.jobs.filter(Boolean);
  return [r.tuneJob, r.tuneCap].filter((x): x is string => !!x);
}

export function slotsUsed(r: GunJobState): number {
  return gunJobs(r).length;
}

export function slotsMax(r: GunJobState): number {
  return Math.max(PARAMS.jobSlotsStart, r.jobSlots ?? PARAMS.jobSlotsStart);
}

export function slotsOpen(r: GunJobState): boolean {
  return slotsUsed(r) < slotsMax(r);
}

export function branchIdOf(role: TowerRole | undefined, id: string): string | null {
  const tree = treeOf(role);
  if (!tree) return null;
  for (const b of tree.branches) {
    if (b.nodes.some((n) => n.id === id)) return b.id;
  }
  return null;
}

export function startedBranches(r: GunJobState): string[] {
  const role = r.card?.stats?.role;
  const ids = new Set<string>();
  for (const id of gunJobs(r)) {
    const b = branchIdOf(role, id);
    if (b) ids.add(b);
  }
  return [...ids];
}

export function rankInBranch(r: GunJobState, branchId: string): number {
  const role = r.card?.stats?.role;
  const tree = treeOf(role);
  const branch = tree?.branches.find((b) => b.id === branchId);
  if (!branch) return 0;
  const have = new Set(gunJobs(r));
  let rank = 0;
  for (let i = 0; i < branch.nodes.length; i++) {
    if (have.has(branch.nodes[i]!.id)) rank = i + 1;
    else break;
  }
  return rank;
}

export function offerJobs(r: GunJobState): TuneDef[] {
  if (!slotsOpen(r)) return [];
  const role = r.card?.stats?.role;
  const tree = treeOf(role);
  if (!tree) return [];
  const started = startedBranches(r);
  const out: TuneDef[] = [];
  for (const b of tree.branches) {
    const rank = rankInBranch(r, b.id);
    if (rank >= 3) continue;
    if (rank === 0 && started.length >= PARAMS.jobBranchesMax && !started.includes(b.id)) continue;
    const node = b.nodes[rank];
    if (node) out.push(node);
  }
  return out;
}

export function canTakeJob(r: GunJobState, id: string): boolean {
  return offerJobs(r).some((n) => n.id === id);
}

export function jobNameList(r: GunJobState): string[] {
  const role = r.card?.stats?.role;
  return gunJobs(r)
    .map((id) => {
      const tree = treeOf(role);
      for (const b of tree?.branches ?? []) {
        const node = b.nodes.find((n) => n.id === id);
        if (node) return node.name;
      }
      return null;
    })
    .filter((x): x is string => !!x);
}
