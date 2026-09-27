import type { ThemeId } from "../types";

/** Planet behind a gun portrait. One sky per watch. Family color stays on the metal. */
export const WATCH_WORLD: Record<
  ThemeId,
  { fill: string; limb: string; sea: string; ring: boolean; lava: boolean; storm: boolean; stars: boolean }
> = {
  water: {
    fill: "#0c2430",
    limb: "#3cd6cc",
    sea: "#163f48",
    ring: false,
    lava: false,
    storm: false,
    stars: false,
  },
  earth: {
    fill: "#2a1610",
    limb: "#ff5c2a",
    sea: "#5a3420",
    ring: false,
    lava: true,
    storm: false,
    stars: false,
  },
  space: {
    fill: "#101018",
    limb: "#c5ccd6",
    sea: "#1c1830",
    ring: true,
    lava: false,
    storm: false,
    stars: true,
  },
};

export function watchOf(id: string | null | undefined): ThemeId {
  if (id === "earth" || id === "space") return id;
  return "water";
}
