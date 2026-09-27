import { MAX_PADS, WORLD } from "../constants";
import type { CoverShape, Pad, PadLook, Vec } from "../types";

export type GateId = "orbit" | "nadir";

export const GATES: { id: GateId; name: string; hint: string; color: string }[] = [
  { id: "orbit", name: "Spawn", hint: "The path", color: "#3cd6cc" },
];

/** Corner radius for drawn lanes and enemy samples. Keep ≤ half the shortest run. */
export const PATH_CORNER = 48;
/** Pads sit this far off the lane. Shortest gun still reaches. */
export const PAD_HUG = 62;
/** A pad farther than this cannot cover the path. */
export const PAD_MAX_OFF = 88;

/**
 * One S-lane into a bottom-right core. Pads sit off the lane.
 * Spawn sits on the left, never the top rim.
 */
export let PATHS: Vec[][] = [
  [
    { x: 72, y: 200 },
    { x: 1088, y: 200 },
    { x: 1088, y: 352 },
    { x: 196, y: 352 },
    { x: 196, y: 504 },
    { x: 1088, y: 504 },
    { x: 1088, y: 648 },
    { x: 1204, y: 648 },
  ],
];

export const PATH = PATHS[0]!;
export const SPAWN = PATHS[0]![0]!;
export const BASE = PATHS[0]![PATHS[0]!.length - 1]!;

export function pathOf(route: number): Vec[] {
  return PATHS[route] ?? PATHS[0]!;
}

export function pathLen(route: number): number {
  const path = pathOf(route);
  let n = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    n += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return n;
}

export let PATH_LENS = PATHS.map((_, i) => pathLen(i));
export let PATH_LEN = Math.max(...PATH_LENS);
export let CRAFT_DOCK: Vec = { x: 88, y: 430 };

/**
 * Pads sit off the lane. Shape jobs:
 * cone  — offset from a long run, faces the path (covers both ways)
 * ring  — pocket between two parallel runs
 * lane  — hugs a long straight
 * diamond — sits on a bend
 * circle — close generalist, including the merge
 */
export let PADS: Pad[] = [
  { id: "p1", x: 160, y: 128, zone: "orbit" },
  { id: "p2", x: 400, y: 128, zone: "orbit" },
  { id: "p3", x: 640, y: 128, zone: "orbit" },
  { id: "p4", x: 880, y: 128, zone: "orbit" },
  { id: "p5", x: 1210, y: 128, zone: "orbit" },
  { id: "p6", x: 400, y: 270, zone: "orbit" },
  { id: "p7", x: 640, y: 270, zone: "orbit" },
  { id: "p8", x: 880, y: 270, zone: "orbit" },

  { id: "p9", x: 118, y: 612, zone: "nadir" },
  { id: "p10", x: 118, y: 500, zone: "nadir" },
  { id: "p11", x: 320, y: 394, zone: "nadir" },
  { id: "p12", x: 560, y: 500, zone: "nadir" },
  { id: "p13", x: 1000, y: 270, zone: "orbit" },
  { id: "p14", x: 420, y: 612, zone: "nadir" },

  { id: "p15", x: 1160, y: 540, zone: "merge" },
  { id: "p16", x: 1160, y: 600, zone: "merge" },
  { id: "p17", x: 760, y: 612, zone: "merge" },
  { id: "p18", x: 640, y: 394, zone: "merge" },
  { id: "p19", x: 880, y: 394, zone: "merge" },
  { id: "p20", x: 1048, y: 500, zone: "merge" },
];

export const PATH_WIDTH_DRAW = 26;

export function padById(id: string): Pad | undefined {
  return PADS.find((p) => p.id === id);
}

