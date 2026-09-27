import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

// Lightweight geometry QA without TS compile.
const WORLD = { w: 1280, h: 720 };
const PATHS = [
  [
    { x: 72, y: 56 },
    { x: 1100, y: 56 },
    { x: 1100, y: 200 },
    { x: 184, y: 200 },
    { x: 184, y: 340 },
    { x: 1100, y: 340 },
    { x: 1100, y: 648 },
    { x: 1204, y: 648 },
  ],
  [
    { x: 52, y: 672 },
    { x: 52, y: 448 },
    { x: 992, y: 448 },
    { x: 992, y: 552 },
    { x: 184, y: 552 },
    { x: 184, y: 648 },
    { x: 1204, y: 648 },
  ],
];
const PADS = [
  { id: "p1", x: 160, y: 128 },
  { id: "p2", x: 400, y: 128 },
  { id: "p3", x: 640, y: 128 },
  { id: "p4", x: 880, y: 128 },
  { id: "p5", x: 1210, y: 128 },
  { id: "p6", x: 400, y: 270 },
  { id: "p7", x: 640, y: 270 },
  { id: "p8", x: 880, y: 270 },
  { id: "p9", x: 118, y: 612 },
  { id: "p10", x: 118, y: 500 },
  { id: "p11", x: 320, y: 394 },
  { id: "p12", x: 560, y: 500 },
  { id: "p13", x: 1000, y: 270 },
  { id: "p14", x: 420, y: 612 },
  { id: "p15", x: 1160, y: 540 },
  { id: "p16", x: 1160, y: 600 },
  { id: "p17", x: 760, y: 612 },
  { id: "p18", x: 640, y: 394 },
  { id: "p19", x: 880, y: 394 },
  { id: "p20", x: 1048, y: 500 },
];

function pathLen(path) {
  let n = 0;
  for (let i = 1; i < path.length; i++) {
    n += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
  }
  return n;
}

function nearest(x, y) {
  let best = Infinity;
  for (const path of PATHS) {
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i];
      const b = path[i + 1];
      const vx = b.x - a.x;
      const vy = b.y - a.y;
      const len2 = vx * vx + vy * vy || 1;
      let t = ((x - a.x) * vx + (y - a.y) * vy) / len2;
      t = Math.max(0, Math.min(1, t));
      const d = Math.hypot(x - (a.x + vx * t), y - (a.y + vy * t));
      if (d < best) best = d;
    }
  }
  return best;
}

const lens = PATHS.map(pathLen);
const short = Math.min(...lens);
const long = Math.max(...lens);
const ratio = long / short;

let free = 0;
let near = 0;
const cell = 16;
const radius = 46;
for (let y = cell / 2; y < WORLD.h; y += cell) {
  for (let x = cell / 2; x < WORLD.w; x += cell) {
    if (x >= WORLD.w - 220 && y >= WORLD.h - 180) continue;
    free += 1;
    if (nearest(x, y) <= radius) near += 1;
  }
}

const padReport = PADS.map((p) => ({
  id: p.id,
  dist: Math.round(nearest(p.x, p.y)),
  in: p.x >= 0 && p.y >= 0 && p.x <= WORLD.w && p.y <= WORLD.h,
}));

const COVER = { coneArc: 1.36, ringInner: 0.42, diamond: 1.12, laneBack: 0.22, laneFwd: 1.08, laneHalf: 0.5 };
const mul = { circle: 1, ring: 1, diamond: 1, cone: 1.19, lane: 1.22 };
function area(kind, r) {
  const R = r * mul[kind];
  const r2 = R * R;
  if (kind === "circle") return Math.PI * r2;
  if (kind === "ring") return Math.PI * (r2 - (R * COVER.ringInner) ** 2);
  if (kind === "diamond") return 2 * (R * COVER.diamond) ** 2;
  if (kind === "cone") return COVER.coneArc * r2;
  return (COVER.laneFwd + COVER.laneBack) * R * (2 * COVER.laneHalf * R);
}
const areas = Object.fromEntries(["circle", "ring", "diamond", "cone", "lane"].map((k) => [k, area(k, 230)]));
const maxA = Math.max(...Object.values(areas));
const minA = Math.min(...Object.values(areas));

console.log(JSON.stringify({
  lens: lens.map((n) => Math.round(n)),
  lengthRatio: Number(ratio.toFixed(3)),
  lengthOk: ratio <= 1.15,
  fill: Number((near / free).toFixed(3)),
  fillOk: near / free >= 0.5,
  pads: padReport,
  padOnPath: padReport.filter((p) => p.dist < 28),
  areas,
  areaSpread: Number((1 - minA / maxA).toFixed(3)),
  areaOk: minA >= maxA * 0.6,
}, null, 2));
