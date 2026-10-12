import type { TowerId } from "./matchup";
import { mulberry32 } from "./rng";

export type Aim = "near" | "far" | "strong" | "mark";
export type PartId =
  | "sabot"
  | "shunt"
  | "dewar"
  | "canister"
  | "iff"
  | "casing"
  | "film"
  | "spark"
  | "grease"
  | "bulb";

export const AIM_WORD: Record<Aim, string> = {
  near: "Near",
  far: "Far",
  strong: "Strong",
  mark: "Marked",
};

export const PARTS: { id: PartId; gun: TowerId; name: string; line: string }[] = [
  { id: "sabot", gun: "lance", name: "Sabot", line: "Pierce one more." },
  { id: "shunt", gun: "rail", name: "Shunt", line: "Shoots the furthest body." },
  { id: "dewar", gun: "halo", name: "Dewar", line: "The ring is one pad wider." },
  { id: "canister", gun: "crater", name: "Canister", line: "The blast is one pad wider." },
  { id: "iff", gun: "beacon", name: "IFF", line: "A marked kill pays double." },
];

const GREY: { id: PartId; gun: TowerId; name: string; line: string }[] = [
  { id: "casing", gun: "lance", name: "Casing", line: "A little more punch." },
  { id: "film", gun: "halo", name: "Film", line: "The frost holds a bit longer." },
  { id: "spark", gun: "crater", name: "Spark", line: "A little more blast." },
  { id: "grease", gun: "rail", name: "Grease", line: "Cycles a little faster." },
  { id: "bulb", gun: "beacon", name: "Bulb", line: "A marked kill pays a little more." },
];

const ALL_PARTS = [...PARTS, ...GREY];

export function partById(id: PartId) {
  return ALL_PARTS.find((part) => part.id === id)!;
}

export function defaultAim(id: TowerId): Aim {
  return id === "lance" || id === "rail" ? "far" : "near";
}

function shuffle<T>(items: T[], seed: number) {
  const next = mulberry32(seed);
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    const swap = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = swap;
  }
  return copy;
}

/** Three parts. Unowned ones lead when a clean hull asks for a black crate. */
export function offerParts(seed: number, owned: PartId[] = []) {
  const fresh = shuffle(PARTS.filter((part) => !owned.includes(part.id)).map((part) => part.id), seed);
  const had = shuffle(PARTS.filter((part) => owned.includes(part.id)).map((part) => part.id), seed + 9);
  return [...fresh, ...had].slice(0, 3);
}

/** Grey crates. Never the parts that change how a gun aims or pierces. */
export function offerGrey(seed: number) {
  return shuffle(GREY.map((part) => part.id), seed);
}
