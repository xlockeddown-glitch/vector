import type { CardDef, CompanionRole, RolledCard } from "../types";

export type CompanionFx = {
  role: CompanionRole;
  dps: number;
  radius: number;
  slowMul?: number;
  shred?: number;
  goldMul?: number;
  coreGuard?: number;
  tauntRate: number;
  intercept: number;
  buffRate: number;
  heal: number;
  knock: number;
  burnDps: number;
  cutDps: number;
  cutSlow: number;
  specialPeriodMul: number;
  hpMul: number;
  speedMul: number;
};

export type CompanionState = {
  uid: string;
  card: RolledCard;
  x: number;
  y: number;
  hdg: number;
  cd: number;
  tauntT: number;
  bubble: string | null;
  bubbleT: number;
  kits: RolledCard[];
  bob: number;
  padI: number;
  hp: number;
  hpMax: number;
  specialCd: number;
  commandX: number;
  commandY: number;
  commandT: number;
  down: boolean;
  home: boolean;
  crit: boolean;
  healPulse: number;
  placedPad: string | null;
  roundKills?: number;
  roundDmg?: number;
  roundSaves?: number;
  roundSpecials?: number;
  roundHeals?: number;
  roundHome?: number;
  bound?: boolean;
  mastery?: number;
  masteryRank?: number;
  boostT?: number;
  runLevel?: number;
  runXp?: number;
  trick?: string | null;
  trickOffer?: string[];
  specials?: string[];
  specialOffer?: string[];
  parts?: import("./parts").PartRoll[];
  partOffer?: import("./parts").PartRoll[];
  clone?: boolean;
  shots?: number;
  levelPop?: number;
};

const LINES = [
  "Move.",
  "Eat vacuum, you bastard.",
  "Oh you think you're fast? Cute.",
  "Get off my lane, damn it.",
  "Not today, you walking hull.",
  "I've seen rocks with more ambition.",
  "Kiss the core. I dare you. Hell no.",
  "That's a face only a bulkhead could love.",
  "Out of my sky, you shit.",
  "Pick a direction and commit, ass-hat.",
  "You're leaking confidence. And fluids.",
  "Nice try. Terrible execution.",
  "Go drift, you cheap rivet.",
  "The core isn't a suggestion.",
  "I will unplug you personally.",
  "Slow down and die properly.",
  "That's the spirit. The dying spirit.",
  "Keep walking. I love a short story.",
  "You call that a rush? Pathetic.",
  "Shut up and burn.",
];

const INTERCEPT_LINES = [
  "Not in my sky.",
  "Grenade? Cute. Mine now.",
  "Eat that, you cheap fuse.",
  "Denied. Get wrecked.",
  "That's a no, you flying junk.",
  "I said hell no.",
];

const ORB_LINES = [
  "Spin up. We're not dying here.",
  "Buffs on. Try not to miss.",
  "I am the pretty one. Also the useful one.",
  "Rate up. Don't waste it.",
  "Rainbow doesn't mean nice.",
];

const ROCKET_LINES = [
  "Boosting. Hold onto something.",
  "Grenade? I eat those.",
  "That's a no from the sky.",
  "Telemetry says you're done.",
  "The title card. You're the extra.",
  "Pad's hot. Don't waste the rate.",
  "Out of my climb, you cheap fuse.",
  "I flew the menu. I fly this too.",
];

const JET_LINES = [
  "Dive. You're the target.",
  "Armor's a suggestion. I strip it.",
  "Out of my vector, you cheap rivet.",
  "Grenade? I eat those for breakfast.",
  "Black hull. Red intent.",
  "Fighter in the lane. You're the extra.",
  "That's a no from the dive.",
  "Keep leaking. I love a short story.",
  "Shrike on station. Die properly.",
  "You're slower than my idle.",
];

const MEDIC_LINES = [
  "Hold still. I'm patching you.",
  "Home. Now. Don't argue.",
  "You leak, I stitch. Fair trade.",
  "Not dying on my watch.",
  "Bandage in vacuum. Deal with it.",
  "You're uglier with a hole in you.",
];

const PUCK_LINES = [
  "Bumper's hot. Walk it back.",
  "Wrong way, you cheap rivet.",
  "Knocked. Try the long way.",
  "That's a bounce. Enjoy the hike.",
  "Out of the merge, you slab.",
  "I said back. I meant back.",
];

