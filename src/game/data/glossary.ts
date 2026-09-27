import type { CardDef, CardKind, RolledCard, SetId } from "../types";
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
  climb: "Bonus perk",
  set: "Two guns",
  signal: "This run",
};

export const KIND_JOB: Record<CardKind, string> = {
  environment: "Hits every enemy",
  defender: "Always shoots from home",
  tower: "A gun you put on a moon",
  relic: "Helps you right now",
  part: "Fits on a gun or craft",
  stamp: "Keeps forever",
  socket: "Lands on a moon by itself",
  map: "The look of the path this game",
  sticker: "A bonus on home",
  companion: "A ship that flies with you. You can fly three.",
  kit: "A skill for one ship you already have",
  climb: "A run perk. This game only. Not a gun.",
  set: "Two guns that already work together",
  signal: "A rule for this run. Not a gun.",
};

export const SET_PLAIN: Record<SetId, string> = {
  heat: "Lights the road. Torch makes fire hop.",
  cold: "Freezes enemies. Kelvin ices the path.",
  spark: "Shots jump. Joule makes jumps bounce.",
  iron: "Guns share range. Hauler shares it with Home.",
};

export const SET_DETAIL: Record<SetId, string> = {
  heat: "Two heat guns light the road. If Torch flies, burning enemies pop.",
  cold: "Two cold guns freeze. If Kelvin flies, ice stays on the path.",
  spark: "Two spark guns jump. If Joule flies, jumps bounce through her.",
  iron: "Two iron guns share the longest range. If Hauler flies, home gets it too.",
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
  climb: "Bonus perk — a perk for this game. Not a gun. Not a ship.",
  set: "Two guns — they already work together.",
  signal: "This run — a rule that lasts the whole game. Not a gun.",
};

const PREFIX_PLAIN: Record<string, string> = {
  Ion: "A roll stamp. Flavor only.",
  Flare: "A roll stamp. Flavor only.",
  Nova: "A roll stamp. Flavor only.",
  Burn: "A roll stamp. Flavor only.",
  Drift: "A roll stamp. Flavor only.",
  Void: "A roll stamp. Flavor only.",
  Still: "A roll stamp. Flavor only.",
  Ice: "A roll stamp. Flavor only.",
  Peak: "A roll stamp. Flavor only — not a stat.",
  Arc: "A roll stamp. Flavor only.",
  Pulse: "A roll stamp. Flavor only.",
  Live: "A roll stamp. Flavor only.",
  Core: "A roll stamp. Flavor only.",
  Thin: "A roll stamp. Flavor only.",
  Mass: "A roll stamp. Flavor only.",
  Cut: "A roll stamp. Flavor only.",
  Tuned: "A roll stamp. Flavor only.",
  First: "A roll stamp. Flavor only.",
  Next: "A roll stamp. Flavor only.",
};

const TIPS_KEY = "vector-tips-v2";

function loadSeen(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(TIPS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveSeen(seen: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TIPS_KEY, JSON.stringify([...seen]));
  } catch {
    /* quota */
  }
}

export function markTip(id: string) {
  const seen = loadSeen();
  if (seen.has(id)) return false;
  seen.add(id);
  saveSeen(seen);
  return true;
}

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

export function peekTipFor(cards: CardDef[]): { id: string; text: string } | null {
  const seen = loadSeen();
  if (!seen.has("name-format")) {
    return {
      id: "name-format",
      text: "Big word is the name. Two guns, Gun, or This run under it. The line under that is what it does.",
    };
  }
  for (const card of cards) {
    const kid = `kind-${card.kind}`;
    if (!seen.has(kid)) return { id: kid, text: KIND_PLAIN[card.kind] };
    const cover = card.stats?.cover;
    if (cover && cover !== "circle") {
      const cid = `cover-${cover}`;
      if (!seen.has(cid)) return { id: cid, text: `${coverLabel(cover)}: ${coverHint(cover)}` };
    }
    const rolled = card as Partial<RolledCard>;
    if (rolled.prefix && PREFIX_PLAIN[rolled.prefix] && !seen.has("prefix")) {
      return {
        id: "prefix",
        text: `The small word before the name (like ${rolled.prefix}) is a roll stamp. The real name is ${displayName(card)}.`,
      };
    }
  }
  return null;
}

export function firstTipFor(cards: CardDef[]): { id: string; text: string } | null {
  return peekTipFor(cards);
}
