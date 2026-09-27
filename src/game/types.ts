import type { PartRoll } from "./data/parts";

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type Grade = "S" | "A" | "B" | "C" | "D" | "F";
export type CardKind =
  | "environment"
  | "defender"
  | "tower"
  | "relic"
  | "part"
  | "stamp"
  | "socket"
  | "map"
  | "sticker"
  | "companion"
  | "kit"
  | "climb"
  | "set"
  | "signal";
export type ThemeId = "water" | "earth" | "space";
export type PlayMode = "story" | "arcade";
export type SetId = "heat" | "cold" | "spark" | "iron";
export type OpId = "mul" | "add" | "raise" | "take";
export type PackMode = "show" | "mystery" | "cut";
export type DraftLane = "open" | "level" | "round" | "part" | "loot" | "stamp";
export type PackHeat = "quiet" | "live" | "peak" | "nova";
export type PackGift = "road" | "freeze" | "jump" | "peel";
export type GemId = "ruby" | "emerald" | "sapphire" | "diamond";
export type PadLook = "plain" | "ring" | "pair" | "rift";
export type PadZone = "orbit" | "nadir" | "zenith" | "merge";
export type CoverShape = "circle" | "cone" | "ring" | "lane" | "diamond";
export type TowerRole =
  | "spear"
  | "crater"
  | "frost"
  | "rail"
  | "scour"
  | "umbra"
  | "cascade"
  | "sweep"
  | "brand"
  | "beam"
  | "hook"
  | "kiln"
  | "mine"
  | "pulse"
  | "split"
  | "wall"
  | "bounce"
  | "orbit";
export type TowerHull =
  | "mast"
  | "mortar"
  | "crystal"
  | "rail"
  | "saw"
  | "dish"
  | "coil"
  | "fan"
  | "stamp"
  | "lens"
  | "crane"
  | "furnace"
  | "drill"
  | "drum"
  | "twin"
  | "barrier"
  | "prism"
  | "halo"
  | "cone"
  | "invert"
  | "mill"
  | "spin"
  | "tube";
export type SimSpeed = 1 | 2 | 3;
export type CompanionRole = "ship" | "orb" | "hunter" | "rocket" | "jet" | "medic" | "puck" | "borer" | "ufo" | "racer" | "spinner" | "lens";
export type SkinId = "stock" | "chrome" | "ember" | "ion" | "gold" | "void";
export type Phase =
  | "title"
  | "help"
  | "opening"
  | "placement"
  | "combat"
  | "shop"
  | "merchant"
  | "draft"
  | "loot"
  | "fit"
  | "engrave"
  | "loop"
  | "victory"
  | "defeat";

export type ProjectileKind = "arrow" | "ember" | "frost" | "hex" | "spark" | "none";
export type EnemyType = "grunt" | "striker" | "plate" | "swarm" | "colossus" | "titan" | "cache" | "dart" | "medic";

export type Vec = { x: number; y: number };

export type TowerStats = {
  damage: number;
  rate: number;
  range: number;
  projectile: ProjectileKind;
  cover?: CoverShape;
  coverArc?: number;
  coverInner?: number;
  splash?: number;
  slowMul?: number;
  slowT?: number;
  chain?: number;
  auraDps?: number;
  shred?: number;
  markGold?: number;
  burnDps?: number;
  bend?: number;
  role?: TowerRole;
  hull?: TowerHull;
  tribe?: SetId;
  knock?: number;
  nova?: number;
  mines?: boolean;
  beam?: boolean;
  split?: number;
  healAura?: number;
  shock?: number;
  lure?: number;
  poisonDps?: number;
  sendHome?: number;
  dockPatch?: { pct: number; rest: number; yank?: number; split?: boolean };
  healPulse?: { pct: number; period: number };
};

export type EnvEffect = {
  slowMul?: number;
  poisonDps?: number;
  chipDps?: number;
  shred?: number;
  dmgAmp?: number;
};

export type PartEffect = {
  damageMul?: number;
  rateMul?: number;
  rangeMul?: number;
  splash?: number;
  chain?: number;
  slowMul?: number;
  slowT?: number;
  shred?: number;
  burnDps?: number;
  auraMul?: number;
  markGold?: number;
  bend?: number;
};

export type PadEffect = {
  rangeMul?: number;
  rateMul?: number;
  splash?: number;
  slowMul?: number;
  slowR?: number;
  burnDps?: number;
  shred?: number;
  killGold?: number;
  gemMul?: number;
};

export type MapEffect = {
  theme: ThemeId;
  slowMul?: number;
  rangeMul?: number;
  scrapMul?: number;
  pads?: number;
  burn?: number;
  goldMul?: number;
};