export function hitPad(x: number, y: number, r = 72, pads: Pad[] = PADS): Pad | undefined {
  let best: Pad | undefined;
  let bestD = r * r;
  for (const p of pads) {
    const d = (p.x - x) ** 2 + (p.y - y) ** 2;
    if (d <= bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

export function inWorld(x: number, y: number) {
  return x >= 0 && y >= 0 && x <= WORLD.w && y <= WORLD.h;
}

export function remainingDist(route: number, wp: number, dist: number): number {
  const path = pathOf(route);
  let n = 0;
  for (let i = wp + 1; i < path.length; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (i === wp + 1) n += Math.max(0, seg - dist);
    else n += seg;
  }
  return n;
}

/** Closest path point and heading toward the core. */
export function nearestPathMeta(x: number, y: number): { dist: number; aim: number; px: number; py: number } {
  let best = Infinity;
  let aim = 0;
  let px = x;
  let py = y;
  for (const path of PATHS) {
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i]!;
      const b = path[i + 1]!;
      const vx = b.x - a.x;
      const vy = b.y - a.y;
      const len2 = vx * vx + vy * vy || 1;
      let t = ((x - a.x) * vx + (y - a.y) * vy) / len2;
      t = Math.max(0, Math.min(1, t));
      const qx = a.x + vx * t;
      const qy = a.y + vy * t;
      const d = Math.hypot(x - qx, y - qy);
      if (d < best) {
        best = d;
        px = qx;
        py = qy;
        aim = Math.atan2(vy, vx);
      }
    }
  }
  return { dist: best, aim, px, py };
}

export type PathSample = { x: number; y: number; heading: number; along: number };

function buildRounded(path: Vec[], radius = PATH_CORNER, step = 5): PathSample[] {
  if (path.length < 2) return path.map((p) => ({ x: p.x, y: p.y, heading: 0, along: 0 }));
  type Seg =
    | { kind: "line"; ax: number; ay: number; bx: number; by: number }
    | { kind: "arc"; cx: number; cy: number; r: number; a0: number; a1: number; ccw: boolean };
  const segs: Seg[] = [];
  const startH = Math.atan2(path[1]!.y - path[0]!.y, path[1]!.x - path[0]!.x);
  let cursor = { x: path[0]!.x, y: path[0]!.y };

  for (let i = 1; i < path.length - 1; i++) {
    const A = path[i - 1]!;
    const B = path[i]!;
    const C = path[i + 1]!;
    const inX = B.x - A.x;
    const inY = B.y - A.y;
    const outX = C.x - B.x;
    const outY = C.y - B.y;
    const inLen = Math.hypot(inX, inY) || 1;
    const outLen = Math.hypot(outX, outY) || 1;
    const iu = { x: inX / inLen, y: inY / inLen };
    const ou = { x: outX / outLen, y: outY / outLen };
    const cross = iu.x * ou.y - iu.y * ou.x;
    const r = Math.min(radius, inLen * 0.42, outLen * 0.42);
    if (Math.abs(cross) < 0.02 || r < 8) {
      segs.push({ kind: "line", ax: cursor.x, ay: cursor.y, bx: B.x, by: B.y });
      cursor = { x: B.x, y: B.y };
      continue;
    }
    const p1 = { x: B.x - iu.x * r, y: B.y - iu.y * r };
    const p2 = { x: B.x + ou.x * r, y: B.y + ou.y * r };
    segs.push({ kind: "line", ax: cursor.x, ay: cursor.y, bx: p1.x, by: p1.y });
    const sign = cross > 0 ? 1 : -1;
    const cx = p1.x - iu.y * r * sign;
    const cy = p1.y + iu.x * r * sign;
    const a0 = Math.atan2(p1.y - cy, p1.x - cx);
    const a1 = Math.atan2(p2.y - cy, p2.x - cx);
    segs.push({ kind: "arc", cx, cy, r, a0, a1, ccw: sign > 0 });
    cursor = p2;
  }
  const last = path[path.length - 1]!;
  segs.push({ kind: "line", ax: cursor.x, ay: cursor.y, bx: last.x, by: last.y });

  const out: PathSample[] = [];
  let along = 0;
  const push = (x: number, y: number, heading: number) => {
    const prev = out[out.length - 1];
    if (prev) along += Math.hypot(x - prev.x, y - prev.y);
    out.push({ x, y, heading, along });
  };
  push(path[0]!.x, path[0]!.y, startH);

  for (const s of segs) {
    if (s.kind === "line") {
      const dx = s.bx - s.ax;
      const dy = s.by - s.ay;
      const len = Math.hypot(dx, dy);
      if (len < 1) continue;
      const n = Math.max(1, Math.round(len / step));
      const h = Math.atan2(dy, dx);
      for (let k = 1; k <= n; k++) {
        const t = k / n;
        push(s.ax + dx * t, s.ay + dy * t, h);
      }
    } else {
      let a0 = s.a0;
      let a1 = s.a1;
      if (s.ccw) {
        while (a1 <= a0) a1 += Math.PI * 2;
      } else {
        while (a1 >= a0) a1 -= Math.PI * 2;
      }
      const sweep = a1 - a0;
      const arcLen = Math.abs(sweep) * s.r;
      const n = Math.max(2, Math.round(arcLen / step));
      for (let k = 1; k <= n; k++) {
        const t = k / n;
        const a = a0 + sweep * t;
        const x = s.cx + Math.cos(a) * s.r;
        const y = s.cy + Math.sin(a) * s.r;
        const h = a + (s.ccw ? Math.PI / 2 : -Math.PI / 2);
        push(x, y, h);
      }
    }
  }
  return out;
}

export let PATH_SAMPLES: PathSample[][] = PATHS.map((p) => buildRounded(p));
export let PATH_ALONG: number[] = PATH_SAMPLES.map((s) => s[s.length - 1]?.along ?? 1);

export function sampleAlong(route: number, along: number): PathSample {
  const s = PATH_SAMPLES[route] ?? PATH_SAMPLES[0]!;
  const first = s[0]!;
  const last = s[s.length - 1]!;
  if (along <= 0) return first;
  if (along >= last.along) return last;
  let lo = 0;
  let hi = s.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (s[mid]!.along < along) lo = mid + 1;
    else hi = mid;
  }
  const b = s[Math.max(1, lo)]!;
  const a = s[Math.max(0, lo - 1)]!;
  const span = b.along - a.along || 1;
  const t = (along - a.along) / span;
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    heading: a.heading + Math.atan2(Math.sin(b.heading - a.heading), Math.cos(b.heading - a.heading)) * t,
    along,
  };
}

