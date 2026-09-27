import type { Grade, HangarId, HangarRanks, MetaSave, Phase, ProfileSlot, ProfilesSave, RunSave, SkinId } from "./types";
import { unlockedIds, type SkinProgress } from "./data/skins";
import { emptyHangar, hangarCost, hangarItem, hangarOf, SKIN_FLUX } from "./data/hangar";
import { emptyVault, vaultCanBuy, vaultNode, vaultOf, type VaultSave } from "./data/vault";
import { orbitXpFromRun } from "./data/orbit";
import { GAME_VERSION } from "./version";

const META_KEY = "vector-meta-v4";
const META_V3 = "tensor-meta-v3";
const META_V2 = "pemdas-meta-v3";
const RUN_KEY = "vector-run-v4";
const LEGACY_RUN = "tensor-run-v3";
const LEGACY = "gridiron-v1";

const EMPTY_META: MetaSave = {
  v: 4,
  runs: 0,
  loops: 0,
  bestWave: 0,
  lastGrade: null,
  forge: {},
  bestLevel: 0,
  stamps: [],
  gunKills: {},
  leakless: 0,
  unlocked: ["stock"],
  equipped: "stock",
  flux: 0,
  hangar: emptyHangar(),
  boughtSkins: [],
  orbitXp: 0,
  vault: emptyVault(),
  tutorialDone: false,
  tutorialSkipped: false,
};

function progressOf(m: MetaSave): SkinProgress {
  const kills = Object.values(m.gunKills ?? {}).reduce((s, n) => s + n, 0);
  return { kills, leakless: m.leakless ?? 0, runs: m.runs, bestWave: m.bestWave };
}

function uniqueSkins(ids: SkinId[]): SkinId[] {
  const seen = new Set<SkinId>();
  const out: SkinId[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function withUnlocks(m: MetaSave): MetaSave {
  const earned = unlockedIds(progressOf(m));
  const bought = m.boughtSkins ?? [];
  const unlocked = uniqueSkins(["stock", ...earned, ...bought]);
  return {
    ...m,
    v: 4,
    flux: Math.max(0, Math.floor(m.flux ?? 0)),
    hangar: hangarOf(m.hangar),
    boughtSkins: bought,
    unlocked,
    equipped: unlocked.includes(m.equipped) ? m.equipped : "stock",
    orbitXp: Math.max(0, Math.floor(m.orbitXp ?? 0)),
    vault: vaultOf(m.vault),
    tutorialDone: !!m.tutorialDone,
    tutorialSkipped: !!m.tutorialSkipped,
    build: GAME_VERSION,
  };
}

function coerceMeta(p: Partial<MetaSave> & { v?: number }): MetaSave {
  return withUnlocks({
    ...EMPTY_META,
    ...p,
    forge: p.forge ?? {},
    stamps: p.stamps ?? [],
    gunKills: p.gunKills ?? {},
    leakless: p.leakless ?? 0,
    unlocked: p.unlocked ?? ["stock"],
    equipped: p.equipped ?? "stock",
    flux: p.flux ?? 0,
    hangar: hangarOf(p.hangar),
    boughtSkins: p.boughtSkins ?? [],
    orbitXp: Math.max(0, Math.floor(p.orbitXp ?? 0)),
    vault: vaultOf(p.vault),
    tutorialDone: !!p.tutorialDone,
    tutorialSkipped: !!p.tutorialSkipped,
  });
}

export function loadMeta(): MetaSave {
  if (typeof window === "undefined") return { ...EMPTY_META, forge: {}, stamps: [], gunKills: {}, hangar: emptyHangar() };
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) {
      const p = JSON.parse(raw) as MetaSave;
      if (p?.v === 4) return coerceMeta(p);
    }
    const v3 = localStorage.getItem(META_V3);
    if (v3) {
      const p = JSON.parse(v3) as Partial<MetaSave> & { v?: number };
      return coerceMeta({
        runs: p.runs ?? 0,
        loops: p.loops ?? 0,
        bestWave: p.bestWave ?? 0,
        lastGrade: p.lastGrade ?? null,
        forge: p.forge ?? {},
        bestLevel: p.bestLevel ?? 0,
        stamps: p.stamps ?? [],
      });
    }
    const v2 = localStorage.getItem(META_V2);
    if (v2) {
      const p = JSON.parse(v2) as Partial<MetaSave> & { v?: number };
      return coerceMeta({
        runs: p.runs ?? 0,
        loops: p.loops ?? 0,
        bestWave: p.bestWave ?? 0,
        lastGrade: p.lastGrade ?? null,
        forge: p.forge ?? {},
        bestLevel: p.bestLevel ?? 0,
        stamps: [],
      });
    }
    const old = localStorage.getItem(LEGACY);
    if (old) {
      const p = JSON.parse(old) as { runs?: number; wins?: number; bestWave?: number; lastGrade?: Grade | null };
      return coerceMeta({
        runs: p.runs ?? 0,
        loops: p.wins ?? 0,
        bestWave: p.bestWave ?? 0,
        lastGrade: p.lastGrade ?? null,
      });
    }
  } catch {
    /* fall through */
  }
  return { ...EMPTY_META, forge: {}, stamps: [], gunKills: {}, hangar: emptyHangar() };
}