export type CompanionEffect = {
  role: CompanionRole;
  dps: number;
  radius: number;
  slowMul?: number;
  shred?: number;
  goldMul?: number;
  coreGuard?: number;
  tauntRate: number;
  intercept?: number;
  buffRate?: number;
  heal?: number;
  knock?: number;
  burnDps?: number;
  cutDps?: number;
  cutSlow?: number;
};

export type KitEffect = {
  craftId?: string;
  dpsMul?: number;
  radiusMul?: number;
  slowMul?: number;
  goldMul?: number;
  tauntMul?: number;
  coreGuard?: number;
  interceptMul?: number;
  buffMul?: number;
  healMul?: number;
  cutDps?: number;
  cutSlow?: number;
  specialPeriodMul?: number;
  knockMul?: number;
  hpMul?: number;
  shred?: number;
  burnDps?: number;
  speedMul?: number;
};

export type StickerEffect = {
  gold?: number;
  lives?: number;
  rateMul?: number;
  draftBump?: number;
  nextWaveDmg?: number;
  killGold?: number;
  shred?: number;
  chipDps?: number;
};

export type CharmDef = {
  id: string;
  name: string;
  blurb: string;
  rounds: number;
  cost: Partial<Record<GemId, number>>;
  rateMul?: number;
  pointMul?: number;
  gemMul?: number;
  slowMul?: number;
  fireRain?: number;
  meteor?: number;
};

export type ActiveCharm = {
  id: string;
  name: string;
  rounds: number;
  rateMul?: number;
  pointMul?: number;
  gemMul?: number;
  slowMul?: number;
  fireRain?: number;
  meteor?: number;
};

export type CardDef = {
  id: string;
  name: string;
  kind: CardKind;
  rarity: Rarity;
  art: string;
  set: SetId | null;
  cost: number;
  blurb: string;
  stats?: TowerStats;
  relic?: RelicEffect;
  env?: EnvEffect;
  part?: PartEffect;
  socket?: PadEffect;
  map?: MapEffect;
  companion?: CompanionEffect;
  kit?: KitEffect;
  sticker?: StickerEffect;
  climb?: { branch: "bay" | "pack" | "crew"; rank: number };
  /** Two gun template ids. Set cards only. */
  setGuns?: string[];
  /** MUT position: Credit Guns Crafts Path Bonus Lives. Never an overall number. */
  role?: string;
};

export type RolledCard = CardDef & {
  templateId: string;
  prefix: string;
  affixes: string[];
  seed: number;
};

export type RelicEffect = {
  gold?: number;
  lives?: number;
  rateMul?: number;
  draftBump?: number;
  nextWaveDmg?: number;
  killGold?: number;
};

export type Pad = {
  id: string;
  x: number;
  y: number;
  zone: PadZone;
  seat?: CoverShape;
  far?: boolean;
  look?: PadLook;
};

export type WaveGroup = {
  type: EnemyType;
  count: number;
  interval: number;
  delay: number;
};

export type WaveDef = {
  name: string;
  groups: WaveGroup[];
  mega?: boolean;
};

export type EnemyDef = {
  hp: number;
  speed: number;
  gold: number;
  armor: number;
  radius: number;
  scale: number;
};

export type RosterItem = {
  uid: string;
  card: RolledCard;
  placedPad: string | null;
  level: number;
  invested: number;
  cd: number;
  freePlace: boolean;
  mod: OpId | null;
  aim: number;
  tuneJob?: string | null;
  tuneCap?: string | null;
  jobs?: string[];
  jobSlots?: number;
  heatXp?: number;
  trick?: string | null;
  trickOffer?: string[];
  specials?: string[];
  specialOffer?: string[];
  appearT?: number;
  patchCd?: number;
  pulseT?: number;
  glowCd?: number;
  overclockT?: number;
  overclockLit?: boolean;
  streak?: number;
  ultT?: number;
  parts?: PartRoll[];
  partOffer?: PartRoll[];
  extraShot?: boolean;
  kills?: number;
  shots?: number;
  heals?: number;
  levelPop?: number;
};

export type GradeResult = {
  grade: Grade;
  stars: number;
  leaks: number;
  kills: number;
  gold: number;
  duration: number;
  points: number;
  flux?: number;
  odds: Record<Rarity, number>;
};

export type HangarId = "life" | "gold" | "luck" | "pad";
export type HangarRanks = Record<HangarId, number>;

