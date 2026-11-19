import { ODDS, OPENING_ODDS } from "./constants";
import { CARDS, cardBars } from "./data/cards";
import { rollCard } from "./data/roll";
import { cardLeans, giftOrder, packGiftOf, type PackLean } from "./data/gifts";
import { freshSeed } from "./rng";
import type { CardDef, CardKind, Grade, PackMode, Rarity, RolledCard } from "./types";

const ORDER: Rarity[] = ["legendary", "epic", "rare", "uncommon", "common"];

function bump(r: Rarity, n: number): Rarity {
  const i = ORDER.indexOf(r);
  return ORDER[Math.max(0, i - n)] ?? r;
}

function rollRarity(table: Record<Rarity, number>): Rarity {
  const total = ORDER.reduce((s, r) => s + (table[r] ?? 0), 0);
  let n = Math.random() * (total || 1);
  for (const r of ORDER) {
    n -= table[r] ?? 0;
    if (n <= 0) return r;
  }
  return "common";
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a;
}

export function packRarityOf(cards: { rarity: Rarity }[]): Rarity | null {
  if (!cards.length) return null;
  const r = cards[0]!.rarity;
  return cards.every((c) => c.rarity === r) ? r : null;
}

export function packKindOf(cards: { kind: CardKind }[]): CardKind | null {
  if (!cards.length) return null;
  const k = cards[0]!.kind;
  return cards.every((c) => c.kind === k) ? k : null;
}

/** Peak job bar. Packs bucket around this so the pick is the job, not extra numbers. */
export function jobPower(c: CardDef): number {
  const bars = cardBars(c);
  if (!bars.length) return 3;
  return Math.max(...bars.map((b) => b.value));
}

export function pickBucketed<T extends CardDef>(pool: T[], count: number): T[] {
  if (pool.length <= count) return pool.slice(0, count);
  const center = pool[Math.floor(Math.random() * pool.length)]!;
  const cp = jobPower(center);
  for (const delta of [1, 2, 5]) {
    const hit = pool.filter((c) => Math.abs(jobPower(c) - cp) <= delta);
    if (hit.length >= count) {
      const rest = shuffle(hit.filter((c) => c !== center));
      const out = [center, ...rest].filter((c, i, a) => a.indexOf(c) === i);
      return out.slice(0, count);
    }
  }
  return shuffle(pool).slice(0, count);
}

function leanPool(pool: CardDef[], count: number, kind: CardKind, lean?: PackLean): CardDef[] {
  const pick = (p: CardDef[]) => (kind === "tower" ? coverThenBucket(p, count) : pickBucketed(p, count));
  if (!pool.length) return [];
  const order = giftOrder(lean);
  for (const g of order) {
    const tagged = pool.filter((c) => cardLeans(c, g));
    if (tagged.length >= count) return pick(tagged);
  }
  return pick(pool);
}

export { packGiftOf };

export function packTitleFor(kind: CardKind | null | undefined, mode: PackMode = "show"): string {
  if (mode === "mystery") return "Mystery pack";
  if (mode === "cut") return "Cut, then pick";
  if (kind === "tower") return "Pick a tower";
  if (kind === "companion") return "Pick a companion";
  if (kind === "relic") return "Pick a bonus";
  if (kind === "sticker") return "Pick a badge";
  if (kind === "socket") return "Pick a pad boost";
  if (kind === "kit") return "Pick a skill";
  if (kind === "stamp") return "Stamp · pick one";
  if (kind === "set") return "Pick two guns";
  if (kind === "signal") return "Pick a rule";
  if (kind === "defender") return "Pick home";
  return "Pick a card";
}

export function dealKitSkills(
  count: number,
  forge: Record<string, number> = {},
  skip: Set<string> = new Set(),
  rarity: Rarity = rollRarity(OPENING_ODDS),
  ownedCrafts: Set<string> = new Set(),
  lean?: PackLean,
): RolledCard[] {
  const pool = shuffle(
    CARDS.filter((c) => {
      if (c.kind !== "kit") return false;
      if (skip.has(c.id)) return false;
      const craft = c.kit?.craftId;
      if (!craft) return false;
      return ownedCrafts.has(craft);
    }),
  );
  return leanPool(pool, count, "kit", lean).map((t) => stampAt(t, rarity, forge));
}