export function coverPoints(step = 14): PathSample[] {
  const out: PathSample[] = [];
  for (let r = 0; r < PATH_SAMPLES.length; r++) {
    const total = PATH_ALONG[r] ?? 1;
    for (let d = 0; d <= total; d += step) out.push(sampleAlong(r, d));
  }
  return out;
}

/** Fraction of the map (minus the core box) that sits near a path. */
export function pathFillRatio(radius = 46, cell = 16): number {
  const coreL = WORLD.w - 220;
  const coreT = WORLD.h - 180;
  let free = 0;
  let near = 0;
  for (let y = cell / 2; y < WORLD.h; y += cell) {
    for (let x = cell / 2; x < WORLD.w; x += cell) {
      if (x >= coreL && y >= coreT) continue;
      free += 1;
      if (nearestPathMeta(x, y).dist <= radius) near += 1;
    }
  }
  return free ? near / free : 0;
}

const TWIN_S_PATHS = PATHS;
const TWIN_S_PADS = PADS;
const TWIN_S_SAMPLES = PATH_SAMPLES;
const TWIN_S_ALONG = PATH_ALONG;

const SHELF_PATHS: Vec[][] = [
  [
    { x: 72, y: 304 },
    { x: 1140, y: 304 },
    { x: 1140, y: 176 },
    { x: 200, y: 176 },
    { x: 200, y: 456 },
    { x: 1080, y: 456 },
    { x: 1080, y: 648 },
    { x: 1204, y: 648 },
  ],
  [
    { x: 56, y: 680 },
    { x: 56, y: 500 },
    { x: 940, y: 500 },
    { x: 940, y: 580 },
    { x: 220, y: 580 },
    { x: 220, y: 648 },
    { x: 1204, y: 648 },
  ],
];

