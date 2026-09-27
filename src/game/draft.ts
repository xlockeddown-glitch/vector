import { LIVE_DRAFT, ODDS, OPENING_ODDS } from "./constants";
import { rarityGem } from "./data/rarity";
import { CARDS, cardBars } from "./data/cards";
import { addGlitch, addSpice, rollCard } from "./data/roll";
import { cardLeans, giftOrder, packGiftOf, type PackGift, type PackLean } from "./data/gifts";
import { freshSeed } from "./rng";
import type { CardDef, CardKind, Grade, PackHeat, PackMode, Rarity, RolledCard } from "./types";

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

export function rarityLabel(r: Rarity | null | undefined): string {
  return rarityGem(r);
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

/** Round packs pick one kind, then fill. Skills are Level-up chips, not packs. */
const DRAFT_KINDS: CardKind[] = ["tower", "companion"];
const KIND_WEIGHT: Record<CardKind, number> = {
  tower: 62,
  companion: 38,
  kit: 0,
  relic: 0,
  sticker: 0,
  socket: 0,
  environment: 0,
  defender: 0,
  part: 0,
  stamp: 0,
  map: 0,
  climb: 0,
  set: 0,
  signal: 0,
};

export type KindHints = {
  lastKind?: CardKind | null;
  hasCone?: boolean;
  hasSlow?: boolean;
  craftCount?: number;
  maxCrafts?: number;
  skillSlotsOpen?: boolean;
  padsFree?: number;
  gunsLeft?: number;
};

export function rollPackKind(hints?: KindHints): CardKind {
  const w = { ...KIND_WEIGHT };
  if ((hints?.gunsLeft ?? 1) <= 0 || (hints?.padsFree ?? 1) <= 0) w.tower = 0;
  if (hints?.hasCone === false) w.tower *= 1.4;
  if (hints?.hasSlow === false) w.tower *= 1.2;
  if ((hints?.craftCount ?? 99) < (hints?.maxCrafts ?? 3)) w.companion *= 1.3;
  else w.companion = 0;
  if (hints?.lastKind && (w[hints.lastKind] ?? 0) > 0) w[hints.lastKind] *= 0.7;
  const total = DRAFT_KINDS.reduce((s, k) => s + (w[k] ?? 0), 0);
  if (total <= 0) return "climb";
  let n = Math.random() * total;
  for (const k of DRAFT_KINDS) {
    n -= w[k] ?? 0;
    if (n <= 0) return k;
  }
  return w.tower > 0 ? "tower" : "companion";
}

export function packIsPure(cards: { rarity: Rarity; kind: CardKind; templateId?: string }[]): boolean {
  if (packRarityOf(cards) === null || packKindOf(cards) === null) return false;
  const ids = cards.map((c) => c.templateId).filter(Boolean);
  return new Set(ids).size === ids.length;
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
  if (kind === "climb") return "Bonus perk · pick one";
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

export function dealByKind(
  kind: CardKind,
  count: number,
  forge: Record<string, number> = {},
  table: Record<Rarity, number> = OPENING_ODDS,
  rarity?: Rarity,
  skip: Set<string> = new Set(),
  lean?: PackLean,
): RolledCard[] {
  const packRarity = rarity ?? rollRarity(table);
  const pool = shuffle(CARDS.filter((c) => c.kind === kind && !skip.has(c.id)));
  return leanPool(pool, count, kind, lean).map((t) => stampAt(t, packRarity, forge));
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

export function dealWild(
  count: number,
  forge: Record<string, number> = {},
  table: Record<Rarity, number> = OPENING_ODDS,
  skip: Set<string> = new Set(),
): RolledCard[] {
  return dealSameKind(count, forge, table, { skip });
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

export function applySkipBump(rarity: Rarity, skipCharge: number): { rarity: Rarity; skipCharge: number; bumped: boolean } {
  if (skipCharge >= 3) return { rarity: bump(rarity, 1), skipCharge: 0, bumped: true };
  return { rarity, skipCharge, bumped: false };
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

function kindPoolSize(kind: CardKind, skip: Set<string>): number {
  return CARDS.filter((c) => c.kind === kind && !skip.has(c.id)).length;
}

export function dealSameKind(
  count: number,
  forge: Record<string, number> = {},
  table: Record<Rarity, number> = OPENING_ODDS,
  opts?: {
    kind?: CardKind;
    skip?: Set<string>;
    rarity?: Rarity;
    towersOnly?: boolean;
    ownedCrafts?: Set<string>;
    hints?: KindHints;
    lean?: PackLean;
  },
): RolledCard[] {
  const rarity = opts?.rarity ?? rollRarity(table);
  const skip = opts?.skip ?? new Set<string>();
  const ownedCrafts = opts?.ownedCrafts ?? new Set<string>();
  const lean = opts?.lean;
  const fill = (kind: CardKind) =>
    kind === "tower"
      ? dealTowerOpening(count, forge, skip, rarity, lean)
      : kind === "kit"
        ? dealKitSkills(count, forge, skip, rarity, ownedCrafts, lean)
        : dealOpeningMix(kind, count, forge, skip, rarity, lean);

  if (opts?.towersOnly) return fill("tower");
  if (opts?.kind) return fill(opts.kind);

  const preferred = rollPackKind(opts?.hints);
  const order = [preferred, ...shuffle(DRAFT_KINDS.filter((k) => k !== preferred))];
  for (const kind of order) {
    if (kind === "kit" && ownedCrafts.size === 0) continue;
    if (kindPoolSize(kind, skip) < 2 && kind !== "kit") continue;
    const cards = fill(kind);
    if (cards.length >= 2) return cards.slice(0, count);
  }
  return fill(preferred).slice(0, count);
}

export function dealWildOpening(
  count: number,
  forge: Record<string, number> = {},
  skip: Set<string> = new Set(),
  rarity: Rarity = rollRarity(OPENING_ODDS),
): RolledCard[] {
  return dealSameKind(count, forge, OPENING_ODDS, { skip, rarity });
}

export function dealSector(forge: Record<string, number> = {}, skipMapId?: string | null): { map: RolledCard; env: RolledCard } | null {
  let maps = shuffle(CARDS.filter((c) => c.kind === "map" && c.id !== skipMapId));
  if (!maps.length) maps = shuffle(CARDS.filter((c) => c.kind === "map"));
  const envs = shuffle(CARDS.filter((c) => c.kind === "environment"));
  const map = maps[0];
  const env = envs[0];
  if (!map || !env) return null;
  return { map: stampAt(map, map.rarity, forge), env: stampAt(env, env.rarity, forge) };
}

export function dealPack(
  count: number,
  table: Record<Rarity, number>,
  owned: Set<string> = new Set(),
  opts?: {
    towersOnly?: boolean;
    bump?: number;
    forge?: Record<string, number>;
    rarity?: Rarity;
    kind?: CardKind;
    ownedCrafts?: Set<string>;
    hints?: KindHints;
    lean?: PackLean;
  },
): RolledCard[] {
  const forge = opts?.forge ?? {};
  const rarity = opts?.rarity ?? bump(rollRarity(table), opts?.bump ?? 0);
  return dealSameKind(count, forge, table, {
    rarity,
    towersOnly: opts?.towersOnly,
    kind: opts?.kind,
    skip: owned,
    ownedCrafts: opts?.ownedCrafts,
    hints: opts?.hints,
    lean: opts?.lean,
  });
}

export function dealLive(
  forge: Record<string, number> = {},
  table: Record<Rarity, number> = OPENING_ODDS,
  skip: Set<string> = new Set(),
  ownedCrafts: Set<string> = new Set(),
): RolledCard[] {
  return dealSameKind(LIVE_DRAFT, forge, table, { skip, ownedCrafts });
}

export function dealLoot(
  count: number,
  forge: Record<string, number> = {},
  table: Record<Rarity, number> = OPENING_ODDS,
  rarity?: Rarity,
  skip: Set<string> = new Set(),
  ownedCrafts: Set<string> = new Set(),
  lean?: PackLean,
): RolledCard[] {
  return dealSameKind(count, forge, table, { rarity: rarity ?? rollRarity(table), skip, ownedCrafts, lean });
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

export function rollPackHeat(pity: number): { heat: PackHeat; pity: number } {
  const n = Math.random() * 100;
  let heat: PackHeat;
  if (pity >= 5) heat = "peak";
  else if (n < 6) heat = "nova";
  else if (n < 19) heat = "peak";
  else if (n < 50 || pity >= 3) heat = "live";
  else heat = "quiet";
  const next = heat === "peak" || heat === "nova" ? 0 : pity + 1;
  return { heat, pity: next };
}

export function heatBump(heat: PackHeat): number {
  if (heat === "nova") return 2;
  if (heat === "peak") return 1;
  return 0;
}

export function spicePack(cards: RolledCard[], heat: PackHeat): RolledCard[] {
  if (!cards.length) return cards;
  const glitchChance = heat === "nova" ? 0.42 : heat === "peak" ? 0.2 : heat === "live" ? 0.14 : 0.03;
  if (heat === "live" || heat === "nova") {
    const i = Math.floor(Math.random() * cards.length);
    if (cards[i]) addSpice(cards[i]);
  }
  if (heat === "nova") {
    const j = Math.floor(Math.random() * cards.length);
    if (cards[j]) addSpice(cards[j]);
  }
  if (Math.random() < glitchChance) {
    const i = Math.floor(Math.random() * cards.length);
    if (cards[i]) addGlitch(cards[i]);
  }
  return cards;
}

export function heatLabel(heat: PackHeat | null | undefined): string {
  if (heat === "nova") return "Hot pack";
  if (heat === "peak") return "Bright pack";
  if (heat === "live") return "Spiced pack";
  if (heat === "quiet") return "Quiet pack";
  return "Pack";
}

const BUCKET_LINE = "These are about as strong. Pick the job you need.";

export function packHeatSub(heat: PackHeat | null | undefined, rarity: Rarity | null, _gift?: PackGift | null): string {
  const band = rarity ? `All ${rarityLabel(rarity)}.` : "Pick one.";
  if (heat === "nova") return `Hot pack. ${band} Extra spice landed. ${BUCKET_LINE}`;
  if (heat === "peak") return `Bright pack. ${band} ${BUCKET_LINE}`;
  if (heat === "live") return `Spiced pack. ${band} One card carries extra spice. ${BUCKET_LINE}`;
  if (heat === "quiet") return `Quiet pack. ${band} ${BUCKET_LINE}`;
  return `${band} ${BUCKET_LINE}`;
}

export function packModeOf(_heat: PackHeat | null | undefined, _round: number, _forceMystery = false): PackMode {
  return "show";
}

export function packModeSub(mode: PackMode, rarity: Rarity | null, heat: PackHeat | null | undefined, gift?: PackGift | null): string {
  if (mode === "cut") return `Cut one, then take one. ${rarity ? `All ${rarityLabel(rarity)}.` : ""}`.trim();
  return packHeatSub(heat, rarity, gift);
}
