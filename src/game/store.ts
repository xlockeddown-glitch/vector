import { create } from "zustand";
import { HOME_PAD, LOOP_WAVES, SKY_PAD, TOTAL_ROUNDS, WAVES_PER_ROUND, xpToNext, levelDraftBump, levelExtraPicks } from "./constants";
import { countSets, emptySets, setLines } from "./data/sets";
import { lordFlags } from "./data/lords";
import { climbFx, climbSummary, emptyClimb } from "./data/climb";
import { emptyGems } from "./data/charms";
import { themeAt } from "./data/themes";
import { storyWatchLine } from "./data/modes";
import { waveAt } from "./data/waves";
import { loadMeta, loadRun, loadProfiles } from "./persist";
import { fieldedTowers, padCap, scrapValue as scrapOf, socketOnPad, coverPct, bonusPct, inspectGun, type World } from "./sim";
import { displayName } from "./data/glossary";
import { companionSpecialOf, companionFx } from "./data/companion";
import { specialCards } from "./data/specials";
import { getCard } from "./data/cards";
import { SIGNALS, signalToCard } from "./data/signals";
import type { PartRoll } from "./data/parts";
import { dealParts, partOfferWeak } from "./data/parts";
import type {
  ActiveCharm,
  CardDef,
  CardKind,
  DraftLane,
  GemId,
  GradeResult,
  MetaSave,
  ProfilesSave,
  PackHeat,
  PackGift,
  PackMode,
  Phase,
  PlayMode,
  Rarity,
  RolledCard,
  RosterItem,
  SetBonusLine,
  SetId,
  SimSpeed,
} from "./types";

export type CraftHud = {
  uid: string;
  name: string;
  hp: number;
  hpMax: number;
  home: boolean;
  crit: boolean;
  flying: boolean;
  special: string;
  kills: number;
  dmg: number;
  saves: number;
  specials: number;
  heals: number;
  homes: number;
  mastery: number;
  masteryRank: number;
  runLevel: number;
  trick: string | null;
  trickOffer: string[];
  art: string;
  specialIds: string[];
  specialOffer: string[];
  parts: PartRoll[];
  partOffer: PartRoll[];
  clone?: boolean;
};

export type SpecialPickHud = {
  uid: string;
  name: string;
  kind: "gun" | "craft";
  lane: "special" | "part";
  options: { id: string; name: string; blurb: string; pair?: string; rarity?: string }[];
};

export type InspectHud = {
  uid: string;
  name: string;
  kind: "gun" | "craft";
  level: number;
  kills: number;
  shots: number;
  heals: number;
  saves: number;
  hull: number;
  hullMax: number;
  base: string;
  now: string;
  parts: string[];
  specials: string[];
};

export type SignedPick = { id: string; name: string; kind: CardKind; set: SetId | null };

export type HudState = {
  phase: Phase;
  playMode: PlayMode;
  modeLine: string;
  gold: number;
  points: number;
  flux: number;
  fluxEarned: number;
  lives: number;
  maxLives: number;
  wave: number;
  waveName: string;
  waveInRound: number;
  wavesPerRound: number;
  round: number;
  roundInLoop: number;
  loop: number;
  totalRounds: number;
  totalWaves: number;
  extraPicks: number;
  draftTotal: number;
  speed: SimSpeed;
  paused: boolean;
  selectedCard: string | null;
  selectedPad: string | null;
  roster: RosterItem[];
  relics: string[];
  draftCards: CardDef[];
  draftTitle: string;
  draftSub: string;
  draftKind: CardKind | null;
  draftPicksLeft: number;
  draftOdds: Record<Rarity, number>;
  grade: GradeResult | null;
  message: string | null;
  announce: string | null;
  canStart: boolean;
  placedCount: number;
  maxTowers: number;
  remainingPads: number;
  mega: boolean;
  pendingPart: RolledCard | null;
  selectedItem: RosterItem | null;
  selectedCardDef: CardDef | null;
  environmentName: string | null;
  defenderName: string | null;
  themeName: string;
  themeShort: string;
  mapName: string | null;
  companionName: string | null;
  companionHp: number;
  companionHpMax: number;
  companionDown: boolean;
  companionSpecial: string | null;
  crafts: CraftHud[];
  stickerNames: string[];
  themeId: string;
  packMode: PackMode;
  cutId: string | null;
  mysteryQueue: number;
  team: Array<{ key: string; card: CardDef; tag: string; uid?: string }>;
  openingStep: number;
  signed: SignedPick[];
  sets: SetBonusLine[];
  setCounts: Record<SetId, number>;
  pendingEngrave: boolean;
  forge: Record<string, number>;
  runLevel: number;
  xp: number;
  xpNext: number;
  roundXp: number;
  pendingLevels: number;
  bonusSay: string | null;
  climbRanks: { bay: number; pack: number; crew: number };
  fusePartnerUid: string | null;
  fuseNext: number;
  fuseTip: boolean;
  specialPick: SpecialPickHud | null;
  inspect: InspectHud | null;
  tutorialActive: boolean;
  tutorialStep: number;
  tutorialDoneReady: boolean;
  vaultMatchChalk: boolean;
  packGift: PackGift | null;
  draftLane: DraftLane;
  levelBump: number;
  levelPicks: number;
  packHeat: PackHeat | null;
  pendingStamp: boolean;
  scrapValue: number;
  ability: string;
  gems: Record<GemId, number>;
  charms: ActiveCharm[];
  pendingMerchant: boolean;
  lastLeakGate: string | null;
  socketOnSelected: RolledCard | null;
  coverPct: number;
  runKills: number;
  runLeaks: number;
  shotsFired: number;
  upgradesMade: number;
  wavesCleared: number;
  signals: string[];
  signalCards: CardDef[];
  endless: boolean;
  bonusPct: number;
  live: { cards: CardDef[]; left: number; ttl: number; title: string } | null;
  swapTokens: number;
  swapToast: boolean;
  skipCharge: number;
  canSkipPack: boolean;
  canBan: boolean;
  draftCompensate: boolean;
};

