import { SKY_PAD } from "../constants";
import type { SetId } from "../types";
import { comboRank } from "./sets";

export const LORDS: Record<
  SetId,
  { craftId: string; name: string; combo: string; craft: string }
> = {
  heat: { craftId: "comp-torch", name: "Wildfire", combo: "Plasma", craft: "Torch" },
  cold: { craftId: "comp-kelvin", name: "Icebox", combo: "Cryo", craft: "Kelvin" },
  spark: { craftId: "comp-joule", name: "Live rail", combo: "Volt", craft: "Joule" },
  iron: { craftId: "comp-rook", name: "Power share", combo: "Current", craft: "Hauler" },
};

export type LordFlags = {
  wildfire: boolean;
  icebox: boolean;
  liveRail: boolean;
  powerShare: boolean;
  names: Partial<Record<SetId, string>>;
};

function craftKey(card: { id: string; templateId?: string }) {
  return card.templateId ?? card.id;
}

export function lordFlying(
  companions:
    | { placedPad?: string | null; home?: boolean; card: { id: string; templateId?: string } }[]
    | undefined,
  set: SetId,
  limpOk = false,
) {
  const id = LORDS[set].craftId;
  return (companions ?? []).some(
    (c) => craftKey(c.card) === id && c.placedPad === SKY_PAD && (limpOk || !c.home),
  );
}

export function lordFlags(
  companions:
    | { placedPad?: string | null; home?: boolean; card: { id: string; templateId?: string } }[]
    | undefined,
  sets: Record<SetId, number>,
  limpOk = false,
): LordFlags {
  const heatOn = (sets.heat ?? 0) >= 2;
  const coldOn = (sets.cold ?? 0) >= 2;
  const sparkOn = (sets.spark ?? 0) >= 2;
  const ironOn = (sets.iron ?? 0) >= 2;
  const torch = heatOn && lordFlying(companions, "heat", limpOk);
  const kelvin = coldOn && lordFlying(companions, "cold", limpOk);
  const joule = sparkOn && lordFlying(companions, "spark", limpOk);
  const rook = ironOn && lordFlying(companions, "iron", limpOk);
  const names: Partial<Record<SetId, string>> = {};
  if (torch) names.heat = LORDS.heat.name;
  if (kelvin) names.cold = LORDS.cold.name;
  if (joule) names.spark = LORDS.spark.name;
  if (rook) names.iron = LORDS.iron.name;
  return {
    wildfire: torch || comboRank(sets.heat, 4) > 0,
    icebox: kelvin,
    liveRail: joule || comboRank(sets.spark, 4) > 0,
    powerShare: ironOn,
    names,
  };
}
