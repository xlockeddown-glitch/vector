/**
 * Live knobs. Edit here. Dictionary names in `.grok/references/operator-dictionary.md`.
 * Constants re-export these so the rest of the game stays stable.
 */
export const PARAMS = {
  /** "lives" */
  lives: 10,
  /** "Credit" at the start of a game — now Vault Starter credit */
  goldStart: 0,
  /** "crafts in the air" */
  craftsFly: 3,
  /** "opening packs" — set, 3 guns, 2 Signals. Main craft already flying. */
  openingPicks: 6,
  /** "waves in a round" */
  wavesPerRound: 3,
  /** "pads" — 8 start, 11 max. Fuse frees a pad. */
  padsStart: 8,
  padsMax: 11,
  /** "swaps" */
  swapsStart: 2,
  swapsMax: 3,
  /** "pack size" — Arena: 3 cards, take 1 */
  packSize: 3,
  swapRate: 0.1,
  swapPity: 8,
  megaEvery: 6,
  extraPicksMax: 0,
  draftPickCost: 40,
  /** Craft mastery. Job points to unlock skill 1 / 2 / 3. */
  masteryNeed: [8, 20, 36],
  /** Orbit. Forever rank. Paint only. ~12–16 runs to Lord. */
  orbitNeed: [0, 8, 20, 40, 64],
  orbitGrade: { S: 10, A: 7, B: 5, C: 3, D: 2, F: 1 },
  /** Vault Credit. A full Arena win banks ~90–130. First vault buy ~2–3 wins. Myth ~20+. */
  fluxGrade: { S: 22, A: 14, B: 9, C: 6, D: 4, F: 1 },
  fluxKillEvery: 8,
  fluxClean: 5,
  goldPerFlux: 25,
  keepCost: { life: 220, gold: 200, luck: 380, pad: 320 },
  skinCost: { chrome: 1800, ember: 3200, ion: 4200, gold: 5600, void: 7200 },
  /** Main craft. 50 levels. 1→36 takes as long as 36→50. ~15% longer grind. */
  bondMax: 50,
  bondSplit: 36,
  bondBase: 25,
  bondGrow: 1.041,
  /** Crafts tickle off gun cover. */
  coverHuntMul: 0.35,
  /** Craft over a gun lights it. Boost lights nearby crafts too. */
  overclockMul: 1.28,
  /** Boost lights a craft inside this. */
  overclockCraftR: 62,
  /** Knock cannot pin at the gate. Fraction of the lane. */
  knockFloor: 0.04,
  /** Extra knocks fade. */
  knockFade: 0.38,
  /** Quiet gun glow. Puddle vs shade. Dish uses the full shade. */
  glowTick: 0.35,
  glowRMul: 0.42,
  /** Packs rage up to this extra speed. */
  rageCap: 0.55,
  /** Gold pips. Slam every this many gun kills. */
  ultEvery: 3,
  /** Arena Level cap. Picks at 2 / 4 / 6 / 8 / 10. */
  gunLevelMax: 10,
  /** Endless Level cap. Soft extra hurt after the five gun picks. */
  heatMaxEndless: 24,
  /** Arena craft Level cap. Specials at 3 / 6 / 9. Endless keeps going. */
  craftLevelMax: 9,
  /** Kills to raise Level 1→2. A little slower so specials feel earned. */
  heatBase: 14,
  heatGrow: 1.22,
  /** Gold job slots on a new gun. Two lines. Five picks. */
  jobSlotsStart: 5,
  /** Combine opens more, up to this. Mode + two branches of 3. */
  jobSlotsMax: 7,
  /** A gun walks this many job lines. */
  jobBranchesMax: 2,
  /** Engrave extra hurt per loop. Was 0.06. Level now carries the climb. */
  forgeDmg: 0.03,
  /** Friend crafts. Extra bite per round. */
  craftHeatPerRound: 0.035,
  /** Worked flying rounds per rung. First specials take real jobs. */
  craftLevelNeed: [3, 3, 2, 2, 2, 1, 1, 1, 1],
  /** After a loop. Needles / Darts run this much faster per loop. */
  raidLoopSpeed: 0.12,
  /** After a loop. Plates gain this much armor per loop. */
  raidLoopArmor: 0.08,
  /** Grenades wait until this far along the path. */
  nadeLate: 0.58,
  /** Empty moon radius. Occupied moons use moonRHot. */
  moonR: 18,
  moonRHot: 26,
  /** Home planet radius. */
  homeR: 66,
  /** Brief freeze when a gun or craft levels. */
  levelHitStop: 0.55,
  /** Camera punch on Level-up. */
  levelTrauma: 0.85,
  /** Burst ring size on Level-up. */
  levelRing: 160,
  /** Floating LEVEL text size. */
  levelFloatSize: 36,
} as const;

export type ParamKey = keyof typeof PARAMS;
