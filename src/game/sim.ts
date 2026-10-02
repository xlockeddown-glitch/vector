// @ts-nocheck
import {
  BASE_PADS,
  CACHE_XP,
  ENEMIES,
  GRADE_XP,
  HOME_PAD,
  MAX_LEVEL,
  MAX_PADS,
  MAX_TOWERS,
  MEGA_XP,
  OPENING_PICKS,
  MAX_COMPANIONS,
  PARAMS,
  SKY_PAD,
  START_LEVEL,
  START_LIVES,
  START_SWAP,
  MAX_SWAP,
  SWAP_RATE,
  SWAP_PITY,
  WAVE_XP,
  WAVES_PER_ROUND,
  WORLD,
  OPENING_ODDS,
  PALETTE,
  WIN_WAVES,
  levelDraftBump,
  levelPadBonus,
  packSizeFor,
  scrapMul,
  xpToNext,
} from "./constants";
import { combatStats, OPENING_ROUNDS, upgradeCost, getCard, gunLevelMul } from "./data/cards";
import { dealStampPack, foldStamps, type StampLook } from "./data/stamps";
import { BASE, PATHS, PADS, padById, pathOf, GATES, nearestPathMeta, sampleAlong, PATH_ALONG, PATH_SAMPLES, setMapLayout, layoutForMap, padReachMul, padRateMul, padBurnBonus, moonPlantLine } from "./data/map";
import { LOOP_WAVES, loopOf, themeAt } from "./data/themes";
import { isPlayMode } from "./data/modes";
import { waveAt, WAVES } from "./data/waves";
import { countSets } from "./data/sets";
import { OPERATORS } from "./data/sets";
import { lordFlags } from "./data/lords";
import { climbFx, climbMaxed, climbOf, dealClimbCards, emptyClimb } from "./data/climb";
import { dealSpecials, maxSpecials, pickRoundForLevel, specialOf, type SpecialDef } from "./data/specials";
import { dealParts, partOf, partOfferWeak, refreshPartOffer, type PartRoll } from "./data/parts";
import { glowHasFx, glowRadius, hullGlow, isGlowHull } from "./data/glow";
import { orbitRank } from "./data/orbit";
import { type PackLean } from "./data/gifts";
import { canTakeJob, gunJobs, offerJobs, slotsMax, slotsOpen, slotsUsed } from "./data/gun-tree";
import { dealByKind, dealCompanionOpening, dealKitSkills, dealLoot, dealOpeningMix, dealPack, dealSector, dealTowerOpening, heatBump, oddsForGrade, packGiftOf, packKindOf, packModeOf, packModeSub, packRarityOf, packTitleFor, rollPackHeat, rollPackKind, rollPackRarity, applySkipBump, spicePack, rarityLabel } from "./draft";
import { dealSetOpening, dealSignalOpening, hasSig } from "./data/signals";
import { expectedWaveTime, gradeWave } from "./grade";
import { audio } from "./audio";
import { addStamp, bumpForge, clearRun, loadMeta, saveRun, noteGunKills, noteLeakless, addFlux, activeProfile, addBondXp, recordRun, markLive } from "./persist";
import { CHARMS, emptyGems, canAfford, payGems } from "./data/charms";
import { rollCard } from "./data/roll";
import { bondFill, bondJobCount, bondKits, bondLookCount, bondMul, xpFromCraft } from "./data/bond";
import { inCover, COVER } from "./cover";
import { companionFx, companionMaxHp, companionSpecialOf, pickTaunt, type CompanionState } from "./data/companion";
import { skillsForCraft } from "./data/skills";
import { BONUS_CREDIT, CREDIT_SPARE, fluxFromBank, fluxFromRound, hangarOf, hangarStartCredit } from "./data/hangar";
import { vaultHas, vaultOf } from "./data/vault";
import type {
  ActiveCharm,
  CardDef,
  CardKind,
  DraftLane,
  EnemyType,
  GemId,
  Grade,
  GradeResult,
  LiveOffer,
  OpId,
  PackHeat,
  PackGift,
  PackMode,
  Phase,
  PlayMode,
  ProjectileKind,
  Rarity,
  RolledCard,
  RosterItem,
  RunSave,
  SimSpeed,
  ThemeId,
} from "./types";

export type Enemy = {
  alive: boolean;
  type: EnemyType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  armor: number;
  radius: number;
  gold: number;
  wp: number;
  dist: number;
  slowT: number;
  slowMul: number;
  shredT: number;
  poisonT: number;
  poisonDps: number;
  burnT: number;
  burnDps: number;
  freezeT: number;
  iced: boolean;
  marked: boolean;
  anim: number;
  facing: number;
  flash: number;
  lane: number;
  route: number;
  along: number;
  hdg: number;
  nadeCd: number;
  fold: number;
  hat?: number;
  knockHits?: number;
  age?: number;
};

type Projectile = {
  alive: boolean;
  x: number;
  y: number;
  ox: number;
  oy: number;
  tx: number;
  ty: number;
  speed: number;
  target: number;
  dmg: number;
  splash: number;
  slowT: number;
  slowMul: number;
  shred: number;
  mark: boolean;
  kind: ProjectileKind;
  style: string;
  ttl: number;
  chainLeft: number;
};

type Fx = {
  kind: "ring" | "spark" | "smoke" | "beam" | "float" | "drop" | "patch" | "mote";
  x: number;
  y: number;
  life: number;
  color: string;
  size: number;
  t: number;
  text?: string;
  x2?: number;
  y2?: number;
  vx?: number;
  vy?: number;
};

type BoreMark = {
  x: number;
  y: number;
  r: number;
  life: number;
  max: number;
  dps: number;
  slowMul: number;
  pit: boolean;
  kind: "cut" | "fire" | "ice";
  owner?: string | null;
};

type Nade = {
  alive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl: number;
  dmg: number;
  bent?: boolean;
};

type SpawnQ = { at: number; type: EnemyType; route: number };

export type World = {
  phase: Phase;
  playMode: PlayMode;
  gold: number;
  lives: number;
  maxLives: number;
  wave: number;
  speed: SimSpeed;
  paused: boolean;
  pickPause: boolean;
  flashT: number;
  wantSfx: string | null;
  roster: RosterItem[];
  relics: string[];
  environmentId: string | null;
  environment: RolledCard | null;
  forge: Record<string, number>;
  pendingEngrave: boolean;
  envSlowMul: number;
  envPoisonDps: number;
  envChipDps: number;
  envShred: number;
  envDmgAmp: number;
  rateMul: number;
  killGoldMul: number;
  mapGoldMul: number;
  draftBump: number;
  nextWaveDmg: number;
  selectedCard: string | null;
  selectedPad: string | null;
  enemies: Enemy[];
  projectiles: Projectile[];
  fx: Fx[];
  spawnQ: SpawnQ[];
  waveT: number;
  visT: number;
  waveActive: boolean;
  leaks: number;
  kills: number;
  goldWave: number;
  hitstop: number;
  trauma: number;
  uid: number;
  draftCards: RolledCard[];
  draftPicksLeft: number;
  draftTitle: string;
  draftSub: string;
  draftKind: CardKind | null;
  draftOdds: Record<Rarity, number>;
  grade: GradeResult | null;
  openingStep: number;
  uiDirty: boolean;
  signals: string[];
  endless: boolean;
  ghostHullUsed: boolean;
  message: string | null;
  announce: string | null;
  announceT: number;
  bonusSay: string | null;
  bonusSayT: number;
  defenderAim: number;
  won: boolean;
  recorded: boolean;
  points: number;
  extraPicks: number;
  draftTotal: number;
  holdT: number;
  roundKills: number;
  roundLeaks: number;
  roundGold: number;
  roundTime: number;
  roundXp: number;
  pendingPart: RolledCard | null;
  resumePhase: Phase | null;
  lootQueued: number;
  runLevel: number;
  xp: number;
  pendingLevels: number;
  lastGrade: Grade | null;
  draftLane: DraftLane;
  pendingStamp: boolean;
  packHeat: PackHeat | null;
  packPity: number;
  packRarity: Rarity | null;
  packMode: PackMode;
  cutId: string | null;
  mysteryQueue: number;
  pendingRoundPack: boolean;
  stampDmg: number;
  stampRange: number;
  stampRate: number;
  stampXp: number;
  stampLuck: number;
  stampPads: number;
  stampCache: number;
  looks: StampLook[];
  gems: Record<GemId, number>;
  charms: ActiveCharm[];
  merchantPity: number;
  pendingMerchant: boolean;
  lastLeakGate: string | null;
  rainT: number;
  meteorT: number;
  mapId: string | null;
  mapTheme: ThemeId | null;
  mapLayout: string;
  mapSlowMul: number;
  mapRangeMul: number;
  mapScrapMul: number;
  mapPads: number;
  mapBurn: number;
  stickers: RolledCard[];
  companions: CompanionState[];
  bores: BoreMark[];
  nades: Nade[];
  padBuff: Record<string, number>;
  skin: string;
  orbitRank: number;
  gunKills: Record<string, number>;
  runKills: number;
  runLeaks: number;
  shotsFired: number;
  upgradesMade: number;
  fuseTip: boolean;
  wavesCleared: number;
  live: LiveOffer | null;
  liveQueue: number;
  liveMark: number;
  flux: number;
  fluxEarned: number;
  hangarPads: number;
  hangarLuck: number;
  vaultHealMul?: number;
  vaultWarm?: boolean;
  vaultDeepBay?: boolean;
  vaultSteady?: boolean;
  vaultHotLip?: boolean;
  vaultFoundry?: boolean;
  vaultMatchChalk?: boolean;
  vaultOutfit?: string[];
  vaultStars?: boolean;
  vaultSun?: boolean;
  vaultPath?: "frost" | "ember" | "ion" | null;
  vaultHelix?: boolean;
  vaultSink?: boolean;
  tutorialActive?: boolean;
  tutorialStep?: number;
  tutorialDoneReady?: boolean;
  tutorialPendingGate?: boolean;
  wantTutorial?: boolean;
  parked?: boolean;
  climb: { bay: number; pack: number; crew: number };
  swapTokens: number;
  swapPity: number;
  swapToast: boolean;
  pendingSwapToast: boolean;
  hoverPad: string | null;
  skipCharge: number;
  lastPackGem: Rarity | null;
  lastPackKind: CardKind | null;
  packGift: PackGift | null;
  lastPackGift: PackGift | null;
  pendingCompensate: "kit" | "companion" | null;
  draftCompensate: boolean;
  bansThisRound: number;
  runBanned: string[];
  boundId: string | null;
  bondLevel: number;
  bondXp: number;
};

function uid(w) {
  w.uid += 1;
  return `u${w.uid}`;
}

export function createWorld(): World {
  setMapLayout("twin-s");
  return {
    phase: "title",
    playMode: "story",
    gold: 0,
    lives: START_LIVES,
    maxLives: START_LIVES,
    wave: 0,
    speed: 1,
    paused: false,
    pickPause: false,
    flashT: 0,
    wantSfx: null,
    roster: [],
    relics: [],
    environmentId: null,
    environment: null,
    forge: typeof window === "undefined" ? {} : loadMeta().forge,
    pendingEngrave: false,
    envSlowMul: 1,
    envPoisonDps: 0,
    envChipDps: 0,
    envShred: 0,
    envDmgAmp: 1,
    rateMul: 1,
    killGoldMul: 1,
    mapGoldMul: 1,
    draftBump: 0,
    nextWaveDmg: 1,
    selectedCard: null,
    selectedPad: null,
    enemies: [],
    projectiles: [],
    fx: [],
    spawnQ: [],
    waveT: 0,
    visT: 0,
    waveActive: false,
    leaks: 0,
    kills: 0,
    goldWave: 0,
    hitstop: 0,
    trauma: 0,
    uid: 0,
    draftCards: [],
    draftPicksLeft: 0,
    draftTitle: "",
    draftSub: "",
    draftKind: null,
    draftOdds: { ...OPENING_ODDS },
    grade: null,
    openingStep: 0,
    uiDirty: true,
    signals: [],
    endless: false,
    ghostHullUsed: false,
    message: null,
    announce: null,
    announceT: 0,
    bonusSay: null,
    bonusSayT: 0,
    defenderAim: 0,
    won: false,
    recorded: false,
    points: 0,
    extraPicks: 0,
    draftTotal: 1,
    holdT: 0,
    roundKills: 0,
    roundLeaks: 0,
    roundGold: 0,
    roundTime: 0,
    roundXp: 0,
    pendingPart: null,
    resumePhase: null,
    lootQueued: 0,
    runLevel: START_LEVEL,
    xp: 0,
    pendingLevels: 0,
    lastGrade: null,
    draftLane: "open",
    pendingStamp: false,
    packHeat: null,
    packPity: 0,
    packRarity: null,
    packMode: "show",
    cutId: null,
    mysteryQueue: 0,
    pendingRoundPack: false,
    stampDmg: 1,
    stampRange: 1,
    stampRate: 1,
    stampXp: 1,
    stampLuck: 0,
    stampPads: 0,
    stampCache: 1,
    looks: [],
    gems: emptyGems(),
    charms: [],
    merchantPity: 0,
    pendingMerchant: false,
    lastLeakGate: null,
    rainT: 0,
    meteorT: 0,
    mapId: null,
    mapTheme: null,
    mapLayout: "twin-s",
    mapSlowMul: 1,
    mapRangeMul: 1,
    mapScrapMul: 1,
    mapPads: 0,
    mapBurn: 0,
    stickers: [],
    companions: [],
    bores: [],
    nades: [],
    padBuff: {},
    skin: typeof window === "undefined" ? "stock" : loadMeta().equipped ?? "stock",
    orbitRank: typeof window === "undefined" ? 0 : orbitRank(loadMeta().orbitXp ?? 0),
    gunKills: {},
    waveNotes: {},
    runKills: 0,
    runLeaks: 0,
    shotsFired: 0,
    upgradesMade: 0,
    fuseTip: false,
    wavesCleared: 0,
    live: null,
    liveQueue: 0,
    liveMark: 10,
    flux: typeof window === "undefined" ? 0 : loadMeta().flux ?? 0,
    fluxEarned: 0,
    hangarPads: 0,
    hangarLuck: 0,
    vaultHealMul: 1,
    vaultWarm: false,
    vaultDeepBay: false,
    vaultSteady: false,
    vaultHotLip: false,
    vaultFoundry: false,
    vaultMatchChalk: false,
    vaultOutfit: [],
    vaultStars: false,
    vaultSun: false,
    vaultPath: null,
    vaultHelix: false,
    vaultSink: false,
    tutorialActive: false,
    tutorialStep: 0,
    tutorialDoneReady: false,
    tutorialPendingGate: false,
    parked: false,
    climb: emptyClimb(),
    swapTokens: START_SWAP,
    swapPity: 0,
    swapToast: false,
    pendingSwapToast: false,
    hoverPad: null,
    skipCharge: 0,
    lastPackGem: null,
    lastPackKind: null,
    packGift: null,
    lastPackGift: null,
    pendingCompensate: null,
    draftCompensate: false,
    bansThisRound: 0,
    runBanned: [],
    boundId: null,
    bondLevel: 1,
    bondXp: 0,
  };
}

function applyStamps(w) {
  const folded = foldStamps(loadMeta().stamps ?? []);
  w.stampDmg = folded.dmg;
  w.stampRange = folded.range;
  w.stampRate = folded.rate;
  w.stampXp = folded.xp;
  w.stampLuck = folded.luck;
  w.stampPads = folded.pads;
  w.stampCache = folded.cache;
  w.looks = folded.looks;
  return folded;
}

export function padCap(w) {
  return Math.min(MAX_TOWERS, BASE_PADS + levelPadBonus(w.runLevel) + w.stampPads + (w.mapPads ?? 0) + (w.hangarPads ?? 0) + climbFx(w.climb).pads);
}

export function livePads(w) {
  const cap = padCap(w);
  const far = PADS.filter((p) => p.far);
  const rest = PADS.filter((p) => !p.far);
  const n = Math.max(0, cap - far.length);
  if (n >= rest.length) return [...far, ...rest];
  const all = rest;
  if (n >= all.length) return [...far, ...all.slice()];
  const used = new Set();
  const out = [];
  for (let i = 0; i < n; i++) {
    let idx = Math.round((i * (all.length - 1)) / Math.max(1, n - 1));
    while (used.has(idx) && idx < all.length - 1) idx += 1;
    while (used.has(idx) && idx > 0) idx -= 1;
    used.add(idx);
    if (all[idx]) out.push(all[idx]);
  }
  return [...far, ...out];
}

export function fieldedTowers(w) {
  return w.roster.filter((r) => r.placedPad && r.placedPad !== HOME_PAD && r.card.kind === "tower");
}

function hydrateGun(r) {
  if (!r) return r;
  r.jobs = r.jobs ?? [r.tuneJob, r.tuneCap].filter(Boolean);
  r.jobSlots = r.jobSlots ?? PARAMS.jobSlotsStart;
  r.heatXp = r.heatXp ?? 0;
  if (r.level == null) r.level = 1;
  r.trick = r.trick ?? null;
  r.trickOffer = r.trickOffer ?? [];
  r.specials = r.specials ?? [];
  r.specialOffer = [];
  r.parts = r.parts ?? [];
  r.partOffer = [];
  r.kills = r.kills ?? 0;
  r.shots = r.shots ?? 0;
  r.heals = r.heals ?? 0;
  if ((r.parts ?? []).some((p) => p.gun?.extraShot)) r.extraShot = true;
  return r;
}

function heatNeed(heat) {
  return Math.max(1, Math.round(PARAMS.heatBase * PARAMS.heatGrow ** Math.max(0, (heat || 1) - 1)));
}

function heatCap(w) {
  return w.endless || w.playMode === "arcade" ? PARAMS.heatMaxEndless : PARAMS.gunLevelMax;
}

function tickHeat(w, r) {
  if (!r || r.card.kind !== "tower") return;
  hydrateGun(r);
  const cap = heatCap(w);
  if (r.level >= cap) return;
  r.heatXp = (r.heatXp ?? 0) + 1;
  if (r.heatXp < heatNeed(r.level)) return;
  r.heatXp = 0;
  r.level += 1;
  const pt = towerPoint(r);
  if (pt) celebrateLevel(w, pt.x, pt.y, "#ff5c2a", r.level, r.uid);
  w.uiDirty = true;
}

function queueGunSpecial(r) {
  if (!r) return;
  const have = r.specials ?? [];
  if (have.length >= maxSpecials("gun")) return;
  if ((r.specialOffer ?? []).length) return;
  const round = pickRoundForLevel("gun", r.level || 1);
  if (!round || have.length >= round) return;
  const role = r.card.stats?.role ?? r.card.templateId ?? r.card.id;
  r.specialOffer = dealSpecials("gun", role, round, r.uid, have);
}

function queueCraftSpecial(c) {
  if (!c) return;
  const have = c.specials ?? [];
  if (have.length >= maxSpecials("craft")) return;
  if ((c.specialOffer ?? []).length) return;
  const round = pickRoundForLevel("craft", c.runLevel || 1);
  if (!round || have.length >= round) return;
  const id = c.card.templateId ?? c.card.id;
  c.specialOffer = dealSpecials("craft", id, round, c.uid, have);
}

function queueGunPart(r) {
  if (!r || r.card.kind !== "tower") return;
  if ((r.specialOffer ?? []).length) return;
  const have = (r.parts ?? []).map((p) => p.id);
  r.partOffer = refreshPartOffer("gun", r.uid, have, r.level || 1, r.partOffer);
}

function queueCraftPart(c) {
  if (!c) return;
  if ((c.specialOffer ?? []).length) return;
  const have = (c.parts ?? []).map((p) => p.id);
  c.partOffer = refreshPartOffer("craft", c.uid, have, c.runLevel || 1, c.partOffer);
}

function queueGunTrick(r) {
  queueGunSpecial(r);
}

function queueCraftTrick(c) {
  queueCraftSpecial(c);
}

function slamEvery(item) {
  const base = PARAMS.ultEvery;
  if ((item.level || 1) >= 3) return Math.max(2, base - 1);
  return base;
}

function craftRoundHeat(w) {
  const rounds = Math.floor(Math.max(0, w.wave) / WAVES_PER_ROUND);
  const n = w.endless || w.playMode === "arcade" ? rounds : Math.min(rounds, 12);
  const soft = n <= 12 ? n : 12 + (n - 12) * 0.4;
  return 1 + PARAMS.craftHeatPerRound * soft;
}

function itemStats(w, item, sets, amp) {
  hydrateGun(item);
  const stats = combatStats(
    item.card,
    item.level,
    item.mod,
    sets ?? liveSets(w),
    w.forge[item.card.templateId] ?? 0,
    amp ?? ampOf(w),
    item.tuneJob,
    item.tuneCap,
    item.jobs,
  );
  if (!stats) return stats;
  applyGunSpecials(stats, item, w);
  applyGunParts(stats, item);
  if (hasSig(w.signals, "sig-shade")) stats.range *= 1.12;
  if (hasSig(w.signals, "sig-hot")) stats.rate *= 1.18;
  if (stats.role === "cascade" && hasSig(w.signals, "sig-twin")) stats.chain = (stats.chain ?? 0) + 1;
  if (stats.role === "spear" && hasSig(w.signals, "sig-lance") && stats.coverArc) stats.coverArc *= 1.28;
  if (stats.role === "frost" && hasSig(w.signals, "sig-freeze") && stats.slowT) stats.slowT *= 1.45;
  if (stats.role === "crater" && hasSig(w.signals, "sig-crater") && stats.splash) stats.splash *= 1.35;
  if (stats.role === "umbra" && hasSig(w.signals, "sig-well")) {
    if (stats.lure) stats.lure *= 1.4;
    if (stats.bend) stats.bend *= 1.35;
  }
  if (item.trick === "wake" || (item.specials ?? []).some((id) => specialOf(id)?.gun?.trick === "wake")) {
    stats.range *= 1.14;
    if (stats.coverArc) stats.coverArc *= 1.22;
  }
  return stats;
}

function craftSynergyTags(w) {
  const tags = new Set();
  for (const c of w.companions ?? []) {
    if (c.placedPad !== SKY_PAD || c.home) continue;
    for (const id of c.specials ?? []) {
      const t = specialOf(id)?.tag;
      if (t) tags.add(t);
    }
  }
  return tags;
}

function applyGunSpecials(stats, item, w) {
  const tags = w ? craftSynergyTags(w) : new Set();
  for (const id of item.specials ?? []) {
    const spec = specialOf(id);
    const g = spec?.gun;
    if (!g) continue;
    const hot = spec.tag && tags.has(spec.tag) ? 1.2 : 1;
    if (g.burnDps) stats.burnDps = (stats.burnDps ?? 0) + g.burnDps * hot;
    if (g.slowMul) stats.slowMul = Math.min(stats.slowMul ?? 1, g.slowMul);
    if (g.slowT) stats.slowT = Math.max(stats.slowT ?? 0, g.slowT * (hot > 1 ? 1.15 : 1));
    if (g.poisonDps) stats.poisonDps = (stats.poisonDps ?? 0) + g.poisonDps * hot;
    if (g.healAura) stats.healAura = (stats.healAura ?? 0) + g.healAura * hot;
    if (g.auraDps) stats.auraDps = (stats.auraDps ?? 0) + g.auraDps * hot;
    if (g.rateMul) stats.rate *= g.rateMul;
    if (g.dmgMul) stats.damage *= g.dmgMul;
    if (g.rangeMul) stats.range *= g.rangeMul;
    if (g.splash) stats.splash = (stats.splash ?? 0) + g.splash;
    if (g.knock) stats.knock = (stats.knock ?? 0) + g.knock * hot;
    if (g.sendHome) stats.sendHome = Math.max(stats.sendHome ?? 0, g.sendHome * hot);
    if (g.chain) stats.chain = (stats.chain ?? 0) + g.chain;
    if (g.coverArcMul && stats.coverArc) stats.coverArc *= g.coverArcMul;
    if (g.shred) stats.shred = (stats.shred ?? 0) + g.shred;
    if (g.markGold) stats.markGold = (stats.markGold ?? 0) + g.markGold;
    if (g.trick === "lip" || g.trick === "drones" || g.trick === "hotslam" || g.trick === "wake") {
      item.trick = item.trick || g.trick;
    }
  }
}

function applyGunParts(stats, item) {
  for (const p of item.parts ?? []) {
    const g = p.gun;
    if (!g) continue;
    if (g.damageMul && g.damageMul > 1) stats.damage *= g.damageMul;
    if (g.rateMul && g.rateMul > 1) stats.rate *= g.rateMul;
    if (g.rangeMul && g.rangeMul > 1) stats.range *= g.rangeMul;
    if (g.splash) stats.splash = (stats.splash ?? 0) + g.splash;
    if (g.burnDps) stats.burnDps = (stats.burnDps ?? 0) + g.burnDps;
    if (g.poisonDps) stats.poisonDps = (stats.poisonDps ?? 0) + g.poisonDps;
    if (g.healAura) stats.healAura = (stats.healAura ?? 0) + g.healAura;
    if (g.knock) stats.knock = (stats.knock ?? 0) + g.knock;
    if (g.slowMul) stats.slowMul = Math.min(stats.slowMul ?? 1, g.slowMul);
    if (g.slowT) stats.slowT = Math.max(stats.slowT ?? 0, g.slowT);
    if (g.chain) stats.chain = (stats.chain ?? 0) + 1;
    if (g.extraShot) {
      item.extraShot = true;
      stats.rate *= 2;
    }
  }
}