export function dealCompanionOpening(
  count: number,
  forge: Record<string, number> = {},
  skip: Set<string> = new Set(),
): RolledCard[] {
  const heroes = ["comp-boost", "comp-shrike", "comp-auger"].filter((id) => !skip.has(id));
  const rolled = heroes
    .map((id) => CARDS.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c)
    .map((hero) => stampAt(hero, "legendary", forge));
  const taken = new Set(heroes);
  const rest = pickBucketed(
    shuffle(CARDS.filter((c) => c.kind === "companion" && !taken.has(c.id) && !skip.has(c.id))),
    Math.max(0, count - rolled.length),
  ).map((t) => stampAt(t, "legendary", forge));
  return shuffle([...rolled, ...rest]).slice(0, count);
}

function stampAt(t: CardDef, rarity: Rarity, forge: Record<string, number>): RolledCard {
  return rollCard(t, rarity, freshSeed(), forge[t.id] ?? 0);
}

/** No two Citrine packs in a row unless grade is S. */
export function applyCitrineCap(rolled: Rarity, lastGem: Rarity | null | undefined, grade?: Grade | null): Rarity {
  if (rolled === "legendary" && lastGem === "legendary" && grade !== "S") return "epic";
  if (rolled === "legendary" && (grade === "F" || grade === "D")) return "rare";
  return rolled;
}

export function rollPackRarity(
  table: Record<Rarity, number> = OPENING_ODDS,
  lastGem: Rarity | null = null,
  grade: Grade | null = null,
): Rarity {
  return applyCitrineCap(rollRarity(table), lastGem, grade);
}

/** Opening packs stamp one rarity onto every card. Skip already-signed templates. */
export function dealOpeningMix(
  kind: CardKind,
  count: number,
  forge: Record<string, number> = {},
  skip: Set<string> = new Set(),
  rarity: Rarity = rollRarity(OPENING_ODDS),
  lean?: PackLean,
): RolledCard[] {
  const pool = shuffle(CARDS.filter((c) => c.kind === kind && !skip.has(c.id)));
  return leanPool(pool, count, kind, lean).map((t) => stampAt(t, rarity, forge));
}

function coverThenBucket(pool: CardDef[], count: number): CardDef[] {
  const picked: CardDef[] = [];
  const covers = new Set<string>();
  for (const t of pool) {
    const cov = t.stats?.cover ?? "circle";
    if (covers.has(cov)) continue;
    covers.add(cov);
    picked.push(t);
    if (picked.length >= count) break;
  }
  if (picked.length >= count) return picked.slice(0, count);
  const rest = pickBucketed(
    pool.filter((t) => !picked.includes(t)),
    count - picked.length,
  );
  return [...picked, ...rest].slice(0, count);
}

/** Gun packs always offer 2+ cover shapes so two lanes have a real choice. */
export function dealTowerOpening(
  count: number,
  forge: Record<string, number> = {},
  skip: Set<string> = new Set(),
  rarity: Rarity = rollRarity(OPENING_ODDS),
  lean?: PackLean,
): RolledCard[] {
  const pool = shuffle(CARDS.filter((c) => c.kind === "tower" && !skip.has(c.id)));
  return leanPool(pool, count, "tower", lean).map((t) => stampAt(t, rarity, forge));
}

export function dealSector(
  forge: Record<string, number> = {},
  skipMapId?: string | null,
  onlyMapId?: string | null,
): { map: RolledCard; env: RolledCard } | null {
  let maps = onlyMapId
    ? CARDS.filter((c) => c.kind === "map" && c.id === onlyMapId)
    : shuffle(CARDS.filter((c) => c.kind === "map" && c.id !== skipMapId));
  if (!maps.length) maps = shuffle(CARDS.filter((c) => c.kind === "map"));
  const envs = shuffle(CARDS.filter((c) => c.kind === "environment"));
  const map = maps[0];
  const env = envs[0];
  if (!map || !env) return null;
  return { map: stampAt(map, map.rarity, forge), env: stampAt(env, env.rarity, forge) };
}

export function oddsForGrade(grade: Grade, bumpN = 0): Record<Rarity, number> {
  const src = ODDS[grade];
  if (!bumpN) return { ...src };
  const out: Record<Rarity, number> = {
    legendary: 0,
    epic: 0,
    rare: 0,
    uncommon: 0,
    common: 0,
  };
  for (const r of ORDER) {
    out[bump(r, bumpN)] += src[r] ?? 0;
  }
  return out;
}
