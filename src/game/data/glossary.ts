import type { CardDef, CardKind, RolledCard } from "../types";
import { coverHint, coverLabel } from "../cover";

export const KIND_LABEL: Record<CardKind, string> = {
  environment: "Weather",
  defender: "Home",
  tower: "Gun",
  relic: "Bonus",
  part: "Part",
  stamp: "Stamp",
  socket: "Pad boost",
  map: "Map",
  sticker: "Badge",
  companion: "Ship",
  kit: "Skill",
  set: "Two guns",
  signal: "This run",
};

export const KIND_PLAIN: Record<CardKind, string> = {
  environment: "Weather — hits every enemy.",
  defender: "Home — the planet, bottom-right. Always shoots. You never place it.",
  tower: "Gun — a gun you put on a moon.",
  relic: "Bonus — helps you right now. Not a gun.",
  part: "Part — a modifier you hold. Quiet levels pick one.",
  stamp: "Stamp — stays forever.",
  socket: "Pad boost — lands on a moon by itself.",
  map: "Map — how the path looks this game.",
  sticker: "Badge — a bonus on home.",
  companion: "Ship — flies with you. Hurt ships go home to heal.",
  kit: "Skill — only for that ship. Not a gun. Not a new ship.",
  set: "Two guns — they already work together.",
  signal: "This run — a rule that lasts the whole game. Not a gun.",
};

export function displayName(card: CardDef): string {
  const rolled = card as Partial<RolledCard>;
  if (rolled.templateId) {
    const base = card.name.replace(new RegExp(`^${rolled.prefix ?? ""}\\s+`), "");
    return base || card.name;
  }
  return card.name;
}

export function cardReadout(card: CardDef): { title: string; line: string; tip: string } {
  const title = displayName(card);
  const rolled = card as Partial<RolledCard>;
  const prefix = rolled.prefix && rolled.prefix !== title ? rolled.prefix : "";
  const cover = card.stats?.cover;
  const bits = [
    KIND_PLAIN[card.kind].split(" — ")[0],
    cover && cover !== "circle" ? coverLabel(cover) : null,
  ].filter(Boolean);
  const line = bits.join(" · ");
  const tipParts = [
    KIND_PLAIN[card.kind],
    cover ? coverHint(cover) : null,
    prefix ? `"${prefix}" is a roll stamp. It does not change the stats.` : null,
  ].filter(Boolean);
  return { title, line, tip: tipParts.join(" ") };
}