export function gunMaxed(r) {
  hydrateGun(r);
  return (r.specials ?? []).length >= maxSpecials("gun");
}

export function coverPct(w) {
  const guns = [];
  const sets = worldSets(w);
  for (const item of w.roster) {
    if (!item.placedPad) continue;
    if (item.card.kind !== "tower" && item.card.kind !== "defender") continue;
    const pos = towerPoint(item);
    const stats = itemStats(w, item, sets, { dmg: w.stampDmg, range: w.stampRange * (w.mapRangeMul ?? 1), rate: w.stampRate });
    if (!pos || !stats) continue;
    guns.push({
      x: pos.x,
      y: pos.y,
      range: stats.range * padReachMul(item.placedPad),
      cover: stats.cover,
      aim: item.aim ?? 0,
      inner: stats.coverInner ?? COVER.ringInner,
      arc: stats.coverArc ?? COVER.coneArc,
    });
  }
  if (!guns.length) return 0;
  let hit = 0;
  let n = 0;
  for (const samples of PATH_SAMPLES) {
    for (const p of samples) {
      n += 1;
      if (guns.some((g) => inCover(g.cover, g.x, g.y, p.x, p.y, g.range, g.aim, g.inner, g.arc))) hit += 1;
    }
  }
  return n ? Math.round((hit / n) * 100) : 0;
}

function inGunCover(w, x, y) {
  const sets = liveSets(w);
  for (const item of w.roster) {
    if (!item.placedPad) continue;
    if (item.card.kind !== "tower" && item.card.kind !== "defender") continue;
    const pos = towerPoint(item);
    const stats = itemStats(w, item, sets);
    if (!pos || !stats) continue;
    const range = stats.range * padReachMul(item.placedPad);
    if (inCover(stats.cover, pos.x, pos.y, x, y, range, item.aim ?? 0, stats.coverInner, stats.coverArc)) return true;
  }
  return false;
}

function slamGun(w, item, mul) {
  const pos = towerPoint(item);
  if (!pos) return;
  const sets = liveSets(w);
  const stats = itemStats(w, item, sets);
  if (!stats) return;
  const hot = item.trick === "hotslam";
  item.ultT = hot ? 0.52 : 0.42;
  const dmg = Math.max(12, stats.damage || 16) * mul * (hot ? 1.35 : 1);
  const reach = hot ? 1.28 : 1;
  for (const e of w.enemies) {
    if (!e.alive) continue;
    if (!inCover(stats.cover, pos.x, pos.y, e.x, e.y, stats.range * reach, item.aim ?? 0, stats.coverInner, stats.coverArc)) continue;
    applyHitFx(w, e, stats);
    applyDamage(w, e, dmg, true, "slam");
    if (stats.shock) knockEnemy(e, stats.shock);
  }
  addFx(w, { kind: "ring", x: pos.x, y: pos.y, life: 0.42, color: "#e8c15a", size: Math.max(52, stats.range * 0.4 * (hot ? 1.25 : 1)) });
  addFx(w, { kind: "spark", x: pos.x, y: pos.y - 16, life: 0.3, color: "#eef3f7", size: 14 });
  if (hot) {
    addFx(w, { kind: "ring", x: pos.x, y: pos.y, life: 0.7, color: "#ff5c2a", size: Math.max(80, stats.range * 0.62) });
    addFx(w, { kind: "patch", x: pos.x, y: pos.y, life: 0.5, color: "#e8c15a", size: 28 });
    addFx(w, { kind: "drop", x: pos.x, y: pos.y, life: 0.55, color: "#ff5c2a", size: 52 });
  }
  w.shotsFired = (w.shotsFired ?? 0) + 1;
}

function dronePeck(w, pos, stats, dmg, aim) {
  if (!pos || !stats) return;
  let n = 0;
  for (const e of w.enemies) {
    if (!e.alive) continue;
    if (!inCover(stats.cover, pos.x, pos.y, e.x, e.y, stats.range, aim ?? 0, stats.coverInner, stats.coverArc)) continue;
    applyDamage(w, e, dmg * 0.32, true);
    addFx(w, { kind: "spark", x: e.x, y: e.y, life: 0.18, color: "#eef3f7", size: 6 });
    addFx(w, { kind: "beam", x: pos.x, y: pos.y - 10, x2: e.x, y2: e.y, life: 0.16, color: "#e8c15a", size: 2 });
    n += 1;
    if (n >= 2) break;
  }
}

export function socketOnPad(w, padId) {
  if (!padId) return null;
  return w.roster.find((r) => r.placedPad === padId && r.card.kind === "socket") ?? null;
}

export function towerOnPad(w, padId) {
  if (!padId) return null;
  return w.roster.find((r) => r.placedPad === padId && r.card.kind === "tower") ?? null;
}

function charmRateMul(w) {
  let t = 1;
  for (const n of w.charms) if (n.rateMul) t *= n.rateMul;
  return t;
}
function charmPointMul(w) {
  let t = 1;
  for (const n of w.charms) if (n.pointMul) t *= n.pointMul;
  return t;
}
function charmGemMul(w) {
  let t = 1;
  for (const n of w.charms) if (n.gemMul) t *= n.gemMul;
  return t;
}
function charmSlowMul(w) {
  let t = 1;
  for (const n of w.charms) if (n.slowMul) t *= n.slowMul;
  return t;
}

function nearbySocketBonus(w, x, y, key) {
  let i = 0;
  for (const a of w.roster) {
    if (a.card.kind !== "socket" || !a.placedPad) continue;
    const pad = padById(a.placedPad);
    const o = a.card.socket;
    if (!pad || !o) continue;
    const s = o.slowR ?? 100;
    if (dist2(pad.x, pad.y, x, y) > s * s) continue;
    if (key === "killGold") i += o.killGold ?? 0;
    if (key === "gemMul") i += (o.gemMul ?? 1) - 1;
  }
  return i;
}

function grantGem(w, gem, x, y) {
  w.gems[gem] = (w.gems[gem] ?? 0) + 1;
  addFx(w, {
    kind: "float",
    x,
    y: y - 20,
    life: 0.95,
    text: GEM_META[gem].name.toUpperCase(),
    color: gem === "ruby" ? "#ff5c2a" : gem === "emerald" ? "#6f8f78" : gem === "sapphire" ? "#3d8fd4" : "#3cd6cc",
    size: 13,
  });
}

function ampOf(w) {
  return {
    dmg: w.stampDmg,
    range: w.stampRange * (w.mapRangeMul ?? 1),
    rate: w.stampRate,
  };
}

export function towerPoint(item) {
  if (item.placedPad === HOME_PAD) return BASE;
  if (!item.placedPad) return null;
  return padById(item.placedPad) ?? null;
}

function allocEnemy(w) {
  let e = w.enemies.find((x) => !x.alive);
  if (!e) {
    e = {
      alive: false,
      type: "grunt",
      x: 0,
      y: 0,
      hp: 1,
      maxHp: 1,
      speed: 1,
      armor: 0,
      radius: 12,
      gold: 0,
      wp: 0,
      dist: 0,
      slowT: 0,
      slowMul: 1,
      shredT: 0,
      poisonT: 0,
      poisonDps: 0,
      burnT: 0,
      burnDps: 0,
      freezeT: 0,
      iced: false,
      marked: false,
      anim: 0,
      facing: 1,
      flash: 0,
      lane: 0,
      route: 0,
      along: 0,
      hdg: 0,
      nadeCd: 1.4 + Math.random() * 1.6,
      fold: 0,
      hat: 0,
      knockHits: 0,
      age: 0,
    };
    w.enemies.push(e);
  }
  return e;
}

function allocProj(w) {
  let p = w.projectiles.find((x) => !x.alive);
  if (!p) {
    p = {
      alive: false,
      x: 0,
      y: 0,
      ox: 0,
      oy: 0,
      tx: 0,
      ty: 0,
      speed: 0,
      target: -1,
      dmg: 0,
      splash: 0,
      slowT: 0,
      slowMul: 1,
      shred: 0,
      mark: false,
      kind: "arrow",
      style: "",
      ttl: 0,
      chainLeft: 0,
    };
    w.projectiles.push(p);
  }
  return p;
}

function addFx(w, fx) {
  w.fx.push({ ...fx, t: 0 });
  if (w.fx.length > 120) w.fx.splice(0, w.fx.length - 120);
}

function motes(w, x, y, n, color, speed, life, aim) {
  const fan = aim == null ? Math.PI * 2 : 0.55;
  for (let i = 0; i < n; i++) {
    const a = (aim ?? 0) + (Math.random() - 0.5) * fan;
    const sp = speed * (0.65 + Math.random() * 0.5);
    addFx(w, {
      kind: "mote",
      x: x + (Math.random() - 0.5) * 3,
      y: y + (Math.random() - 0.5) * 3,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: life * (0.85 + Math.random() * 0.3),
      color,
      size: 1.7 + Math.random() * 1.3,
    });
  }
}

function unitHasOffer(unit) {
  return ((unit?.specialOffer ?? []).length || (unit?.partOffer ?? []).length) > 0;
}

function celebrateLevel(w, x, y, color, level, uid) {
  w.hitstop = Math.max(w.hitstop ?? 0, PARAMS.levelHitStop);
  w.trauma = Math.min(1, (w.trauma ?? 0) + PARAMS.levelTrauma);
  w.flashT = 0.42;
  w.wantSfx = "draft";
  w.announce = `LEVEL ${level}`;
  w.announceT = 2.2;
  const ring = PARAMS.levelRing;
  addFx(w, { kind: "ring", x, y, life: 1.4, color: "#e8c15a", size: ring });
  addFx(w, { kind: "ring", x, y, life: 1.1, color, size: ring * 0.72 });
  addFx(w, { kind: "ring", x, y, life: 0.72, color: "#eef3f7", size: ring * 0.38 });
  addFx(w, { kind: "patch", x, y, life: 0.9, color: "#e8c15a", size: 32 });
  addFx(w, { kind: "spark", x, y, life: 0.6, color: "#e8c15a", size: 28 });
  for (let i = 0; i < 7; i++) {
    addFx(w, {
      kind: "drop",
      x: x + (i - 3) * 9,
      y: y + 8,
      life: 0.72 + i * 0.07,
      color: i % 2 ? color : "#e8c15a",
      size: 44 + i * 6,
    });
  }
  addFx(w, {
    kind: "float",
    x,
    y: y - 36,
    life: 2.1,
    text: `LEVEL ${level}`,
    color: "#e8c15a",
    size: PARAMS.levelFloatSize,
  });
  const gun = (w.roster ?? []).find((r) => r.uid === uid);
  if (gun) gun.levelPop = 1.15;
  const craft = (w.companions ?? []).find((c) => c.uid === uid);
  if (craft) craft.levelPop = 1.15;
}

function openLevelPick(w, uid) {
  if (!uid) return;
  if (w.phase === "combat") return;
  const cur = w.selectedCard;
  if (cur && cur !== uid) {
    const busyGun = (w.roster ?? []).find((r) => r.uid === cur);
    const busyCraft = (w.companions ?? []).find((c) => c.uid === cur);
    if (unitHasOffer(busyGun) || unitHasOffer(busyCraft)) return;
  }
  w.selectedCard = uid;
  w.uiDirty = true;
}

function nextLevelPick(w) {
  const gun = (w.roster ?? []).find((r) => r.card.kind === "tower" && unitHasOffer(r));
  const craft = (w.companions ?? []).find((c) => unitHasOffer(c));
  const next = gun ?? craft;
  if (next) {
    w.selectedCard = next.uid;
    w.uiDirty = true;
    return;
  }
  if (w.pickPause) {
    w.paused = false;
    w.pickPause = false;
  }
  w.uiDirty = true;
}

export function inspectGun(w, item) {
  const s = item?.card?.stats;
  const now = item ? itemStats(w, item) : null;
  if (!s) return { base: "A gun on a moon.", now: "Level 1." };
  const extra = item.extraShot ? " Twin barrels." : "";
  return {
    base: `Hurt ${Math.round(s.damage)}. Fire ${s.rate}. Reach ${Math.round(s.range)}.`,
    now: now
      ? `Hurt ${Math.round(now.damage)}. Fire ${Math.round(now.rate)}. Reach ${Math.round(now.range)}.${extra}`
      : `Level ${item.level || 1}.${extra}`,
  };
}

function spawnEnemy(w, type, route = 0) {
  const def = ENEMIES[type];
  const waveScale = 1 + w.wave * 0.11;
  const e = allocEnemy(w);
  e.alive = true;
  e.type = type;
  e.route = (route % PATHS.length + PATHS.length) % PATHS.length;
  e.maxHp = def.hp * waveScale;
  e.hp = e.maxHp;
  e.speed = def.speed;
  e.armor = def.armor;
  e.radius = def.radius;
  e.gold = def.gold;
  e.wp = 0;
  e.dist = 0;
  e.slowT = 0;
  e.slowMul = 1;
  e.shredT = 0;
  e.poisonT = 0;
  e.poisonDps = 0;
  e.burnT = 0;
  e.burnDps = 0;
  e.freezeT = 0;
  e.iced = false;
  e.marked = false;
  e.anim = Math.random() * 4;
  e.facing = 1;
  e.flash = 0;
  e.lane = ((w.enemies.reduce((n, x) => n + (x.alive ? 1 : 0), 0) + w.kills) % 3 - 1) * (type === "swarm" ? 6 : 9);
  e.along = 0;
  const first = sampleAlong(e.route, 0);
  e.hdg = first.heading;
  e.fold = 0;
  e.hat = Math.floor(Math.random() * 4);
  e.knockHits = 0;
  e.age = 0;
  const loop = loopOf(w.wave);
  if (loop > 0) {
    if (type === "dart" || type === "striker") e.speed *= 1 + PARAMS.raidLoopSpeed * loop;
    if (type === "plate") e.armor = Math.min(0.72, e.armor + PARAMS.raidLoopArmor * loop);
  }
  const nx = -Math.sin(e.hdg);
  const ny = Math.cos(e.hdg);
  e.x = first.x + nx * e.lane;
  e.y = first.y + ny * e.lane;
}

function progress(e) {
  return e.along ?? 0;
}