function teamOf(w: World): Array<{ key: string; card: CardDef; tag: string; uid?: string }> {
  const out: Array<{ key: string; card: CardDef; tag: string; uid?: string }> = [];
  if (w.mapId) {
    try {
      const m = getCard(w.mapId);
      out.push({ key: "map", card: m, tag: "map" });
    } catch {
      /* skip */
    }
  }
  if (w.environment) out.push({ key: "env", card: w.environment, tag: "weather" });
  for (const r of w.roster) {
    if (r.card.kind === "socket") continue;
    const tag =
      r.placedPad === HOME_PAD
        ? "core"
        : r.card.kind === "companion"
          ? r.placedPad === SKY_PAD
            ? "flying"
            : "bench"
          : r.placedPad
            ? "placed"
            : "bench";
    out.push({ key: r.uid, card: r.card, tag, uid: r.uid });
  }
  for (const s of w.stickers ?? []) out.push({ key: s.id, card: s, tag: "emblem" });
  return out;
}

function fromWorld(w: World): HudState {
  const selectedItem = w.roster.find((r) => r.uid === w.selectedCard) ?? null;
  const padItem = w.roster.find((r) => r.placedPad && r.placedPad === w.selectedPad) ?? null;
  const focus = padItem ?? selectedItem;
  const env = w.environment;
  const def = w.roster.find((r) => r.placedPad === HOME_PAD);
  const theme = themeAt(w.wave, w.mapTheme);
  const signed: SignedPick[] = [];
  const setCards: CardDef[] = [];
  if (w.mapId) {
    try {
      const m = getCard(w.mapId);
      signed.push({ id: m.id, name: m.name, kind: "map", set: m.set });
      setCards.push(m);
    } catch {
      /* unknown map */
    }
  }
  if (env) {
    signed.push({ id: env.id, name: displayName(env), kind: env.kind, set: env.set });
    setCards.push(env);
  }
  for (const c of w.companions ?? []) {
    signed.push({
      id: c.card.id,
      name: displayName(c.card),
      kind: "companion",
      set: c.card.set,
    });
    setCards.push(c.card);
    for (const k of c.kits) {
      if (k.id === "bond-pip") continue;
      signed.push({ id: k.id, name: displayName(k), kind: "kit", set: k.set });
      setCards.push(k);
    }
  }
  for (const s of w.stickers ?? []) {
    signed.push({ id: s.id, name: displayName(s), kind: "sticker", set: s.set });
    setCards.push(s);
  }
  for (const r of w.roster) {
    if (r.card.kind === "companion") continue;
    signed.push({ id: r.uid, name: displayName(r.card), kind: r.card.kind, set: r.card.set });
    setCards.push(r.card);
  }
  const setCounts = countSets(setCards);
  const lords = lordFlags(w.companions, setCounts, climbFx(w.climb).lordLimp);
  const cap = padCap(w);
  const fielded = fieldedTowers(w).length;
  const scrapTarget =
    focus && focus.placedPad !== HOME_PAD && focus.card.kind !== "defender" ? focus : null;
  let mapName: string | null = null;
  if (w.mapId) {
    try {
      mapName = getCard(w.mapId).name;
    } catch {
      mapName = w.mapId;
    }
  }
  return {
    phase: w.phase,
    playMode: w.playMode === "arcade" ? "arcade" : "story",
    modeLine: w.playMode === "arcade" ? `${Math.floor(w.wave / LOOP_WAVES) + 1}` : storyWatchLine(w.wave),
    gold: Math.floor(w.gold),
    points: Math.floor(w.points),
    flux: Math.floor(w.flux ?? 0),
    fluxEarned: Math.floor(w.fluxEarned ?? 0),
    lives: w.lives,
    maxLives: w.maxLives,
    wave: w.wave,
    waveName: waveAt(w.wave).name,
    waveInRound: (w.wave % WAVES_PER_ROUND) + 1,
    wavesPerRound: WAVES_PER_ROUND,
    round: Math.floor(w.wave / WAVES_PER_ROUND) + 1,
    roundInLoop: Math.floor((w.wave % LOOP_WAVES) / WAVES_PER_ROUND) + 1,
    loop: Math.floor(w.wave / LOOP_WAVES) + 1,
    totalRounds: TOTAL_ROUNDS,
    totalWaves: LOOP_WAVES,
    extraPicks: w.extraPicks,
    draftTotal: w.draftTotal,
    speed: w.speed,
    paused: w.paused,
    selectedCard: w.selectedCard,
    selectedPad: w.selectedPad,
    roster: w.roster,
    relics: w.relics,
    draftCards: w.draftCards,
    draftTitle: w.draftTitle,
    draftSub: w.draftSub,
    draftKind: w.draftKind,
    draftPicksLeft: w.draftPicksLeft,
    draftOdds: w.draftOdds,
    grade: w.grade,
    message: w.message,
    announce: w.announce,
    canStart: w.phase === "placement" && fieldedTowers(w).length > 0,
    placedCount: fielded,
    maxTowers: cap,
    remainingPads: Math.max(0, cap - fielded),
    mega: !!waveAt(w.wave).mega,
    pendingPart: w.pendingPart,
    selectedItem: focus,
    selectedCardDef: focus ? focus.card : selectedItem ? selectedItem.card : null,
    environmentName: env ? displayName(env) : null,
    defenderName: def ? displayName(def.card) : null,
    themeName: theme.name,
    themeShort: theme.short,
    mapName,
    companionName: (w.companions ?? []).map((c) => displayName(c.card)).join(" · ") || null,
    companionHp: (w.companions ?? []).find((c) => c.placedPad === SKY_PAD)?.hp ?? 0,
    companionHpMax: (w.companions ?? []).find((c) => c.placedPad === SKY_PAD)?.hpMax ?? 0,
    companionDown: (w.companions ?? []).some((c) => c.home && c.placedPad === SKY_PAD),
    companionSpecial:
      (w.companions ?? [])
        .filter((c) => c.placedPad === SKY_PAD)
        .map((c) => companionSpecialOf(c.card.companion?.role ?? "hunter").name)
        .join(" · ") || null,
    crafts: (w.companions ?? []).map((c) => ({
      uid: c.uid,
      name: displayName(c.card),
      hp: Math.ceil(c.hp),
      hpMax: Math.ceil(c.hpMax),
      home: !!c.home,
      crit: !!c.crit,
      flying: c.placedPad === SKY_PAD,
      special: companionSpecialOf(c.card.companion?.role ?? "hunter").name,
      kills: Math.round(c.roundKills ?? 0),
      dmg: Math.round(c.roundDmg ?? 0),
      saves: Math.round(c.roundSaves ?? 0),
      specials: Math.round(c.roundSpecials ?? 0),
      heals: Math.round(c.roundHeals ?? 0),
      homes: Math.round(c.roundHome ?? 0),
      mastery: Math.round(c.mastery ?? 0),
      masteryRank: c.masteryRank ?? c.kits.length,
      runLevel: c.runLevel ?? 1,
      trick: c.trick ?? null,
      trickOffer: c.trickOffer ?? [],
      art: String(c.card.templateId ?? c.card.id ?? c.card.art ?? ""),
      specialIds: c.specials ?? [],
      specialOffer: c.specialOffer ?? [],
      parts: c.parts ?? [],
      partOffer: c.partOffer ?? [],
      clone: !!c.clone,
    })),
    stickerNames: (w.stickers ?? []).map((s) => displayName(s)),
    openingStep: w.openingStep,
    signed,
    sets: setLines(setCounts, lords.names),
    setCounts,
    pendingEngrave: w.pendingEngrave,
    forge: w.forge,
    runLevel: w.runLevel,
    xp: w.xp,
    xpNext: xpToNext(w.runLevel),
    roundXp: w.roundXp ?? 0,
    pendingLevels: w.pendingLevels,
    bonusSay: (w.bonusSayT ?? 0) > 0 ? (w.bonusSay ?? null) : null,
    climbRanks: w.climb ?? emptyClimb(),
    fusePartnerUid: null,
    fuseNext: 0,
    fuseTip: false,
    specialPick: (() => {
      if (w.phase === "combat") return null;
      const uid = w.selectedCard;
      if (!uid) return null;
      const gun = (w.roster ?? []).find((r) => r.uid === uid && r.card.kind === "tower");
      if (gun && (gun.specialOffer ?? []).length) {
        return {
          uid: gun.uid,
          name: displayName(gun.card),
          kind: "gun" as const,
          lane: "special" as const,
          options: specialCards(gun.specialOffer ?? []).map((s) => ({
            id: s.id,
            name: s.name,
            blurb: s.blurb,
            pair: s.pair,
            rarity: s.uniqueFor ? "rare" : "common",
          })),
        };
      }
      if (gun && (gun.partOffer ?? []).length) {
        if (partOfferWeak(gun.partOffer)) {
          gun.partOffer = dealParts("gun", gun.uid, (gun.parts ?? []).map((p) => p.id), gun.level || 1);
        }
        return {
          uid: gun.uid,
          name: displayName(gun.card),
          kind: "gun" as const,
          lane: "part" as const,
          options: (gun.partOffer ?? []).map((p) => ({
            id: p.id,
            name: p.name,
            blurb: p.blurb,
            rarity: p.rarity,
          })),
        };
      }
      const craft = (w.companions ?? []).find((c) => c.uid === uid);
      if (craft && (craft.specialOffer ?? []).length) {
        return {
          uid: craft.uid,
          name: displayName(craft.card),
          kind: "craft" as const,
          lane: "special" as const,
          options: specialCards(craft.specialOffer ?? []).map((s) => ({
            id: s.id,
            name: s.name,
            blurb: s.blurb,
            pair: s.pair,
            rarity: s.uniqueFor ? "rare" : "common",
          })),
        };
      }
      if (craft && (craft.partOffer ?? []).length) {
        if (partOfferWeak(craft.partOffer)) {
          craft.partOffer = dealParts(
            "craft",
            craft.uid,
            (craft.parts ?? []).map((p) => p.id),
            craft.runLevel || 1,
          );
        }
        return {
          uid: craft.uid,
          name: displayName(craft.card),
          kind: "craft" as const,
          lane: "part" as const,
          options: (craft.partOffer ?? []).map((p) => ({
            id: p.id,
            name: p.name,
            blurb: p.blurb,
            rarity: p.rarity,
          })),
        };
      }
      return null;
    })(),
    inspect: (() => {
      if (w.phase !== "placement" && w.phase !== "combat") return null;
      const uid = w.selectedCard;
      if (!uid) return null;
      if ((w.roster ?? []).some((r) => r.uid === uid && ((r.specialOffer ?? []).length || (r.partOffer ?? []).length))) return null;
      if ((w.companions ?? []).some((c) => c.uid === uid && ((c.specialOffer ?? []).length || (c.partOffer ?? []).length))) return null;
      const gun = (w.roster ?? []).find((r) => r.uid === uid && r.card.kind === "tower" && r.placedPad && r.placedPad !== HOME_PAD);
      if (gun) {
        const parts = (gun.parts ?? []).map((p) => p.name);
        const specs = (gun.specials ?? []).map((id) => specialCards([id])[0]?.name).filter(Boolean) as string[];
        const look = inspectGun(w, gun);
        return {
          uid: gun.uid,
          name: displayName(gun.card),
          kind: "gun" as const,
          level: gun.level || 1,
          kills: Math.round(gun.kills ?? 0),
          shots: Math.round(gun.shots ?? 0),
          heals: Math.round(gun.heals ?? 0),
          saves: 0,
          hull: 0,
          hullMax: 0,
          base: look.base,
          now: look.now,
          parts,
          specials: specs,
        };
      }
      const craft = (w.companions ?? []).find((c) => c.uid === uid && c.placedPad === SKY_PAD);
      if (craft) {
        const base = craft.card.companion;
        const nowFx = companionFx(craft.card, craft.kits ?? []);
        const parts = (craft.parts ?? []).map((p) => p.name);
        const specs = (craft.specials ?? []).map((id) => specialCards([id])[0]?.name).filter(Boolean) as string[];
        return {
          uid: craft.uid,
          name: displayName(craft.card),
          kind: "craft" as const,
          level: craft.runLevel || 1,
          kills: Math.round(craft.roundKills ?? 0),
          shots: Math.round(craft.shots ?? 0),
          heals: Math.round(craft.roundHeals ?? 0),
          saves: Math.round(craft.roundSaves ?? 0),
          hull: Math.ceil(craft.hp),
          hullMax: Math.ceil(craft.hpMax),
          base: base ? `Bite ${Math.round(base.dps)}. Reach ${Math.round(base.radius)}.` : "A craft that flies.",
          now: `Bite ${Math.round(nowFx.dps)}. Reach ${Math.round(nowFx.radius)}.${craft.clone ? " Echo." : ""}`,
          parts,
          specials: specs,
        };
      }
      return null;
    })(),
    tutorialActive: !!w.tutorialActive,
    tutorialStep: w.tutorialStep ?? 0,
    tutorialDoneReady: !!w.tutorialDoneReady,
    vaultMatchChalk: !!w.vaultMatchChalk,
    packGift: w.packGift ?? null,
    draftLane: w.draftLane,
    levelBump: levelDraftBump(w.runLevel),
    levelPicks: levelExtraPicks(w.runLevel),
    packHeat: w.packHeat,
    pendingStamp: w.pendingStamp,
    scrapValue: scrapTarget ? scrapOf(w, scrapTarget) : 0,
    ability: climbSummary(w.climb),
    gems: w.gems ?? emptyGems(),
    charms: w.charms ?? [],
    pendingMerchant: w.pendingMerchant,
    lastLeakGate: w.lastLeakGate,
    socketOnSelected: socketOnPad(w, focus?.placedPad ?? w.selectedPad)?.card ?? null,
    coverPct: coverPct(w),
    runKills: w.runKills ?? 0,
    runLeaks: w.runLeaks ?? 0,
    shotsFired: w.shotsFired ?? 0,
    upgradesMade: w.upgradesMade ?? 0,
    wavesCleared: w.wavesCleared ?? 0,
    signals: (w.signals ?? []).map((id) => SIGNALS.find((s) => s.id === id || id.includes(s.id))?.name ?? id),
    signalCards: (w.signals ?? [])
      .map((id) => SIGNALS.find((s) => s.id === id || id.includes(s.id)))
      .filter((s): s is NonNullable<typeof s> => !!s)
      .map((s) => signalToCard(s)),
    endless: !!w.endless,
    bonusPct: bonusPct(w),
    packMode: w.packMode ?? "show",
    cutId: w.cutId ?? null,
    mysteryQueue: w.mysteryQueue ?? 0,
    themeId: theme.id,
    team: teamOf(w),
    live: null,
    swapTokens: w.swapTokens ?? 1,
    swapToast: !!w.swapToast,
    skipCharge: w.skipCharge ?? 0,
    canSkipPack: false,
    canBan: false,
    draftCompensate: !!w.draftCompensate,
  };
}

