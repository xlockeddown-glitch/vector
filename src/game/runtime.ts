import { audio, resumeAudioOnVisible, type Sfx } from "./audio";
import { loadAssets, type Assets } from "./assets";
import { hitPad, PATHS, BASE, nearestPathMeta } from "./data/map";
import { HOME_PAD, LOOP_WAVES, WORLD } from "./constants";
import { clearRun, loadMeta, loadRun, recordRun, equipSkin, buyHangar, buyVault, buySkin, addFlux, selectSlot, bindCraft, slotHasRun, loadProfiles, markTutorial, isLive, markLive } from "./persist";
import { drawWorld, screenToWorld, viewTransform, placeDefendHit } from "./render";
import {
  applyRun,
  beginOpening,
  beginPerformanceDraft,
  beginStampDraft,
  buyCharm,
  buyDraftPick,
  checkpoint,
  commandCompanion,
  sendCraftHome,
  continueFromShop,
  createWorld,
  debugWipeEnemies,
  engraveTower,
  beginNextWatch,
  keepFlying,
  goTitle,
  leaveMerchant,
  pickDraft,
  skipDraftPack,
  banDraftCard,
  pickLive,
  placeTower,
  sellTower,
  scrapTower,
  startWave,
  stepWorld,
  unstickWorld,
  upgradeTower,
  tryFuseGuns,
  pickTrick,
  pickSpecial,
  fitPart,
  swapTower,
  dismissSwapToast,
  toggleCompanion,
  livePads,
  bayMoon,
  type World,
} from "./sim";
import { useGame } from "./store";
import { cardLeans } from "./data/gifts";
import { dealSpecials } from "./data/specials";
import type { HangarId, OpId, SkinId } from "./types";

export type Runtime = {
  start: () => void;
  stop: () => void;
  reattach: (canvas: HTMLCanvasElement, sink?: HudSink) => void;
  bindHud: (sink: HudSink) => void;
  pointer: (cx: number, cy: number) => void;
  hover: (cx: number, cy: number) => void;
  play: () => void;
  dispatch: (action: Action) => void;
  world: World;
};

export type HudSink = (w: World) => void;

export type Action =
  | { type: "play"; continue?: boolean; tutorial?: boolean; mode?: "story" | "arcade" }
  | { type: "help" }
  | { type: "closeHelp" }
  | { type: "pick"; id: string }
  | { type: "skipPack" }
  | { type: "ban"; id: string }
  | { type: "selectCard"; uid: string | null }
  | { type: "startWave" }
  | { type: "shopContinue" }
  | { type: "buyPick" }
  | { type: "upgrade"; uid?: string; mod?: OpId; tune?: string }
  | { type: "trick"; uid: string; id: string }
  | { type: "special"; uid: string; id: string }
  | { type: "fuse"; keep: string; eat: string }
  | { type: "engrave"; uid: string }
  | { type: "fit"; uid: string }
  | { type: "sell" }
  | { type: "scrap"; uid?: string }
  | { type: "speed" }
  | { type: "pause" }
  | { type: "mute" }
  | { type: "retry" }
  | { type: "title" }
  | { type: "watchKeep" }
  | { type: "buyCharm"; id: string }
  | { type: "leaveMerchant" }
  | { type: "hangar" }
  | { type: "closeHangar" }
  | { type: "hangarBuy"; id: string }
  | { type: "hangarSkin"; id: SkinId }
  | { type: "skipTutorial" }
  | { type: "finishTutorial" }
  | { type: "livePick"; id: string }
  | { type: "liveSkip" }
  | { type: "skin"; id: SkinId }
  | { type: "dismissSwap" }
  | { type: "craftBay"; uid: string }
  | { type: "slot"; id: number }
  | { type: "bind"; id: string };

type QaSnap = {
  phase: World["phase"];
  points: number;
  extraPicks: number;
  wave: number;
  lives: number;
  kills: number;
  leaks: number;
  draftCount: number;
  draftPicksLeft: number;
  draftTitle: string | null;
  openingStep: number;
  grade: string | null;
  placed: number;
  bench: number;
  canStart: boolean;
  runLevel: number;
  xp: number;
  pendingLevels: number;
  live: string | null;
  liveCount: number;
  swapTokens: number;
  paths: number;
  base: { x: number; y: number };
  crafts: number;
  flying: number;
  home: number;
  crit: number;
  bores: number;
  draftKinds: string[];
  packKind: string | null;
  draftTemplates: string[];
  packRarity: string | null;
  packPure: boolean;
  skipCharge: number;
  bansThisRound: number;
  runBanned: string[];
  lastPackGem: string | null;
  packGift: string | null;
  giftLean: number;
  message: string | null;
  announce: string | null;
  climb: { bay: number; pack: number; crew: number } | null;
  speed: number;
  selectedCard: string | null;
  remainingPads: number;
  enemyCount: number;
  spawnLeft: number;
  holdT: number;
  paused: boolean;
  pickPause: boolean;
  playMode: string;
  specialReady: number;
};

