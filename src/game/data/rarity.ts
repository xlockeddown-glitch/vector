import type { Rarity } from "../types";

/** Pack level names. A tower is still a tower — the gem is how hot the pack is. */
export const RARITY_GEM: Record<Rarity, { name: string; foil: string; ink: string }> = {
  common: { name: "Moonstone", foil: "foil-moonstone", ink: "pearly white" },
  uncommon: { name: "Sapphire", foil: "foil-sapphire", ink: "blue" },
  rare: { name: "Ruby", foil: "foil-ruby", ink: "crimson" },
  epic: { name: "Amethyst", foil: "foil-amethyst", ink: "purple" },
  legendary: { name: "Citrine", foil: "foil-citrine", ink: "gold" },
};

export function rarityGem(r: Rarity | null | undefined): string {
  if (!r) return "";
  return RARITY_GEM[r].name;
}

export function rarityFoil(r: Rarity): string {
  return RARITY_GEM[r].foil;
}