type Store = {
  hud: HudState | null;
  muted: boolean;
  help: boolean;
  hangar: boolean;
  ready: boolean;
  best: MetaSave;
  hasRun: boolean;
  profiles: ProfilesSave;
  setHud: (w: World) => void;
  setMuted: (m: boolean) => void;
  setHelp: (h: boolean) => void;
  setHangar: (h: boolean) => void;
  setReady: (r: boolean) => void;
  setBest: (b: MetaSave) => void;
  setHasRun: (v: boolean) => void;
  setProfiles: (p: ProfilesSave) => void;
};

export const useGame = create<Store>((set) => ({
  hud: null,
  muted: false,
  help: false,
  hangar: false,
  ready: false,
  best: loadMeta(),
  hasRun: false,
  profiles: loadProfiles(),
  setHud: (w) => {
    try {
      set({ hud: fromWorld(w) });
    } catch (err) {
      console.warn("vector hud", err);
    }
  },
  setMuted: (m) => set({ muted: m }),
  setHelp: (h) => set({ help: h }),
  setHangar: (h) => set({ hangar: h }),
  setReady: (r) => set({ ready: r }),
  setBest: (b) => set({ best: b }),
  setHasRun: (v) => set({ hasRun: v }),
  setProfiles: (p) => set({ profiles: p }),
}));

export { emptySets };