const UFO_LINES = [
  "Trash day. You're the bag.",
  "Beam's on. Walk it back.",
  "I collect junk. You're qualifying.",
  "Yellow disc. Green bite.",
  "That's a lift. Enjoy the hike.",
  "ASUS eye says you're trash.",
];

const RACER_LINES = [
  "Sprint. You're the wall.",
  "Quiet shop. Loud finish.",
  "T-wing. You're the cone.",
  "Brew's hot. Stay off the line.",
  "Skunk works. You leak.",
  "I don't corner. I cut.",
];

const BORE_LINES = [
  "Groove's open. Walk it slow.",
  "That's a trench. Enjoy the hike.",
  "Bite the dirt, you cheap rivet.",
  "Bore's hot. Don't look down.",
  "I eat rock. You're softer.",
  "Lane's mine. I already cut it.",
  "Plunge. You're the sample.",
  "White hull. Purple bite.",
];

const SPIN_LINES = [
  "Bloom. You're the mulch.",
  "Spin up. Petals out.",
  "I heal. I burn. Pick one.",
  "Gray mill. Orange bite.",
  "Guns go faster. You go slower.",
  "That's a petal. It's a bomb.",
  "Not the best. Still in your lane.",
  "Windmill says sit down.",
];

export function pickTaunt(seed: number, role: CompanionRole = "hunter"): string {
  const pool =
    role === "jet"
      ? JET_LINES
      : role === "rocket"
        ? ROCKET_LINES
        : role === "ship"
          ? INTERCEPT_LINES
          : role === "orb"
            ? ORB_LINES
            : role === "medic"
              ? MEDIC_LINES
              : role === "puck"
              ? PUCK_LINES
              : role === "borer"
                ? BORE_LINES
                : role === "ufo"
                  ? UFO_LINES
                  : role === "racer"
                    ? RACER_LINES
                    : role === "spinner"
                      ? SPIN_LINES
                      : role === "lens"
                        ? UFO_LINES
                    : LINES;
  const i = Math.abs(Math.floor(seed)) % pool.length;
  return pool[i]!;
}

export function companionFx(card: RolledCard, kits: RolledCard[]): CompanionFx {
  const base = card.companion ?? { role: "hunter" as CompanionRole, dps: 10, radius: 80, tauntRate: 1 };
  const out: CompanionFx = {
    role: base.role ?? "hunter",
    dps: base.dps,
    radius: base.radius,
    slowMul: base.slowMul,
    shred: base.shred,
    goldMul: base.goldMul,
    coreGuard: base.coreGuard,
    tauntRate: base.tauntRate,
    intercept: base.intercept ?? 0,
    buffRate: base.buffRate ?? 0,
    heal: base.heal ?? 0,
    knock: base.knock ?? 0,
    burnDps: base.burnDps ?? 0,
    cutDps: base.cutDps ?? 0,
    cutSlow: base.cutSlow ?? 1,
    specialPeriodMul: 1,
    hpMul: 1,
    speedMul: 1,
  };
  for (const k of kits) {
    const e = k.kit;
    if (!e) continue;
    if (e.dpsMul) out.dps *= e.dpsMul;
    if (e.radiusMul) out.radius *= e.radiusMul;
    if (e.slowMul) out.slowMul = Math.min(out.slowMul ?? 1, e.slowMul);
    if (e.goldMul) out.goldMul = (out.goldMul ?? 1) * e.goldMul;
    if (e.tauntMul) out.tauntRate *= e.tauntMul;
    if (e.coreGuard) out.coreGuard = (out.coreGuard ?? 0) + e.coreGuard;
    if (e.interceptMul) out.intercept *= e.interceptMul;
    if (e.buffMul) out.buffRate *= e.buffMul;
    if (e.healMul) out.heal *= e.healMul;
    if (e.dpsMul && out.cutDps) out.cutDps *= e.dpsMul;
    if (e.slowMul && out.cutSlow) out.cutSlow = Math.min(out.cutSlow, e.slowMul);
    if (e.cutDps) out.cutDps = Math.max(out.cutDps, e.cutDps);
    if (e.cutSlow) out.cutSlow = Math.min(out.cutSlow || 1, e.cutSlow);
    if (e.specialPeriodMul) out.specialPeriodMul *= e.specialPeriodMul;
    if (e.knockMul) out.knock *= e.knockMul;
    if (e.hpMul) out.hpMul *= e.hpMul;
    if (e.shred) out.shred = (out.shred ?? 0) + e.shred;
    if (e.burnDps) out.burnDps += e.burnDps;
    if (e.speedMul) out.speedMul *= e.speedMul;
  }
  return out;
}