const SHELF_PADS: Pad[] = [
  { id: "p1", x: 180, y: 146, zone: "orbit" },
  { id: "p2", x: 420, y: 146, zone: "orbit" },
  { id: "p3", x: 660, y: 146, zone: "orbit" },
  { id: "p4", x: 900, y: 146, zone: "orbit" },
  { id: "p5", x: 1210, y: 146, zone: "orbit" },
  { id: "p6", x: 420, y: 300, zone: "orbit" },
  { id: "p7", x: 660, y: 300, zone: "orbit" },
  { id: "p8", x: 900, y: 300, zone: "orbit" },
  { id: "p9", x: 122, y: 620, zone: "nadir" },
  { id: "p10", x: 122, y: 540, zone: "nadir" },
  { id: "p11", x: 360, y: 440, zone: "nadir" },
  { id: "p12", x: 580, y: 540, zone: "nadir" },
  { id: "p13", x: 1020, y: 300, zone: "orbit" },
  { id: "p14", x: 440, y: 620, zone: "nadir" },
  { id: "p15", x: 1160, y: 540, zone: "merge" },
  { id: "p16", x: 1160, y: 600, zone: "merge" },
  { id: "p17", x: 760, y: 620, zone: "merge" },
  { id: "p18", x: 640, y: 440, zone: "merge" },
  { id: "p19", x: 880, y: 440, zone: "merge" },
  { id: "p20", x: 1020, y: 540, zone: "merge" },
];

const HOOK_PATHS: Vec[][] = [
  [
    { x: 72, y: 436 },
    { x: 72, y: 188 },
    { x: 1000, y: 188 },
    { x: 1000, y: 356 },
    { x: 220, y: 356 },
    { x: 220, y: 528 },
    { x: 1100, y: 528 },
    { x: 1100, y: 648 },
    { x: 1204, y: 648 },
  ],
  [
    { x: 48, y: 700 },
    { x: 48, y: 360 },
    { x: 420, y: 360 },
    { x: 420, y: 560 },
    { x: 180, y: 560 },
    { x: 180, y: 648 },
    { x: 1204, y: 648 },
  ],
];

const HOOK_PADS: Pad[] = [
  { id: "p1", x: 240, y: 128, zone: "orbit" },
  { id: "p2", x: 460, y: 128, zone: "orbit" },
  { id: "p3", x: 680, y: 128, zone: "orbit" },
  { id: "p4", x: 200, y: 330, zone: "orbit" },
  { id: "p5", x: 1210, y: 128, zone: "orbit" },
  { id: "p6", x: 440, y: 330, zone: "orbit" },
  { id: "p7", x: 680, y: 330, zone: "orbit" },
  { id: "p8", x: 860, y: 330, zone: "orbit" },
  { id: "p9", x: 118, y: 620, zone: "nadir" },
  { id: "p10", x: 118, y: 460, zone: "nadir" },
  { id: "p11", x: 300, y: 460, zone: "nadir" },
  { id: "p12", x: 560, y: 460, zone: "nadir" },
  { id: "p13", x: 1100, y: 330, zone: "orbit" },
  { id: "p14", x: 420, y: 620, zone: "nadir" },
  { id: "p15", x: 1160, y: 540, zone: "merge" },
  { id: "p16", x: 1160, y: 600, zone: "merge" },
  { id: "p17", x: 760, y: 560, zone: "merge" },
  { id: "p18", x: 640, y: 400, zone: "merge" },
  { id: "p19", x: 860, y: 400, zone: "merge" },
  { id: "p20", x: 1048, y: 540, zone: "merge" },
];

type PackedLayout = {
  paths: Vec[][];
  pads: Pad[];
  samples: PathSample[][];
  along: number[];
  dock: Vec;
};

function findDock(path: Vec[], pads: Pad[]): Vec {
  const samples = buildRounded(path);
  let best = { x: 88, y: 430, d: 0 };
  for (let x = 72; x < WORLD.w - 220; x += 48) {
    for (let y = 96; y < WORLD.h - 140; y += 48) {
      if (x > WORLD.w - 260 && y > WORLD.h - 180) continue;
      let d = 9999;
      for (const s of samples) d = Math.min(d, Math.hypot(s.x - x, s.y - y));
      for (const p of pads) d = Math.min(d, Math.hypot(p.x - x, p.y - y));
      if (d > best.d) best = { x, y, d };
    }
  }
  return { x: best.x, y: best.y };
}

function pathLengthOf(path: Vec[]): number {
  let n = 0;
  for (let i = 1; i < path.length; i++) {
    n += Math.hypot(path[i]!.x - path[i - 1]!.x, path[i]!.y - path[i - 1]!.y);
  }
  return n;
}