export type MetaSave = {
  v: 4;
  runs: number;
  loops: number;
  bestWave: number;
  lastGrade: Grade | null;
  forge: Record<string, number>;
  bestLevel: number;
  stamps: string[];
  gunKills: Record<string, number>;
  leakless: number;
  unlocked: SkinId[];
  equipped: SkinId;
  flux: number;
  hangar: HangarRanks;
  boughtSkins: SkinId[];
  orbitXp?: number;
  vault?: { outfit: number; bay: number; armory: number; sky?: number; myth?: number; ownedIds: string[] };
  tutorialDone?: boolean;
  tutorialSkipped?: boolean;
  /** Last build that wrote this save. Old saves stay valid. */
  build?: string;
};

export type ProfileSlot = {
  id: number;
  boundId: string | null;
  xp: number;
  jobs: number;
};

export type ProfilesSave = {
  v: 1;
  active: number;
  slots: ProfileSlot[];
};

export type RunSave = {
  v: 2 | 3 | 4;
  wave: number;
  points: number;
  lives: number;
  maxLives: number;
  phase: Phase;
  /** True when the player parked on Title on purpose. Remounts must not yank them back in. */
  parked?: boolean;
  playMode?: PlayMode;
  roster: Array<{
    uid: string;
    card: RolledCard;
    placedPad: string | null;
    level: number;
    invested: number;
    mod: OpId | null;
    aim?: number;
    tuneJob?: string | null;
    tuneCap?: string | null;
    jobs?: string[];
    jobSlots?: number;
    heatXp?: number;
    trick?: string | null;
    trickOffer?: string[];
    specials?: string[];
    specialOffer?: string[];
    parts?: PartRoll[];
    partOffer?: PartRoll[];
    extraShot?: boolean;
    kills?: number;
    shots?: number;
    heals?: number;
  }>;
  relics: string[];
  environment: RolledCard | null;
  extraPicks: number;
  rateMul: number;
  killGoldMul: number;
  draftBump: number;
  openingStep: number;
  pendingEngrave: boolean;
  draftCards: RolledCard[];
  draftTitle: string;
  draftSub: string;
  draftKind: CardKind | null;
  draftPicksLeft: number;
  draftOdds: Record<Rarity, number>;
  envSlowMul: number;
  envPoisonDps: number;
  envChipDps: number;
  envShred: number;
  envDmgAmp: number;
  forge: Record<string, number>;
  pendingPart: RolledCard | null;
  resumePhase: Phase | null;
  lootQueued: number;
  runLevel: number;
  xp: number;
  pendingLevels: number;
  lastGrade: Grade | null;
  grade?: GradeResult | null;
  draftLane: DraftLane;
  pendingStamp: boolean;
  packHeat: PackHeat | null;
  packPity: number;
  packRarity: Rarity | null;
  packMode?: PackMode;
  cutId?: string | null;
  mysteryQueue?: number;
  pendingRoundPack?: boolean;
  signals?: string[];
  endless?: boolean;
  ghostHullUsed?: boolean;
  gems: Record<GemId, number>;
  charms: ActiveCharm[];
  merchantPity: number;
  pendingMerchant: boolean;
  mapId?: string | null;
  mapTheme?: ThemeId | null;
  mapLayout?: string;
  mapSlowMul?: number;
  mapRangeMul?: number;
  mapScrapMul?: number;
  mapPads?: number;
  mapBurn?: number;
  stickers?: RolledCard[];
  companion?: {
    card: RolledCard;
    kits: RolledCard[];
  } | null;
  companions?: Array<{
    card: RolledCard;
    kits: RolledCard[];
    placedPad?: string | null;
    runLevel?: number;
    runXp?: number;
    trick?: string | null;
    trickOffer?: string[];
    specials?: string[];
    specialOffer?: string[];
    parts?: PartRoll[];
    partOffer?: PartRoll[];
    clone?: boolean;
  }>;
  runKills?: number;
  runLeaks?: number;
  shotsFired?: number;
  upgradesMade?: number;
  wavesCleared?: number;
  swapTokens?: number;
  swapPity?: number;
  skipCharge?: number;
  lastPackGem?: Rarity | null;
  lastPackKind?: CardKind | null;
  packGift?: PackGift | null;
  lastPackGift?: PackGift | null;
  pendingCompensate?: "kit" | "companion" | null;
  bansThisRound?: number;
  runBanned?: string[];
  climb?: { bay: number; pack: number; crew: number };
};

export type LiveOffer = {
  cards: RolledCard[];
  t: number;
  ttl: number;
  title: string;
};

export type OpeningRound = {
  kind: CardKind;
  title: string;
  sub: string;
  picks?: number;
  heroes?: boolean;
};

export type SetBonusLine = {
  id: SetId;
  name: string;
  count: number;
  text: string;
};