export function companionMaxHp(role: CompanionRole): number {
  if (role === "borer") return 280;
  if (role === "rocket") return 220;
  if (role === "jet") return 200;
  if (role === "spinner") return 190;
  if (role === "racer") return 170;
  if (role === "ufo") return 150;
  if (role === "ship") return 140;
  if (role === "orb") return 90;
  if (role === "medic") return 100;
  if (role === "puck") return 130;
  if (role === "lens") return 160;
  return 110;
}

export function companionSpecialOf(role: CompanionRole): { name: string; period: number } {
  if (role === "rocket") return { name: "Burn run", period: 5.5 };
  if (role === "jet") return { name: "Dive", period: 4.6 };
  if (role === "ship") return { name: "Scoop", period: 7 };
  if (role === "orb") return { name: "Overclock", period: 8 };
  if (role === "medic") return { name: "Patch", period: 6.2 };
  if (role === "borer") return { name: "Plunge", period: 5.2 };
  if (role === "puck") return { name: "Bump", period: 5.2 };
  if (role === "ufo") return { name: "Lift", period: 5.6 };
  if (role === "racer") return { name: "Sprint", period: 4.4 };
  if (role === "spinner") return { name: "Bloom", period: 5.4 };
  if (role === "lens") return { name: "Bend", period: 5.8 };
  return { name: "Zap", period: 6 };
}

export type CompanionBars = { power: number; reach: number; armor: number };

function craftPips(n: number, max: number): number {
  if (max <= 0) return 1;
  const t = Math.max(0, Math.min(1, n / max));
  return Math.max(1, Math.min(5, Math.round(1 + t * 4)));
}

let CRAFT_CEIL: { power: number; reach: number; armor: number } | null = null;
function craftCeil() {
  if (CRAFT_CEIL) return CRAFT_CEIL;
  CRAFT_CEIL = { power: 28, reach: 124, armor: 240 };
  return CRAFT_CEIL;
}

/** 1–5 bars vs the rest of the companion catalog. */
export function companionBars(card: CardDef): CompanionBars | null {
  const c = card.companion;
  if (!c) return null;
  const m = craftCeil();
  return {
    power: craftPips(c.dps, m.power),
    reach: craftPips(c.radius, m.reach),
    armor: craftPips(companionMaxHp(c.role ?? "hunter"), m.armor),
  };
}

/** One-line pick hint. Kid-plain. Says the job. */
export const CRAFT_HOOK: Record<string, string> = {
  "comp-auger": "Cuts a hole in the path. Enemies in it walk slower.",
  "comp-boost": "Guns she flies by shoot faster. She eats grenades.",
  "comp-shrike": "Strips armor off enemies. Dives fast. Eats grenades.",
  "comp-poppy": "Heals friends. Nearby guns shoot a bit faster.",
  "comp-zeek": "Drags enemies backwards down the path.",
  "comp-kelvin": "Ices enemies. They walk slower.",
  "comp-joule": "Hits enemies so they skip back.",
  "comp-halo": "Guns she flies over shoot faster.",
  "comp-torr": "Kills drop extra Credit.",
  "comp-rook": "Nearby guns shoot farther. Eats grenades.",
  "comp-puck": "Knocks a clump back toward the gate.",
  "comp-chis": "Heals hurt ships and walks them home.",
  "comp-torch": "Sets enemies on fire. Fire hops to the next one.",
  "comp-sink": "Bends grenades around and throws them at enemies.",
};

export function craftHook(id: string | undefined): string {
  if (!id) return "Flies. Makes a mess.";
  if (CRAFT_HOOK[id]) return CRAFT_HOOK[id];
  const found = (Object.keys(CRAFT_HOOK) as Array<keyof typeof CRAFT_HOOK>).find(
    (k) => id === k || id.startsWith(`${k}:`) || id.includes(k),
  );
  return (found ? CRAFT_HOOK[found] : undefined) ?? "Flies. Makes a mess.";
}