export function saveMeta(patch: Partial<MetaSave>) {
  if (typeof window === "undefined") return loadMeta();
  const next = withUnlocks({ ...loadMeta(), ...patch, v: 4 });
  try {
    localStorage.setItem(META_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
  return next;
}

export function bumpForge(templateId: string) {
  const meta = loadMeta();
  const forge = { ...meta.forge, [templateId]: (meta.forge[templateId] ?? 0) + 1 };
  return saveMeta({ forge, loops: meta.loops + 1 });
}

export function addStamp(id: string) {
  const meta = loadMeta();
  return saveMeta({ stamps: [...(meta.stamps ?? []), id] });
}

export function recordRun(opts: { wave: number; loops?: number; grade: Grade | null; level?: number }) {
  const cur = loadMeta();
  const add = orbitXpFromRun(opts.wave, opts.grade);
  return saveMeta({
    runs: cur.runs + 1,
    bestWave: Math.max(cur.bestWave, opts.wave),
    lastGrade: opts.grade ?? cur.lastGrade,
    loops: opts.loops ?? cur.loops,
    bestLevel: Math.max(cur.bestLevel ?? 0, opts.level ?? 0),
    orbitXp: (cur.orbitXp ?? 0) + add,
  });
}

export function noteGunKills(add: Record<string, number>) {
  const cur = loadMeta();
  const gunKills = { ...cur.gunKills };
  for (const [id, n] of Object.entries(add)) {
    if (n > 0) gunKills[id] = (gunKills[id] ?? 0) + n;
  }
  return saveMeta({ gunKills });
}

export function noteLeakless() {
  const cur = loadMeta();
  return saveMeta({ leakless: (cur.leakless ?? 0) + 1 });
}

export function equipSkin(id: SkinId) {
  const cur = loadMeta();
  if (!cur.unlocked.includes(id)) return cur;
  return saveMeta({ equipped: id });
}

export function addFlux(n: number) {
  if (!Number.isFinite(n) || n <= 0) return loadMeta();
  const cur = loadMeta();
  return saveMeta({ flux: cur.flux + Math.floor(n) });
}

export function buyHangar(id: HangarId) {
  const item = hangarItem(id);
  const cur = loadMeta();
  if (!item) return cur;
  const ranks: HangarRanks = hangarOf(cur.hangar);
  const rank = ranks[id] ?? 0;
  if (rank >= item.max) return cur;
  const cost = hangarCost(item, rank);
  if (cur.flux < cost) return cur;
  return saveMeta({
    flux: cur.flux - cost,
    hangar: { ...ranks, [id]: rank + 1 },
  });
}

export function buyVault(id: string) {
  const node = vaultNode(id);
  const cur = loadMeta();
  if (!node?.branch) return cur;
  const vault = vaultOf(cur.vault);
  if (!vaultCanBuy(vault, id)) return cur;
  if (cur.flux < node.cost) return cur;
  const ownedIds = [...vault.ownedIds, id];
  const branch = node.branch;
  const next: VaultSave = {
    ...vault,
    ownedIds,
    [branch]: Math.max(vault[branch], node.rank),
  };
  return saveMeta({ flux: cur.flux - node.cost, vault: next });
}

export function markTutorial(done: boolean, skipped: boolean) {
  return saveMeta({ tutorialDone: done || loadMeta().tutorialDone, tutorialSkipped: skipped || loadMeta().tutorialSkipped });
}

export function buySkin(id: SkinId) {
  const cost = SKIN_FLUX[id];
  const cur = loadMeta();
  if (!cost || cur.flux < cost) return cur;
  if ((cur.boughtSkins ?? []).includes(id) || cur.unlocked.includes(id)) {
    return saveMeta({ equipped: id });
  }
  return saveMeta({
    flux: cur.flux - cost,
    boughtSkins: [...(cur.boughtSkins ?? []), id],
    equipped: id,
  });
}

const RESTABLE: Phase[] = ["placement", "shop", "draft", "opening", "engrave", "loot", "fit", "merchant"];
const LIVE_KEY = "vector-live";

export function markLive(on: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (on) sessionStorage.setItem(LIVE_KEY, "1");
    else sessionStorage.removeItem(LIVE_KEY);
  } catch {
    /* */
  }
}

export function isLive() {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(LIVE_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveRun(run: RunSave) {
  if (typeof window === "undefined") return;
  try {
    const phase = RESTABLE.includes(run.phase) ? run.phase : "placement";
    localStorage.setItem(runKey(), JSON.stringify({ ...run, phase, v: 4 }));
  } catch {
    /* quota */
  }
}

export function loadRun(): RunSave | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      localStorage.getItem(runKey()) ??
      (activeSlot() === 0 ? localStorage.getItem(RUN_KEY) ?? localStorage.getItem(LEGACY_RUN) : null);
    if (!raw) return null;
    const p = JSON.parse(raw) as RunSave;
    if (!p?.roster) return null;
    if (p.v !== 2 && p.v !== 3 && p.v !== 4) return null;
    return p;
  } catch {
    return null;
  }
}

export function clearRun() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(runKey());
    if (activeSlot() === 0) localStorage.removeItem(RUN_KEY);
  } catch {
    /* */
  }
}

