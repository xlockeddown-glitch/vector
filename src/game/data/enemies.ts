import type { EnemyType, ThemeId } from "../types";
import { PALETTE } from "./palette";

/** Player names. IDs stay grunt / striker / … */
export const ENEMY_NAME: Record<EnemyType, string> = {
  grunt: "Hull",
  striker: "Dart",
  plate: "Plate",
  swarm: "Swarm",
  colossus: "Hulk",
  titan: "Titan",
  cache: "Cache",
  dart: "Needle",
  medic: "Patch",
};

export type ScrapPaint = {
  fill: string;
  hi: string;
  limb: string;
  strap: string;
  flash: string;
  ring: boolean;
};

/** Watch paints the raid. Same sky as the guns. */
export function scrapPaint(theme: ThemeId): ScrapPaint {
  if (theme === "water") {
    return {
      fill: "#2a4a58",
      hi: "#4a7480",
      limb: PALETTE.frost,
      strap: "#081418",
      flash: "#7ef0ea",
      ring: false,
    };
  }
  if (theme === "earth") {
    return {
      fill: "#3a2418",
      hi: "#6a3a22",
      limb: PALETTE.ember,
      strap: "#140c08",
      flash: PALETTE.ember,
      ring: false,
    };
  }
  return {
    fill: "#12151c",
    hi: "#222838",
    limb: "#9b6cff",
    strap: "#05060b",
    flash: PALETTE.paper,
    ring: true,
  };
}
