export type VaultBranch = "outfit" | "bay" | "armory" | "sky" | "myth";

export type VaultNode = {
  id: string;
  branch?: VaultBranch;
  rank: number;
  cost: number;
  name: string;
  blurb: string;
  effect: string;
};

export type VaultSave = {
  outfit: number;
  bay: number;
  armory: number;
  sky: number;
  myth: number;
  ownedIds: string[];
};

export const VAULT: Record<VaultBranch, VaultNode[]> = {
  outfit: [
    { id: "chrome_lip", rank: 1, cost: 240, name: "Chrome lip", blurb: "Thin chrome edge on your main craft.", effect: "chrome_lip" },
    { id: "frost_trail", rank: 2, cost: 480, name: "Frost trail", blurb: "Soft frost wake when you fly.", effect: "frost_trail" },
    { id: "amethyst_frame", rank: 3, cost: 800, name: "Amethyst frame", blurb: "Purple frame on your title card.", effect: "amethyst_frame" },
    { id: "night_glass", rank: 4, cost: 1200, name: "Night glass", blurb: "Dark canopy. Brighter craft lightbar.", effect: "night_glass" },
    { id: "signature", rank: 5, cost: 1800, name: "Signature", blurb: "Full look for your main craft.", effect: "signature" },
  ],
  bay: [
    { id: "spare_pad", rank: 1, cost: 280, name: "Spare moon", blurb: "Start with one extra moon.", effect: "spare_pad" },
    { id: "extra_swap", rank: 2, cost: 420, name: "Extra swap", blurb: "One extra swap when the run starts.", effect: "extra_swap" },
    { id: "bay_patch", rank: 2, cost: 420, name: "Bay patch", blurb: "Crafts heal a little faster at home.", effect: "bay_patch" },
    { id: "warm_start", rank: 3, cost: 720, name: "Warm start", blurb: "First Bonus boost comes a bit sooner.", effect: "warm_start" },
    { id: "deep_bay", rank: 4, cost: 1080, name: "Deep bay", blurb: "One free re-pick on your first Bonus boost.", effect: "deep_bay" },
    { id: "open_sky", rank: 5, cost: 1400, name: "Open sky", blurb: "One extra swap at the start.", effect: "open_sky" },
  ],
  armory: [
    { id: "match_chalk", rank: 1, cost: 300, name: "Match chalk", blurb: "Level-up chips glow louder.", effect: "match_chalk" },
    { id: "clean_bench", rank: 2, cost: 450, name: "Clean bench", blurb: "Bench can hold one more gun.", effect: "clean_bench" },
    { id: "steady_stock", rank: 3, cost: 720, name: "Steady stock", blurb: "Mid-run gun packs skip guns you already own.", effect: "steady_stock" },
    { id: "hot_lip", rank: 4, cost: 1080, name: "Hot lip", blurb: "Guns keep extra heat after a Level-up.", effect: "hot_lip" },
    { id: "foundry", rank: 5, cost: 1500, name: "Foundry", blurb: "First Level-up each run leans unique.", effect: "foundry" },
  ],
  sky: [
    { id: "shooting_stars", rank: 1, cost: 720, name: "Shooting stars", blurb: "Rainbow stars streak the sky.", effect: "shooting_stars" },
    { id: "distant_sun", rank: 1, cost: 1080, name: "Distant sun", blurb: "A far sun hangs in the dark.", effect: "distant_sun" },
    { id: "path_frost", rank: 1, cost: 540, name: "Frost path", blurb: "The warp lane glows ice.", effect: "path_frost" },
    { id: "path_ember", rank: 1, cost: 540, name: "Ember path", blurb: "The warp lane glows fire.", effect: "path_ember" },
    { id: "path_ion", rank: 1, cost: 540, name: "Ion path", blurb: "The warp lane glows ion blue.", effect: "path_ion" },
  ],
  myth: [
    { id: "myth_sink", rank: 1, cost: 2600, name: "Sink", blurb: "Black-hole craft. Bends grenades back.", effect: "comp-sink" },
    { id: "myth_helix", rank: 1, cost: 2600, name: "Helix", blurb: "Twin-helix gun. Two sparks at once.", effect: "gun-helix" },
  ],
};

export const VAULT_BRANCH: Record<VaultBranch, { name: string; line: string }> = {
  outfit: { name: "Outfit", line: "Looks only. Does not make guns stronger." },
  bay: { name: "Bay", line: "Tools for the next run." },
  armory: { name: "Armory", line: "Helps your guns on the board." },
  sky: { name: "Sky", line: "Looks on the map. Path color. Stars. Sun." },
  myth: { name: "Myth", line: "Hard unlocks. A special gun and a special craft." },
};

export function emptyVault(): VaultSave {
  return { outfit: 0, bay: 0, armory: 0, sky: 0, myth: 0, ownedIds: [] };
}

export function vaultOf(v: Partial<VaultSave> | undefined): VaultSave {
  const ids = Array.isArray(v?.ownedIds) ? [...new Set(v!.ownedIds.filter((x) => typeof x === "string"))] : [];
  return {
    outfit: Math.max(0, Math.min(5, Math.floor(v?.outfit ?? 0))),
    bay: Math.max(0, Math.min(5, Math.floor(v?.bay ?? 0))),
    armory: Math.max(0, Math.min(5, Math.floor(v?.armory ?? 0))),
    sky: Math.max(0, Math.min(5, Math.floor(v?.sky ?? 0))),
    myth: Math.max(0, Math.min(5, Math.floor(v?.myth ?? 0))),
    ownedIds: ids,
  };
}

export function vaultNode(id: string): VaultNode | undefined {
  for (const branch of Object.keys(VAULT) as VaultBranch[]) {
    const n = VAULT[branch].find((x) => x.id === id);
    if (n) return { ...n, branch };
  }
  return undefined;
}

export function vaultHas(v: VaultSave | undefined, id: string): boolean {
  return (v?.ownedIds ?? []).includes(id);
}

export function vaultCanBuy(v: VaultSave, id: string): boolean {
  const n = vaultNode(id);
  if (!n || vaultHas(v, id) || !n.branch) return false;
  if (n.rank <= 1) return true;
  if (n.branch === "bay" && n.rank === 2) return vaultHas(v, "spare_pad");
  if (n.branch === "bay" && n.rank === 3) return vaultHas(v, "extra_swap") || vaultHas(v, "bay_patch");
  if (n.branch === "sky" || n.branch === "myth") return true;
  return v[n.branch] >= n.rank - 1;
}

export const TUTORIAL_TIPS = [
  "Pick two guns that already work together.",
  "Pick a gun you plant on a moon.",
  "Tap a lit moon to plant. Empty ones stay dark.",
  "Defend starts the fight.",
  "Tap a planted gun to spend Credit and grow it.",
  "Signals sit on the run. They are not guns.",
  "Hold 12. Then keep flying, or return.",
] as const;