export function forgeRank(forge: Record<string, number>, templateId: string) {
  return forge[templateId] ?? 0;
}

/** @deprecated alias for title screen */
export const loadBest = loadMeta;
export const saveBest = saveMeta;

const PROFILE_KEY = "vector-profiles-v1";
const SLOT_N = 3;

function emptySlot(id: number): ProfileSlot {
  return { id, boundId: null, xp: 0, jobs: 0 };
}

function emptyProfiles(): ProfilesSave {
  return { v: 1, active: 0, slots: [0, 1, 2].map(emptySlot) };
}

function coerceProfiles(p: Partial<ProfilesSave>): ProfilesSave {
  const base = emptyProfiles();
  const slots = base.slots.map((s, i) => {
    const got = p.slots?.[i];
    return {
      id: i,
      boundId: got?.boundId ?? null,
      xp: Math.max(0, Math.floor(got?.xp ?? 0)),
      jobs: Math.max(0, Math.floor(got?.jobs ?? 0)),
    };
  });
  const active = Math.max(0, Math.min(SLOT_N - 1, Math.floor(p.active ?? 0)));
  return { v: 1, active, slots };
}

export function loadProfiles(): ProfilesSave {
  if (typeof window === "undefined") return emptyProfiles();
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as ProfilesSave;
      if (p?.v === 1) return coerceProfiles(p);
    }
  } catch {
    /* */
  }
  return emptyProfiles();
}

export function saveProfiles(patch: Partial<ProfilesSave>) {
  if (typeof window === "undefined") return loadProfiles();
  const next = coerceProfiles({ ...loadProfiles(), ...patch, v: 1 });
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
  return next;
}

export function activeSlot(): number {
  return loadProfiles().active;
}

export function activeProfile(): ProfileSlot {
  const p = loadProfiles();
  return p.slots[p.active] ?? emptySlot(0);
}

function runKey(slot = activeSlot()) {
  return `${RUN_KEY}-${slot}`;
}

export function selectSlot(id: number) {
  const i = Math.max(0, Math.min(SLOT_N - 1, Math.floor(id)));
  return saveProfiles({ active: i });
}

export function bindCraft(craftId: string) {
  const p = loadProfiles();
  const slots = p.slots.map((s) => (s.id === p.active ? { ...s, boundId: craftId, xp: s.xp } : s));
  return saveProfiles({ slots });
}

export function addBondXp(n: number) {
  const add = Math.max(0, Math.floor(n));
  const p = loadProfiles();
  const slots = p.slots.map((s) => (s.id === p.active ? { ...s, xp: s.xp + add } : s));
  return saveProfiles({ slots });
}

export function slotHasRun(id = activeSlot()) {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(runKey(id))) return true;
    if (id === 0 && localStorage.getItem(RUN_KEY)) return true;
  } catch {
    /* */
  }
  return false;
}