/** Clean U-folds on the two longest interior runs. About +15% walk. */
function lengthenPath(path: Vec[], extra = 0.15): Vec[] {
  if (path.length < 4) return path.map((p) => ({ ...p }));
  const need = pathLengthOf(path) * extra;
  const mag = Math.max(72, Math.min(148, need / 4));
  const segs: { i: number; len: number }[] = [];
  for (let i = 1; i < path.length - 1; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    segs.push({ i, len: Math.hypot(b.x - a.x, b.y - a.y) });
  }
  segs.sort((a, b) => b.len - a.len);
  const foldAt = new Set(segs.slice(0, 2).map((s) => s.i));
  const out: Vec[] = [{ ...path[0]! }];
  const clamp = (p: Vec): Vec => ({
    x: Math.max(64, Math.min(WORLD.w - 64, p.x)),
    y: Math.max(48, Math.min(WORLD.h - 72, p.y)),
  });
  for (let i = 1; i < path.length; i++) {
    const a = out[out.length - 1]!;
    const b = path[i]!;
    if (!foldAt.has(i)) {
      out.push({ ...b });
      continue;
    }
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const px = -uy;
    const py = ux;
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const s = (WORLD.w / 2 - mid.x) * px + (WORLD.h / 2 - mid.y) * py >= 0 ? 1 : -1;
    const inset = Math.min(150, len * 0.26);
    const p1 = clamp({ x: a.x + ux * inset, y: a.y + uy * inset });
    const p2 = clamp({ x: p1.x + px * mag * s, y: p1.y + py * mag * s });
    const p4 = clamp({ x: b.x - ux * inset, y: b.y - uy * inset });
    const p3 = clamp({ x: p4.x + px * mag * s, y: p4.y + py * mag * s });
    out.push(p1, p2, p3, p4, { ...b });
  }
  return out;
}

function jogPath(path: Vec[], jog: number): Vec[] {
  const out = path.map((p) => ({ x: p.x, y: p.y }));
  if (!jog || out.length < 5) return out;
  const i = 2 + (Math.abs(Math.floor(jog)) % (out.length - 4));
  const a = out[i - 1]!;
  const b = out[i]!;
  const c = out[i + 1]!;
  const dx = c.x - a.x;
  const dy = c.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const mag = 52 + (Math.abs(jog) % 3) * 10;
  const sign = jog >= 0 ? 1 : -1;
  b.x = Math.max(80, Math.min(WORLD.w - 80, b.x + (-dy / len) * mag * sign));
  b.y = Math.max(80, Math.min(WORLD.h - 80, b.y + (dx / len) * mag * sign));
  return out;
}

function seatFor(turn: number, i: number): CoverShape {
  if (turn > 0.7) return "diamond";
  if (turn > 0.28) return "cone";
  if (i % 5 === 2) return "ring";
  if (turn < 0.06) return "lane";
  return "circle";
}

function packLayout(paths: Vec[][], _pads?: Pad[]): PackedLayout {
  const one = [paths[0]!];
  const samples = one.map((p) => buildRounded(p));
  const pads = [...corePads(one[0]!), ...hugPads(one[0]!, MAX_PADS)];
  return {
    paths: one,
    pads,
    samples,
    along: samples.map((s) => s[s.length - 1]?.along ?? 1),
    dock: findDock(one[0]!, pads),
  };
}

const RAW: Record<string, Vec[]> = {
  "twin-s": [
    { x: 72, y: 200 },
    { x: 1088, y: 200 },
    { x: 1088, y: 352 },
    { x: 196, y: 352 },
    { x: 196, y: 504 },
    { x: 1088, y: 504 },
    { x: 1088, y: 648 },
    { x: 1204, y: 648 },
  ],
  shelf: SHELF_PATHS[0]!.map((p) => ({ x: p.x, y: p.y })),
  hook: HOOK_PATHS[0]!.map((p) => ({ x: p.x, y: p.y })),
};

export function setMapLayout(id: string, jog = 0) {
  const raw = RAW[id] ?? RAW["twin-s"]!;
  const L = packLayout([lengthenPath(jogPath(raw, jog), 0.15)]);
  PATHS = L.paths;
  PADS = L.pads;
  PATH_SAMPLES = L.samples;
  PATH_ALONG = L.along;
  PATH_LENS = PATHS.map((_, i) => pathLen(i));
  PATH_LEN = Math.max(...PATH_LENS);
  CRAFT_DOCK = L.dock ?? { x: 88, y: 430 };
  return L;
}