function dist2(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function applyDamage(w, e, raw, quiet = false, from = null) {
  const shred = e.shredT > 0 || w.envShred > 0 ? Math.max(0.35, w.envShred) : 0;
  let amount = raw;
  if (from && from !== "slam" && (w.companions ?? []).some((x) => x.uid === from)) {
    const hunter = (w.companions ?? []).find((x) => x.uid === from);
    const huntMul = hunter?.trick === "hunt" ? Math.min(0.72, PARAMS.coverHuntMul * 2.05) : PARAMS.coverHuntMul;
    amount *= inGunCover(w, e.x, e.y) ? 1 : huntMul;
  }
  const dmg = amount * (1 - Math.max(0, e.armor - shred)) * w.nextWaveDmg * w.envDmgAmp;
  e.hp -= dmg;
  if (from) {
    const c = (w.companions ?? []).find((x) => x.uid === from);
    if (c) c.roundDmg = (c.roundDmg ?? 0) + dmg;
  }
  if (!quiet) {
    e.flash = 0.12;
    addFx(w, {
      kind: "float",
      x: e.x + (Math.random() * 10 - 5),
      y: e.y - 18,
      life: 0.55,
      text: `${Math.max(1, Math.round(dmg))}`,
      color: "#f0f1f4",
      size: 12,
    });
  }
  if (e.hp <= 0) killEnemy(w, e, from);
}

function killEnemy(w, e, from = null) {
  if (!e.alive) return;
  hopBurn(w, e);
  e.alive = false;
  w.kills += 1;
  w.runKills = (w.runKills ?? 0) + 1;
  if (from) {
    const c = (w.companions ?? []).find((x) => x.uid === from);
    if (c) {
      c.roundKills = (c.roundKills ?? 0) + 1;
      tickMastery(w, c, 1);
    }
  }
  if (!w.gunKills) w.gunKills = {};
  let closest = null;
  let cd = 1e9;
  for (const r of w.roster) {
    if (!r.placedPad) continue;
    if (r.card.kind !== "tower" && r.card.kind !== "defender") continue;
    const pos = towerPoint(r);
    if (!pos) continue;
    const d = dist2(pos.x, pos.y, e.x, e.y);
    if (d < cd) {
      cd = d;
      closest = r;
    }
  }
  if (closest && from !== "slam") {
    const id = closest.card.templateId ?? closest.card.id;
    w.gunKills[id] = (w.gunKills[id] ?? 0) + 1;
    closest.kills = (closest.kills ?? 0) + 1;
    noteWave(w, closest.card.stats?.role, "kills");
    closest.streak = (closest.streak ?? 0) + 1;
    const every = slamEvery(closest);
    if (closest.streak % every === 0) {
      slamGun(w, closest, closest.streak >= every * 3 ? 2.1 : 1.55);
      if (closest.streak >= every * 3) closest.streak = 0;
    }
    tickHeat(w, closest);
  }
  let pay = e.gold * w.killGoldMul * charmPointMul(w);
  if (hasSig(w.signals, "sig-ore")) pay *= 1.45;
  if (e.marked) pay *= 1.45;
  const siphon = nearbySocketBonus(w, e.x, e.y, "killGold");
  if (siphon) pay *= 1 + siphon;
  let goldMul = 1;
  for (const c of skyCrafts(w)) {
    if (c.home) continue;
    const fx = companionFx(c.card, c.kits);
    if (fx.goldMul && dist2(c.x, c.y, e.x, e.y) <= fx.radius * fx.radius) goldMul *= fx.goldMul;
  }
  pay *= Math.min(1.45, goldMul);
  const credit = Math.round(pay);
  w.gold += credit;
  w.points += credit;
  w.goldWave += credit;
  w.uiDirty = true;
  addFx(w, { kind: "ring", x: e.x, y: e.y, life: 0.35, color: "#9aa0ab", size: 22 });
  addFx(w, { kind: "smoke", x: e.x, y: e.y, life: 0.4, color: "#8b8e98", size: 16 });
  w.trauma = Math.min(1, w.trauma + (e.type === "titan" || e.type === "colossus" ? 0.45 : 0.12));
  w.hitstop = e.type === "titan" ? 0.08 : 0.03;
  if (e.type === "colossus" || e.type === "titan") {
    w.draftBump = Math.min(3, (w.draftBump ?? 0) + 1);
    addFx(w, { kind: "float", x: e.x, y: e.y - 24, life: 0.9, text: "HOTTER", color: "#e8c15a", size: 14 });
  } else if (e.type === "cache") {
    grantXp(w, Math.round(CACHE_XP * (w.stampCache || 1)), true);
    w.draftBump = Math.min(3, (w.draftBump ?? 0) + 1);
    addFx(w, { kind: "float", x: e.x, y: e.y - 24, life: 0.9, text: "HOTTER", color: "#9aa3b2", size: 14 });
  } else if ((w.runKills ?? 0) >= (w.liveMark ?? 10)) {
    w.liveMark = (w.liveMark ?? 10) + 14;
    w.draftBump = Math.min(3, (w.draftBump ?? 0) + 1);
    addFx(w, { kind: "float", x: e.x, y: e.y - 24, life: 0.9, text: "HOTTER", color: "#9aa3b2", size: 14 });
  }
}

function leakEnemy(w, e) {
  e.alive = false;
  w.leaks += 1;
  w.runLeaks = (w.runLeaks ?? 0) + 1;
  if (hasSig(w.signals, "sig-ghost") && !w.ghostHullUsed) {
    w.ghostHullUsed = true;
    w.uiDirty = true;
    w.trauma = Math.min(1, w.trauma + 0.18);
    const n = GATES[e.route];
    w.lastLeakGate = n?.name ?? null;
    audio.play("leak");
    addFx(w, { kind: "float", x: BASE.x, y: BASE.y - 28, life: 1.2, text: "GHOST", color: "#3cd6cc", size: 16 });
    return;
  }
  w.lives -= 1;
  w.uiDirty = true;
  w.trauma = Math.min(1, w.trauma + 0.35);
  const n = GATES[e.route];
  w.lastLeakGate = n?.name ?? null;
  audio.play("leak");
  addFx(w, { kind: "ring", x: BASE.x, y: BASE.y, life: 0.5, color: "#c45c3e", size: 40 });
  addFx(w, {
    kind: "float",
    x: BASE.x,
    y: BASE.y - 28,
    life: 1.1,
    text: n ? `${n.name} leaked` : "LEAK",
    color: "#ff5c2a",
    size: 14,
  });
  if (w.lives <= 0) {
    failRun(w);
  }
}

function bankFlux(w, amount) {
  const n = Math.max(0, Math.floor(amount));
  if (n <= 0) return 0;
  const next = addFlux(n);
  w.flux = next.flux;
  w.fluxEarned = (w.fluxEarned ?? 0) + n;
  return n;
}

function failRun(w) {
  w.lives = 0;
  w.phase = "defeat";
  w.waveActive = false;
  payoutBond(w, w.grade?.grade ?? w.lastGrade ?? "F");
  if ((w.points ?? 0) > 0) {
    bankFlux(w, w.points);
    w.points = 0;
  }
  if (!w.recorded) {
    recordRun({
      wave: w.wave,
      grade: w.grade?.grade ?? w.lastGrade ?? "F",
      level: w.runLevel,
      loops: Math.floor(w.wave / LOOP_WAVES),
    });
    w.recorded = true;
  }
  w.uiDirty = true;
  audio.play("lose");
  clearRun();
}

function lerpAng(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function hopBurn(w, e) {
  if ((e.burnT ?? 0) <= 0 && (e.burnDps ?? 0) <= 0) return;
  const sets = liveSets(w);
  const lords = lordFlags(w.companions, sets, climbFx(w.climb).lordLimp);
  if (!lords.wildfire) return;
  const r2 = 92 * 92;
  for (const o of w.enemies) {
    if (!o.alive || o === e) continue;
    if (dist2(e.x, e.y, o.x, o.y) > r2) continue;
    o.burnT = Math.max(o.burnT, 1.4);
    o.burnDps = Math.max(o.burnDps, Math.max(4, (e.burnDps || 6) * 0.8));
  }
  addFx(w, { kind: "ring", x: e.x, y: e.y, life: 0.28, color: "#ff5c2a", size: 52 });
}

function moveEnemy(w, e, dt, envSlow, fold = 0) {
  e.age = (e.age ?? 0) + dt;
  if (e.freezeT > 0) {
    e.freezeT -= dt;
    const p = sampleAlong(e.route, e.along ?? 0);
    const nx = -Math.sin(e.hdg ?? p.heading);
    const ny = Math.cos(e.hdg ?? p.heading);
    e.x = p.x + nx * (e.lane ?? 0);
    e.y = p.y + ny * (e.lane ?? 0);
    return;
  }
  const cap = PATH_ALONG[e.route] ?? 1;
  const crawl = fold > 0 ? Math.max(0.62, 1 - fold * 0.012) : 1;
  const rage = 1 + Math.min(PARAMS.rageCap, (e.age ?? 0) * 0.018 + (e.knockHits ?? 0) * 0.045);
  let spd = e.speed * (e.slowT > 0 ? e.slowMul : 1) * envSlow * crawl * rage;
  if (hasSig(w.signals, "sig-hot")) spd *= 1.12;
  const capNow = PATH_ALONG[e.route] ?? 1;
  if (hasSig(w.signals, "sig-rim") && capNow > 0 && (e.along ?? 0) / capNow > 0.72) spd *= 0.62;
  e.along = Math.min(cap, (e.along ?? 0) + spd * dt);
  const p = sampleAlong(e.route, e.along);
  const k = 1 - Math.exp(-3.4 * dt);
  e.hdg = lerpAng(e.hdg ?? p.heading, p.heading, k);
  const nx = -Math.sin(e.hdg);
  const ny = Math.cos(e.hdg);
  const wobble = fold > 0 ? Math.sin((e.along ?? 0) * 0.042 + e.anim * 0.55) * (7 + fold * 0.22) : 0;
  e.x = p.x + nx * (e.lane + wobble);
  e.y = p.y + ny * (e.lane + wobble);
  const c = Math.cos(e.hdg);
  if (c > 0.28) e.facing = 1;
  else if (c < -0.28) e.facing = -1;
  e.fold = fold;
}

function foldingGuns(w) {
  const sets = liveSets(w);
  const guns = [];
  for (const item of w.roster) {
    if (!item.placedPad) continue;
    if (item.card.kind !== "tower" && item.card.kind !== "defender") continue;
    const pos = towerPoint(item);
    const stats = itemStats(w, item, sets);
    if (!pos || !stats?.bend) continue;
    guns.push({
      x: pos.x,
      y: pos.y,
      range: stats.range * padReachMul(item.placedPad),
      cover: stats.cover,
      aim: item.aim ?? 0,
      inner: stats.coverInner ?? COVER.ringInner,
      arc: stats.coverArc ?? COVER.coneArc,
      bend: stats.bend,
    });
  }
  return guns;
}

function foldAt(guns, e) {
  if (!guns.length) return 0;
  let max = 0;
  for (const g of guns) {
    if (inCover(g.cover, g.x, g.y, e.x, e.y, g.range, g.aim, g.inner, g.arc)) {
      if (g.bend > max) max = g.bend;
    }
  }
  return max;
}

export function bonusPct(w) {
  let p = w.killGoldMul || 1;
  for (const n of w.charms ?? []) if (n.pointMul) p *= n.pointMul;
  return Math.round((p - 1) * 100);
}

function liveSets(w) {
  const cards = [];
  if (w.environment) cards.push(w.environment);
  for (const r of w.roster) {
    if (r.card.kind === "companion") continue;
    cards.push(r.card);
  }
  for (const s of w.stickers ?? []) cards.push(s);
  return countSets(cards);
}

export function worldSets(w) {
  return liveSets(w);
}

function applyHitFx(w, e, stats) {
  if (stats.slowT) {
    const fresh = !(e.slowT > 0);
    e.slowT = Math.max(e.slowT, stats.slowT);
    e.slowMul = stats.slowMul ?? 1;
    if (fresh && stats.role === "frost") noteWave(w, "frost", "froze");
  }
  if (stats.shred) e.shredT = Math.max(e.shredT, 2.4);
  if ((stats.markGold ?? 0) > 0) e.marked = true;
  if (stats.burnDps) {
    e.burnT = Math.max(e.burnT, 1.8);
    e.burnDps = Math.max(e.burnDps, stats.burnDps);
  }
  if (stats.poisonDps) {
    e.poisonT = Math.max(e.poisonT ?? 0, 1.8);
    e.poisonDps = Math.max(e.poisonDps ?? 0, stats.poisonDps);
  }
  if (stats.sendHome && e.alive && Math.random() < stats.sendHome) {
    const cap = PATH_ALONG[e.route] ?? 1;
    const floor = cap * PARAMS.knockFloor;
    e.along = floor;
    const s = sampleAlong(e.route, e.along);
    e.x = s.x;
    e.y = s.y;
    e.hdg = s.heading ?? e.hdg;
    addFx(w, { kind: "float", x: e.x, y: e.y - 16, life: 0.7, text: "Back.", color: "#7ef0ea", size: 11 });
  }
  tribeOnHit(w, e, stats);
}

function tribeOnHit(w, e, stats) {
  const tribe = stats?.tribe;
  if (!tribe || !e?.alive) return;
  const sets = liveSets(w);
  const lords = lordFlags(w.companions, sets, climbFx(w.climb).lordLimp);
  if (tribe === "heat" && (sets.heat ?? 0) >= 2) {
    dropPatch(w, e.x, e.y, "fire", {
      radius: lords.wildfire ? 28 : 22,
      cutDps: lords.wildfire ? 10 : 6,
      cutSlow: 1,
    });
  }
  if (tribe === "cold" && (sets.cold ?? 0) >= 2) {
    if (!e.iced) {
      e.iced = true;
      e.freezeT = Math.max(e.freezeT, lords.icebox ? 0.55 : 0.3);
    }
    if ((sets.cold ?? 0) >= 4 || lords.icebox) {
      dropPatch(w, e.x, e.y, "ice", {
        radius: lords.icebox ? 30 : 22,
        cutDps: 0,
        cutSlow: lords.icebox ? 0.48 : 0.58,
      });
    }
  }
}

function firstInRange(w, x, y, stats, aim) {
  let best = -1;
  let bestP = -1;
  for (let i = 0; i < w.enemies.length; i++) {
    const e = w.enemies[i];
    if (!e.alive) continue;
    if (!inCover(stats.cover, x, y, e.x, e.y, stats.range, aim, stats.coverInner, stats.coverArc)) continue;
    const p = progress(e);
    if (p > bestP) {
      bestP = p;
      best = i;
    }
  }
  return best;
}

function fireAt(w, fromX, fromY, targetIndex, dmg, stats) {
  const e = w.enemies[targetIndex];
  if (!e?.alive) return;
  w.shotsFired = (w.shotsFired ?? 0) + 1;
  if (stats.projectile === "spark") {
    chainHit(w, fromX, fromY, targetIndex, dmg, stats.chain ?? 1, stats);
    return;
  }
  if (stats.projectile === "none") return;
  applyHitFx(w, e, stats);
  if (stats.splash && stats.splash > 0) {
    const r2 = stats.splash * stats.splash;
    let hit = 0;
    for (const o of w.enemies) {
      if (!o.alive) continue;
      if (dist2(e.x, e.y, o.x, o.y) <= r2) {
        hit += 1;
        applyHitFx(w, o, stats);
        applyDamage(w, o, dmg);
      }
    }
    if (hit >= 2) noteWave(w, stats.role || "crater", "splash");
  } else applyDamage(w, e, dmg);
  if ((stats.chain ?? 0) > 0) {
    let next = -1;
    let best = 22500;
    for (let i = 0; i < w.enemies.length; i++) {
      if (i === targetIndex) continue;
      const o = w.enemies[i];
      if (!o.alive) continue;
      const dd = dist2(e.x, e.y, o.x, o.y);
      if (dd < best) {
        best = dd;
        next = i;
      }
    }
    if (next >= 0) chainHit(w, e.x, e.y, next, dmg * 0.7, stats.chain ?? 1, stats);
  }
  const p = allocProj(w);
  p.alive = true;
  p.x = fromX;
  p.y = fromY - 22;
  p.ox = fromX;
  p.oy = fromY - 22;
  p.tx = e.x;
  p.ty = e.y;
  p.target = targetIndex;
  p.dmg = 0;
  p.splash = 0;
  p.slowT = 0;
  p.slowMul = 1;
  p.shred = 0;
  p.mark = false;
  p.kind = stats.projectile;
  p.style = stats.role || "";
  p.speed =
    stats.role === "brand" ? 340 : stats.projectile === "ember" ? 320 : stats.projectile === "frost" ? 460 : 640;
  p.ttl = 0.9;
  p.chainLeft = 0;
}

function chainHit(w, x, y, start, dmg, hops, stats) {
  const hit = new Set();
  let idx = start;
  let cx = x;
  let cy = y;
  let d = dmg;
  const poles = voltPoles(w);
  for (let h = 0; h < hops; h++) {
    const e = w.enemies[idx];
    if (!e?.alive) break;
    addFx(w, { kind: "beam", x: cx, y: cy, x2: e.x, y2: e.y, life: 0.14, color: "#7c6cf0", size: 2 });
    motes(w, e.x, e.y, 1, "#9b6cff", 36, 0.2);
    applyDamage(w, e, d);
    if (h > 0 && stats?.role) noteWave(w, stats.role, "chain");
    if (stats) applyHitFx(w, e, stats);
    if (e.alive) e.flash = 0.16;
    hit.add(idx);
    cx = e.x;
    cy = e.y;
    d *= 0.7;
    let next = -1;
    let best = poles.length ? 320 * 320 : 19600;
    let via = null;
    for (let i = 0; i < w.enemies.length; i++) {
      if (hit.has(i)) continue;
      const o = w.enemies[i];
      if (!o.alive) continue;
      let score = dist2(cx, cy, o.x, o.y);
      let pole = null;
      for (const p of poles) {
        const hop = dist2(cx, cy, p.x, p.y) + dist2(p.x, p.y, o.x, o.y);
        if (hop * 0.5 < score) {
          score = hop * 0.5;
          pole = p;
        }
      }
      if (score < best) {
        best = score;
        next = i;
        via = pole;
      }
    }
    if (next < 0) break;
    if (via) {
      addFx(w, { kind: "beam", x: cx, y: cy, x2: via.x, y2: via.y, life: 0.1, color: "#7c6cf0", size: 2 });
      cx = via.x;
      cy = via.y;
    }
    idx = next;
  }
}

function voltPoles(w) {
  const sets = liveSets(w);
  const lords = lordFlags(w.companions, sets, climbFx(w.climb).lordLimp);
  if (!lords.liveRail) return [];
  const pts = [];
  for (const item of placedGuns(w)) {
    if (item.card.set !== "spark") continue;
    const pos = towerPoint(item);
    if (pos) pts.push(pos);
  }
  for (const c of w.companions ?? []) {
    if (c.placedPad !== SKY_PAD || c.home) continue;
    if ((c.card.templateId ?? c.card.id) === "comp-joule") pts.push({ x: c.x, y: c.y });
  }
  return pts;
}

function impact(w, p) {
  p.alive = false;
  const apply = (e, amount) => {
    if (p.slowT) {
      e.slowT = Math.max(e.slowT, p.slowT);
      e.slowMul = p.slowMul;
    }
    if (p.shred) e.shredT = Math.max(e.shredT, 2.4);
    if (p.mark) e.marked = true;
    applyDamage(w, e, amount);
  };
  const t = w.enemies[p.target];
  if (p.splash > 0) {
    const r2 = p.splash * p.splash;
    for (const e of w.enemies) {
      if (!e.alive) continue;
      if (dist2(p.x, p.y, e.x, e.y) <= r2) apply(e, p.dmg);
    }
    addFx(w, { kind: "ring", x: p.x, y: p.y, life: 0.28, color: "#c45c3e", size: p.splash });
  } else if (t?.alive) apply(t, p.dmg);
  const style = p.style || "";
  if (style === "crater" || p.kind === "ember") {
    if (!(p.splash > 0)) addFx(w, { kind: "ring", x: p.x, y: p.y, life: 0.26, color: "#ff5c2a", size: 74 });
    motes(w, p.x, p.y, 6, "#ff5c2a", 150, 0.26);
  } else if (style === "frost" || p.kind === "frost") {
    addFx(w, { kind: "ring", x: p.x, y: p.y, life: 0.28, color: PALETTE.frost, size: 18 });
    motes(w, p.x, p.y, 4, PALETTE.frost, 28, 0.5);
  } else if (style === "brand") {
    addFx(w, { kind: "spark", x: p.x, y: p.y, life: 0.12, color: "#eef3f7", size: 14 });
  } else if (p.kind === "hex") {
    addFx(w, { kind: "spark", x: p.x, y: p.y, life: 0.18, color: PALETTE.accent, size: 6 });
  } else addFx(w, { kind: "spark", x: p.x, y: p.y, life: 0.16, color: "#f0f1f4", size: 5 });
}

function stepProjectiles(w, dt) {
  for (const p of w.projectiles) {
    if (!p.alive) continue;
    p.ttl -= dt;
    const t = w.enemies[p.target];
    if (t?.alive) {
      p.tx = t.x;
      p.ty = t.y;
    }
    const dx = p.tx - p.x;
    const dy = p.ty - p.y;
    const d = Math.hypot(dx, dy) || 1;
    const step = p.speed * dt;
    if (d <= step + 8 || p.ttl <= 0) {
      p.x = p.tx;
      p.y = p.ty;
      impact(w, p);
    } else {
      p.x += (dx / d) * step;
      p.y += (dy / d) * step;
    }
  }
}

function placedGuns(w) {
  return w.roster.filter((r) => r.placedPad && (r.card.kind === "tower" || r.card.kind === "defender"));
}

function sharedCurrentRange(w, sets) {
  if ((sets.iron ?? 0) < 2) return 0;
  let maxR = 0;
  for (const item of placedGuns(w)) {
    if (item.card.set !== "iron") continue;
    const stats = itemStats(w, item, sets);
    if (stats) maxR = Math.max(maxR, stats.range);
  }
  return maxR;
}

function withSocket(stats, sock) {
  if (!stats || !sock?.socket) return stats;
  const s = { ...stats };
  if (sock.socket.rangeMul) s.range *= sock.socket.rangeMul;
  if (sock.socket.rateMul) s.rate *= sock.socket.rateMul;
  if (sock.socket.splash) s.splash = Math.max(s.splash ?? 0, sock.socket.splash);
  return s;
}

function eachInCover(w, pos, stats, aim, fn) {
  for (const e of w.enemies) {
    if (!e.alive) continue;
    if (!inCover(stats.cover, pos.x, pos.y, e.x, e.y, stats.range, aim, stats.coverInner, stats.coverArc)) continue;
    fn(e);
  }
}

function tickGunGlow(w, item, stats, pos, dt, hot) {
  if (item.placedPad === HOME_PAD) return;
  const glow = hullGlow(stats.role);
  const dish = isGlowHull(stats.role, stats.projectile);
  const chipAura = stats.auraDps ?? 0;
  const chipHeal = stats.healAura ?? 0;
  if (!dish && !chipAura && !chipHeal && !glowHasFx(glow) && !stats.lure) return;

  item.glowCd = (item.glowCd ?? 0) - dt;
  if (item.glowCd > 0) return;
  item.glowCd = PARAMS.glowTick;

  const home = item.placedPad === HOME_PAD;
  const range = glowRadius(stats.range, stats.role, stats.projectile) * (home && dish ? 1.12 : 1);
  const oc = hot ? PARAMS.overclockMul * (hasSig(w.signals, "sig-slam") ? 1.55 : 1) : 1;
  const lv = gunLevelMul(item.level || 1);
  const dps = dish
    ? chipAura * oc
    : ((glow.auraDps ?? 0) * lv.dmg + chipAura) * oc;
  const heal = ((glow.healAura ?? 0) + chipHeal) * oc;
  const puddle = dish
    ? stats
    : {
        burnDps: glow.burnDps ? glow.burnDps * lv.dmg * oc : undefined,
        slowMul: glow.slowMul,
        slowT: glow.slowT,
        shred: glow.shred,
        markGold: glow.markGold,
      };

  if (dish) w.shotsFired = (w.shotsFired ?? 0) + 1;

  for (const e of w.enemies) {
    if (!e.alive) continue;
    if (dist2(pos.x, pos.y, e.x, e.y) > range * range) continue;
    applyHitFx(w, e, puddle);
    if (dps) {
      const cap = PATH_ALONG[e.route] ?? 1;
      const late = (e.along ?? 0) / cap > 0.7;
      const amp = (home && dish ? 1.28 : 1) * (home && dish && late ? 1.22 : 1);
      applyDamage(w, e, dps * PARAMS.glowTick * amp, true);
      e.flash = 0.08;
    }
    if (dish && stats.lure) {
      let best = null;
      let bd = 280;
      for (const c of skyCrafts(w)) {
        if (c.home) continue;
        const d = Math.hypot(c.x - e.x, c.y - e.y);
        if (d < bd) {
          bd = d;
          best = c;
        }
      }
      if (best && bd > 8) {
        const k = (stats.lure ?? 0) * 0.018;
        e.x += ((best.x - e.x) / bd) * k;
        e.y += ((best.y - e.y) / bd) * k;
      }
    }
  }

  if (dish && stats.lure) {
    addFx(w, { kind: "ring", x: pos.x, y: pos.y, life: 0.28, color: "#9aa3b2", size: 34 });
  }

  if (heal) {
    for (const c of skyCrafts(w)) {
      if (c.home) continue;
      if (Math.hypot(c.x - pos.x, c.y - pos.y) <= range) {
        c.hp = Math.min(c.hpMax, c.hp + heal * PARAMS.glowTick);
        addFx(w, { kind: "ring", x: c.x, y: c.y, life: 0.22, color: "#3ecf7a", size: 18 });
      }
    }
  }
}

function stepTowers(w, dt) {
  const sets = liveSets(w);
  const shared = sharedCurrentRange(w, sets);
  const lords = lordFlags(w.companions, sets, climbFx(w.climb).lordLimp);
  for (const item of placedGuns(w)) {
    const card = item.card;
    let stats = itemStats(w, item, sets);
    const pos = towerPoint(item);
    if (!stats || !pos) continue;
    if (shared && card.set === "iron") stats.range = Math.max(stats.range, shared);
    if (shared && lords.names.iron && card.kind === "defender") stats.range = Math.max(stats.range, shared);
    const sock = socketOnPad(w, item.placedPad);
    stats = withSocket(stats, sock?.card);
    stats.range *= padReachMul(item.placedPad);
    stats.rate *= padRateMul(item.placedPad);
    const moonBurn = padBurnBonus(item.placedPad);
    if (moonBurn) stats.burnDps = (stats.burnDps ?? 0) + moonBurn;
    if (item.placedPad !== HOME_PAD && (stats.cover === "cone" || stats.cover === "lane")) {
      const face = aimForPad(item, pos);
      const seed = (item.uid.charCodeAt(0) || 1) * 0.37;
      item.aim = face + Math.sin(w.visT * 0.85 + seed) * 0.5;
    }
    item.cd -= dt;
    item.overclockT = Math.max(0, (item.overclockT ?? 0) - dt);
    if ((item.ultT ?? 0) > 0) item.ultT -= dt;
    const hot = (item.overclockT ?? 0) > 0;
    if (hot && !item.overclockLit) {
      item.overclockLit = true;
      slamGun(w, item, 1.2);
    }
    if (!hot) item.overclockLit = false;
    if (item.trick === "lip") {
      for (const e of w.enemies) {
        if (!e.alive) continue;
        if (dist2(pos.x, pos.y, e.x, e.y) > 54 * 54) continue;
        e.slowT = Math.max(e.slowT ?? 0, 0.4);
        e.slowMul = Math.min(e.slowMul || 1, 0.7);
      }
    }
    tickGunGlow(w, item, stats, pos, dt, hot);
    if (stats.projectile === "none") continue;
    if (item.cd > 0) continue;
    const idx = firstInRange(w, pos.x, pos.y, stats, item.aim ?? 0);
    if (idx < 0) continue;
    const home = item.placedPad === HOME_PAD;
    let halo = 0;
    for (const c of skyCrafts(w)) {
      if (c.home) continue;
      halo = Math.max(halo, companionFx(c.card, c.kits).buffRate || 0);
    }
    const buff = item.placedPad && w.padBuff?.[item.placedPad] > 0 ? 1 + (halo || 0.22) : 1;
    const oc = hot ? PARAMS.overclockMul * (hasSig(w.signals, "sig-slam") ? 1.55 : 1) : 1;
    const rate = stats.rate * w.rateMul * charmRateMul(w) * (home ? 1.18 : 1) * buff * oc;
    item.cd = 1 / Math.max(0.2, rate);
    item.shots = (item.shots ?? 0) + (item.extraShot ? 2 : 1);
    const e = w.enemies[idx];
    if (item.trick === "wake" && e) {
      addFx(w, { kind: "beam", x: pos.x, y: pos.y - 14, x2: e.x, y2: e.y, life: 0.22, color: "#e8c15a", size: 3 });
      addFx(w, { kind: "ring", x: e.x, y: e.y, life: 0.3, color: "#eef3f7", size: 24 });
    }
    if (home && e) w.defenderAim = Math.atan2(e.y - pos.y, e.x - pos.x);
    const cap = PATH_ALONG[e?.route ?? 0] ?? 1;
    const late = e && (e.along ?? 0) / cap > 0.7;
    const dmg = stats.damage * (home ? 1.28 * climbFx(w.climb).coreDmg : 1) * (home && late ? 1.22 : 1) * oc;
    const role = stats.role;
    const aim = item.aim ?? 0;
    if (item.trick === "drones") dronePeck(w, pos, stats, dmg, item.aim ?? 0);
    if (stats.beam) {
      w.shotsFired = (w.shotsFired ?? 0) + 1;
      addFx(w, { kind: "beam", x: pos.x, y: pos.y - 18, x2: e.x, y2: e.y, life: 0.16, color: "#7ef0ea", size: 3 });
      applyHitFx(w, e, stats);
      applyDamage(w, e, dmg * 1.15, true);
      continue;
    }
    if (stats.nova || role === "pulse") {
      w.shotsFired = (w.shotsFired ?? 0) + 1;
      const r = stats.nova || 88;
      const r2 = r * r;
      for (const o of w.enemies) {
        if (!o.alive) continue;
        if (dist2(pos.x, pos.y, o.x, o.y) > r2) continue;
        applyHitFx(w, o, stats);
        applyDamage(w, o, dmg, true);
        if (stats.shock) knockEnemy(o, stats.shock);
      }
      addFx(w, { kind: "ring", x: pos.x, y: pos.y, life: 0.32, color: "#ff5c2a", size: r });
      continue;
    }
    if (stats.mines || role === "mine") {
      w.shotsFired = (w.shotsFired ?? 0) + 1;
      dropCut(
        w,
        e.x,
        e.y,
        { radius: 52, cutDps: Math.max(6, dmg * 0.5), cutSlow: stats.slowMul ?? 0.68 },
        true,
      );
      if (hasSig(w.signals, "sig-mine")) {
        dropCut(
          w,
          e.x + 18,
          e.y + 8,
          { radius: 44, cutDps: Math.max(5, dmg * 0.42), cutSlow: stats.slowMul ?? 0.72 },
          true,
        );
      }
      applyDamage(w, e, dmg * 0.55, true);
      addFx(w, { kind: "ring", x: e.x, y: e.y, life: 0.2, color: "#c5ccd3", size: 28 });
      continue;
    }
    if (stats.knock || role === "hook") {
      knockEnemy(e, stats.knock || 62);
      applyHitFx(w, e, stats);
      applyDamage(w, e, dmg, true);
      addFx(w, { kind: "beam", x: pos.x, y: pos.y - 12, x2: e.x, y2: e.y, life: 0.18, color: "#c5ccd3", size: 2 });
      continue;
    }
    if (role === "orbit") {
      w.shotsFired = (w.shotsFired ?? 0) + 1;
      const shown = [];
      eachInCover(w, pos, stats, aim, (o) => {
        applyHitFx(w, o, stats);
        applyDamage(w, o, dmg * 0.42, true);
        if (shown.length < 2) shown.push(o);
      });
      for (const o of shown) {
        const ang = Math.atan2(o.y - pos.y, o.x - pos.x);
        addFx(w, { kind: "beam", x: pos.x, y: pos.y - 10, x2: o.x, y2: o.y, life: 0.16, color: "#c4b8ff", size: 2 });
        motes(w, o.x, o.y, 2, "#c4b8ff", 90, 0.18, ang);
      }
      if (!shown.length) addFx(w, { kind: "ring", x: pos.x, y: pos.y - 8, life: 0.22, color: "#9b6cff", size: 28 });
      continue;
    }
    if (role === "spear") {
      w.shotsFired = (w.shotsFired ?? 0) + 1;
      let n = 0;
      eachInCover(w, pos, stats, aim, (o) => {
        if (n >= 3) return;
        applyHitFx(w, o, stats);
        applyDamage(w, o, dmg * (n === 0 ? 1 : 0.7), true);
        const ang = Math.atan2(o.y - (pos.y - 16), o.x - pos.x);
        addFx(w, { kind: "beam", x: pos.x, y: pos.y - 16, x2: o.x, y2: o.y, life: 0.16, color: "#eef3f7", size: 2 });
        motes(w, o.x, o.y, 3, "#eef3f7", 160, 0.2, ang);
        n += 1;
      });
      continue;
    }
    if (role === "sweep") {
      w.shotsFired = (w.shotsFired ?? 0) + 1;
      eachInCover(w, pos, stats, aim, (o) => {
        applyHitFx(w, o, stats);
        applyDamage(w, o, dmg * 0.58, true);
        addFx(w, { kind: "spark", x: o.x, y: o.y, life: 0.14, color: "#eef3f7", size: 8 });
        motes(w, o.x, o.y, 2, "#c5ccd3", 50, 0.16);
      });
      addFx(w, { kind: "ring", x: pos.x, y: pos.y - 10, life: 0.2, color: "#c5ccd3", size: 46 });
      continue;
    }
    if (role === "rail") {
      w.shotsFired = (w.shotsFired ?? 0) + 1;
      eachInCover(w, pos, stats, aim, (o) => {
        applyHitFx(w, o, stats);
        applyDamage(w, o, dmg * 0.72, true);
      });
      const ang = Math.atan2(e.y - pos.y, e.x - pos.x);
      addFx(w, { kind: "beam", x: pos.x, y: pos.y - 14, x2: e.x, y2: e.y, life: 0.16, color: "#7ef0ea", size: 2 });
      motes(w, e.x, e.y, 1, "#3ecf7a", 36, 0.32, ang);
      continue;
    }
    if (role === "frost") {
      fireAt(w, pos.x, pos.y, idx, dmg, stats);
      dropCut(w, e.x, e.y, { radius: 34, cutDps: 0, cutSlow: stats.slowMul ?? 0.5 }, false);
      continue;
    }
    if (role === "wall") {
      w.shotsFired = (w.shotsFired ?? 0) + 1;
      eachInCover(w, pos, stats, aim, (o) => {
        applyHitFx(w, o, stats);
        applyDamage(w, o, dmg * 0.65, true);
      });
      dropCut(w, e.x, e.y, { radius: 40, cutDps: 1, cutSlow: stats.slowMul ?? 0.58 }, false);
      addFx(w, { kind: "ring", x: e.x, y: e.y, life: 0.24, color: "#3cd6cc", size: 36 });
      continue;
    }
    if (role === "scour") {
      const bonus = e.shredT > 0 ? 1.45 : 1;
      fireAt(w, pos.x, pos.y, idx, dmg * bonus, stats);
      continue;
    }
    if (role === "brand") {
      fireAt(w, pos.x, pos.y, idx, dmg, stats);
      addFx(w, { kind: "float", x: e.x, y: e.y - 14, life: 0.5, text: "MARK", color: "#e8c15a", size: 10 });
      continue;
    }
    if ((stats.split ?? 0) > 1 && role !== "orbit") {
      fireAt(w, pos.x, pos.y, idx, dmg, stats);
      let extra = 0;
      for (let i = 0; i < w.enemies.length && extra < stats.split - 1; i++) {
        if (i === idx) continue;
        const o = w.enemies[i];
        if (!o.alive) continue;
        if (!inCover(stats.cover, pos.x, pos.y, o.x, o.y, stats.range, aim, stats.coverInner, stats.coverArc))
          continue;
        fireAt(w, pos.x, pos.y, i, dmg * 0.75, stats);
        extra += 1;
      }
      continue;
    }
    fireAt(w, pos.x, pos.y, idx, dmg, stats);
  }
}

function stepSockets(w, dt) {
  for (const r of w.roster) {
    if (r.card.kind !== "socket" || !r.placedPad) continue;
    const sock = r.card.socket;
    const pad = padById(r.placedPad);
    if (!sock || !pad) continue;
    const rad = sock.slowR ?? 0;
    if (rad <= 0) continue;
    const r2 = rad * rad;
    for (const e of w.enemies) {
      if (!e.alive) continue;
      if (dist2(pad.x, pad.y, e.x, e.y) > r2) continue;
      if (sock.slowMul) {
        e.slowT = Math.max(e.slowT, 0.4);
        e.slowMul = Math.min(e.slowMul, sock.slowMul);
      }
      if (sock.shred) e.shredT = Math.max(e.shredT, 0.5);
      if (sock.burnDps) applyDamage(w, e, sock.burnDps * dt, true);
    }
  }
}

function stepCharms(w, dt) {
  const rain = w.charms.find((c) => c.fireRain);
  const met = w.charms.find((c) => c.meteor);
  if (rain?.fireRain) {
    w.rainT += dt;
    if (w.rainT >= 0.85) {
      w.rainT = 0;
      for (const e of w.enemies) {
        if (!e.alive) continue;
        applyDamage(w, e, rain.fireRain, true);
      }
      addFx(w, { kind: "ring", x: BASE.x - 200, y: 200, life: 0.3, color: "#ff5c2a", size: 80 });
    }
  }
  if (met?.meteor) {
    w.meteorT += dt;
    if (w.meteorT >= 1.35) {
      w.meteorT = 0;
      const live = w.enemies.filter((e) => e.alive);
      if (live.length) {
        const t = live[Math.floor(Math.random() * live.length)];
        addFx(w, { kind: "ring", x: t.x, y: t.y, life: 0.4, color: "#e8c15a", size: 70 });
        for (const e of w.enemies) {
          if (!e.alive) continue;
          if (dist2(t.x, t.y, e.x, e.y) <= 6084) applyDamage(w, e, met.meteor);
        }
      }
    }
  }
}

function tickCharms(w) {
  w.charms = w.charms.map((c) => ({ ...c, rounds: c.rounds - 1 })).filter((c) => c.rounds > 0);
}

export function buyCharm(w, id) {
  if (w.phase !== "merchant") return false;
  const n = CHARMS.find((c) => c.id === id);
  if (!n || !canAfford(w.gems, n.cost)) return false;
  w.gems = payGems(w.gems, n.cost);
  const r = w.charms.find((c) => c.id === n.id);
  if (r) r.rounds += n.rounds;
  else
    w.charms.push({
      id: n.id,
      name: n.name,
      rounds: n.rounds,
      rateMul: n.rateMul,
      pointMul: n.pointMul,
      gemMul: n.gemMul,
      slowMul: n.slowMul,
      fireRain: n.fireRain,
      meteor: n.meteor,
    });
  w.message = `${n.name} armed · ${n.rounds} rounds`;
  w.uiDirty = true;
  return true;
}

export function leaveMerchant(w) {
  if (w.phase === "merchant") {
    w.pendingMerchant = false;
    afterShop(w);
  }
}

function noteWave(w, role, key) {
  if (!role) return;
  if (!w.waveNotes) w.waveNotes = {};
  const row = w.waveNotes[role] ?? { kills: 0, froze: 0, splash: 0, chain: 0 };
  row[key] += 1;
  w.waveNotes[role] = row;
}

const WAVE_NAME = {
  spear: "Lance",
  crater: "Crater",
  frost: "Halo",
  rail: "Rail",
  umbra: "Well",
  cascade: "Ion",
  sweep: "Corona",
  brand: "Beacon",
  mine: "Mine",
  orbit: "Helix",
};

function waveBit(role, row) {
  const name = WAVE_NAME[role] ?? role;
  if (role === "frost" && row.froze > 0) return { n: row.froze, text: `${name} froze ${row.froze}` };
  if (role === "crater" && row.splash > 0) {
    return { n: row.splash + row.kills, text: row.splash > 1 ? `${name} popped ${row.splash} piles` : `${name} popped the pile` };
  }
  if (role === "cascade" && row.chain > 0) return { n: row.chain, text: `${name} jumped ${row.chain}` };
  if (role === "spear" && row.kills > 0) return { n: row.kills, text: `${name} cut ${row.kills}` };
  if (role === "rail" && row.kills > 0) return { n: row.kills, text: `${name} lined ${row.kills}` };
  if (role === "sweep" && row.kills > 0) return { n: row.kills, text: `${name} swept ${row.kills}` };
  if (row.kills > 0) return { n: row.kills, text: `${name} got ${row.kills}` };
  return null;
}

function waveLine(w) {
  const bits = [];
  for (const [role, row] of Object.entries(w.waveNotes ?? {})) {
    const bit = waveBit(role, row);
    if (bit) bits.push(bit);
  }
  bits.sort((a, b) => b.n - a.n);
  return bits
    .slice(0, 2)
    .map((b) => b.text)
    .join(". ");
}

function sayWave(w) {
  const recap = waveLine(w);
  const credit = w.announce?.startsWith("+") ? w.announce : null;
  const line = [recap, credit].filter(Boolean).join(". ");
  if (!line) return;
  w.announce = line;
  w.announceT = 2.4;
  w.holdT = Math.max(w.holdT ?? 0, 2.2);
}

function queueWave(w) {
  w.spawnQ = [];
  w.waveT = 0;
  w.leaks = 0;
  w.kills = 0;
  w.goldWave = 0;
  w.waveNotes = {};
  w.waveActive = true;
  const t = waveAt(w.wave);
  const n = w.wave % PATHS.length;
  let r = 0;
  for (const i of t.groups) {
    for (let k = 0; k < i.count; k++) {
      const a =
        i.type === "colossus" || i.type === "titan" || (i.type === "striker" && k % 5 === 0) ? n : r % PATHS.length;
      w.spawnQ.push({ at: i.delay + k * i.interval, type: i.type, route: a });
      r += 1;
    }
  }
  w.spawnQ.sort((a, b) => a.at - b.at);
}

function rankNeed(w) {
  let n = xpToNext(w.runLevel);
  if (w.vaultWarm && w.runLevel === START_LEVEL) n = Math.round(n * 0.9);
  return n;
}

function grantXp(w, t, quiet = false) {
  if (t <= 0) return 0;
  const add = Math.round(t * (w.stampXp || 1));
  w.xp += add;
  w.roundXp = (w.roundXp ?? 0) + add;
  let r = 0;
  while (w.xp >= rankNeed(w)) {
    w.xp -= rankNeed(w);
    w.runLevel += 1;
    r += 1;
  }
  if (r) {
    const pay = r * BONUS_CREDIT;
    w.points += pay;
    w.pendingLevels = 0;
    w.bonusSay = `+${pay} Credit`;
    w.bonusSayT = 4;
    if (!quiet) {
      w.announce = `+${pay} Credit`;
      w.announceT = 1.6;
    }
  }
  if (add > 0) tutorialAdvance(w, 5);
  w.uiDirty = true;
  return r;
}

function luckOf(w) {
  return w.draftBump + levelDraftBump(w.runLevel) + (w.stampLuck || 0) + (w.hangarLuck || 0) + climbFx(w.climb).luck;
}

export function startWave(w) {
  if (w.phase !== "placement") return;
  if (!fieldedTowers(w).length) return;
  w.phase = "combat";
  tutorialAdvance(w, 4);
  w.selectedCard = null;
  w.paused = false;
  w.pickPause = false;
  w.holdT = 0;
  w.hitstop = 0;
  if (w.wave % WAVES_PER_ROUND === 0) {
    w.roundKills = 0;
    w.roundLeaks = 0;
    w.roundGold = 0;
    w.roundTime = 0;
    w.roundXp = 0;
    for (const c of w.companions ?? []) {
      c.roundKills = 0;
      c.roundDmg = 0;
      c.roundSaves = 0;
      c.roundSpecials = 0;
      c.roundHeals = 0;
      c.roundHome = 0;
    }
  }
  queueWave(w);
  w.uiDirty = true;
}

function finishWave(w) {
  w.waveActive = false;
  tutorialAdvance(w, 7);
  w.nextWaveDmg = 1;
  w.wavesCleared = (w.wavesCleared ?? 0) + 1;
  w.roundKills += w.kills;
  w.roundLeaks += w.leaks;
  w.roundGold += w.goldWave;
  w.roundTime += w.waveT;
  if (w.gunKills && Object.keys(w.gunKills).length) {
    noteGunKills(w.gunKills);
    w.gunKills = {};
  }
  const t = w.wave % WAVES_PER_ROUND === WAVES_PER_ROUND - 1;
  const n = WAVE_XP + (waveAt(w.wave).mega ? MEGA_XP : 0);
  if (!t) {
    w.wave += 1;
    w.holdT = 1.35;
    grantXp(w, n);
    sayWave(w);
    if (!w.announce) {
      w.announce = `Wave ${w.wave + 1}`;
      w.announceT = 1.1;
    }
    w.uiDirty = true;
    return;
  }
  if ((w.roundLeaks ?? 0) === 0) noteLeakless();
  const r = Math.max(8, w.roundKills + w.roundLeaks);
  const i = gradeWave({
    leaks: w.roundLeaks,
    kills: w.roundKills,
    gold: w.roundGold,
    duration: w.roundTime,
    expected: expectedWaveTime(r, 56) * WAVES_PER_ROUND,
  });
  i.odds = oddsForGrade(i.grade, luckOf(w));
  w.grade = i;
  w.lastGrade = i.grade;
  i.flux = bankFlux(w, fluxFromRound(i.grade, w.roundKills, w.roundLeaks));
  grantXp(w, n, true);
  grantXp(w, GRADE_XP[i.grade], true);
  payoutBond(w, i.grade);
  tickCraftLevels(w);
  w.pendingEngrave = false;
  w.pendingStamp = false;
  w.pendingMerchant = false;
  tickCharms(w);
  sayWave(w);
  if (w.tutorialPendingGate) {
    w.tutorialDoneReady = true;
    w.tutorialPendingGate = false;
  }
  if ((w.wavesCleared ?? 0) >= WIN_WAVES && !w.endless) {
    beginLoopGate(w);
    return;
  }
  w.wave += 1;
  w.grade = null;
  w.holdT = 1.35;
  w.phase = "combat";
  audio.play("grade");
  checkpoint(w);
  w.uiDirty = true;
}

export function stepWorld(w, dt) {
  unstickWorld(w);
  w.visT += dt;
  if ((w.flashT ?? 0) > 0) w.flashT = Math.max(0, w.flashT - dt);
  for (const r of w.roster ?? []) {
    if (r.levelPop) r.levelPop = Math.max(0, r.levelPop - dt * 0.72);
  }
  for (const c of w.companions ?? []) {
    if (c.levelPop) c.levelPop = Math.max(0, c.levelPop - dt * 0.72);
  }
  if (w.announceT > 0) {
    w.announceT -= dt;
    if (w.announceT <= 0) {
      w.announce = null;
      w.uiDirty = true;
    }
  }
  if ((w.bonusSayT ?? 0) > 0) {
    w.bonusSayT -= dt;
    if (w.bonusSayT <= 0) {
      w.bonusSay = null;
      w.bonusSayT = 0;
      w.uiDirty = true;
    }
  }
  w.trauma = Math.max(0, w.trauma - dt * 1.8);
  for (const fx of w.fx) {
    fx.t += dt;
    if (fx.kind === "mote") {
      fx.x += (fx.vx || 0) * dt;
      fx.y += (fx.vy || 0) * dt;
    }
  }
  w.fx = w.fx.filter((f) => f.t < f.life);
  if (w.phase !== "combat" || w.paused) return;
  const frozen = w.hitstop > 0;
  if (frozen) {
    w.hitstop -= dt;
    return;
  }
  if (w.holdT > 0) {
    w.holdT -= dt;
    if (w.holdT <= 0) queueWave(w);
    return;
  }
  w.waveT += dt;
  while (w.spawnQ.length && w.spawnQ[0].at <= w.waveT) {
    const s = w.spawnQ.shift();
    spawnEnemy(w, s.type, s.route);
  }
  const envSlow = w.envSlowMul * charmSlowMul(w) * (w.mapSlowMul ?? 1);
  const folders = foldingGuns(w);
  for (const e of w.enemies) {
    if (!e.alive) continue;
    e.anim += dt * (e.type === "dart" || e.type === "striker" ? 10 : 6);
    if (e.slowT > 0) e.slowT -= dt;
    if (e.shredT > 0) e.shredT -= dt;
    if (e.flash > 0) e.flash -= dt;
    if (w.envPoisonDps > 0) applyDamage(w, e, w.envPoisonDps * dt, true);
    if (w.envChipDps > 0) applyDamage(w, e, w.envChipDps * dt, true);
    if ((w.mapBurn ?? 0) > 0) applyDamage(w, e, w.mapBurn * dt, true);
    if (e.poisonT > 0) {
      e.poisonT -= dt;
      applyDamage(w, e, e.poisonDps * dt, true);
    }
    if (e.burnT > 0) {
      e.burnT -= dt;
      applyDamage(w, e, e.burnDps * dt, true);
    }
    const fold = foldAt(folders, e);
    moveEnemy(w, e, dt, envSlow, fold);
    if (e.type === "medic") {
      for (const o of w.enemies) {
        if (!o.alive || o === e) continue;
        if (Math.hypot(o.x - e.x, o.y - e.y) < 78) {
          o.hp = Math.min(o.maxHp, o.hp + 26 * dt);
        }
      }
    }
    if ((e.along ?? 0) >= (PATH_ALONG[e.route] ?? 1) - 4) leakEnemy(w, e);
  }
  stepCompanion(w, dt);
  tickPadCare(w, dt);
  if (!frozen) {
    stepBores(w, dt);
    stepNades(w, dt);
    stepSockets(w, dt);
    stepCharms(w, dt);
    stepTowers(w, dt);
    stepProjectiles(w, dt);
  }
  if (!w.enemies.some((e) => e.alive) && w.spawnQ.length === 0 && w.waveActive) {
    finishWave(w);
  }
}

function applyRelic(w, card) {
  const r = card.relic;
  if (!r) return;
  if (r.gold) bankFlux(w, Math.max(1, fluxFromBank(r.gold)));
  if (r.lives) {
    w.lives += r.lives;
    w.maxLives += r.lives;
  }
  if (r.rateMul) w.rateMul += r.rateMul;
  if (r.draftBump) w.draftBump += r.draftBump;
  if (r.nextWaveDmg) w.nextWaveDmg += r.nextWaveDmg;
  if (r.killGold) w.killGoldMul += r.killGold;
  w.relics.push("templateId" in card ? card.templateId : card.id);
}

function applyEnv(w, card) {
  w.environment = card;
  w.environmentId = card.templateId;
  const e = card.env;
  w.envSlowMul = e?.slowMul ?? 1;
  w.envPoisonDps = e?.poisonDps ?? 0;
  w.envChipDps = e?.chipDps ?? 0;
  w.envShred = e?.shred ?? 0;
  w.envDmgAmp = 1 + (e?.dmgAmp ?? 0);
}

export function addToRoster(w, card) {
  if (card.kind === "environment") {
    applyEnv(w, card);
    w.message = `${card.name} covers the path.`;
    return true;
  }
  if (card.kind === "map") {
    applyMap(w, card);
    w.message = `${card.name} is the sector.`;
    return true;
  }
  if (card.kind === "companion") {
    const c = spawnCompanion(w, card);
    w.message = c.home ? `${card.name} waits by home.` : `${card.name} is in the air.`;
    return true;
  }
  if (card.kind === "sticker") {
    applySticker(w, card);
    w.message = `${card.name} stuck to home.`;
    return true;
  }
  if (card.kind === "kit") {
    return applyKit(w, card);
  }
  if (card.kind === "relic") {
    applyRelic(w, card);
    w.message = `${card.name} added.`;
    return true;
  }
  if (card.kind === "part") return false;
  if (card.kind === "stamp") return false;
  if (card.kind === "socket") {
    autoPlaceSocket(w, card);
    return true;
  }
  const isDef = card.kind === "defender";
  w.roster.push({
    uid: uid(w),
    card,
    placedPad: isDef ? HOME_PAD : null,
    level: 1,
    invested: 0,
    cd: 0,
    freePlace: true,
    mod: null,
    aim: isDef ? Math.PI : 0,
    tuneJob: null,
    tuneCap: null,
    jobs: [],
    jobSlots: PARAMS.jobSlotsStart,
    heatXp: 0,
    trick: null,
    trickOffer: [],
    specials: [],
    specialOffer: [],
  });
  return true;
}

function applyMap(w, card) {
  const m = card.map;
  if (!m) return;
  w.mapId = card.templateId ?? card.id;
  w.mapTheme = m.theme;
  w.mapLayout = layoutForMap(w.mapId);
  let jog = 0;
  for (const ch of w.mapId ?? "m") jog += ch.charCodeAt(0);
  setMapLayout(w.mapLayout, (jog % 5) - 2);
  w.mapSlowMul = m.slowMul ?? 1;
  w.mapRangeMul = m.rangeMul ?? 1;
  w.mapScrapMul = m.scrapMul ?? 1;
  w.mapPads = m.pads ?? 0;
  w.mapBurn = m.burn ?? 0;
  if (m.goldMul) {
    const prev = w.mapGoldMul || 1;
    w.killGoldMul = (w.killGoldMul / prev) * m.goldMul;
    w.mapGoldMul = m.goldMul;
  } else {
    const prev = w.mapGoldMul || 1;
    w.killGoldMul = w.killGoldMul / prev;
    w.mapGoldMul = 1;
  }
  if (w.mapId && !w.relics.includes(w.mapId)) w.relics.push(w.mapId);
}

function applySticker(w, card) {
  const s = card.sticker;
  w.stickers = [...(w.stickers ?? []), card];
  if (!s) return;
  if (s.gold) bankFlux(w, Math.max(1, fluxFromBank(s.gold)));
  if (s.lives) {
    w.lives += s.lives;
    w.maxLives += s.lives;
  }
  if (s.rateMul) w.rateMul += s.rateMul;
  if (s.draftBump) w.draftBump += s.draftBump;
  if (s.nextWaveDmg) w.nextWaveDmg += s.nextWaveDmg;
  if (s.killGold) w.killGoldMul += s.killGold;
  if (s.shred) w.envShred = Math.max(w.envShred, s.shred);
  if (s.chipDps) w.envChipDps += s.chipDps;
}

function skyCrafts(w) {
  return (w.companions ?? []).filter((c) => c.placedPad === SKY_PAD && !c.home);
}

const LIMP_HP = 0.35;
const LEAVE_HP = 0.82;
const CRIT_HP = 0.55;
const DOCK_HEAL = 24;
const BAY_R = 54;
const BAY_TAP = 100;

/** Orbiting Bay around Home. Biased left/up so the moon stays on the map. */
export const BAY_ORBIT = { ox: -40, oy: -28, rx: 94, ry: 52, r: 20 };

export function bayMoon(t = 0) {
  const a = t * 0.38;
  return {
    x: BASE.x + BAY_ORBIT.ox + Math.cos(a) * BAY_ORBIT.rx,
    y: BASE.y + BAY_ORBIT.oy + Math.sin(a) * BAY_ORBIT.ry,
    a,
  };
}

export function bayPoint(slot = 0, t = 0) {
  const moon = bayMoon(t);
  const a = moon.a - 0.7 + slot * 0.85;
  return {
    x: moon.x + Math.cos(a) * BAY_ORBIT.r,
    y: moon.y + Math.sin(a) * (BAY_ORBIT.r * 0.72),
  };
}

function homeSlot(w, c) {
  const home = skyCrafts(w).filter((x) => x.home);
  const i = home.findIndex((x) => x.uid === c.uid);
  return Math.max(0, i);
}

function dockHealRate(w, c) {
  let rate = DOCK_HEAL * climbFx(w.climb).healMul * (w.vaultHealMul || 1);
  if (hasSig(w.signals, "sig-dock")) rate *= 1.55;
  for (const k of c.kits ?? []) {
    if (k.kit?.healMul) rate *= k.kit.healMul;
  }
  for (const m of skyCrafts(w)) {
    if (m.uid === c.uid || m.home) continue;
    const fx = companionFx(m.card, m.kits);
    if (!fx.heal) continue;
    if (dist2(m.x, m.y, c.x, c.y) > fx.radius * fx.radius) continue;
    rate += fx.heal * 0.85;
  }
  return rate;
}

const PATCH_R = 64;
const PATCH_HURT = 0.8;

function patchColor(role: string | undefined) {
  if (role === "rail") return "#4aa8e8";
  if (role === "split") return "#e8c15a";
  if (role === "hook") return "#c5ccd3";
  if (role === "wall" || role === "frost") return "#3cd6cc";
  return "#3ecf7a";
}

function hurtSky(w) {
  return skyCrafts(w).filter((c) => !c.crit && c.hp / Math.max(1, c.hpMax) < PATCH_HURT);
}

function applyPatch(w, c, pct, pos, color: string, label = "patch") {
  const add = Math.max(1, Math.round(c.hpMax * pct));
  const before = c.hp;
  c.hp = Math.min(c.hpMax, c.hp + add);
  const got = Math.round(c.hp - before);
  if (got <= 0) return 0;
  addFx(w, { kind: "patch", x: c.x, y: c.y, life: 0.55, color, size: 22 });
  addFx(w, { kind: "beam", x: pos.x, y: pos.y - 18, x2: c.x, y2: c.y, life: 0.32, color, size: 3 });
  addFx(w, { kind: "float", x: c.x, y: c.y - 20, life: 0.85, text: label, color, size: 13 });
  addFx(w, { kind: "ring", x: pos.x, y: pos.y, life: 0.4, color, size: 28 });
  return got;
}

function tickPadCare(w, dt) {
  if (w.phase !== "combat") return;
  for (const item of placedGuns(w)) {
    if (item.placedPad === HOME_PAD) continue;
    const stats = item.card.stats;
    const pos = towerPoint(item);
    if (!stats || !pos) continue;
    item.patchCd = Math.max(0, (item.patchCd ?? 0) - dt);
    const color = patchColor(stats.role);
    if (stats.dockPatch && (item.patchCd ?? 0) <= 0) {
      const near = hurtSky(w)
        .map((c) => ({ c, d: Math.hypot(c.x - pos.x, c.y - pos.y) }))
        .filter((n) => n.d <= PATCH_R)
        .sort((a, b) => a.c.hp / a.c.hpMax - b.c.hp / b.c.hpMax);
      if (near.length) {
        const spec = stats.dockPatch;
        const two = spec.split && near.length >= 2;
        const take = two ? near.slice(0, 2) : near.slice(0, 1);
        const pct = two ? spec.pct * 0.64 : spec.pct;
        for (const n of take) {
          if (spec.yank) {
            const d = Math.max(1, n.d);
            n.c.x += ((pos.x - n.c.x) / d) * spec.yank;
            n.c.y += ((pos.y - n.c.y) / d) * spec.yank;
          }
          applyPatch(w, n.c, pct, pos, color);
        }
        item.patchCd = spec.rest;
      }
    }
    if (stats.healPulse) {
      item.pulseT = (item.pulseT ?? stats.healPulse.period) - dt;
      if (item.pulseT <= 0) {
        item.pulseT = stats.healPulse.period;
        const reach = stats.range * 0.42;
        const near = hurtSky(w).filter((c) => Math.hypot(c.x - pos.x, c.y - pos.y) <= reach);
        if (near.length) {
          addFx(w, { kind: "patch", x: pos.x, y: pos.y, life: 0.7, color, size: 46 });
          addFx(w, { kind: "ring", x: pos.x, y: pos.y, life: 0.55, color, size: 40 });
          for (const c of near) applyPatch(w, c, stats.healPulse.pct, pos, color, "pulse");
        }
      }
    }
  }
}

function autoPlaceSocket(w, card) {
  const used = new Set(
    w.roster.filter((r) => r.card.kind === "socket" && r.placedPad).map((r) => r.placedPad),
  );
  const free = PADS.filter((p) => !used.has(p.id));
  const merge = free.filter((p) => p.zone === "merge");
  const near = free.slice().sort((a, b) => dist2(a.x, a.y, BASE.x, BASE.y) - dist2(b.x, b.y, BASE.x, BASE.y));
  const pad = merge[0] || near[0];
  if (!pad) {
    w.message = `${card.name} — no free moon.`;
    return;
  }
  w.roster.push({
    uid: uid(w),
    card,
    placedPad: pad.id,
    level: 1,
    invested: 0,
    cd: 0,
    freePlace: false,
    mod: null,
    aim: 0,
  });
  const zone =
    pad.zone === "merge" ? "Merge — both lanes pass near here." : pad.zone === "orbit" ? "North lane." : "West lane.";
  w.message = `${card.name} dropped on a moon. ${zone}`;
  addFx(w, { kind: "ring", x: pad.x, y: pad.y, life: 0.35, color: "#3cd6cc", size: 28 });
}

function spawnCompanion(w, card) {
  const role = card.companion?.role ?? "hunter";
  const hpMax = Math.round(companionMaxHp(role) * climbFx(w.climb).hpMul);
  const flying = skyCrafts(w).length < MAX_COMPANIONS;
  const id = uid(w);
  const offset = skyCrafts(w).length;
  const c = {
    uid: id,
    card,
    x: BASE.x - 80 - offset * 28,
    y: BASE.y - 20 - offset * 10,
    hdg: Math.PI,
    cd: 0.4,
    tauntT: 1.2,
    bubble: null,
    bubbleT: 0,
    kits: [],
    bob: offset * 0.4,
    padI: 0,
    hp: hpMax,
    hpMax,
    specialCd: 2,
    commandX: 0,
    commandY: 0,
    commandT: 0,
    down: false,
    home: !flying,
    crit: false,
    healPulse: 0,
    placedPad: SKY_PAD,
    boostT: 0,
    roundKills: 0,
    roundDmg: 0,
    roundSaves: 0,
    roundSpecials: 0,
    roundHeals: 0,
    roundHome: 0,
    bound: false,
    mastery: 0,
    masteryRank: 0,
    runLevel: 1,
    runXp: 0,
    trick: null,
    trickOffer: [],
    specials: [],
    specialOffer: [],
    parts: [],
    partOffer: [],
    clone: false,
  };
  w.companions = [...(w.companions ?? []), c];
  w.roster.push({
    uid: id,
    card,
    placedPad: SKY_PAD,
    level: 1,
    invested: 0,
    cd: 0,
    freePlace: true,
    mod: null,
    aim: 0,
  });
  return c;
}

function applyBoundCraft(w, c) {
  const slot = activeProfile();
  const id = c.card.templateId ?? c.card.id;
  if (!slot.boundId || slot.boundId !== id) return;
  const fill = bondFill(slot.xp);
  const mul = bondMul(fill.level);
  c.bound = true;
  c.hpMax = Math.round(c.hpMax * mul.hp);
  c.hp = c.hpMax;
  w.boundId = id;
  w.bondLevel = fill.level;
  w.bondXp = slot.xp;
  if (mul.dps > 1) {
    c.kits.push({
      id: "bond-pip",
      name: "Main pip",
      kind: "kit",
      rarity: "common",
      art: id,
      set: null,
      cost: 0,
      blurb: "Your main got stronger.",
      kit: { dpsMul: mul.dps },
      templateId: "bond-pip",
      prefix: "",
      affixes: [],
      seed: fill.level,
    });
  }
  for (const job of bondKits(id, fill.level)) {
    c.kits.push(rollCard(job, job.rarity ?? "rare", fill.level, 0));
  }
}

function payoutBond(w, grade) {
  const c = (w.companions ?? []).find((n) => n.bound);
  if (!c) return 0;
  const beforeJobs = bondJobCount(w.bondLevel ?? 1);
  const beforeLooks = bondLookCount(w.bondLevel ?? 1);
  const n = xpFromCraft(c, grade);
  const next = addBondXp(n);
  const slot = next.slots[next.active] ?? activeProfile();
  const fill = bondFill(slot.xp);
  w.bondXp = slot.xp;
  w.bondLevel = fill.level;
  addFx(w, {
    kind: "float",
    x: c.x,
    y: c.y - 26,
    life: 1.05,
    text: `+${n} XP`,
    color: "#3d9bff",
    size: 13,
  });
  const afterJobs = bondJobCount(fill.level);
  if (afterJobs > beforeJobs) {
    const jobs = bondKits(c.card.templateId ?? c.card.id, fill.level);
    const learned = jobs[afterJobs - 1];
    if (learned) {
      addFx(w, {
        kind: "float",
        x: c.x,
        y: c.y - 44,
        life: 1.6,
        text: `${c.card.name} learned ${learned.name}.`,
        color: "#7ef0ea",
        size: 13,
      });
    }
  }
  const afterLooks = bondLookCount(fill.level);
  if (afterLooks > beforeLooks) {
    addFx(w, {
      kind: "float",
      x: c.x,
      y: c.y - (afterJobs > beforeJobs ? 62 : 44),
      life: 1.5,
      text: `${c.card.name} got a new look.`,
      color: "#e8c15a",
      size: 13,
    });
  }
  return n;
}

function tickCraftLevels(w) {
  for (const c of w.companions ?? []) {
    if (c.placedPad !== SKY_PAD) continue;
    const did =
      (c.roundKills ?? 0) +
        (c.roundDmg ?? 0) +
        (c.roundSaves ?? 0) +
        (c.roundHeals ?? 0) +
        (c.roundSpecials ?? 0) >
      0;
    if (!did) continue;
    tickCraftLevel(w, c);
  }
}

function tickCraftLevel(w, c) {
  if (!c) return;
  const cap = w.endless || w.playMode === "arcade" ? PARAMS.heatMaxEndless : PARAMS.craftLevelMax;
  c.runLevel = c.runLevel ?? 1;
  c.runXp = c.runXp ?? 0;
  if (c.runLevel >= cap) return;
  c.runXp += 1;
  const need = PARAMS.craftLevelNeed[Math.min(PARAMS.craftLevelNeed.length - 1, Math.max(0, (c.runLevel || 1) - 1))] ?? 3;
  if (c.runXp < need) return;
  c.runXp = 0;
  c.runLevel += 1;
  celebrateLevel(w, c.x, c.y, "#3cd6cc", c.runLevel, c.uid);
  w.uiDirty = true;
}

function noteHome(c) {
  if (!c.home) c.roundHome = (c.roundHome ?? 0) + 1;
}

function noteSave(w, c, n = 1) {
  c.roundSaves = (c.roundSaves ?? 0) + n;
  tickMastery(w, c, 2 * n);
}

function tickMastery(w, c, n) {
  if (!c || n <= 0) return;
  c.mastery = (c.mastery ?? 0) + n;
}

export function toggleCompanion(w, id) {
  const c = (w.companions ?? []).find((x) => x.uid === id);
  const r = w.roster.find((x) => x.uid === id);
  if (!c || !r) return false;
  if (c.placedPad === SKY_PAD) {
    if (c.bound) {
      w.message = `${c.card.name} is your main. It stays in the air.`;
      w.uiDirty = true;
      return false;
    }
    c.placedPad = null;
    r.placedPad = null;
    c.commandT = 0;
    c.home = false;
    w.message = `${c.card.name} on the bench.`;
  } else {
    if (skyCrafts(w).length >= MAX_COMPANIONS) {
      w.message = `Only ${MAX_COMPANIONS} crafts fly at once. Bench one first.`;
      w.uiDirty = true;
      return false;
    }
    c.placedPad = SKY_PAD;
    r.placedPad = SKY_PAD;
    c.x = BASE.x - 80;
    c.y = BASE.y - 20;
    c.home = false;
    c.down = false;
    if (c.hp < 1) c.hp = 1;
    w.message = `${c.card.name} launched.`;
  }
  w.uiDirty = true;
  return true;
}

export function sendCraftHome(w, id) {
  const c = (w.companions ?? []).find((x) => x.uid === id);
  if (!c || c.placedPad !== SKY_PAD) return false;
  if (c.home) {
    if (c.crit && c.hp / Math.max(1, c.hpMax) < CRIT_HP) {
      w.message = `${c.card.name} is still stitching. Wait.`;
      w.uiDirty = true;
      return false;
    }
    if (c.hp / Math.max(1, c.hpMax) < CRIT_HP) {
      w.message = `${c.card.name} isn't patched enough.`;
      w.uiDirty = true;
      return false;
    }
    c.home = false;
    c.crit = false;
    c.commandT = 0;
    c.bubble = "Back in.";
    c.bubbleT = 0.9;
    w.message = `${c.card.name} leaves the bay.`;
    w.uiDirty = true;
    return true;
  }
  noteHome(c);
  c.home = true;
  c.commandT = 0;
  c.bubble = "Heading home.";
  c.bubbleT = 1.3;
  w.message = `${c.card.name} called to the bay.`;
  w.uiDirty = true;
  addFx(w, { kind: "ring", x: c.x, y: c.y, life: 0.28, color: "#3ecf7a", size: 22 });
  return true;
}

export function commandCompanion(w, x, y, id) {
  const sky = skyCrafts(w);
  if (!sky.length) return false;
  const moon = bayMoon(w.visT);
  const bay = Math.hypot(x - moon.x, y - moon.y) < BAY_TAP || Math.hypot(x - BASE.x, y - BASE.y) < BAY_TAP;
  if (bay) {
    let c = id ? sky.find((n) => n.uid === id) : null;
    if (!c) {
      const flying = sky.filter((n) => !n.home);
      flying.sort((a, b) => a.hp / Math.max(1, a.hpMax) - b.hp / Math.max(1, b.hpMax));
      c = flying[0] || sky.find((n) => n.home) || sky[0];
    }
    if (!c) return false;
    return sendCraftHome(w, c.uid);
  }
  const flying = sky.filter((n) => !n.home);
  if (!flying.length) return false;
  let c = id ? flying.find((n) => n.uid === id) : null;
  if (!c) {
    let best = 1e9;
    for (const n of flying) {
      const d = dist2(n.x, n.y, x, y);
      if (d < best) {
        best = d;
        c = n;
      }
    }
  }
  if (!c) return false;
  c.commandX = x;
  c.commandY = y;
  c.commandT = 4.6;
  c.bubble = "On it.";
  c.bubbleT = 0.85;
  w.uiDirty = true;
  return true;
}

function hurtCompanion(w, c, amt) {
  if (!c || c.placedPad !== SKY_PAD || amt <= 0) return;
  if (c.home) return;
  c.hp -= amt;
  if (c.hp > 0) {
    if (!c.home && c.hp / c.hpMax < LIMP_HP) {
      noteHome(c);
      c.home = true;
      c.commandT = 0;
      c.bubble = "Heading home.";
      c.bubbleT = 1.4;
      w.message = `${c.card.name} limps back to the bay.`;
      w.uiDirty = true;
    }
    return;
  }
  c.hp = 1;
  noteHome(c);
  c.home = true;
  c.crit = true;
  c.commandT = 0;
  c.bubble = "Bay. Now.";
  c.bubbleT = 2.2;
  addFx(w, { kind: "ring", x: c.x, y: c.y, life: 0.4, color: "#e8c15a", size: 28 });
  w.message = `${c.card.name} is critical — stitching at the bay.`;
  w.uiDirty = true;
}

function applyKit(w, card) {
  const craftId = card.kit?.craftId;
  const all = w.companions ?? [];
  const target = craftId
    ? all.find((c) => (c.card.templateId ?? c.card.id) === craftId)
    : skyCrafts(w)[0] || all[0];
  if (!target) {
    w.message = `${card.name} needs that craft first. Pick a different one.`;
    return false;
  }
  const id = card.templateId ?? card.id;
  if (target.kits.some((k) => (k.templateId ?? k.id) === id)) {
    w.message = `${card.name} is already on ${target.card.name}. Pick a different one.`;
    return false;
  }
  target.kits = [...target.kits, card];
  const mul = card.kit?.hpMul ?? 1;
  if (mul > 1) {
    target.hpMax *= mul;
    target.hp = Math.min(target.hpMax, target.hp * mul);
  }
  w.message = `${card.name} on ${target.card.name}.`;
  return true;
}

function knockEnemy(e, dist) {
  e.knockHits = (e.knockHits ?? 0) + 1;
  const hits = e.knockHits;
  const fade = 1 / (1 + (hits - 1) * PARAMS.knockFade);
  const cap = PATH_ALONG[e.route] ?? 1;
  const floor = cap * PARAMS.knockFloor;
  e.along = Math.max(floor, (e.along ?? 0) - dist * fade);
  const s = sampleAlong(e.route, e.along);
  e.x = s.x;
  e.y = s.y;
  e.hdg = s.heading ?? e.hdg;
  e.flash = 0.12;
}

function stepOneCraft(w, c, dt) {
  if (c.hpMax == null) {
    const role0 = c.card.companion?.role ?? "hunter";
    c.hpMax = companionMaxHp(role0);
    c.hp = c.hp ?? c.hpMax;
    c.specialCd = c.specialCd ?? 2;
    c.commandT = c.commandT ?? 0;
    c.home = !!c.home;
    c.crit = !!c.crit;
    c.healPulse = c.healPulse ?? 0;
    c.down = false;
    c.boostT = c.boostT ?? 0;
    c.runLevel = c.runLevel ?? 1;
    c.runXp = c.runXp ?? 0;
    c.trick = c.trick ?? null;
    c.trickOffer = c.trickOffer ?? [];
    c.specials = c.specials ?? [];
    c.specialOffer = c.specialOffer ?? [];
    c.parts = c.parts ?? [];
    c.partOffer = c.partOffer ?? [];
  }
  if (partOfferWeak(c.partOffer)) {
    c.partOffer = refreshPartOffer("craft", c.uid, (c.parts ?? []).map((p) => p.id), c.runLevel || 1, c.partOffer);
    w.uiDirty = true;
  }
  c.bob += dt;
  c.boostT = Math.max(0, (c.boostT ?? 0) - dt);
  if (c.bubbleT > 0) {
    c.bubbleT -= dt;
    if (c.bubbleT <= 0) c.bubble = null;
  }
  if (c.placedPad !== SKY_PAD) return;
  const fx = companionFx(c.card, c.kits);
  if (c.trick === "catch") fx.intercept = Math.max(fx.intercept || 0, 36) * 1.45;
  if (c.trick === "hunt") fx.radius *= 1.12;
  if (c.trick === "trail") fx.burnDps = (fx.burnDps || 5) * 1.35;
  const lookLv = Math.min(4, c.runLevel || 1);
  const rungMul = lookLv >= 3 ? 1.12 : lookLv >= 2 ? 1.05 : 1;
  fx.dps *= rungMul;
  if (fx.burnDps) fx.burnDps *= rungMul;
  if (fx.cutDps) fx.cutDps *= rungMul;
  const roundHeat = craftRoundHeat(w);
  if (roundHeat > 1) {
    fx.dps *= roundHeat;
    if (fx.burnDps) fx.burnDps *= roundHeat;
    if (fx.cutDps) fx.cutDps *= roundHeat;
  }
  if ((c.boostT ?? 0) > 0) {
    fx.dps *= PARAMS.overclockMul;
    if (fx.burnDps) fx.burnDps *= PARAMS.overclockMul;
    if (fx.cutDps) fx.cutDps *= PARAMS.overclockMul;
  }
  const role = fx.role ?? "hunter";
  const spec = companionSpecialOf(role);
  if (!c.home && c.hp / Math.max(1, c.hpMax) < LIMP_HP) {
    noteHome(c);
    c.home = true;
    c.commandT = 0;
    c.bubble = "Heading home.";
    c.bubbleT = 1.2;
  }
  const bay = bayPoint(homeSlot(w, c), w.visT);
  let tx = BASE.x - 70;
  let ty = BASE.y - 24;
  let nearest = null;
  let best = 1e9;
  let hunt = null;
  let huntD = 1e9;
  for (const e of w.enemies) {
    if (!e.alive) continue;
    const d = dist2(c.x, c.y, e.x, e.y);
    if (d < best) {
      best = d;
      nearest = e;
    }
    if (!c.home && d < 256) hurtCompanion(w, c, 7 * dt);
    if (!c.home && (c.trick === "hunt" || inGunCover(w, e.x, e.y)) && d < huntD) {
      huntD = d;
      hunt = e;
    }
  }
  const prey = hunt || nearest;
  if (c.home) {
    tx = bay.x;
    ty = bay.y;
  } else if (c.commandT > 0) {
    c.commandT -= dt;
    tx = c.commandX;
    ty = c.commandY;
  } else if (role === "orb" || role === "rocket") {
    const pads = w.roster.filter((r) => r.placedPad && r.placedPad !== HOME_PAD && r.card.kind === "tower");
    if (pads.length) {
      c.padI = (c.padI ?? 0) % pads.length;
      const item = pads[c.padI];
      const pad = padById(item.placedPad);
      if (pad) {
        tx = pad.x;
        ty = pad.y - 18;
        if (Math.hypot(c.x - pad.x, c.y - pad.y) < 28) {
          w.padBuff[pad.id] = 2.4;
          c.padI = (c.padI + 1) % pads.length;
        }
      }
    }
  } else if (role === "medic") {
    let hurt = null;
    let hd = 1e9;
    for (const o of skyCrafts(w)) {
      if (o.uid === c.uid) continue;
      if (o.hp >= o.hpMax * 0.92 && !o.home) continue;
      const d = dist2(c.x, c.y, o.x, o.y);
      if (d < hd) {
        hd = d;
        hurt = o;
      }
    }
    if (hurt) {
      tx = hurt.x;
      ty = hurt.y;
    } else if (nearest) {
      tx = nearest.x;
      ty = nearest.y;
    }
  } else if (role === "borer") {
    if (nearest) {
      const meta = nearestPathMeta(nearest.x, nearest.y);
      tx = meta.px + Math.cos(meta.aim) * 40;
      ty = meta.py + Math.sin(meta.aim) * 40;
    } else {
      tx = BASE.x - 200;
      ty = BASE.y - 90;
    }
  }
  if (!c.home && c.commandT <= 0 && (role === "ship" || role === "rocket" || role === "jet" || role === "racer")) {
    let nade = null;
    let nd = 1e9;
    for (const n of w.nades) {
      if (!n.alive) continue;
      const d = dist2(c.x, c.y, n.x, n.y);
      if (d < nd) {
        nd = d;
        nade = n;
      }
    }
    if (nade) {
      tx = nade.x;
      ty = nade.y;
    } else if ((role === "ship" || role === "jet" || role === "racer") && prey) {
      tx = prey.x;
      ty = prey.y;
    }
  } else if (!c.home && c.commandT <= 0 && role !== "orb" && role !== "medic" && role !== "borer" && prey) {
    tx = prey.x;
    ty = prey.y;
  }
  const dx = tx - c.x;
  const dy = ty - c.y;
  const dist = Math.hypot(dx, dy) || 1;
  const want = Math.atan2(dy, dx);
  c.hdg = lerpAng(c.hdg, want, 1 - Math.exp(-4 * dt));
  const heat = (c.boostT ?? 0) > 0 ? PARAMS.overclockMul : 1;
  const glow = (c.runLevel || 1) >= 2 ? 1.08 : 1;
  const spd =
    (role === "jet" || role === "racer"
      ? 310
      : role === "rocket"
        ? 260
        : role === "puck"
          ? 250
          : role === "medic"
            ? 190
            : role === "orb"
              ? 160
              : role === "borer"
                ? 128
                : role === "spinner"
                  ? 195
                : role === "ufo"
                  ? 170
                  : role === "lens"
                    ? 150
                  : nearest || role === "ship"
                    ? 220
                    : 140) *
    heat *
    glow *
    (fx.speedMul || 1) *
    (hasSig(w.signals, "sig-fast") ? 1.22 : 1);
  const pull = dist < 12 ? 0.15 : Math.min(1, dist / 70);
  c.x += Math.cos(c.hdg) * spd * pull * dt;
  c.y += Math.sin(c.hdg) * spd * pull * dt + Math.sin(c.bob * 3.2) * 8 * dt;
  c.x = Math.max(24, Math.min(WORLD.w - 24, c.x));
  c.y = Math.max(24, Math.min(WORLD.h - 24, c.y));
  if (c.home) {
    if (dist < BAY_R) {
      const rate = dockHealRate(w, c);
      c.hp = Math.min(c.hpMax, c.hp + rate * dt);
      c.healPulse = (c.healPulse ?? 0) - dt;
      if (c.healPulse <= 0 && c.hp < c.hpMax) {
        c.healPulse = 0.48;
        addFx(w, {
          kind: "float",
          x: c.x + 4,
          y: c.y - 16,
          life: 0.7,
          text: `+${Math.max(1, Math.round(rate * 0.48))}`,
          color: "#3ecf7a",
          size: 12,
        });
      }
      if (c.crit && c.hp / c.hpMax >= CRIT_HP) c.crit = false;
      if (c.hp / c.hpMax >= LEAVE_HP) {
        c.home = false;
        c.crit = false;
        c.bubble = "Back in.";
        c.bubbleT = 0.9;
        addFx(w, { kind: "ring", x: c.x, y: c.y, life: 0.32, color: "#3ecf7a", size: 26 });
      }
    }
    return;
  }
  c.cd -= dt;
  c.tauntT -= dt;
  c.specialCd -= dt;
  if ((c.trick === "catch" || role === "ship" || role === "rocket" || role === "jet" || role === "racer" || role === "ufo") && fx.intercept > 0) {
    const r2 = fx.intercept * fx.intercept;
    for (const n of w.nades) {
      if (!n.alive) continue;
      if (dist2(c.x, c.y, n.x, n.y) > r2) continue;
      n.alive = false;
      noteSave(w, c);
      addFx(w, { kind: "ring", x: n.x, y: n.y, life: 0.28, color: "#ff5c2a", size: 18 });
      c.bubble = pickTaunt((c.card.seed ?? 1) + Math.floor(w.visT * 17), role);
      c.bubbleT = 1.4;
      c.tauntT = 1.1;
    }
  }
  if (c.trick === "trail") {
    const r2 = (fx.radius * 0.55) * (fx.radius * 0.55);
    for (const e of w.enemies) {
      if (!e.alive) continue;
      if (dist2(c.x, c.y, e.x, e.y) > r2) continue;
      e.burnT = Math.max(e.burnT ?? 0, 0.8);
      e.burnDps = Math.max(e.burnDps ?? 0, fx.burnDps || 6);
    }
  }
  if (c.specialCd <= 0) {
    c.specialCd = spec.period * (fx.specialPeriodMul || 1);
    c.roundSpecials = (c.roundSpecials ?? 0) + 1;
    tickMastery(w, c, 3);
    c.bubble = spec.name;
    c.bubbleT = 1.15;
    if (role === "medic") {
      const heal = fx.heal || 18;
      for (const o of skyCrafts(w)) {
        if (dist2(c.x, c.y, o.x, o.y) > fx.radius * fx.radius * 2.2) continue;
        const before = o.hp;
        o.hp = Math.min(o.hpMax, o.hp + heal);
        if (o.hp > before) {
          c.roundHeals = (c.roundHeals ?? 0) + (o.hp - before);
          addFx(w, {
            kind: "float",
            x: o.x,
            y: o.y - 18,
            life: 0.8,
            text: `+${Math.round(o.hp - before)}`,
            color: "#3ecf7a",
            size: 13,
          });
          addFx(w, {
            kind: "beam",
            x: c.x,
            y: c.y,
            x2: o.x,
            y2: o.y,
            life: 0.28,
            color: "#3ecf7a",
            size: 3,
          });
        }
        if (o.uid === c.uid) continue;
        if (!o.home && o.hp / o.hpMax < 0.5) {
          noteHome(o);
          o.home = true;
          o.commandT = 0;
          o.bubble = "Home. Now.";
          o.bubbleT = 1.2;
        } else if (o.home && !o.crit && o.hp / o.hpMax >= LEAVE_HP) {
          o.home = false;
        }
      }
      addFx(w, { kind: "ring", x: c.x, y: c.y, life: 0.4, color: "#3ecf7a", size: 44 });
    } else if (role === "borer") {
      dropCut(w, c.x, c.y, fx, true, c.uid);
      for (const e of w.enemies) {
        if (!e.alive) continue;
        if (dist2(c.x, c.y, e.x, e.y) > fx.radius * fx.radius * 2.2) continue;
        applyDamage(w, e, fx.dps * 2.1 + (fx.cutDps || 10) * 1.4, true, c.uid);
        e.slowT = Math.max(e.slowT, 1.4);
        e.slowMul = Math.min(e.slowMul || 1, fx.cutSlow || 0.55);
      }
      addFx(w, { kind: "ring", x: c.x, y: c.y, life: 0.45, color: "#9b6cff", size: 52 });
      addFx(w, { kind: "smoke", x: c.x, y: c.y, life: 0.5, color: "#c4a484", size: 22 });
    } else if (role === "puck") {
      const knock = fx.knock || 78;
      for (const e of w.enemies) {
        if (!e.alive) continue;
        if (dist2(c.x, c.y, e.x, e.y) > fx.radius * fx.radius * 1.6) continue;
        knockEnemy(e, knock);
        applyDamage(w, e, fx.dps * 1.2, true, c.uid);
      }
      addFx(w, { kind: "ring", x: c.x, y: c.y, life: 0.35, color: "#9aa3b2", size: 48 });
    } else if (role === "ufo") {
      const knock = fx.knock || 54;
      for (const e of w.enemies) {
        if (!e.alive) continue;
        if (dist2(c.x, c.y, e.x, e.y) > fx.radius * fx.radius * 1.8) continue;
        knockEnemy(e, knock);
        applyDamage(w, e, fx.dps * 1.6, true, c.uid);
        if (fx.slowMul) {
          e.slowT = Math.max(e.slowT, 1.2);
          e.slowMul = Math.min(e.slowMul || 1, fx.slowMul);
        }
      }
      addFx(w, { kind: "beam", x: c.x, y: c.y, x2: c.x, y2: c.y + 42, life: 0.4, color: PALETTE.sage, size: 4 });
      addFx(w, { kind: "ring", x: c.x, y: c.y, life: 0.4, color: "#ffc72c", size: 48 });
    } else if (role === "racer") {
      c.x += Math.cos(c.hdg) * 82;
      c.y += Math.sin(c.hdg) * 82;
      c.x = Math.max(24, Math.min(WORLD.w - 24, c.x));
      c.y = Math.max(24, Math.min(WORLD.h - 24, c.y));
      for (const e of w.enemies) {
        if (!e.alive) continue;
        if (dist2(c.x, c.y, e.x, e.y) > fx.radius * fx.radius * 2.2) continue;
        applyDamage(w, e, fx.dps * 2.3, true, c.uid);
        if (fx.shred) e.shredT = Math.max(e.shredT, 1.8);
      }
      for (const n of w.nades) {
        if (!n.alive) continue;
        if (dist2(c.x, c.y, n.x, n.y) > 90 * 90) continue;
        n.alive = false;
        noteSave(w, c);
      }
      addFx(w, { kind: "ring", x: c.x, y: c.y, life: 0.32, color: "#e31937", size: 50 });
    } else if (role === "hunter") {
      for (const e of w.enemies) {
        if (!e.alive) continue;
        if (dist2(c.x, c.y, e.x, e.y) > fx.radius * fx.radius * 1.8) continue;
        applyDamage(w, e, fx.dps * 1.9, true, c.uid);
        if (fx.burnDps) {
          e.burnT = Math.max(e.burnT, 1.6);
          e.burnDps = Math.max(e.burnDps, fx.burnDps);
        }
        if (fx.slowMul) {
          e.slowT = Math.max(e.slowT, 1.1);
          e.slowMul = Math.min(e.slowMul || 1, fx.slowMul);
          const ice = lordFlags(w.companions, liveSets(w), climbFx(w.climb).lordLimp).icebox;
          if (ice && !e.iced) {
            e.iced = true;
            e.freezeT = 0.55;
          }
        }
      }
      addFx(w, { kind: "ring", x: c.x, y: c.y, life: 0.35, color: fx.burnDps ? "#ff5c2a" : "#7c6cf0", size: fx.radius * 0.45 });
    } else if (role === "lens") {
      for (const n of w.nades) {
        if (!n.alive) continue;
        if (dist2(c.x, c.y, n.x, n.y) > fx.radius * fx.radius) continue;
        n.bent = true;
        let prey = null;
        let best = 1e9;
        for (const e of w.enemies) {
          if (!e.alive) continue;
          const dd = dist2(n.x, n.y, e.x, e.y);
          if (dd < best) {
            best = dd;
            prey = e;
          }
        }
        if (prey) {
          const dx = prey.x - n.x;
          const dy = prey.y - n.y;
          const mag = Math.hypot(dx, dy) || 1;
          n.vx = (dx / mag) * 140;
          n.vy = (dy / mag) * 140;
        }
      }
      addFx(w, { kind: "ring", x: c.x, y: c.y, life: 0.45, color: "#9b6cff", size: fx.radius * 0.7 });
    } else if (role === "ship") {
      const r2 = fx.intercept * 1.8 * (fx.intercept * 1.8);
      for (const n of w.nades) {
        if (!n.alive) continue;
        if (dist2(c.x, c.y, n.x, n.y) > r2) continue;
        n.alive = false;
        noteSave(w, c);
      }
      addFx(w, { kind: "ring", x: c.x, y: c.y, life: 0.32, color: "#3d9bff", size: 36 });
    } else if (role === "orb") {
      for (const r of w.roster) {
        if (r.placedPad && r.card.kind === "tower") w.padBuff[r.placedPad] = 3.2;
      }
      addFx(w, { kind: "ring", x: c.x, y: c.y, life: 0.4, color: "#3ecf7a", size: 40 });
    } else if (role === "jet") {
      for (const e of w.enemies) {
        if (!e.alive) continue;
        if (dist2(c.x, c.y, e.x, e.y) > fx.radius * fx.radius * 2.4) continue;
        applyDamage(w, e, fx.dps * 2.2, true, c.uid);
        if (fx.shred) e.shredT = Math.max(e.shredT, 2.2);
      }
      addFx(w, { kind: "ring", x: c.x, y: c.y, life: 0.4, color: "#ff5c2a", size: 56 });
    } else if (role === "spinner") {
      const heal = fx.heal || 10;
      for (const o of skyCrafts(w)) {
        if (dist2(c.x, c.y, o.x, o.y) > fx.radius * fx.radius * 2) continue;
        const before = o.hp;
        o.hp = Math.min(o.hpMax, o.hp + heal);
        if (o.hp > before) {
          c.roundHeals = (c.roundHeals ?? 0) + (o.hp - before);
          addFx(w, {
            kind: "float",
            x: o.x,
            y: o.y - 16,
            life: 0.7,
            text: `+${Math.round(o.hp - before)}`,
            color: "#7c6cf0",
            size: 12,
          });
        }
      }
      for (const r of w.roster) {
        if (!r.placedPad || r.card.kind !== "tower") continue;
        const pad = padById(r.placedPad);
        if (!pad) continue;
        if (dist2(c.x, c.y, pad.x, pad.y) > fx.radius * fx.radius * 2.4) continue;
        w.padBuff[pad.id] = Math.max(w.padBuff[pad.id] ?? 0, 2.2);
      }
      dropPatch(w, c.x, c.y, "fire", { ...fx, cutDps: Math.max(5, fx.dps * 0.4), cutSlow: 0.84 }, false, c.uid);
      for (const e of w.enemies) {
        if (!e.alive) continue;
        if (dist2(c.x, c.y, e.x, e.y) > fx.radius * fx.radius * 1.5) continue;
        applyDamage(w, e, fx.dps * 1.15, true, c.uid);
        if (fx.burnDps) {
          e.burnT = Math.max(e.burnT, 0.9);
          e.burnDps = Math.max(e.burnDps, fx.burnDps);
        }
      }
      addFx(w, { kind: "ring", x: c.x, y: c.y, life: 0.42, color: "#ff5c2a", size: 48 });
      addFx(w, { kind: "ring", x: c.x, y: c.y, life: 0.3, color: "#7c6cf0", size: 26 });
    } else {
      for (const e of w.enemies) {
        if (!e.alive) continue;
        if (dist2(c.x, c.y, e.x, e.y) > fx.radius * fx.radius * 2.2) continue;
        applyDamage(w, e, fx.dps * 2.4, true, c.uid);
        if (fx.slowMul) {
          e.slowT = Math.max(e.slowT, 0.9);
          e.slowMul = Math.min(e.slowMul || 1, fx.slowMul);
        }
      }
      addFx(w, { kind: "ring", x: c.x, y: c.y, life: 0.42, color: "#ff5c2a", size: 52 });
    }
    burstLateSpecial(w, c, fx);
  }
  if (c.cd <= 0) {
    c.cd = 0.28;
    if (fx.cutDps) {
      const meta = nearestPathMeta(c.x, c.y);
      if (meta.dist < 52) dropCut(w, meta.px, meta.py, fx, false, c.uid);
    }
    if (role === "medic") {
      for (const o of skyCrafts(w)) {
        if (o.uid === c.uid) continue;
        if (dist2(c.x, c.y, o.x, o.y) > fx.radius * fx.radius) continue;
        const tick = (fx.heal || 8) * 0.28;
        const before = o.hp;
        o.hp = Math.min(o.hpMax, o.hp + tick);
        if (o.hp > before) c.roundHeals = (c.roundHeals ?? 0) + (o.hp - before);
        if (o.home) {
          addFx(w, {
            kind: "beam",
            x: c.x,
            y: c.y,
            x2: o.x,
            y2: o.y,
            life: 0.16,
            color: "#3ecf7a",
            size: 2,
          });
        }
      }
    }
    for (const e of w.enemies) {
      if (!e.alive) continue;
      if (dist2(c.x, c.y, e.x, e.y) > fx.radius * fx.radius) continue;
      if (fx.shred) e.shredT = Math.max(e.shredT, 1.4);
      if (fx.slowMul) {
        e.slowT = Math.max(e.slowT, 0.7);
        e.slowMul = Math.min(e.slowMul || 1, fx.slowMul);
      }
      if (fx.burnDps) {
        e.burnT = Math.max(e.burnT, 1.1);
        e.burnDps = Math.max(e.burnDps, fx.burnDps);
      }
      if (role === "puck" && fx.knock && Math.random() < 0.12) knockEnemy(e, fx.knock * 0.22);
      let tick = fx.dps * 0.28;
      if (fx.coreGuard) {
        const cap = PATH_ALONG[e.route] ?? 1;
        if ((e.along ?? 0) / cap > 0.72) tick *= 1 + fx.coreGuard;
      }
      applyDamage(w, e, tick, true, c.uid);
    }
  }
  if (!c.home) {
    for (const r of placedGuns(w)) {
      if (r.placedPad === HOME_PAD) continue;
      const pad = padById(r.placedPad);
      if (!pad) continue;
      if (dist2(c.x, c.y, pad.x, pad.y) < 46 * 46) r.overclockT = Math.max(r.overclockT ?? 0, 1.12);
    }
    if (role === "rocket") {
      const r2 = PARAMS.overclockCraftR * PARAMS.overclockCraftR;
      for (const o of skyCrafts(w)) {
        if (o.uid === c.uid || o.home) continue;
        if (dist2(c.x, c.y, o.x, o.y) > r2) continue;
        o.boostT = Math.max(o.boostT ?? 0, 1.12);
      }
    }
  }
  if ((nearest || role === "orb" || role === "medic") && c.tauntT <= 0) {
    c.tauntT = (2.4 + Math.random() * 2.2) / Math.max(0.4, fx.tauntRate);
    c.bubble = pickTaunt((c.card.seed ?? 1) + Math.floor(w.visT * 13) + w.kills, role);
    c.bubbleT = 1.85;
  }
}

function stepCompanion(w, dt) {
  if (!w.companions) w.companions = [];
  for (const c of w.companions) stepOneCraft(w, c, dt);
}

function dropCut(w, x, y, fx, pit, owner = null) {
  dropPatch(w, x, y, "cut", fx, !!pit, owner);
}

function burstLateSpecial(w, c, fx) {
  const t = c.trick;
  if (t !== "nova" && t !== "storm" && t !== "eclipse") return;
  if (t === "nova") {
    const r = (fx.radius || 80) * 1.55;
    const r2 = r * r;
    for (const e of w.enemies) {
      if (!e.alive) continue;
      if (dist2(c.x, c.y, e.x, e.y) > r2) continue;
      applyDamage(w, e, (fx.dps || 12) * 2.6, true, c.uid);
      e.burnT = Math.max(e.burnT ?? 0, 1.8);
      e.burnDps = Math.max(e.burnDps ?? 0, fx.burnDps || 12);
    }
    addFx(w, { kind: "ring", x: c.x, y: c.y, life: 0.9, color: "#e8c15a", size: r });
    addFx(w, { kind: "ring", x: c.x, y: c.y, life: 0.55, color: "#ff5c2a", size: r * 0.52 });
    addFx(w, { kind: "patch", x: c.x, y: c.y, life: 0.6, color: "#e8c15a", size: 34 });
    for (let i = 0; i < 5; i++) {
      addFx(w, { kind: "drop", x: c.x + (i - 2) * 11, y: c.y, life: 0.5, color: i % 2 ? "#ff5c2a" : "#e8c15a", size: 38 });
    }
    return;
  }
  if (t === "storm") {
    const hits = [];
    const reach = (fx.radius || 80) * (fx.radius || 80) * 2.6;
    for (const e of w.enemies) {
      if (!e.alive) continue;
      if (dist2(c.x, c.y, e.x, e.y) > reach) continue;
      hits.push(e);
      if (hits.length >= 5) break;
    }
    let px = c.x;
    let py = c.y;
    for (const e of hits) {
      applyDamage(w, e, (fx.dps || 12) * 1.85, true, c.uid);
      addFx(w, { kind: "beam", x: px, y: py, x2: e.x, y2: e.y, life: 0.34, color: "#7c6cf0", size: 4 });
      addFx(w, { kind: "spark", x: e.x, y: e.y, life: 0.28, color: "#eef3f7", size: 10 });
      px = e.x;
      py = e.y;
    }
    addFx(w, { kind: "ring", x: c.x, y: c.y, life: 0.52, color: "#7c6cf0", size: 68 });
    return;
  }
  const r = (fx.radius || 80) * 1.45;
  const r2 = r * r;
  for (const e of w.enemies) {
    if (!e.alive) continue;
    if (dist2(c.x, c.y, e.x, e.y) > r2) continue;
    e.slowT = Math.max(e.slowT ?? 0, 1.9);
    e.slowMul = Math.min(e.slowMul || 1, fx.cutSlow || 0.5);
    applyDamage(w, e, (fx.dps || 12) * 1.45, true, c.uid);
  }
  addFx(w, { kind: "ring", x: c.x, y: c.y, life: 0.75, color: "#12151c", size: r });
  addFx(w, { kind: "ring", x: c.x, y: c.y, life: 0.48, color: "#e8c15a", size: r * 0.42 });
  addFx(w, { kind: "patch", x: c.x, y: c.y, life: 0.55, color: "#9b6cff", size: 30 });
}

function dropPatch(w, x, y, kind, fx, pit = false, owner = null) {
  if (!w.bores) w.bores = [];
  const meta = nearestPathMeta(x, y);
  const px = meta.px;
  const py = meta.py;
  if (!pit) {
    const near = w.bores.find((b) => b.kind === kind && !b.pit && dist2(b.x, b.y, px, py) < 22 * 22);
    if (near) {
      near.life = Math.max(near.life, kind === "fire" ? 2.8 : 3.2);
      near.dps = Math.max(near.dps, fx.cutDps || 0);
      near.slowMul = Math.min(near.slowMul, fx.cutSlow || 1);
      if (owner) near.owner = owner;
      return;
    }
  }
  const life = kind === "fire" ? 2.6 : kind === "ice" ? 2.8 : pit ? 4.4 : 3.2;
  w.bores.push({
    x: px,
    y: py,
    r: pit ? Math.max(36, fx.radius * 0.9) : Math.max(16, fx.radius * 0.4),
    life,
    max: life,
    dps: pit ? (fx.cutDps || 8) * 1.55 : fx.cutDps || (kind === "ice" ? 0 : 8),
    slowMul: pit ? Math.min(fx.cutSlow || 0.72, 0.52) : fx.cutSlow || 0.74,
    pit: !!pit,
    kind,
    owner: owner ?? null,
  });
  if (w.bores.length > 22) w.bores.splice(0, w.bores.length - 22);
}

function stepBores(w, dt) {
  if (!w.bores) w.bores = [];
  for (const b of w.bores) {
    b.life -= dt;
    if (b.life <= 0) continue;
    const r2 = b.r * b.r;
    for (const e of w.enemies) {
      if (!e.alive) continue;
      if (dist2(b.x, b.y, e.x, e.y) > r2) continue;
      if (b.kind === "fire") {
        applyDamage(w, e, Math.max(3, b.dps) * dt, true, b.owner ?? null);
        e.burnT = Math.max(e.burnT, 0.7);
        e.burnDps = Math.max(e.burnDps, Math.max(3, b.dps));
        continue;
      }
      if (b.kind === "ice") {
        e.slowT = Math.max(e.slowT, 0.4);
        e.slowMul = Math.min(e.slowMul || 1, b.slowMul || 0.55);
        continue;
      }
      applyDamage(w, e, b.dps * dt, true, b.owner ?? null);
      e.slowT = Math.max(e.slowT, b.pit ? 0.55 : 0.28);
      e.slowMul = Math.min(e.slowMul || 1, b.slowMul);
    }
  }
  w.bores = w.bores.filter((b) => b.life > 0);
}

function stepNades(w, dt) {
  if (!w.nades) w.nades = [];
  for (const e of w.enemies) {
    if (!e.alive) continue;
    if (e.type !== "plate" && e.type !== "colossus" && e.type !== "titan") continue;
    const cap = PATH_ALONG[e.route ?? 0] ?? 1;
    if ((e.along ?? 0) / cap < PARAMS.nadeLate) continue;
    e.nadeCd = (e.nadeCd ?? 2) - dt;
    if (e.nadeCd > 0) continue;
    e.nadeCd = e.type === "titan" ? 2.4 : e.type === "colossus" ? 3.2 : 4.4;
    const dx = BASE.x - e.x;
    const dy = BASE.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    w.nades.push({
      alive: true,
      x: e.x,
      y: e.y,
      vx: (dx / d) * 92,
      vy: (dy / d) * 92,
      ttl: 4.5,
      dmg: e.type === "titan" ? 2 : 1,
      bent: false,
    });
  }
  for (const n of w.nades) {
    if (!n.alive) continue;
    for (const c of skyCrafts(w)) {
      if (c.home) continue;
      const role = c.card.companion?.role;
      if (role !== "lens") continue;
      const fx = companionFx(c.card, c.kits);
      const d = Math.hypot(n.x - c.x, n.y - c.y);
      if (d > fx.radius) continue;
      let prey = null;
      let best = 1e9;
      for (const e of w.enemies) {
        if (!e.alive) continue;
        const dd = dist2(n.x, n.y, e.x, e.y);
        if (dd < best) {
          best = dd;
          prey = e;
        }
      }
      if (!prey) continue;
      const dx = prey.x - n.x;
      const dy = prey.y - n.y;
      const mag = Math.hypot(dx, dy) || 1;
      n.vx = (dx / mag) * 110;
      n.vy = (dy / mag) * 110;
      n.bent = true;
    }
    n.ttl -= dt;
    n.x += n.vx * dt;
    n.y += n.vy * dt;
    if (n.ttl <= 0) n.alive = false;
    else {
      let hit = false;
      if (n.bent) {
        for (const e of w.enemies) {
          if (!e.alive) continue;
          if (Math.hypot(n.x - e.x, n.y - e.y) < 16) {
            n.alive = false;
            applyDamage(w, e, 28 * n.dmg, true);
            addFx(w, { kind: "ring", x: n.x, y: n.y, life: 0.28, color: "#9b6cff", size: 18 });
            hit = true;
            break;
          }
        }
      }
      if (hit) continue;
      for (const c of skyCrafts(w)) {
        if (c.home) continue;
        if (Math.hypot(n.x - c.x, n.y - c.y) < 18) {
          n.alive = false;
          hurtCompanion(w, c, 22 * n.dmg);
          addFx(w, { kind: "ring", x: n.x, y: n.y, life: 0.28, color: "#e8c15a", size: 18 });
          hit = true;
          break;
        }
      }
      if (!hit && !n.bent && Math.hypot(n.x - BASE.x, n.y - BASE.y) < 28) {
        n.alive = false;
        w.lives -= n.dmg;
        w.leaks += n.dmg;
        w.trauma = Math.min(1, w.trauma + 0.35);
        addFx(w, { kind: "ring", x: BASE.x, y: BASE.y, life: 0.4, color: "#ff5c2a", size: 40 });
        w.message = "Grenade hit home.";
        if (w.lives <= 0) {
          failRun(w);
        }
      }
    }
  }
  w.nades = w.nades.filter((n) => n.alive);
  if (w.padBuff) {
    for (const id of Object.keys(w.padBuff)) {
      w.padBuff[id] -= dt;
      if (w.padBuff[id] <= 0) delete w.padBuff[id];
    }
  }
}

function maybeGrantSwap(w: World) {
  if ((w.swapTokens ?? 0) >= MAX_SWAP) return;
  w.swapPity = (w.swapPity ?? 0) + 1;
  const force = w.swapPity >= SWAP_PITY;
  if (!force && Math.random() > SWAP_RATE) return;
  w.swapTokens = Math.min(MAX_SWAP, (w.swapTokens ?? 0) + 1);
  w.swapPity = 0;
  if (w.phase === "opening" || w.phase === "draft" || w.phase === "loot") {
    w.pendingSwapToast = true;
  } else {
    w.swapToast = true;
  }
}

export function dismissSwapToast(w: World) {
  w.swapToast = false;
  w.uiDirty = true;
}

function aimForPad(item: RosterItem, pad: { x: number; y: number }) {
  const meta = nearestPathMeta(pad.x, pad.y);
  if ((item.card.stats?.cover ?? "circle") === "cone") {
    return Math.atan2(meta.py - pad.y, meta.px - pad.x);
  }
  return meta.aim;
}

function ownedCraftIds(w) {
  const ids = new Set();
  for (const c of w.companions ?? []) ids.add(c.card.templateId ?? c.card.id);
  return ids;
}

function ownedTemplates(w, midRun = false) {
  const ids = new Set();
  if (!w.vaultHelix) ids.add("gun-helix");
  if (!w.vaultSink) ids.add("comp-sink");
  for (const r of w.roster ?? []) {
    const tid = r.card.templateId ?? r.card.id;
    ids.add(tid);
  }
  for (const c of w.companions ?? []) {
    ids.add(c.card.templateId ?? c.card.id);
    for (const k of c.kits ?? []) ids.add(k.templateId ?? k.id);
  }
  for (const s of w.stickers ?? []) ids.add(s.templateId ?? s.id);
  for (const id of w.relics ?? []) ids.add(id);
  if (w.mapId) ids.add(w.mapId);
  if (w.environmentId) ids.add(w.environmentId);
  for (const id of w.runBanned ?? []) ids.add(id);
  return ids;
}

export function fuseArrowPos(item) {
  const pad = towerPoint(item);
  if (!pad) return null;
  return { x: pad.x, y: pad.y - 44, uid: item.uid };
}

export function hitFuseArrow(w, x, y) {
  if (w.phase !== "placement" && w.phase !== "combat") return null;
  let best = null;
  let bestD = 24 * 24;
  for (const r of w.roster ?? []) {
    if (r.card.kind !== "tower" || !r.placedPad || r.placedPad === HOME_PAD) continue;
    if (gunMaxed(r)) continue;
    if (!fusePartnerOf(w, r.uid)) continue;
    const p = fuseArrowPos(r);
    if (!p) continue;
    const d = (p.x - x) ** 2 + (p.y - y) ** 2;
    if (d <= bestD) {
      bestD = d;
      best = r;
    }
  }
  return best;
}

export function fusePartnerOf(w, uid) {
  return null;
}

export function tryFuseGuns(w, keepUid, eatUid) {
  return false;
}

function kindHintsFrom(w) {
  const towers = (w.roster ?? []).filter((r) => r.card.kind === "tower");
  const hasCone = towers.some((r) => (r.card.stats?.cover ?? "circle") === "cone");
  const hasSlow = towers.some((r) => (r.card.stats?.slowMul && r.card.stats.slowMul < 1) || r.card.stats?.slowT);
  const craftCount = (w.companions ?? []).length;
  const placed = towers.filter((r) => r.placedPad && r.placedPad !== HOME_PAD).length;
  const freePads = Math.max(0, padCap(w) - placed);
  const ownedGuns = new Set(towers.map((r) => r.card.templateId ?? r.card.id));
  const gunPool = 9;
  return {
    lastKind: w.lastPackKind ?? null,
    hasCone,
    hasSlow,
    craftCount,
    maxCrafts: MAX_COMPANIONS,
    skillSlotsOpen: false,
    padsFree: freePads,
    gunsLeft: Math.max(0, gunPool - ownedGuns.size),
  };
}

function giftHintsFrom(w): PackLean {
  const towers = (w.roster ?? []).filter((r) => r.card.kind === "tower");
  const hasRoad = towers.some((r) => (r.card.stats?.splash ?? 0) > 0 || r.card.set === "heat");
  const hasFreeze = towers.some((r) => (r.card.stats?.slowMul && r.card.stats.slowMul < 1) || r.card.stats?.slowT);
  const hasJump = towers.some((r) => (r.card.stats?.chain ?? 0) > 0 || r.card.set === "spark");
  const hasPeel = towers.some((r) => (r.card.stats?.shred ?? 0) > 0 || r.card.set === "iron");
  return {
    lastGift: w.lastPackGift ?? null,
    hints: { lastGift: w.lastPackGift ?? null, hasRoad, hasFreeze, hasJump, hasPeel },
  };
}

function stampDealtPack(w) {
  w.packRarity = packRarityOf(w.draftCards);
  w.packMode = "show";
  w.cutId = null;
  w.lastPackGem = w.packRarity;
  w.lastPackKind = w.draftKind ?? packKindOf(w.draftCards);
  w.packGift = packGiftOf(w.draftCards);
  if (w.packGift) w.lastPackGift = w.packGift;
  if (w.draftCards.length > 0 && (w.draftPicksLeft || 1) > w.draftCards.length) {
    w.draftPicksLeft = w.draftCards.length;
  }
}

function refillEmptyPack(w) {
  if ((w.draftCards ?? []).length > 0) return true;
  const skip = ownedTemplates(w, w.phase !== "opening");
  const failed = w.draftKind;
  const rarity = w.packRarity ?? "uncommon";
  const lean = giftHintsFrom(w);
  const order = (["tower", "companion"] as const).filter((k) => k !== failed);
  for (const kind of order) {
    const cards =
      kind === "tower"
        ? dealTowerOpening(PARAMS.packSize, w.forge, skip, rarity, lean)
        : dealOpeningMix("companion", PARAMS.packSize, w.forge, skip, rarity, lean);
    if (!cards.length) continue;
    w.draftCards = cards;
    w.draftKind = kind;
    w.draftPicksLeft = Math.min(Math.max(1, w.draftPicksLeft || 1), cards.length);
    w.draftTitle = packTitleFor(kind, "show");
    stampDealtPack(w);
    w.draftSub = "No more of those cards. Pick from this pack.";
    w.draftCompensate = false;
    return true;
  }
  return false;
}

function tiltOwnedGun(w, cards) {
  return cards;
}

export function tutorialAdvance(w, step) {
  if (!w.tutorialActive) return;
  if (w.tutorialStep + 1 !== step && w.tutorialStep < step - 1) {
    if (step === 6 && w.tutorialStep === 5) {
      /* Level-up chip is optional */
    } else if (step > w.tutorialStep + 1 && step !== 6) {
      w.tutorialStep = step - 1;
    } else if (w.tutorialStep + 1 !== step) return;
  }
  if (step <= w.tutorialStep) return;
  w.tutorialStep = step;
  w.uiDirty = true;
  if (step >= 7) {
    w.tutorialActive = false;
    w.tutorialPendingGate = true;
  }
}

function applyVault(w) {
  const meta = loadMeta();
  const v = vaultOf(meta.vault);
  w.vaultHealMul = vaultHas(v, "bay_patch") ? 1.15 : 1;
  w.vaultWarm = vaultHas(v, "warm_start");
  w.vaultDeepBay = vaultHas(v, "deep_bay");
  w.vaultSteady = vaultHas(v, "steady_stock");
  w.vaultHotLip = vaultHas(v, "hot_lip");
  w.vaultFoundry = vaultHas(v, "foundry");
  w.vaultMatchChalk = vaultHas(v, "match_chalk");
  w.vaultOutfit = v.ownedIds.filter((id) => ["chrome_lip", "frost_trail", "amethyst_frame", "night_glass", "signature"].includes(id));
  w.vaultStars = vaultHas(v, "shooting_stars");
  w.vaultSun = vaultHas(v, "distant_sun");
  w.vaultPath = vaultHas(v, "path_ion")
    ? "ion"
    : vaultHas(v, "path_ember")
      ? "ember"
      : vaultHas(v, "path_frost")
        ? "frost"
        : null;
  w.vaultHelix = vaultHas(v, "myth_helix");
  w.vaultSink = vaultHas(v, "myth_sink");
  let pads = hangarOf(meta.hangar).pad;
  if (vaultHas(v, "spare_pad")) pads += 1;
  w.hangarPads = pads;
  let swaps = START_SWAP;
  if (vaultHas(v, "extra_swap")) swaps += 1;
  if (vaultHas(v, "open_sky")) swaps += 1;
  w.swapTokens = Math.min(MAX_SWAP, swaps);
}

function finishDraftStep(w) {
  if (w.phase === "opening") {
    w.openingStep += 1;
    if (w.openingStep < OPENING_PICKS) {
      dealOpeningRound(w);
      checkpoint(w);
      return;
    }
    beginPlacement(w, true);
    tutorialAdvance(w, 3);
  } else if (w.phase === "loot") resumeLoot(w);
  else {
    w.draftPicksLeft = 0;
    w.pendingRoundPack = false;
    w.pendingLevels = 0;
    w.draftCards = [];
    if (w.phase === "combat") {
      w.paused = false;
      w.uiDirty = true;
    } else {
      w.wave += 1;
      w.grade = null;
      beginPlacement(w, false);
    }
  }
  checkpoint(w);
}

function dealOpeningRound(w) {
  const round = OPENING_ROUNDS[w.openingStep];
  if (!round) return;
  const owned = ownedTemplates(w);
  const rarity = round.heroes ? "legendary" : rollPackRarity(OPENING_ODDS);
  const lean: PackLean = round.heroes ? { skipGift: true } : giftHintsFrom(w);
  const n = PARAMS.packSize;
  w.draftLane = "open";
  w.draftKind = round.kind;
  w.draftPicksLeft = 1;
  w.draftTitle = round.title;
  w.draftOdds = { ...OPENING_ODDS };
  if (round.kind === "set") w.draftCards = dealSetOpening(n);
  else if (round.kind === "signal") w.draftCards = dealSignalOpening(n, new Set(w.signals ?? []));
  else if (round.kind === "companion" && round.heroes) w.draftCards = dealCompanionOpening(n, w.forge, owned);
  else if (round.kind === "companion") w.draftCards = dealOpeningMix("companion", n, w.forge, owned, rarity, lean);
  else if (round.kind === "tower") w.draftCards = dealTowerOpening(n, w.forge, owned, rarity, lean);
  else if (round.kind === "kit") w.draftCards = dealKitSkills(n, w.forge, owned, rarity, ownedCraftIds(w), lean);
  else w.draftCards = dealOpeningMix(round.kind, n, w.forge, owned, rarity, lean);
  w.packMode = "show";
  w.cutId = null;
  w.lastPackGem = packRarityOf(w.draftCards);
  w.lastPackKind = w.draftKind;
  stampDealtPack(w);
  w.draftSub = round.sub;
  if (w.tutorialActive) {
    if (round.kind === "companion") tutorialAdvance(w, 1);
    if (round.kind === "tower") tutorialAdvance(w, 2);
  }
  if (w.draftCards.length === 0) {
    if (refillEmptyPack(w)) {
      w.uiDirty = true;
      return;
    }
    w.openingStep += 1;
    if (w.openingStep < OPENING_PICKS) {
      dealOpeningRound(w);
      return;
    }
    beginPlacement(w, true);
    return;
  }
  w.draftPicksLeft = 1;
  w.uiDirty = true;
}

function rollNewSector(w, announce: boolean, skipMapId?: string | null) {
  const sector = dealSector(w.forge, skipMapId ?? w.mapId);
  if (!sector) return;
  applyMap(w, sector.map);
  applyEnv(w, sector.env);
  w.message = `${sector.map.name} · ${sector.env.name}`;
  if (announce) {
    w.announce = `${sector.map.name} · ${sector.env.name}`;
    w.announceT = 2.2;
  }
}

export function beginOpening(w) {
  w.paused = false;
  w.pickPause = false;
  w.holdT = 0;
  w.hitstop = 0;
  w.wave = 0;
  w.enemies = [];
  w.projectiles = [];
  w.spawnQ = [];
  w.fx = [];
  w.waveActive = false;
  w.roster = [];
  w.selectedCard = null;
  w.selectedPad = null;
  w.phase = "opening";
  w.openingStep = 0;
  w.signals = [];
  w.endless = w.playMode === "arcade";
  w.ghostHullUsed = false;
  w.announce = null;
  w.announceT = 0;
  const meta = loadMeta();
  const hangar = hangarOf(meta.hangar);
  w.forge = meta.forge;
  w.hangarPads = hangar.pad;
  w.hangarLuck = hangar.luck;
  w.lives = START_LIVES + applyStamps(w).lives + hangar.life;
  w.maxLives = w.lives;
  w.points = hangarStartCredit(hangar);
  w.flux = meta.flux ?? 0;
  w.fluxEarned = 0;
  w.swapTokens = START_SWAP;
  applyVault(w);
  if (w.wantTutorial) {
    w.tutorialActive = true;
    w.tutorialStep = 1;
    w.wantTutorial = false;
  }
  w.swapPity = 0;
  w.swapToast = false;
  w.nades = [];
  w.bores = [];
  w.padBuff = {};
  w.gunKills = {};
  w.skin = meta.equipped ?? "stock";
  w.orbitRank = orbitRank(meta.orbitXp ?? 0);
  w.companions = [];
  w.skipCharge = 0;
  w.lastPackGem = null;
  w.lastPackKind = null;
  w.packGift = null;
  w.lastPackGift = null;
  w.pendingCompensate = null;
  w.draftCompensate = false;
  w.bansThisRound = 0;
  w.runBanned = [];
  rollNewSector(w, false);
  const core = dealOpeningMix("defender", 1, w.forge)[0];
  if (core) addToRoster(w, core);
  const slot = activeProfile();
  if (slot.boundId) {
    try {
      const def = getCard(slot.boundId);
      const rolled = rollCard(def, def.rarity, 7, w.forge[def.id] ?? 0);
      const c = spawnCompanion(w, rolled);
      applyBoundCraft(w, c);
    } catch {
      /* missing card */
    }
  }
  dealOpeningRound(w);
  checkpoint(w);
}

export function beginPerformanceDraft(w) {
  w.pendingRoundPack = false;
  w.extraPicks = 0;
  w.draftPicksLeft = 0;
  w.draftCards = [];
  w.paused = false;
  w.pickPause = false;
  w.points += BONUS_CREDIT;
  w.message = `+${BONUS_CREDIT} Credit`;
  w.uiDirty = true;
  if (w.phase === "draft" || w.phase === "loot") {
    w.phase = w.waveActive || w.enemies.some((e) => e.alive) ? "combat" : "placement";
    if (w.phase === "placement") beginPlacement(w, false);
  }
}

function beginLevelDraft(w) {
  const n = Math.max(1, w.pendingLevels || 1) * BONUS_CREDIT;
  w.pendingLevels = 0;
  w.pendingRoundPack = false;
  w.draftPicksLeft = 0;
  w.draftCards = [];
  w.paused = false;
  w.pickPause = false;
  w.points += n;
  w.message = `+${n} Credit`;
  w.announce = `+${n} Credit`;
  w.announceT = 1.4;
  if (w.phase === "draft" || w.phase === "loot") {
    w.phase = w.waveActive || w.enemies.some((e) => e.alive) ? "combat" : "placement";
    if (w.phase === "placement") beginPlacement(w, false);
  }
  w.uiDirty = true;
}

function afterShop(w) {
  w.pendingStamp = false;
  w.pendingRoundPack = false;
  w.pendingLevels = 0;
  w.draftPicksLeft = 0;
  w.wave += 1;
  w.grade = null;
  beginPlacement(w, false);
}

function beginRoundDrafts(w) {
  w.mysteryQueue = 0;
  w.bansThisRound = 0;
  w.pendingLevels = 0;
  w.pendingRoundPack = false;
  w.draftPicksLeft = 0;
  w.wave += 1;
  w.grade = null;
  w.packMode = "show";
  w.cutId = null;
  beginPlacement(w, false);
}

function beginMysteryPack(w) {
  w.points += BONUS_CREDIT;
  w.message = `+${BONUS_CREDIT} Credit`;
  w.paused = false;
  w.pickPause = false;
  w.uiDirty = true;
}

export function beginStampDraft(w) {
  w.pendingStamp = false;
  w.phase = "draft";
  w.draftLane = "stamp";
  w.draftKind = "stamp";
  w.draftPicksLeft = 1;
  w.draftTotal = 1;
  w.draftTitle = "Stamp · pick one";
  w.draftSub = "Keeps forever, even on the next run.";
  w.packHeat = null;
  w.packMode = "show";
  w.cutId = null;
  w.draftCards = dealStampPack(loadMeta().stamps ?? [], 3);
  w.packRarity = packRarityOf(w.draftCards);
  w.lastPackKind = "stamp";
  w.uiDirty = true;
}

export function offerLive(w, _title) {
  w.draftBump = Math.min(3, (w.draftBump ?? 0) + 1);
  w.message = "Next pack rolls a gem up.";
  w.uiDirty = true;
}

export function skipDraftPack(w) {
  if (w.phase === "opening") return false;
  if (w.phase === "combat" || w.phase === "placement") return false;
  w.skipCharge = Math.min(3, (w.skipCharge ?? 0) + 1);
  w.points += BONUS_CREDIT;
  w.message = `+${BONUS_CREDIT} Credit`;
  w.pendingLevels = 0;
  w.pendingRoundPack = false;
  w.draftPicksLeft = 0;
  w.draftCards = [];
  w.paused = false;
  w.pickPause = false;
  if (w.phase === "draft" || w.phase === "loot") {
    w.phase = w.waveActive || w.enemies.some((e) => e.alive) ? "combat" : "placement";
    if (w.phase === "placement") beginPlacement(w, false);
  }
  w.uiDirty = true;
  checkpoint(w);
  return true;
}

export function skipLive(w) {
  skipDraftPack(w);
}

export function banDraftCard(_w, _id: string) {
  return false;
}

export function pickLive(_w, _id) {
  return false;
}

function beginLootDraft(w) {
  w.lootQueued = 0;
  w.points += BONUS_CREDIT;
  w.message = `+${BONUS_CREDIT} Credit`;
  w.paused = false;
  w.pickPause = false;
  w.phase = "combat";
  w.uiDirty = true;
}

export function pickDraft(w, id) {
  if (w.phase !== "opening" && w.phase !== "draft" && w.phase !== "loot") return;
  const n = w.draftCards.find((c) => c.id === id);
  if (!n) return;
  if (w.packMode === "cut") {
    if (!w.cutId) {
      w.cutId = id;
      w.message = "Cut. Now take one.";
      w.uiDirty = true;
      return;
    }
    if (id === w.cutId) return;
  }
  if (n.kind === "set") {
    const ids = n.setGuns ?? [];
    for (const gid of ids) {
      try {
        const def = getCard(gid);
        addToRoster(w, rollCard(def, def.rarity, 7, w.forge[gid] ?? 0));
      } catch {
        /* missing gun */
      }
    }
    w.message = `${n.name} in.`;
    w.draftPicksLeft = 0;
    w.draftCards = [];
    finishDraftStep(w);
    return;
  }
  if (n.kind === "signal") {
    const sid = n.templateId ?? n.id;
    w.signals = [...(w.signals ?? []), sid].slice(0, 2);
    w.message = `${n.name} locked in.`;
    w.draftPicksLeft = 0;
    w.draftCards = [];
    finishDraftStep(w);
    return;
  }
  if (n.kind === "stamp" || w.draftLane === "stamp") {
    addStamp(n.templateId);
    applyStamps(w);
    w.draftPicksLeft = 0;
    w.message = `${n.name} stamped in.`;
    if (w.pendingEngrave) {
      const guns = w.roster.filter((r) => r.placedPad && r.card.kind !== "socket");
      if (!guns.length) {
        w.pendingEngrave = false;
        beginLoopGate(w);
      } else {
        w.phase = "engrave";
        w.message = "Loop complete. Engrave a gun. That frame stays stronger forever.";
        w.uiDirty = true;
      }
    } else {
      afterShop(w);
    }
    checkpoint(w);
    return;
  }
  if (n.kind === "climb" || w.draftLane === "level") {
    applyClimbPick(w, n.templateId ?? n.id);
    w.draftPicksLeft = 0;
    w.draftCards = [];
    finishDraftStep(w);
    return;
  }
  if (n.kind !== "tower" && ownedTemplates(w).has(n.templateId)) {
    w.message = "You already have that. Pick a different one.";
    w.uiDirty = true;
    return;
  }
  if (n.kind === "tower") {
    const tid = n.templateId ?? n.id;
    const copies = (w.roster ?? []).filter((r) => r.card.kind === "tower" && (r.card.templateId ?? r.card.id) === tid);
    if (copies.length && copies.every((r) => gunMaxed(r))) {
      w.message = "This gun already walked its jobs.";
      w.uiDirty = true;
      return;
    }
  }
  if (!addToRoster(w, n)) {
    w.uiDirty = true;
    return;
  }
  w.draftPicksLeft -= 1;
  w.draftCards = w.draftCards.filter((c) => c.id !== id);
  w.packMode = "show";
  w.cutId = null;
  if (w.draftPicksLeft > 0 && w.draftCards.length > 0) {
    w.message = `Take ${w.draftPicksLeft} more.`;
    w.uiDirty = true;
    checkpoint(w);
    return;
  }
  finishDraftStep(w);
}

export function fitPart(_w, _t) {
  return false;
}

function resumeLoot(w) {
  w.draftCards = [];
  if (w.lootQueued > 0) {
    beginLootDraft(w);
    return;
  }
  w.phase = "combat";
  w.uiDirty = true;
  if (!w.enemies.some((e) => e.alive) && w.spawnQ.length === 0 && w.waveActive) finishWave(w);
}

function beginPlacement(w, t) {
  w.phase = "placement";
  if (w.tutorialActive && w.tutorialStep < 3) tutorialAdvance(w, 3);
  w.draftCards = [];
  w.draftKind = null;
  w.bores = [];
  if (w.pendingSwapToast) {
    w.swapToast = true;
    w.pendingSwapToast = false;
  }
  const n = themeAt(w.wave, w.mapTheme);
  const r = fieldedTowers(w).length;
  const i = Math.max(0, padCap(w) - r);
  const a = i === 0 ? `All ${padCap(w)} moons filled.` : `${i} moon${i === 1 ? "" : "s"} left.`;
  const o = w.lastLeakGate
    ? `${w.lastLeakGate} got through. Cover the path.`
    : "Tap a glowing moon.";
  if (t) {
    w.announce = null;
    w.announceT = 0;
    w.message = `${o} ${a}`;
  } else {
    const prev = themeAt(Math.max(0, w.wave - 1), w.mapTheme);
    if (n.id === prev.id) w.message = `${o} ${a}`;
    else {
      w.announce = n.name;
      w.announceT = 2.4;
      w.message = `${n.name}. ${o} ${a}`;
    }
  }
  for (const c of w.companions ?? []) {
    const role = c.card.companion?.role ?? "hunter";
    c.hpMax = c.hpMax || companionMaxHp(role);
    c.hp = c.hpMax;
    c.down = false;
    c.home = false;
    c.crit = false;
    c.healPulse = 0;
    c.specialCd = 1.6;
    c.commandT = 0;
    c.bubble = null;
    if (c.placedPad === SKY_PAD) {
      c.x = BASE.x - 80;
      c.y = BASE.y - 20;
    }
  }
  const firstGun = w.roster.find((x) => x.card.kind === "tower" && !x.placedPad);
  w.selectedCard = firstGun?.uid ?? null;
  checkpoint(w);
  w.uiDirty = true;
}

export function placeTower(w, t, n) {
  if ((w.phase !== "placement" && w.phase !== "combat") || n === HOME_PAD) return false;
  const r = w.roster.find((x) => x.uid === t);
  const i = padById(n);
  if (!r || !i || r.placedPad) return false;
  const a = r.card.kind === "socket";
  const o = r.card.kind === "tower";
  if (!a && !o) return false;
  if (o) {
    const cap = padCap(w);
    if (fieldedTowers(w).length >= cap) {
      w.message = `All ${cap} moons filled. Sell one, bench one, or defend.`;
      w.uiDirty = true;
      return false;
    }
    if (!livePads(w).some((p) => p.id === n)) return false;
    if (towerOnPad(w, n)) return false;
  }
  if (a && socketOnPad(w, n)) {
    w.message = "That moon already has a rig.";
    w.uiDirty = true;
    return false;
  }
  r.freePlace = false;
  r.placedPad = n;
  r.aim = aimForPad(r, i);
  r.appearT = w.visT;
  const nextGun = w.roster.find((x) => x.uid !== r.uid && x.card.kind === "tower" && !x.placedPad);
  w.selectedCard = nextGun?.uid ?? null;
  w.selectedPad = w.phase === "placement" ? null : n;
  w.hoverPad = null;
  const s = Math.max(0, padCap(w) - fieldedTowers(w).length);
  const hint = moonPlantLine(i);
  w.message = s === 0 ? "All guns placed. Hit Defend." : hint ?? "Tap a glowing moon.";
  w.uiDirty = true;
  addFx(w, { kind: "drop", x: i.x, y: i.y, life: 0.48, color: a ? "#3cd6cc" : "#9b6cff", size: 88 });
  addFx(w, { kind: "ring", x: i.x, y: i.y, life: 0.42, color: a ? "#3cd6cc" : "#7c6cf0", size: 28 });
  addFx(w, { kind: "spark", x: i.x, y: i.y - 8, life: 0.28, color: "#eef3f7", size: 10 });
  addFx(w, { kind: "smoke", x: i.x, y: i.y + 6, life: 0.34, color: "#9aa3b2", size: 14 });
  return true;
}

export function sellTower(w, t) {
  const n = w.roster.find((r) => r.uid === t);
  if (!n?.placedPad || n.placedPad === HOME_PAD) return;
  if (n.card.kind === "companion") {
    toggleCompanion(w, t);
    return;
  }
  n.placedPad = null;
  w.selectedPad = null;
  w.uiDirty = true;
}

export function swapTower(w, uid: string, padId: string) {
  if ((w.phase !== "placement" && w.phase !== "combat") || padId === HOME_PAD) return false;
  const item = w.roster.find((r) => r.uid === uid);
  const pad = padById(padId);
  if (!item || !pad || item.card.kind !== "tower") return false;
  if (!livePads(w).some((p) => p.id === padId)) return false;
  if (!item.placedPad || item.placedPad === HOME_PAD) return false;
  if (item.placedPad === padId) return false;
  if (towerOnPad(w, padId)) return false;
  if ((w.swapTokens ?? 0) < 1) {
    w.message = "No swap tokens. Rare extra when you crack a pack.";
    w.uiDirty = true;
    return false;
  }
  w.swapTokens -= 1;
  item.placedPad = padId;
  item.aim = aimForPad(item, pad);
  w.selectedCard = item.uid;
  w.selectedPad = padId;
  w.hoverPad = null;
  w.message = `Moved ${item.card.name}. ${w.swapTokens} swap${w.swapTokens === 1 ? "" : "s"} left.`;
  w.uiDirty = true;
  addFx(w, { kind: "ring", x: pad.x, y: pad.y, life: 0.35, color: "#3cd6cc", size: 36 });
  return true;
}

export function scrapValue(w, t) {
  const n = 12 + t.invested * 0.5 + (t.level - 1) * 8;
  const pile = Math.max(6, Math.round(n * scrapMul(w.runLevel) * (w.mapScrapMul ?? 1)));
  return Math.max(1, fluxFromBank(pile));
}

export function scrapTower(w, t) {
  const n = w.roster.find((r) => r.uid === t);
  if (!n || n.placedPad === HOME_PAD || n.card.kind === "defender") return false;
  const r = scrapValue(w, n);
  bankFlux(w, r);
  w.roster = w.roster.filter((x) => x.uid !== t);
  w.companions = (w.companions ?? []).filter((c) => c.uid !== t);
  if (w.selectedCard === t) w.selectedCard = null;
  if (n.placedPad && w.selectedPad === n.placedPad) w.selectedPad = null;
  if (n.card.kind === "companion") {
    w.pendingCompensate = "companion";
  }
  w.message = `Sold ${n.card.name} · +${r} Credit`;
  w.uiDirty = true;
  return true;
}

function applyClimbPick(w, id) {
  if (!w.climb) w.climb = emptyClimb();
  if (id === "climb-gold") {
    bankFlux(w, CREDIT_SPARE);
    w.message = `Spare credit. +${CREDIT_SPARE}.`;
    return;
  }
  const perk = climbOf(id);
  if (!perk) return;
  w.climb[perk.branch] = Math.max(w.climb[perk.branch] ?? 0, perk.rank);
  const fx = climbFx(w.climb);
  if (perk.id === "climb-bay-2") w.swapTokens = Math.min(MAX_SWAP, (w.swapTokens ?? 0) + 1);
  if (perk.id === "climb-pack-2") w.skipCharge = Math.max(w.skipCharge ?? 0, 1);
  if (perk.id === "climb-crew-3") {
    for (const c of w.companions ?? []) {
      const next = Math.round(c.hpMax * fx.hpMul);
      if (next > c.hpMax) {
        const ratio = c.hp / Math.max(1, c.hpMax);
        c.hpMax = next;
        c.hp = Math.min(c.hpMax, Math.round(c.hpMax * ratio));
      }
    }
  }
  w.message = `${perk.name}. ${perk.blurb}`;
}

export function upgradeTower(w, t, n, tuneId) {
  const r = w.roster.find((x) => x.uid === t);
  if (!r?.placedPad) return false;
  hydrateGun(r);
  if (!slotsOpen(r)) return false;
  const i = upgradeCost(r.card, slotsUsed(r));
  if (i <= 0 || w.points < i) return false;
  if (!tuneId || !canTakeJob(r, tuneId)) return false;
  r.jobs = [...gunJobs(r), tuneId];
  if (!r.tuneJob) r.tuneJob = tuneId;
  else if (!r.tuneCap) r.tuneCap = tuneId;
  w.points -= i;
  r.invested += i;
  w.upgradesMade = (w.upgradesMade ?? 0) + 1;
  w.uiDirty = true;
  const a = towerPoint(r);
  if (a) addFx(w, { kind: "ring", x: a.x, y: a.y, life: 0.3, color: "#f0f1f4", size: 28 });
  return true;
}

export function buyDraftPick(w) {
  return false;
}

export function pickTrick(w, uid, id) {
  return pickSpecial(w, uid, id);
}

export function pickSpecial(w, uid, id) {
  if (!uid || !id) return false;
  if (partOf(id.split(":")[0])) return pickPart(w, uid, id);
  const spec = specialOf(id);
  if (!spec) return pickTrickLegacy(w, uid, id);
  const gun = (w.roster ?? []).find((r) => r.uid === uid && r.card.kind === "tower");
  if (gun) {
    hydrateGun(gun);
    const offer = gun.specialOffer ?? [];
    if (!offer.includes(id)) return false;
    gun.specials = [...(gun.specials ?? []), id];
    gun.specialOffer = [];
    const g = spec.gun;
    if (g?.trick) gun.trick = g.trick;
    w.message = `${gun.card.name} learned ${spec.name}.`;
    w.announce = spec.name;
    w.announceT = 1.3;
    const pt = towerPoint(gun);
    if (pt) {
      addFx(w, { kind: "ring", x: pt.x, y: pt.y, life: 0.7, color: "#ff5c2a", size: 72 });
      addFx(w, { kind: "float", x: pt.x, y: pt.y - 26, life: 1.4, text: spec.name, color: "#ff5c2a", size: 20 });
    }
    gun.levelPop = 0.38;
    nextLevelPick(w);
    w.uiDirty = true;
    return true;
  }
  const craft = (w.companions ?? []).find((c) => c.uid === uid);
  if (!craft) return false;
  const offer = craft.specialOffer ?? [];
  if (!offer.includes(id)) return false;
  craft.specials = [...(craft.specials ?? []), id];
  craft.specialOffer = [];
  const k = spec.craft;
  if (k) {
    const rolled = {
      id: `${spec.id}-${craft.uid}`,
      templateId: spec.id,
      name: spec.name,
      kind: "kit",
      rarity: "rare",
      art: craft.card.art,
      set: craft.card.set,
      cost: 0,
      blurb: spec.blurb,
      kit: { craftId: craft.card.templateId ?? craft.card.id, ...k },
      affixes: [],
      prefix: "",
      seed: (craft.card.seed ?? 1) + (craft.specials?.length ?? 0),
    };
    craft.kits = [...(craft.kits ?? []), rolled];
    if (k.trail) craft.trick = "trail";
    if (k.hunt) craft.trick = "hunt";
    if (k.trick) craft.trick = k.trick;
    if ((k.hpMul ?? 1) > 1) {
      craft.hpMax = Math.round((craft.hpMax || 100) * k.hpMul);
      craft.hp = Math.min(craft.hpMax, Math.round((craft.hp || 0) * k.hpMul));
    }
  }
  w.message = `${craft.card.name} learned ${spec.name}.`;
  w.announce = spec.name;
  w.announceT = 1.3;
  addFx(w, { kind: "ring", x: craft.x, y: craft.y, life: 0.7, color: "#3cd6cc", size: 64 });
  addFx(w, { kind: "float", x: craft.x, y: craft.y - 26, life: 1.4, text: spec.name, color: "#3cd6cc", size: 20 });
  craft.levelPop = 0.38;
  nextLevelPick(w);
  w.uiDirty = true;
  return true;
}

function pickPart(w, uid, id) {
  const gun = (w.roster ?? []).find((r) => r.uid === uid && r.card.kind === "tower");
  if (gun) {
    const offer = gun.partOffer ?? [];
    const pick = offer.find((p) => p.id === id);
    if (!pick) return false;
    gun.parts = [...(gun.parts ?? []), pick];
    gun.partOffer = [];
    if (pick.gun?.extraShot) gun.extraShot = true;
    w.message = `${gun.card.name} fitted ${pick.name}.`;
    w.announce = pick.name;
    w.announceT = 1.4;
    const pt = towerPoint(gun);
    if (pt) {
      addFx(w, { kind: "ring", x: pt.x, y: pt.y, life: 0.75, color: "#e8c15a", size: 80 });
      addFx(w, { kind: "float", x: pt.x, y: pt.y - 26, life: 1.5, text: pick.name, color: "#e8c15a", size: 22 });
    }
    gun.levelPop = 0.42;
    nextLevelPick(w);
    w.uiDirty = true;
    return true;
  }
  const craft = (w.companions ?? []).find((c) => c.uid === uid);
  if (!craft) return false;
  const offer = craft.partOffer ?? [];
  const pick = offer.find((p) => p.id === id);
  if (!pick) return false;
  craft.parts = [...(craft.parts ?? []), pick];
  craft.partOffer = [];
  const k = pick.craft;
  if (k && !k.clone) {
    const rolled = {
      id: `${pick.id}-${craft.uid}`,
      templateId: pick.id,
      name: pick.name,
      kind: "kit",
      rarity: pick.rarity === "legendary" ? "legendary" : "rare",
      art: craft.card.art,
      set: craft.card.set,
      cost: 0,
      blurb: pick.blurb,
      kit: {
        craftId: craft.card.templateId ?? craft.card.id,
        dpsMul: k.dpsMul,
        radiusMul: k.radiusMul,
        hpMul: k.hpMul,
        interceptMul: k.interceptMul,
        speedMul: k.speedMul,
        healMul: k.healMul,
        burnDps: k.burnDps,
      },
      affixes: [],
      prefix: "",
      seed: (craft.card.seed ?? 1) + (craft.parts?.length ?? 0),
    };
    craft.kits = [...(craft.kits ?? []), rolled];
    if ((k.hpMul ?? 1) > 1) {
      craft.hpMax = Math.round((craft.hpMax || 100) * k.hpMul);
      craft.hp = Math.min(craft.hpMax, Math.round((craft.hp || 0) * k.hpMul));
    }
  }
  if (k?.clone) spawnClone(w, craft);
  w.message = `${craft.card.name} fitted ${pick.name}.`;
  w.announce = pick.name;
  w.announceT = 1.4;
  addFx(w, { kind: "ring", x: craft.x, y: craft.y, life: 0.75, color: "#e8c15a", size: 70 });
  addFx(w, { kind: "float", x: craft.x, y: craft.y - 26, life: 1.5, text: pick.name, color: "#e8c15a", size: 22 });
  craft.levelPop = 0.42;
  nextLevelPick(w);
  w.uiDirty = true;
  return true;
}

function spawnClone(w, src) {
  if ((w.companions ?? []).some((c) => c.clone)) {
    w.message = `${src.card.name} already has an echo.`;
    return;
  }
  const card = { ...src.card, name: `${src.card.name} echo` };
  const c = spawnCompanion(w, card);
  c.clone = true;
  c.hpMax = Math.max(20, Math.round((src.hpMax || 100) * 0.5));
  c.hp = c.hpMax;
  c.placedPad = SKY_PAD;
  c.home = false;
  c.x = src.x + 18;
  c.y = src.y - 12;
  const r = w.roster.find((x) => x.uid === c.uid);
  if (r) r.placedPad = SKY_PAD;
  c.kits = [
    ...(src.kits ?? []),
    {
      id: `echo-${c.uid}`,
      templateId: "p-clone",
      name: "Echo",
      kind: "kit",
      rarity: "legendary",
      art: src.card.art,
      set: src.card.set,
      cost: 0,
      blurb: "Half as strong.",
      kit: { craftId: src.card.templateId ?? src.card.id, dpsMul: 0.5, radiusMul: 0.7, hpMul: 0.5 },
      affixes: [],
      prefix: "",
      seed: 1,
    },
  ];
  addFx(w, { kind: "ring", x: c.x, y: c.y, life: 0.7, color: "#9b6cff", size: 36 });
}

function pickTrickLegacy(w, uid, id) {
  const gun = (w.roster ?? []).find((r) => r.uid === uid && r.card.kind === "tower");
  if (gun) {
    const offer = gun.trickOffer?.length ? gun.trickOffer : [];
    if (!offer.includes(id) && gun.trick !== id) return false;
    gun.trick = id;
    gun.trickOffer = [];
    w.uiDirty = true;
    return true;
  }
  return false;
}

function settleTricks(w) {
  /* Level-up chips wait. Never auto-pick. */
}

export function continueFromShop(w) {
  if (w.phase !== "shop") return;
  settleTricks(w);
  if (w.pendingStamp) {
    beginStampDraft(w);
    return;
  }
  if (w.pendingEngrave) {
    const guns = w.roster.filter((r) => r.placedPad && r.card.kind !== "socket");
    if (!guns.length) {
      w.pendingEngrave = false;
      beginLoopGate(w);
      return;
    }
    w.phase = "engrave";
    w.message = "Loop complete. Engrave a gun. That frame stays stronger forever.";
    w.uiDirty = true;
    return;
  }
  afterShop(w);
}

export function engraveTower(w, t) {
  if (w.phase !== "engrave") return false;
  const n = w.roster.find((r) => r.uid === t);
  if (!n) return false;
  const r = n.card.templateId;
  w.forge[r] = (w.forge[r] ?? 0) + 1;
  bumpForge(r);
  w.lives += 1;
  w.maxLives += 1;
  w.pendingEngrave = false;
  w.message = `${n.card.name} engraved. This frame is permanently stronger.`;
  if ((w.wave + 1) % LOOP_WAVES === 0) beginLoopGate(w);
  else afterShop(w);
  checkpoint(w);
  return true;
}

export function beginLoopGate(w) {
  w.phase = "loop";
  w.won = true;
  w.paused = false;
  w.pickPause = false;
  w.holdT = 0;
  w.pendingStamp = false;
  w.pendingRoundPack = false;
  w.message = "Home held. Keep flying or return.";
  w.announce = "You held 12";
  w.announceT = 2.2;
  w.uiDirty = true;
  audio.play("win");
  checkpoint(w);
}

export function keepFlying(w) {
  w.endless = true;
  w.playMode = "arcade";
  w.phase = "combat";
  w.paused = false;
  w.pickPause = false;
  w.grade = null;
  w.wave += 1;
  w.holdT = 1.5;
  w.announce = "Keep flying";
  w.announceT = 2;
  w.message = "Keep flying. Hold as long as you can.";
  w.uiDirty = true;
  checkpoint(w);
}

function liftGuns(w) {
  for (const r of w.roster) {
    if (r.placedPad === HOME_PAD) continue;
    if (r.card.kind === "companion") continue;
    r.placedPad = null;
    r.freePlace = true;
  }
}

function resetWatchRank(w) {
  w.runLevel = START_LEVEL;
  w.xp = 0;
  w.pendingLevels = 0;
  w.roundXp = 0;
  w.climb = emptyClimb();
}

export function beginNextWatch(w) {
  const prevMap = w.mapId;
  liftGuns(w);
  resetWatchRank(w);
  rollNewSector(w, true, prevMap);
  w.wave += 1;
  w.grade = null;
  w.pendingEngrave = false;
  w.pendingStamp = false;
  w.pendingRoundPack = false;
  w.swapTokens = Math.max(w.swapTokens ?? 0, START_SWAP);
  w.selectedPad = null;
  w.selectedCard = null;
  w.paused = false;
  w.pickPause = false;
  w.enemies = [];
  w.projectiles = [];
  w.spawnQ = [];
  w.waveActive = false;
  beginPlacement(w, true);
  const loop = loopOf(w.wave);
  w.message = "The lane shifted. Moons are already there. Plant again. They'll be back.";
  if (loop >= 1) {
    w.announce = loop === 1 ? "Needles run faster" : "More Hulks this loop";
    w.announceT = 2.2;
  }
}

export function goTitle(w, keep: boolean): boolean {
  markLive(false);
  w.paused = false;
  w.pickPause = false;
  w.waveActive = false;
  if (!keep) {
    if ((w.points ?? 0) > 0) {
      bankFlux(w, w.points);
      w.points = 0;
    }
    if (!w.recorded) {
      recordRun({
        wave: w.wave,
        grade: w.grade?.grade ?? w.lastGrade ?? "F",
        level: w.runLevel,
        loops: Math.floor(w.wave / LOOP_WAVES),
      });
      w.recorded = true;
    }
    clearRun();
    const next = createWorld();
    Object.assign(w, next);
    w.enemies = [];
    w.projectiles = [];
    w.fx = [];
    w.phase = "title";
    w.uiDirty = true;
    return false;
  }
  if (w.phase === "combat") {
    w.phase = "placement";
    w.enemies = [];
    w.projectiles = [];
    w.spawnQ = [];
    w.nades = [];
    w.bores = [];
  }
  saveRun({ ...snapshotRun(w), parked: true });
  w.phase = "title";
  w.parked = true;
  w.uiDirty = true;
  return true;
}

export function checkpoint(w) {
  if (w.phase === "title" || w.phase === "defeat" || w.phase === "victory") return;
  w.parked = false;
  saveRun({ ...snapshotRun(w), parked: false });
  markLive(true);
}

function snapshotRun(w) {
  return {
    v: 4,
    wave: w.wave,
    points: w.points,
    lives: w.lives,
    maxLives: w.maxLives,
    phase: w.phase,
    playMode: w.playMode === "arcade" ? "arcade" : "story",
    parked: !!w.parked,
    roster: w.roster.map((r) => ({
      uid: r.uid,
      card: r.card,
      placedPad: r.placedPad,
      level: r.level,
      invested: r.invested,
      mod: r.mod,
      aim: r.aim,
      tuneJob: r.tuneJob ?? null,
      tuneCap: r.tuneCap ?? null,
      jobs: r.jobs ?? [],
      jobSlots: r.jobSlots ?? PARAMS.jobSlotsStart,
      heatXp: r.heatXp ?? 0,
      trick: r.trick ?? null,
      trickOffer: r.trickOffer ?? [],
      specials: r.specials ?? [],
      specialOffer: r.specialOffer ?? [],
      parts: r.parts ?? [],
      partOffer: r.partOffer ?? [],
      extraShot: !!r.extraShot,
      kills: r.kills ?? 0,
      shots: r.shots ?? 0,
      heals: r.heals ?? 0,
    })),
    relics: w.relics,
    environment: w.environment,
    extraPicks: w.extraPicks,
    rateMul: w.rateMul,
    killGoldMul: w.killGoldMul,
    draftBump: w.draftBump,
    openingStep: w.openingStep,
    pendingEngrave: w.pendingEngrave,
    draftCards: w.draftCards,
    draftTitle: w.draftTitle,
    draftSub: w.draftSub,
    draftKind: w.draftKind,
    draftPicksLeft: w.draftPicksLeft,
    draftOdds: w.draftOdds,
    envSlowMul: w.envSlowMul,
    envPoisonDps: w.envPoisonDps,
    envChipDps: w.envChipDps,
    envShred: w.envShred,
    envDmgAmp: w.envDmgAmp,
    forge: w.forge,
    pendingPart: w.pendingPart,
    resumePhase: w.resumePhase,
    lootQueued: w.lootQueued,
    runLevel: w.runLevel,
    xp: w.xp,
    roundXp: w.roundXp ?? 0,
    pendingLevels: w.pendingLevels,
    lastGrade: w.lastGrade,
    grade: w.grade ?? null,
    draftLane: w.draftLane,
    pendingStamp: w.pendingStamp,
    packHeat: w.packHeat,
    packPity: w.packPity,
    packRarity: w.packRarity,
    packMode: w.packMode,
    cutId: w.cutId,
    mysteryQueue: w.mysteryQueue,
    pendingRoundPack: w.pendingRoundPack,
    signals: w.signals ?? [],
    endless: !!w.endless,
    ghostHullUsed: !!w.ghostHullUsed,
    gems: w.gems,
    charms: w.charms,
    merchantPity: w.merchantPity,
    pendingMerchant: w.pendingMerchant,
    mapId: w.mapId,
    mapTheme: w.mapTheme,
    mapLayout: w.mapLayout,
    mapSlowMul: w.mapSlowMul,
    mapRangeMul: w.mapRangeMul,
    mapScrapMul: w.mapScrapMul,
    mapPads: w.mapPads,
    mapBurn: w.mapBurn,
    stickers: w.stickers,
    companion: (w.companions ?? [])[0] ? { card: (w.companions ?? [])[0].card, kits: (w.companions ?? [])[0].kits } : null,
    companions: (w.companions ?? []).map((c) => ({
      card: c.card,
      kits: c.kits,
      placedPad: c.placedPad,
      runLevel: c.runLevel ?? 1,
      runXp: c.runXp ?? 0,
      trick: c.trick ?? null,
      trickOffer: c.trickOffer ?? [],
      specials: c.specials ?? [],
      specialOffer: c.specialOffer ?? [],
      parts: c.parts ?? [],
      partOffer: c.partOffer ?? [],
      clone: !!c.clone,
    })),
    runKills: w.runKills ?? 0,
    runLeaks: w.runLeaks ?? 0,
    shotsFired: w.shotsFired ?? 0,
    upgradesMade: w.upgradesMade ?? 0,
    wavesCleared: w.wavesCleared ?? 0,
    swapTokens: w.swapTokens ?? START_SWAP,
    swapPity: w.swapPity ?? 0,
    skipCharge: w.skipCharge ?? 0,
    lastPackGem: w.lastPackGem ?? null,
    lastPackKind: w.lastPackKind ?? null,
    packGift: w.packGift ?? null,
    lastPackGift: w.lastPackGift ?? null,
    pendingCompensate: w.pendingCompensate ?? null,
    bansThisRound: w.bansThisRound ?? 0,
    runBanned: w.runBanned ?? [],
    climb: w.climb ?? emptyClimb(),
  };
}

function fallbackGrade(w) {
  const g = w.lastGrade ?? "B";
  const stars = g === "S" ? 5 : g === "A" ? 4 : g === "B" ? 3 : g === "C" ? 2 : 1;
  return {
    grade: g,
    stars,
    leaks: w.roundLeaks ?? 0,
    kills: w.roundKills ?? 0,
    gold: w.roundGold ?? 0,
    duration: w.roundTime ?? 0,
    points: 0,
    odds: oddsForGrade(g, luckOf(w)),
  };
}

export function unstickWorld(w) {
  if (!w) return false;
  if (w.phase === "title" || w.phase === "defeat" || w.phase === "victory" || w.phase === "help") return false;
  if (w.phase === "shop" && !w.grade) {
    w.grade = fallbackGrade(w);
    w.uiDirty = true;
    return true;
  }
  if ((w.phase === "draft" || w.phase === "opening" || w.phase === "loot") && !(w.draftCards && w.draftCards.length)) {
    if (refillEmptyPack(w)) {
      w.uiDirty = true;
      return true;
    }
    finishDraftStep(w);
    return true;
  }
  if (w.phase === "fit") {
    w.pendingPart = null;
    afterShop(w);
    return true;
  }
  if (w.phase === "engrave") {
    const guns = w.roster.filter((r) => r.placedPad && r.card.kind !== "socket");
    if (!guns.length) {
      w.pendingEngrave = false;
      afterShop(w);
      return true;
    }
  }
  if (w.phase === "combat" && w.holdT <= 0 && w.waveActive) {
    const live = (w.enemies ?? []).some((e) => e.alive);
    if (!live && (w.spawnQ ?? []).length === 0) {
      finishWave(w);
      return true;
    }
  }
  return false;
}

export function applyRun(w, run) {
  w.wave = run.wave;
  w.points = run.points;
  w.lives = run.lives;
  w.maxLives = run.maxLives;
  w.phase = run.phase === "combat" ? "placement" : run.phase;
  w.playMode = isPlayMode(run.playMode) ? run.playMode : "story";
  w.roster = run.roster.map((r) =>
    hydrateGun({
      ...r,
      cd: 0,
      freePlace: false,
      aim: r.aim ?? 0,
      tuneJob: r.tuneJob ?? null,
      tuneCap: r.tuneCap ?? null,
      jobs: r.jobs ?? [r.tuneJob, r.tuneCap].filter(Boolean),
      jobSlots: r.jobSlots ?? PARAMS.jobSlotsStart,
      heatXp: r.heatXp ?? 0,
      trick: r.trick ?? null,
      trickOffer: r.trickOffer ?? [],
      specials: r.specials ?? [],
      specialOffer: r.specialOffer ?? [],
      parts: r.parts ?? [],
      partOffer: r.partOffer ?? [],
      extraShot: !!r.extraShot,
      kills: r.kills ?? 0,
      shots: r.shots ?? 0,
      heals: r.heals ?? 0,
    }),
  );
  w.relics = run.relics;
  w.environment = run.environment;
  w.environmentId = run.environment?.templateId ?? null;
  w.extraPicks = run.extraPicks;
  w.rateMul = run.rateMul;
  w.killGoldMul = run.killGoldMul;
  w.draftBump = run.draftBump;
  w.openingStep = run.openingStep;
  w.pendingEngrave = run.pendingEngrave;
  w.draftCards = run.draftCards ?? [];
  w.draftTitle = run.draftTitle ?? "";
  w.draftSub = run.draftSub ?? "";
  w.draftKind = run.draftKind ?? null;
  w.draftPicksLeft = run.draftPicksLeft ?? 0;
  w.draftOdds = run.draftOdds ?? { ...OPENING_ODDS };
  w.envSlowMul = run.envSlowMul;
  w.envPoisonDps = run.envPoisonDps;
  w.envChipDps = run.envChipDps;
  w.envShred = run.envShred;
  w.envDmgAmp = run.envDmgAmp;
  w.forge = run.forge ?? loadMeta().forge;
  w.pendingPart = run.pendingPart ?? null;
  w.resumePhase = run.resumePhase ?? null;
  w.lootQueued = run.lootQueued ?? 0;
  w.runLevel = run.runLevel ?? 1;
  w.xp = run.xp ?? 0;
  w.roundXp = run.roundXp ?? 0;
  w.pendingLevels = run.pendingLevels ?? 0;
  w.lastGrade = run.lastGrade ?? null;
  w.grade = run.grade ?? null;
  w.draftLane = run.draftLane ?? "open";
  w.pendingStamp = run.pendingStamp ?? false;
  w.packHeat = run.packHeat ?? null;
  w.packPity = run.packPity ?? 0;
  w.packRarity = run.packRarity ?? packRarityOf(run.draftCards ?? []);
  w.packMode = run.packMode ?? "show";
  w.cutId = run.cutId ?? null;
  w.mysteryQueue = run.mysteryQueue ?? 0;
  w.pendingRoundPack = run.pendingRoundPack ?? false;
  w.signals = run.signals ?? [];
  w.endless = !!run.endless;
  w.ghostHullUsed = !!run.ghostHullUsed;
  w.gems = run.gems ?? emptyGems();
  w.charms = run.charms ?? [];
  w.merchantPity = run.merchantPity ?? 0;
  w.pendingMerchant = run.pendingMerchant ?? false;
  w.mapId = run.mapId ?? null;
  w.mapTheme = run.mapTheme ?? null;
  w.mapLayout = run.mapLayout ?? layoutForMap(w.mapId);
  setMapLayout(w.mapLayout);
  w.mapSlowMul = run.mapSlowMul ?? 1;
  w.mapRangeMul = run.mapRangeMul ?? 1;
  w.mapScrapMul = run.mapScrapMul ?? 1;
  w.mapPads = run.mapPads ?? 0;
  w.mapBurn = run.mapBurn ?? 0;
  w.stickers = run.stickers ?? [];
  w.nades = [];
  w.bores = [];
  w.padBuff = {};
  w.gunKills = {};
  w.skin = loadMeta().equipped ?? "stock";
  w.runKills = run.runKills ?? 0;
  w.runLeaks = run.runLeaks ?? 0;
  w.shotsFired = run.shotsFired ?? 0;
  w.upgradesMade = run.upgradesMade ?? 0;
  w.wavesCleared = run.wavesCleared ?? 0;
  w.swapTokens = run.swapTokens ?? START_SWAP;
  w.swapPity = run.swapPity ?? 0;
  w.swapToast = false;
  w.skipCharge = run.skipCharge ?? 0;
  w.lastPackGem = run.lastPackGem ?? null;
  w.lastPackKind = run.lastPackKind ?? null;
  w.packGift = run.packGift ?? packGiftOf(run.draftCards ?? []);
  w.lastPackGift = run.lastPackGift ?? w.packGift ?? null;
  w.pendingCompensate = run.pendingCompensate ?? null;
  w.draftCompensate = false;
  w.bansThisRound = run.bansThisRound ?? 0;
  w.runBanned = run.runBanned ?? [];
  w.climb = run.climb ?? emptyClimb();
  w.parked = false;
  {
    const meta = loadMeta();
    const hangar = hangarOf(meta.hangar);
    w.hangarPads = hangar.pad;
    w.hangarLuck = hangar.luck;
    w.flux = meta.flux ?? 0;
    w.fluxEarned = 0;
    applyVault(w);
  }
  w.companions = [];
  const savedCrafts =
    run.companions ??
    (run.companion?.card ? [{ card: run.companion.card, kits: run.companion.kits ?? [], placedPad: SKY_PAD }] : []);
  const rosterCrafts = w.roster.filter((r) => r.card.kind === "companion");
  if (rosterCrafts.length) {
    for (const r of rosterCrafts) {
      const match =
        savedCrafts.find((s) => s.card.id === r.card.id || s.card.templateId === r.card.templateId) ?? savedCrafts[0];
      const role = r.card.companion?.role ?? "hunter";
      const hpMax = companionMaxHp(role);
      const wantSky = r.placedPad === SKY_PAD || r.placedPad == null && (match?.placedPad ?? SKY_PAD) === SKY_PAD;
      const flying = wantSky && skyCrafts(w).length < MAX_COMPANIONS;
      const pad = flying ? SKY_PAD : null;
      r.placedPad = pad;
      w.companions.push({
        uid: r.uid,
        card: r.card,
        x: BASE.x - 80,
        y: BASE.y - 20,
        hdg: Math.PI,
        cd: 0.4,
        tauntT: 1.2,
        bubble: null,
        bubbleT: 0,
        kits: match?.kits ?? [],
        bob: 0,
        padI: 0,
        hp: hpMax,
        hpMax,
        specialCd: 1.6,
        commandX: 0,
        commandY: 0,
        commandT: 0,
        down: false,
        home: false,
        crit: false,
        healPulse: 0,
        placedPad: pad,
        runLevel: match?.runLevel ?? 1,
        runXp: match?.runXp ?? 0,
        trick: match?.trick ?? null,
        trickOffer: match?.trickOffer ?? [],
        specials: match?.specials ?? [],
        specialOffer: match?.specialOffer ?? [],
        parts: match?.parts ?? [],
        partOffer: match?.partOffer ?? [],
        clone: !!match?.clone,
      });
    }
  } else {
    for (const s of savedCrafts) {
      const c = spawnCompanion(w, s.card);
      c.kits = s.kits ?? [];
      c.runLevel = s.runLevel ?? 1;
      c.runXp = s.runXp ?? 0;
      c.trick = s.trick ?? null;
      c.trickOffer = s.trickOffer ?? [];
      c.specials = s.specials ?? [];
      c.specialOffer = s.specialOffer ?? [];
      c.parts = s.parts ?? [];
      c.partOffer = s.partOffer ?? [];
      c.clone = !!s.clone;
    }
  }
  applyStamps(w);
  w.uid = run.roster.length + 8;
  w.paused = false;
  w.pickPause = false;
  w.holdT = 0;
  w.hitstop = 0;
  w.enemies = [];
  w.projectiles = [];
  w.spawnQ = [];
  w.waveActive = false;
  if (w.phase === "placement") {
    const firstGun = w.roster.find((x) => x.card.kind === "tower" && !x.placedPad);
    w.selectedCard = firstGun?.uid ?? null;
    w.message = firstGun
      ? "Tap a glowing moon."
      : fieldedTowers(w).length
        ? "Hit Defend."
        : w.message;
  }
  unstickWorld(w);
  w.uiDirty = true;
}

export function debugWipeEnemies(w) {
  for (const e of w.enemies) {
    if (!e.alive) continue;
    e.alive = false;
    w.kills += 1;
  }
  w.spawnQ = [];
}

export { PADS, PATHS, WAVES, LOOP_WAVES };
