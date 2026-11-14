import type { SkinId } from "../types";
import { VAULT } from "./vault";

/**
 * Battle pass. One free season track: play runs, earn Pass XP, climb tiers.
 * Every tier pays out automatically. Rewards are Vault Credit, Vault looks
 * (Outfit and Sky items, granted free) and craft skins. Looks only:
 * nothing on the pass makes guns stronger. Saved in the browser with the rest of the meta.
 */

export type PassReward =
  | { kind: "credit"; n: number }
  | { kind: "vault"; id: string }
  | { kind: "skin"; id: SkinId }
  | { kind: "badge"; name: string };

export type PassTier = { tier: number; reward: PassReward };

export type PassSave = { season: string; xp: number; claimed: number; badges: string[] };

export const SEASON = {
  id: "s1",
  name: "Season 1 · Neon Drift",
  tiers: 30,
  xpPerTier: 100,
};

/** Pass XP for a finished run: 10 per wave cleared, +50 for holding 12, +5 per star made in Build. */
export function passXpFromRun(opts: { wavesCleared: number; won: boolean; starsMade?: number }): number {
  return Math.max(0, Math.floor(opts.wavesCleared)) * 10 + (opts.won ? 50 : 0) + Math.max(0, opts.starsMade ?? 0) * 5;
}

const LOOK: Record<number, PassReward> = {
  3: { kind: "vault", id: "path_frost" },
  5: { kind: "badge", name: "Drifter" },
  6: { kind: "vault", id: "chrome_lip" },
  9: { kind: "vault", id: "path_ion" },
  10: { kind: "skin", id: "chrome" },
  12: { kind: "vault", id: "frost_trail" },
  15: { kind: "badge", name: "Neon Ace" },
  16: { kind: "vault", id: "path_ember" },
  18: { kind: "vault", id: "shooting_stars" },
  20: { kind: "skin", id: "ion" },
  22: { kind: "vault", id: "amethyst_frame" },
  24: { kind: "vault", id: "distant_sun" },
  26: { kind: "vault", id: "night_glass" },
  28: { kind: "skin", id: "void" },
  30: { kind: "vault", id: "signature" },
};

export const PASS_TIERS: PassTier[] = Array.from({ length: SEASON.tiers }, (_, i) => {
  const tier = i + 1;
  return { tier, reward: LOOK[tier] ?? { kind: "credit", n: 40 + Math.floor(tier / 5) * 20 } };
});

export function emptyPass(): PassSave {
  return { season: SEASON.id, xp: 0, claimed: 0, badges: [] };
}

export function passOf(p: Partial<PassSave> | undefined | null): PassSave {
  if (!p || p.season !== SEASON.id) return emptyPass();
  return {
    season: SEASON.id,
    xp: Math.max(0, Math.floor(p.xp ?? 0)),
    claimed: Math.max(0, Math.min(SEASON.tiers, Math.floor(p.claimed ?? 0))),
    badges: Array.isArray(p.badges) ? p.badges.filter((b) => typeof b === "string") : [],
  };
}

export function passTier(xp: number): number {
  return Math.min(SEASON.tiers, Math.floor(Math.max(0, xp) / SEASON.xpPerTier));
}

export function passFill(xp: number) {
  const tier = passTier(xp);
  if (tier >= SEASON.tiers) return { tier, have: 1, need: 1, maxed: true };
  return { tier, have: xp - tier * SEASON.xpPerTier, need: SEASON.xpPerTier, maxed: false };
}

const vaultName = (id: string) => {
  for (const nodes of Object.values(VAULT)) {
    const n = nodes.find((x) => x.id === id);
    if (n) return n.name;
  }
  return id;
};

const SKIN_NAME: Partial<Record<SkinId, string>> = { chrome: "Chrome", ion: "Ion edge", void: "Void matte", ember: "Heat shield", gold: "Gold foil" };

export function rewardLabel(r: PassReward): string {
  if (r.kind === "credit") return `${r.n} Vault Credit`;
  if (r.kind === "vault") return vaultName(r.id);
  if (r.kind === "skin") return `${SKIN_NAME[r.id] ?? r.id} skin`;
  return `Badge: ${r.name}`;
}

export function rewardKind(r: PassReward): string {
  if (r.kind === "credit") return "Credit";
  if (r.kind === "vault") return "Look";
  if (r.kind === "skin") return "Skin";
  return "Badge";
}