const MAP_LAYOUT: Record<string, string> = {
  "map-mare": "twin-s",
  "map-regolith": "shelf",
  "map-void": "hook",
  "map-helios": "shelf",
  "map-lagrange": "hook",
};

export function layoutForMap(mapId: string | null | undefined): string {
  if (mapId && MAP_LAYOUT[mapId]) return MAP_LAYOUT[mapId]!;
  return "twin-s";
}

function pointAlong(samples: PathSample[], along: number): PathSample {
  const first = samples[0]!;
  const last = samples[samples.length - 1]!;
  if (along <= 0) return first;
  if (along >= last.along) return last;
  let lo = 0;
  let hi = samples.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (samples[mid]!.along < along) lo = mid + 1;
    else hi = mid;
  }
  return samples[Math.max(0, lo)]!;
}

function corePads(path: Vec[]): Pad[] {
  const end = path[path.length - 1] ?? { x: WORLD.w - 80, y: WORLD.h - 72 };
  const a = {
    id: "far-a",
    x: Math.max(72, end.x - 184),
    y: Math.max(72, end.y - 92),
    zone: "merge" as const,
    seat: "circle" as const,
    far: true,
    look: "ring" as const,
  };
  const b = {
    id: "far-b",
    x: Math.max(72, end.x - 56),
    y: Math.max(72, end.y - 128),
    zone: "merge" as const,
    seat: "lane" as const,
    far: true,
    look: "ring" as const,
  };
  return [a, b];
}

export function padReachMul(padId: string | null | undefined): number {
  if (padId === "home") return 1.08;
  const p = PADS.find((x) => x.id === padId);
  if (p?.far) return 1.48;
  if (p?.look === "ring") return 1.12;
  return 1;
}

export function padRateMul(padId: string | null | undefined): number {
  const p = PADS.find((x) => x.id === padId);
  return p?.look === "pair" ? 1.12 : 1;
}

export function padBurnBonus(padId: string | null | undefined): number {
  const p = PADS.find((x) => x.id === padId);
  return p?.look === "rift" ? 6 : 0;
}

export function moonLook(i: number, far = false): PadLook {
  if (far) return "ring";
  const k = i % 8;
  if (k === 1) return "rift";
  if (k === 4) return "ring";
  if (k === 6) return "pair";
  return "plain";
}

export function moonPlantLine(pad: Pad): string | null {
  if (pad.look === "rift") return "Cracked moon. This gun burns a bit.";
  if (pad.look === "ring") return "Ring moon. This gun reaches farther.";
  if (pad.look === "pair") return "Twin moon. This gun shoots faster.";
  return null;
}

function hugPads(path: Vec[], n = MAX_PADS): Pad[] {
  const samples = buildRounded(path);
  const last = samples[samples.length - 1]?.along ?? 1;
  const edge = 110;
  const span = Math.max(1, last - edge * 2);
  const pads: Pad[] = [];
  let prevH = 0;
  for (let i = 0; i < n; i++) {
    const s = pointAlong(samples, edge + ((i + 0.5) / n) * span);
    let d = s.heading - prevH;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    const turn = i === 0 ? 0 : Math.abs(d);
    prevH = s.heading;
    const nx = -Math.sin(s.heading);
    const ny = Math.cos(s.heading);
    const at = (sign: number) => ({ x: s.x + nx * PAD_HUG * sign, y: s.y + ny * PAD_HUG * sign });
    const inb = (p: Vec) =>
      p.x >= 48 &&
      p.y >= 48 &&
      p.x <= WORLD.w - 48 &&
      p.y <= WORLD.h - 48 &&
      !(p.x > WORLD.w - 200 && p.y > WORLD.h - 130);
    let sign = i % 2 === 0 ? 1 : -1;
    let pos = at(sign);
    if (!inb(pos)) pos = at(-sign);
    pads.push({
      id: `p${i + 1}`,
      x: Math.max(48, Math.min(WORLD.w - 48, pos.x)),
      y: Math.max(48, Math.min(WORLD.h - 48, pos.y)),
      zone: i < 9 ? "orbit" : i < 18 ? "nadir" : "merge",
      seat: seatFor(turn, i),
      look: moonLook(i),
    });
  }
  return pads;
}

setMapLayout("twin-s");