type HeldRuntime = Runtime & { gen?: number };

export const RUNTIME_GEN = Date.now();

export function createRuntime(canvas: HTMLCanvasElement, sink?: HudSink): Runtime {
  const bag = window as unknown as { __vectorRuntime?: HeldRuntime };
  const held = bag.__vectorRuntime;
  if (held?.reattach && held.gen === RUNTIME_GEN) {
    held.reattach(canvas, sink);
    return held;
  }
  if (held?.stop) {
    try {
      held.stop();
    } catch {
      /* stale loop */
    }
  }
  bag.__vectorRuntime = undefined;

  const world = createWorld();
  try {
    if (isLive()) {
      const saved = loadRun();
      if (saved && !saved.parked) {
        applyRun(world, saved);
        unstickWorld(world);
      }
    }
  } catch {
    /* stale save */
  }
  let assets: Assets | null = null;
  let raf = 0;
  let last = performance.now();
  let acc = 0;
  const FIXED = 1 / 60;
  let hudAcc = 0;
  let saveAcc = 0;
  let running = false;
  let hudSink: HudSink | null = sink ?? null;

  let ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");

  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  };

  const pushHud = (force = false) => {
    if (force || world.uiDirty) {
      try {
        const fn = hudSink ?? ((w) => useGame.getState().setHud(w));
        fn(world);
      } catch (err) {
        console.warn("vector hud", err);
      }
      world.uiDirty = false;
    }
  };

  const snap = (): QaSnap => ({
    phase: world.phase,
    points: world.points,
    extraPicks: world.extraPicks,
    wave: world.wave,
    lives: world.lives,
    kills: world.kills,
    leaks: world.leaks,
    draftCount: world.draftCards.length,
    draftPicksLeft: world.draftPicksLeft,
    draftTitle: world.draftTitle ?? null,
    openingStep: world.openingStep ?? 0,
    grade: world.grade?.grade ?? null,
    placed: world.roster.filter((r) => r.placedPad && r.placedPad !== "home" && r.card.kind === "tower").length,
    bench: world.roster.filter((r) => !r.placedPad).length,
    canStart: world.phase === "placement" && world.roster.some((r) => r.placedPad && r.placedPad !== "home" && r.card.kind === "tower"),
    runLevel: world.runLevel,
    xp: world.xp,
    pendingLevels: world.pendingLevels,
    live: world.live?.title ?? null,
    liveCount: world.live?.cards.length ?? 0,
    swapTokens: world.swapTokens ?? 0,
    paths: PATHS.length,
    base: { x: BASE.x, y: BASE.y },
    crafts: (world.companions ?? []).length,
    flying: (world.companions ?? []).filter((c) => c.placedPad === "sky").length,
    home: (world.companions ?? []).filter((c) => c.home && c.placedPad === "sky").length,
    crit: (world.companions ?? []).filter((c) => c.crit).length,
    bores: (world.bores ?? []).length,
    draftKinds: world.draftCards.map((c) => c.kind),
    packKind: world.draftKind ?? null,
    draftTemplates: world.draftCards.map((c) => c.templateId ?? c.id),
    packRarity: world.packRarity ?? null,
    packPure:
      world.draftCards.length > 0 &&
      world.draftCards.every((c) => c.kind === world.draftCards[0]!.kind) &&
      world.draftCards.every((c) => c.rarity === world.draftCards[0]!.rarity),
    skipCharge: world.skipCharge ?? 0,
    bansThisRound: world.bansThisRound ?? 0,
    runBanned: world.runBanned ?? [],
    lastPackGem: world.lastPackGem ?? null,
    packGift: world.packGift ?? null,
    giftLean: world.packGift
      ? world.draftCards.filter((c) => cardLeans(c, world.packGift!)).length
      : 0,
    message: world.message ?? null,
    announce: world.announce ?? null,
    climb: world.climb ?? null,
    speed: world.speed ?? 1,
    selectedCard: world.selectedCard ?? null,
    remainingPads: livePads(world).filter((p) => !world.roster.some((r) => r.placedPad === p.id && r.card.kind === "tower")).length,
    enemyCount: world.enemies.filter((e) => e.alive).length,
    spawnLeft: world.spawnQ.length,
    holdT: Number((world.holdT ?? 0).toFixed(2)),
    paused: !!world.paused,
    pickPause: !!world.pickPause,
    playMode: world.playMode === "arcade" ? "arcade" : "story",
    specialReady:
      (world.roster ?? []).filter((r) => (r.specialOffer ?? []).length || (r.partOffer ?? []).length).length +
      (world.companions ?? []).filter((c) => (c.specialOffer ?? []).length || (c.partOffer ?? []).length).length,
  });

  const loop = (now: number) => {
    if (!running) return;
    const raw = Math.min(0.1, (now - last) / 1000);
    last = now;
    try {
      unstickWorld(world);
      const simOn = world.phase === "combat" && !world.paused;
      acc += simOn ? raw * world.speed : 0;
      let steps = 0;
      while (acc >= FIXED && steps < 6) {
        stepWorld(world, FIXED);
        acc -= FIXED;
        steps += 1;
      }
      if (!simOn) {
        stepWorld(world, raw);
      }
      if (world.wantSfx) {
        audio.play(world.wantSfx as Sfx);
        world.wantSfx = null;
      }
      drawWorld(ctx!, canvas, world, assets);
    } catch (err) {
      console.warn("vector tick", err);
    }
    try {
      hudAcc += raw;
      if (hudAcc > 0.1 || world.uiDirty) {
        hudAcc = 0;
        pushHud(true);
      }
      saveAcc += raw;
      if (saveAcc > 2.5) {
        saveAcc = 0;
        checkpoint(world);
      }
    } catch (err) {
      console.warn("vector hud tick", err);
    }
    raf = requestAnimationFrame(loop);
  };

  (window as unknown as { __gridiron: () => unknown }).__gridiron = () => ({
    ...snap(),
    gold: world.gold,
    placedDetail: world.roster.filter((r) => r.placedPad).map((r) => ({
      card: r.card.templateId,
      pad: r.placedPad,
      cd: Number(r.cd.toFixed(2)),
    })),
    enemies: world.enemies.filter((e) => e.alive).slice(0, 8).map((e) => ({
      t: e.type,
      x: Math.round(e.x),
      y: Math.round(e.y),
      hp: Math.round(e.hp),
    })),
    projs: world.projectiles.filter((p) => p.alive).length,
    waveT: Number(world.waveT.toFixed(1)),
  });

  (window as unknown as { __gridironQA: Record<string, unknown> }).__gridironQA = {
    snap,
    view: () => {
      const { scale, ox, oy, cssW, cssH } = viewTransform(canvas);
      const rect = canvas.getBoundingClientRect();
      const drawW = WORLD.w * scale;
      const drawH = WORLD.h * scale;
      const axisFill = Math.max(drawW / Math.max(1, cssW), drawH / Math.max(1, cssH));
      const gap = Math.max(0, cssH - (oy + drawH));
      const spawnY = oy + 200 * scale;
      const homeY = oy + WORLD.h * scale;
      return {
        cssW: Math.round(cssW),
        cssH: Math.round(cssH),
        canvasW: Math.round(rect.width),
        canvasH: Math.round(rect.height),
        scale: Number(scale.toFixed(3)),
        ox: Math.round(ox),
        oy: Math.round(oy),
        drawW: Math.round(drawW),
        drawH: Math.round(drawH),
        axisFill: Number(axisFill.toFixed(3)),
        gap: Math.round(gap),
        topStuck: gap > 48 && oy < 16,
        homeCut: homeY > cssH + 8,
        spawnCut: spawnY < -8,
        vw: window.innerWidth,
        vh: window.innerHeight,
        tiny: axisFill < 0.72,
        collapsed: window.innerHeight >= 700 && (rect.height < window.innerHeight * 0.35 || rect.height < 200),
        narrow: window.innerWidth >= 500 && rect.width < window.innerWidth * 0.85,
      };
    },
    pickFirst: () => {
      const id = world.draftCards[0]?.id;
      if (id) {
        pickDraft(world, id);
        pushHud(true);
      }
      return snap();
    },
    pickLast: () => {
      const id = world.draftCards[world.draftCards.length - 1]?.id;
      if (id) {
        pickDraft(world, id);
        pushHud(true);
      }
      return snap();
    },
    pickId: (want: string) => {
      const card = world.draftCards.find((c) => c.templateId === want || c.id === want || c.name.toLowerCase() === want.toLowerCase());
      if (card) {
        pickDraft(world, card.id);
        pushHud(true);
      }
      return { ...snap(), picked: card?.name ?? null, names: world.draftCards.map((c) => c.name) };
    },
    tryBadSkill: () => {
      const fake = {
        id: "r-fake-skill",
        templateId: "skill-nobody",
        name: "Ghost stitch",
        kind: "kit" as const,
        rarity: "rare" as const,
        art: "comp-auger",
        set: "iron" as const,
        cost: 0,
        blurb: "Needs a craft you do not have.",
        kit: { craftId: "comp-nobody", cutDps: 12 },
        affixes: [] as string[],
        prefix: "",
        seed: 1,
      };
      world.draftCards = [fake, ...world.draftCards];
      const picks = world.draftPicksLeft;
      const n = world.draftCards.length;
      pickDraft(world, fake.id);
      pushHud(true);
      return {
        picksUnchanged: world.draftPicksLeft === picks,
        stillInPack: world.draftCards.some((c) => c.id === fake.id),
        count: world.draftCards.length,
        before: n,
        message: world.message,
        phase: world.phase,
      };
    },
    skipOffer: () => {
      skipDraftPack(world);
      pushHud(true);
      return snap();
    },
    banFirst: () => {
      const id = world.draftCards[0]?.id;
      if (id) {
        banDraftCard(world, id);
        pushHud(true);
      }
      return snap();
    },
    fitFirst: () => {
      const g = world.roster.find((r) => r.card.kind === "tower" || r.card.kind === "defender");
      if (g) {
        fitPart(world, g.uid);
        pushHud(true);
      }
      return snap();
    },
    pickBench: () => {
      const g = world.roster.find((r) => r.card.kind === "tower" && !r.placedPad);
      if (g) {
        world.selectedCard = g.uid;
        world.uiDirty = true;
        pushHud(true);
      }
      return { ...snap(), holding: g?.card.name ?? null };
    },
    pickSpecialFirst: () => {
      const gun = (world.roster ?? []).find(
        (r) => r.card.kind === "tower" && ((r.specialOffer ?? []).length || (r.partOffer ?? []).length),
      );
      const craft = (world.companions ?? []).find(
        (c) => (c.specialOffer ?? []).length || (c.partOffer ?? []).length,
      );
      const target = gun ?? craft;
      if (!target) return { ...snap(), picked: null };
      const specId = (target.specialOffer ?? [])[0];
      const partId = (target.partOffer ?? [])[0]?.id;
      const id = specId || partId;
      if (!id) return { ...snap(), picked: null };
      pickSpecial(world, target.uid, id);
      pushHud(true);
      return { ...snap(), picked: id };
    },
    levelCraftStay: () => {
      const craft = (world.companions ?? []).find((c) => c.placedPad === "sky");
      if (!craft) return { stayed: true, flying: 0, missing: true };
      const uid = craft.uid;
      const prev = world.selectedCard;
      const prevOffer = [...(craft.specialOffer ?? [])];
      const planted = prevOffer.length === 0;
      if (planted) {
        craft.specialOffer = dealSpecials(
          "craft",
          craft.card.templateId ?? craft.card.id,
          1,
          craft.uid,
          craft.specials ?? [],
        );
      }
      dispatch({ type: "selectCard", uid });
      const after = (world.companions ?? []).find((c) => c.uid === uid);
      const stayed = after?.placedPad === "sky";
      if (planted && after) after.specialOffer = prevOffer;
      world.selectedCard = prev;
      world.uiDirty = true;
      pushHud(true);
      return {
        stayed,
        flying: (world.companions ?? []).filter((c) => c.placedPad === "sky").length,
        missing: false,
        phase: world.phase,
      };
    },
    pads: () =>
      livePads(world).map((p) => ({
        id: p.id,
        x: p.x,
        y: p.y,
        taken: world.roster.some((r) => r.placedPad === p.id && r.card.kind === "tower"),
      })),
    pathPoint: () => {
      const path = PATHS[0] ?? [];
      const a = path[0] ?? { x: 72, y: 200 };
      const b = path[1] ?? { x: 1088, y: 200 };
      return { x: Math.round((a.x + b.x) / 2), y: Math.round((a.y + b.y) / 2) };
    },
    placeBench: () => {
      const freeTower = livePads(world).filter(
        (p) => !world.roster.some((r) => r.placedPad === p.id && r.card.kind === "tower"),
      );
      let i = 0;
      for (const r of world.roster) {
        if (r.placedPad || r.card.kind !== "tower") continue;
        const pad = freeTower[i++];
        if (!pad) break;
        placeTower(world, r.uid, pad.id);
      }
      const freeSock = livePads(world).filter(
        (p) => !world.roster.some((r) => r.placedPad === p.id && r.card.kind === "socket"),
      );
      let j = 0;
      for (const r of world.roster) {
        if (r.placedPad || r.card.kind !== "socket") continue;
        const pad = freeSock[j++];
        if (!pad) break;
        placeTower(world, r.uid, pad.id);
      }
      pushHud(true);
      return snap();
    },
    wipe: () => {
      debugWipeEnemies(world);
      world.uiDirty = true;
      pushHud(true);
      return snap();
    },
    stampNow: () => {
      beginStampDraft(world);
      pushHud(true);
      return snap();
    },
    flatNow: () => {
      world.lastGrade = world.lastGrade ?? "B";
      beginPerformanceDraft(world);
      pushHud(true);
      const rarities = world.draftCards.map((c) => c.rarity);
      return {
        ...snap(),
        rarities,
        flat: rarities.length > 0 && rarities.every((r) => r === rarities[0]),
        heat: world.packHeat,
        packRarity: world.packRarity,
      };
    },
    scrapFirst: () => {
      const g = world.roster.find((r) => r.card.kind === "tower");
      if (g) scrapTower(world, g.uid);
      pushHud(true);
      return snap();
    },
    speed2: () => {
      world.speed = 2;
      world.uiDirty = true;
      return snap();
    },
    speed3: () => {
      world.speed = 3;
      world.uiDirty = true;
      return snap();
    },
    gemDump: () => {
      world.gems = { ruby: 6, emerald: 6, sapphire: 6, diamond: 3 };
      world.uiDirty = true;
      pushHud(true);
      return snap();
    },
    merchantNow: () => {
      world.gems = { ruby: 6, emerald: 6, sapphire: 6, diamond: 3 };
      world.pendingMerchant = true;
      world.phase = "merchant";
      world.message = "A merchant docks. Trade gems for charms that last several rounds.";
      world.uiDirty = true;
      pushHud(true);
      return snap();
    },
    fluxDump: () => {
      const next = addFlux(200);
      world.flux = next.flux;
      useGame.getState().setBest(next);
      world.uiDirty = true;
      pushHud(true);
      return { ...snap(), flux: world.flux };
    },
    liveNow: () => {
      world.draftBump = Math.min(3, (world.draftBump ?? 0) + 1);
      world.message = "Next pack rolls a gem up.";
      world.uiDirty = true;
      pushHud(true);
      return snap();
    },
    hurtCraft: () => {
      const c = (world.companions ?? []).find((n) => n.placedPad === "sky" && !n.home);
      if (c) {
        c.hp = Math.max(1, c.hpMax * 0.18);
        c.home = true;
        c.commandT = 0;
        c.bubble = "Heading home.";
        c.bubbleT = 1.4;
        world.message = `${c.card.name} limps back to the bay.`;
        world.uiDirty = true;
      }
      pushHud(true);
      return snap();
    },
    critCraft: () => {
      const c = (world.companions ?? []).find((n) => n.placedPad === "sky");
      if (c) {
        c.hp = 1;
        c.home = true;
        c.crit = true;
        c.commandT = 0;
        c.bubble = "Bay. Now.";
        c.bubbleT = 2;
        world.message = `${c.card.name} is critical — stitching at the bay.`;
        world.uiDirty = true;
      }
      pushHud(true);
      return snap();
    },
    plungeNow: () => {
      const c = (world.companions ?? []).find((n) => n.placedPad === "sky" && n.card.companion?.role === "borer");
      if (c) {
        c.specialCd = 0;
        c.bubble = "Plunge";
        c.bubbleT = 1.2;
        world.message = "Auger plunges.";
        world.uiDirty = true;
      }
      pushHud(true);
      return snap();
    },
    startWave: () => {
      startWave(world);
      pushHud(true);
      return snap();
    },
    shopGo: () => {
      continueFromShop(world);
      pushHud(true);
      return snap();
    },
    shopStuck: () => {
      world.phase = "shop";
      world.grade = null;
      world.lastGrade = world.lastGrade ?? "A";
      world.uiDirty = true;
      pushHud(true);
      return snap();
    },
    wipeWave: () => {
      debugWipeEnemies(world);
      world.waveActive = true;
      pushHud(true);
      return snap();
    },
  };

  const ro = new ResizeObserver(() => resize());

  const onHide = () => {
    if (document.hidden) checkpoint(world);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.code === "Space" && world.phase === "placement") {
      e.preventDefault();
      dispatch({ type: "startWave" });
    }
    if (e.code === "KeyF") dispatch({ type: "speed" });
    if (e.code === "KeyP" || e.code === "Escape") dispatch({ type: "pause" });
    if (e.code === "KeyM") dispatch({ type: "mute" });
  };

  const start = () => {
    if (running) {
      resize();
      pushHud(true);
      return;
    }
    running = true;
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onHide);
    ro.observe(canvas);
    resumeAudioOnVisible();
    last = performance.now();
    raf = requestAnimationFrame(loop);
    useGame.getState().setReady(true);
    useGame.getState().setBest(loadMeta());
    useGame.getState().setHasRun(!!loadRun());
    void loadAssets()
      .then((a) => {
        assets = a;
      })
      .catch(() => {});
    pushHud(true);
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    window.removeEventListener("keydown", onKey);
    document.removeEventListener("visibilitychange", onHide);
    ro.disconnect();
  };

  const reattach = (next: HTMLCanvasElement, nextSink?: HudSink) => {
    canvas = next;
    const nextCtx = next.getContext("2d");
    if (nextCtx) ctx = nextCtx;
    if (nextSink) hudSink = nextSink;
    try {
      ro.disconnect();
    } catch {
      /* */
    }
    if (running) {
      ro.observe(canvas);
      resize();
      pushHud(true);
    } else {
      start();
    }
  };

  const bindHud = (next: HudSink) => {
    hudSink = next;
    pushHud(true);
  };

  const play = (resume = false, wantTutorial = false, mode: "story" | "arcade" = "story") => {
    audio.unlock();
    audio.play("ui");
    markLive(true);
    if (resume) {
      const run = loadRun();
      if (run) {
        const next = createWorld();
        Object.assign(world, next);
        applyRun(world, run);
        pushHud(true);
        useGame.getState().setHasRun(true);
        return;
      }
    }
    clearRun();
    useGame.getState().setHasRun(false);
    const next = createWorld();
    Object.assign(world, next);
    world.enemies = [];
    world.projectiles = [];
    world.fx = [];
    world.playMode = mode === "arcade" ? "arcade" : "story";
    world.wantTutorial = !!wantTutorial;
    beginOpening(world);
    pushHud(true);
  };

  const pointer = (cx: number, cy: number) => {
    if (world.phase !== "placement" && world.phase !== "combat") return;
    if (world.phase === "placement" && placeDefendHit(canvas, cx, cy, world)) {
      startWave(world);
      audio.play("ui");
      pushHud(true);
      return;
    }
    const p = screenToWorld(canvas, cx, cy);
    if (world.phase === "combat") {
      const moon = bayMoon(world.visT);
      const onBay = Math.hypot(p.x - moon.x, p.y - moon.y) < 36;
      if (onBay) {
        const sky = (world.companions ?? []).filter((c) => c.placedPad === "sky");
        const selected = world.selectedCard
          ? sky.find((c) => c.uid === world.selectedCard)
          : null;
        commandCompanion(world, p.x, p.y, selected?.uid);
        audio.play("ui");
        world.uiDirty = true;
        pushHud(true);
        return;
      }
      let hitCraft = null;
      let best = 28 * 28;
      for (const c of world.companions ?? []) {
        if (c.placedPad !== "sky") continue;
        const d = (c.x - p.x) ** 2 + (c.y - p.y) ** 2;
        if (d < best) {
          best = d;
          hitCraft = c;
        }
      }
      if (hitCraft) {
        world.selectedCard = hitCraft.uid;
        world.uiDirty = true;
        audio.play("ui");
        pushHud(true);
        return;
      }
    }
    const pads = livePads(world);
    const reach = world.phase === "placement" ? 120 : 72;
    const pad = hitPad(p.x, p.y, reach, pads);
    const gunsDown = world.roster.some(
      (r) => r.placedPad && r.placedPad !== "home" && r.card.kind === "tower",
    );
    const onPath = nearestPathMeta(p.x, p.y).dist < 28;
    const occupant = pad
      ? world.roster.find((r) => r.placedPad === pad.id && r.card.kind !== "socket")
      : undefined;
    let holding = world.selectedCard
      ? world.roster.find((r) => r.uid === world.selectedCard)
      : null;
    let canPlant =
      !!holding &&
      !holding.placedPad &&
      (holding.card.kind === "tower" || holding.card.kind === "socket");
    if (world.phase === "placement" && !canPlant && pad && !occupant) {
      const nextGun = world.roster.find((r) => r.card.kind === "tower" && !r.placedPad);
      if (nextGun) {
        world.selectedCard = nextGun.uid;
        holding = nextGun;
        canPlant = true;
      }
    }
    const willPlant = world.phase === "placement" && !!pad && !occupant && canPlant;
    const unplacedGuns = world.roster.filter((r) => r.card.kind === "tower" && !r.placedPad).length;
    if (world.phase === "placement" && gunsDown && onPath && !willPlant && unplacedGuns === 0) {
      startWave(world);
      audio.play("ui");
      pushHud(true);
      return;
    }
    if (!pad) {
      world.selectedPad = null;
      world.uiDirty = true;
      return;
    }
    if (world.selectedCard) {
      const item = world.roster.find((r) => r.uid === world.selectedCard);
      if (item && !item.placedPad) {
        const ok = placeTower(world, world.selectedCard, pad.id);
        if (ok) audio.play("place");
        else audio.play("ui");
        return;
      }
      if (
        item &&
        item.placedPad &&
        item.placedPad !== "home" &&
        item.card.kind === "tower" &&
        item.placedPad !== pad.id
      ) {
        const ok = swapTower(world, item.uid, pad.id);
        if (ok) audio.play("place");
        else audio.play("ui");
        return;
      }
    }
    world.selectedPad = pad.id;
    if (occupant) world.selectedCard = occupant.uid;
    else {
      const sock = world.roster.find((r) => r.placedPad === pad.id && r.card.kind === "socket");
      if (sock) world.selectedCard = sock.uid;
    }
    world.uiDirty = true;
    audio.play("ui");
  };

  const hover = (cx: number, cy: number) => {
    if (world.phase === "placement" && placeDefendHit(canvas, cx, cy, world)) {
      canvas.style.cursor = "pointer";
      return;
    }
    canvas.style.cursor = "";
    if (world.phase !== "placement" && world.phase !== "combat") {
      if (world.hoverPad) world.hoverPad = null;
      return;
    }
    const picking = world.roster.find((r) => r.uid === world.selectedCard);
    const canGhost =
      !!picking &&
      (picking.card.kind === "tower" || picking.card.kind === "defender") &&
      (!picking.placedPad ||
        (picking.placedPad !== HOME_PAD && picking.card.kind === "tower" && (world.swapTokens ?? 0) > 0));
    if (!canGhost) {
      if (world.hoverPad) world.hoverPad = null;
      return;
    }
    const p = screenToWorld(canvas, cx, cy);
    const pad = hitPad(p.x, p.y, 72, livePads(world));
    let id: string | null = null;
    if (pad && pad.id !== HOME_PAD && picking.placedPad !== pad.id) {
      const taken = world.roster.some((r) => r.placedPad === pad.id && r.card.kind === "tower");
      if (!taken) id = pad.id;
    }
    if (world.hoverPad !== id) world.hoverPad = id;
  };

  const dispatch = (action: Action) => {
    audio.unlock();
    switch (action.type) {
      case "play":
        if (!action.continue) {
          const p = loadProfiles();
          if (!p.slots[p.active]?.boundId) bindCraft("comp-auger");
        }
        play(!!action.continue, !!action.tutorial, action.mode === "arcade" ? "arcade" : "story");
        break;
      case "help":
        useGame.getState().setHelp(true);
        audio.play("ui");
        break;
      case "closeHelp":
        useGame.getState().setHelp(false);
        audio.play("ui");
        break;
      case "hangar":
        useGame.getState().setBest(loadMeta());
        useGame.getState().setHangar(true);
        audio.play("ui");
        break;
      case "closeHangar":
        useGame.getState().setHangar(false);
        audio.play("ui");
        break;
      case "slot": {
        const next = selectSlot(action.id);
        useGame.getState().setProfiles(next);
        useGame.getState().setHasRun(slotHasRun(next.active));
        audio.play("ui");
        break;
      }
      case "bind": {
        const next = bindCraft(action.id);
        useGame.getState().setProfiles(next);
        audio.play("place");
        break;
      }
      case "skin": {
        const next = equipSkin(action.id);
        world.skin = next.equipped;
        useGame.getState().setBest(next);
        audio.play("ui");
        break;
      }
      case "hangarBuy": {
        const next = buyVault(action.id);
        world.flux = next.flux;
        useGame.getState().setBest(next);
        world.uiDirty = true;
        audio.play("place");
        pushHud(true);
        break;
      }
      case "skipTutorial": {
        const next = markTutorial(false, true);
        world.tutorialActive = false;
        world.tutorialDoneReady = false;
        useGame.getState().setBest(next);
        world.uiDirty = true;
        audio.play("ui");
        pushHud(true);
        break;
      }
      case "finishTutorial": {
        const next = markTutorial(true, false);
        world.tutorialActive = false;
        world.tutorialDoneReady = false;
        useGame.getState().setBest(next);
        world.uiDirty = true;
        audio.play("ui");
        pushHud(true);
        break;
      }
      case "hangarSkin": {
        const next = buySkin(action.id);
        world.skin = next.equipped;
        world.flux = next.flux;
        useGame.getState().setBest(next);
        world.uiDirty = true;
        audio.play("place");
        pushHud(true);
        break;
      }
      case "pick":
        pickDraft(world, action.id);
        audio.play("draft");
        pushHud(true);
        break;
      case "skipPack":
        skipDraftPack(world);
        audio.play("ui");
        pushHud(true);
        break;
      case "ban":
        banDraftCard(world, action.id);
        audio.play("ui");
        pushHud(true);
        break;
      case "livePick":
        pickLive(world, action.id);
        audio.play("draft");
        pushHud(true);
        break;
      case "liveSkip":
        skipDraftPack(world);
        audio.play("ui");
        pushHud(true);
        break;
      case "dismissSwap":
        dismissSwapToast(world);
        audio.play("ui");
        pushHud(true);
        break;
      case "craftBay":
        sendCraftHome(world, action.uid);
        audio.play("ui");
        pushHud(true);
        break;
      case "selectCard": {
        if (!action.uid) {
          world.selectedCard = null;
          world.selectedPad = null;
          if (world.pickPause) {
            world.paused = false;
            world.pickPause = false;
          }
          world.uiDirty = true;
          audio.play("ui");
          pushHud(true);
          break;
        }
        const item = world.roster.find((r) => r.uid === action.uid);
        if (item?.card.kind === "companion") {
          const craft = (world.companions ?? []).find((c) => c.uid === item.uid);
          const flying = craft?.placedPad === "sky" || item.placedPad === "sky";
          const ready = (craft?.specialOffer ?? []).length > 0 || (craft?.partOffer ?? []).length > 0;
          if (!flying) {
            toggleCompanion(world, item.uid);
            world.selectedCard = item.uid;
          } else if (ready) {
            // Level-up never benches a flying craft.
            world.selectedCard = item.uid;
          } else if (world.selectedCard === item.uid) {
            toggleCompanion(world, item.uid);
            world.selectedCard = item.uid;
          } else {
            world.selectedCard = item.uid;
          }
          world.uiDirty = true;
          audio.play("ui");
          pushHud(true);
          break;
        }
        world.selectedCard = action.uid;
        if (item?.placedPad && item.placedPad !== "home") world.selectedPad = item.placedPad;
        world.uiDirty = true;
        audio.play("ui");
        break;
      }
      case "startWave":
        startWave(world);
        audio.play("ui");
        pushHud(true);
        break;
      case "shopContinue":
        continueFromShop(world);
        audio.play("draft");
        pushHud(true);
        break;
      case "engrave":
        engraveTower(world, action.uid);
        audio.play("place");
        pushHud(true);
        break;
      case "fit":
        fitPart(world, action.uid);
        audio.play("place");
        pushHud(true);
        break;
      case "buyPick":
        buyDraftPick(world);
        audio.play("ui");
        pushHud(true);
        break;
      case "upgrade": {
        const item = action.uid
          ? world.roster.find((r) => r.uid === action.uid)
          : world.roster.find((r) => r.placedPad === world.selectedPad);
        if (item) {
          const ok = upgradeTower(world, item.uid, action.mod, action.tune);
          audio.play(ok ? "place" : "ui");
          pushHud(true);
        }
        break;
      }
      case "trick": {
        const ok = pickTrick(world, action.uid, action.id);
        audio.play(ok ? "place" : "ui");
        pushHud(true);
        break;
      }
      case "special": {
        const ok = pickSpecial(world, action.uid, action.id);
        audio.play(ok ? "draft" : "ui");
        pushHud(true);
        break;
      }
      case "fuse": {
        const ok = tryFuseGuns(world, action.keep, action.eat);
        audio.play(ok ? "place" : "ui");
        pushHud(true);
        break;
      }
      case "sell": {
        const item = world.roster.find((r) => r.placedPad === world.selectedPad);
        if (item) {
          sellTower(world, item.uid);
          audio.play("ui");
        }
        break;
      }
      case "scrap": {
        const item = action.uid
          ? world.roster.find((r) => r.uid === action.uid)
          : world.roster.find((r) => r.uid === world.selectedCard) ??
            world.roster.find((r) => r.placedPad === world.selectedPad);
        if (item) {
          const ok = scrapTower(world, item.uid);
          audio.play(ok ? "place" : "ui");
          pushHud(true);
        }
        break;
      }
      case "speed":
        world.speed = (world.speed === 3 ? 1 : ((world.speed + 1) as 2 | 3)) as World["speed"];
        world.uiDirty = true;
        audio.play("ui");
        break;
      case "pause":
        if (world.phase === "combat") {
          world.paused = !world.paused;
          world.uiDirty = true;
          audio.play("ui");
        }
        break;
      case "mute": {
        const next = !useGame.getState().muted;
        useGame.getState().setMuted(next);
        audio.setMuted(next);
        break;
      }
      case "buyCharm":
        buyCharm(world, action.id);
        audio.play("draft");
        pushHud(true);
        break;
      case "leaveMerchant":
        leaveMerchant(world);
        audio.play("ui");
        pushHud(true);
        break;
      case "retry": {
        if (!world.recorded) {
          const grade = world.grade?.grade ?? null;
          const best = recordRun({
            wave: world.wave,
            grade,
            level: world.runLevel,
            loops: Math.floor(world.wave / LOOP_WAVES),
          });
          if (best) useGame.getState().setBest(best);
          world.recorded = true;
        } else {
          useGame.getState().setBest(loadMeta());
        }
        clearRun();
        useGame.getState().setHasRun(false);
        audio.play("ui");
        const keepMode = world.playMode === "arcade" ? "arcade" : "story";
        const next = createWorld();
        Object.assign(world, next);
        world.enemies = [];
        world.projectiles = [];
        world.fx = [];
        world.playMode = keepMode;
        beginOpening(world);
        pushHud(true);
        break;
      }
      case "title": {
        const keep = world.phase !== "defeat" && world.phase !== "victory" && world.phase !== "loop";
        const saved = goTitle(world, keep);
        useGame.getState().setHasRun(saved);
        useGame.getState().setBest(loadMeta());
        audio.play("ui");
        pushHud(true);
        break;
      }
      case "watchKeep": {
        keepFlying(world);
        audio.play("ui");
        pushHud(true);
        break;
      }
    }
  };

  const runtime: HeldRuntime = {
    start,
    stop,
    reattach,
    bindHud,
    pointer,
    hover,
    play,
    dispatch,
    world,
    gen: RUNTIME_GEN,
  };
  bag.__vectorRuntime = runtime;
  return runtime;
}
