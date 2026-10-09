import { GRID_H, GRID_W, type Point } from "./grid";
import { pointAlong, type GridEnemy, type GridRun } from "./grid-sim";
import { TOWERS as GUNS, type TowerId } from "./matchup";
import { blitPack, ensurePack } from "./pack";

const HW = 42;
const HH = 21;
const PAD_X = 28;
const PAD_TOP = 108;

const INK = "#070b12";
const METAL = "#3d4b60";
const METAL_D = "#141c2a";
const LIGHT = "#8b98ab";
const FROST = "#147a78";
const FROST_H = "#7ef6ee";
const EMBER = "#c43a16";
const EMBER_H = "#ffb089";
const GOLD_H = "#ffe08a";
const PAPER = "#eef3f7";
const PURPLE = "#6a48c4";
const PURPLE_H = "#d4c4ff";

function proj(x: number, y: number) {
  return {
    x: (x - y) * HW + (GRID_H - 1) * HW + PAD_X,
    y: (x + y) * HH + PAD_TOP,
  };
}

function mapSize() {
  const far = proj(GRID_W - 1, 0);
  const deep = proj(GRID_W - 1, GRID_H - 1);
  return {
    w: Math.ceil(far.x + HW + 36),
    h: Math.ceil(deep.y + HH + 28),
  };
}

let camX = 0;
let camY = 0;
let camKey = "";

function layout(cssW: number, cssH: number) {
  const map = mapSize();
  return { scale: 1, map, cssW, cssH };
}

function placeCam(cssW: number, cssH: number, map: { w: number; h: number }, key: string) {
  if (camKey !== key) {
    camKey = key;
    camX = (cssW - map.w) / 2;
    camY = (cssH - map.h) / 2;
  }
  camX = map.w <= cssW ? (cssW - map.w) / 2 : Math.max(cssW - map.w, Math.min(0, camX));
  camY = map.h <= cssH ? (cssH - map.h) / 2 : Math.max(cssH - map.h, Math.min(0, camY));
}

export function panBy(dx: number, dy: number) {
  camX += dx;
  camY += dy;
}

export function resetCamera() {
  camKey = "";
}

export function cellFromPoint(cssW: number, cssH: number, px: number, py: number): Point | null {
  const view = layout(cssW, cssH);
  placeCam(cssW, cssH, view.map, camKey || "board");
  const lx = px - camX;
  const ly = py - camY;
  const rx = lx - ((GRID_H - 1) * HW + PAD_X);
  const ry = ly - PAD_TOP;
  const gx = (rx / HW + ry / HH) / 2;
  const gy = (ry / HH - rx / HW) / 2;
  const x = Math.round(gx);
  const y = Math.round(gy);
  if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) return null;
  return { x, y };
}

function poly(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[], style: string | CanvasGradient) {
  ctx.beginPath();
  ctx.moveTo(pts[0]!.x, pts[0]!.y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y);
  ctx.closePath();
  ctx.fillStyle = style;
  ctx.fill();
}

function ramp(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [t, c] of stops) g.addColorStop(t, c);
  return g;
}

function slab(ctx: CanvasRenderingContext2D, cx: number, cy: number, tone: "pad" | "hot" | "exit" | "road") {
  const hw = HW + 1.5;
  const hh = HH + 1;
  const fill = tone === "exit" ? "#3a2a68" : tone === "hot" ? "#1c4a52" : tone === "road" ? "#121820" : "#243044";
  const rim = tone === "hot" ? FROST_H : tone === "exit" ? "#d4c4ff" : tone === "road" ? "#147a78" : "rgba(238,243,247,0.12)";
  ctx.beginPath();
  ctx.moveTo(cx, cy - hh);
  ctx.lineTo(cx + hw, cy);
  ctx.lineTo(cx, cy + hh);
  ctx.lineTo(cx - hw, cy);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = rim;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function shadow(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number) {
  ctx.fillStyle = "rgba(0,0,0,0.38)";
  ctx.beginPath();
  ctx.ellipse(cx + 4, cy + 8, rx, rx * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();
}

function prism(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  hw: number,
  hh: number,
  tall: number,
  roof: [string, string],
  left: [string, string],
  right: [string, string],
) {
  poly(
    ctx,
    [
      { x: cx - hw, y: cy },
      { x: cx, y: cy + hh },
      { x: cx, y: cy + hh - tall },
      { x: cx - hw, y: cy - tall },
    ],
    ramp(ctx, cx - hw, cy - tall, cx, cy + hh, [[0, left[0]], [1, left[1]]]),
  );
  poly(
    ctx,
    [
      { x: cx + hw, y: cy },
      { x: cx, y: cy + hh },
      { x: cx, y: cy + hh - tall },
      { x: cx + hw, y: cy - tall },
    ],
    ramp(ctx, cx, cy - tall, cx + hw, cy + hh, [[0, right[0]], [1, right[1]]]),
  );
  poly(
    ctx,
    [
      { x: cx, y: cy - hh - tall },
      { x: cx + hw, y: cy - tall },
      { x: cx, y: cy + hh - tall },
      { x: cx - hw, y: cy - tall },
    ],
    ramp(ctx, cx, cy - hh - tall, cx, cy + hh - tall, [[0, roof[0]], [1, roof[1]]]),
  );
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy - hh - tall);
  ctx.lineTo(cx - hw, cy - tall);
  ctx.stroke();
}

function glowDot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function building(ctx: CanvasRenderingContext2D, id: TowerId, cx: number, cy: number, flash: boolean) {
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.beginPath();
  ctx.ellipse(cx + 1, cy + 2, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  if (blitPack(ctx, id, cx, cy)) {
    if (flash) glowDot(ctx, cx, cy - 52, 4, id === "crater" ? EMBER_H : id === "beacon" ? GOLD_H : FROST_H);
    return;
  }
  shadow(ctx, cx, cy, 18);
  if (id === "lance") {
    prism(ctx, cx, cy, 16, 8, 10, [LIGHT, METAL], [METAL, METAL_D], ["#243044", INK]);
    prism(ctx, cx, cy - 10, 8, 5, 36, [FROST_H, FROST], [FROST, "#0c3030"], ["#0c3030", INK]);
    glowDot(ctx, cx, cy - 52, flash ? 5 : 3.5, FROST_H);
  } else if (id === "halo") {
    prism(ctx, cx, cy, 16, 9, 22, ["#1a4a48", "#0c3030"], [FROST, "#0c3030"], [METAL_D, INK]);
    ctx.save();
    ctx.strokeStyle = flash ? PAPER : FROST_H;
    ctx.shadowColor = FROST_H;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 30, 16, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    glowDot(ctx, cx, cy - 30, 3, FROST_H);
  } else if (id === "crater") {
    prism(ctx, cx, cy, 22, 11, 16, ["#8a3418", EMBER], [EMBER, "#4a180e"], ["#4a180e", INK]);
    ctx.save();
    const g = ctx.createRadialGradient(cx, cy - 18, 2, cx, cy - 18, 10);
    g.addColorStop(0, flash ? PAPER : GOLD_H);
    g.addColorStop(0.45, EMBER_H);
    g.addColorStop(1, EMBER);
    ctx.fillStyle = g;
    ctx.shadowColor = EMBER_H;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 18, 9, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (id === "rail") {
    prism(ctx, cx, cy, 24, 10, 12, [LIGHT, "#6a7c90"], ["#9aabbe", METAL_D], [METAL_D, INK]);
    prism(ctx, cx + 16, cy - 8, 10, 3, 4, [PAPER, LIGHT], [LIGHT, METAL], [METAL_D, INK]);
    glowDot(ctx, cx + 28, cy - 12, flash ? 3 : 2, PAPER);
  } else {
    prism(ctx, cx, cy, 12, 7, 8, ["#c4a15a", "#6a5420"], ["#a8842e", "#3a3014"], [METAL_D, INK]);
    prism(ctx, cx, cy - 8, 3, 2, 28, [GOLD_H, "#a8842e"], ["#a8842e", "#3a3014"], ["#3a3014", INK]);
    glowDot(ctx, cx, cy - 42, flash ? 8 : 6, GOLD_H);
  }
}

function hull(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, body: string, light: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(2, 8, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createLinearGradient(-16, -10, 16, 8);
  g.addColorStop(0, light);
  g.addColorStop(0.4, body);
  g.addColorStop(1, INK);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.quadraticCurveTo(4, -12, -16, -4);
  ctx.quadraticCurveTo(-8, 2, -16, 5);
  ctx.quadraticCurveTo(2, 8, 18, 0);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.ellipse(-2, -3, 4, 2, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function paintGround(ctx: CanvasRenderingContext2D, run: GridRun) {
  const onPath = new Set(run.grid.path.map((p) => `${p.x},${p.y}`));
  const cells: Point[] = [];
  for (let y = 0; y < GRID_H; y++) for (let x = 0; x < GRID_W; x++) cells.push({ x, y });
  cells.sort((a, b) => a.x + a.y - (b.x + b.y));
  for (const cell of cells) {
    const p = proj(cell.x, cell.y);
    const key = `${cell.x},${cell.y}`;
    const exit = cell.x === run.grid.exit.x && cell.y === run.grid.exit.y;
    const road = onPath.has(key) && !exit;
    const hot = !road && run.selected && run.press?.x === cell.x && run.press.y === cell.y;
    slab(ctx, p.x, p.y, exit ? "exit" : road ? "road" : hot ? "hot" : "pad");
  }
  const skin = run.grid.skin;
  const edge = skin === "dirt" ? "#c47a3a" : skin === "road" ? "#d7e4ef" : FROST_H;
  const bed = skin === "dirt" ? "#6a3a22" : skin === "road" ? "#5c6b80" : FROST;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  run.grid.path.forEach((cell, i) => {
    const p = proj(cell.x, cell.y);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.strokeStyle = bed;
  ctx.lineWidth = 8;
  ctx.shadowColor = edge;
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = edge;
  ctx.lineWidth = 3;
  ctx.stroke();
  const march = (run.time * 28) % 1;
  const last = run.grid.path.length - 1;
  const at = march * Math.max(1, last);
  const i = Math.min(last - 1, Math.floor(at));
  const t = at - i;
  const a = proj(run.grid.path[i]!.x, run.grid.path[i]!.y);
  const b = proj(run.grid.path[i + 1]!.x, run.grid.path[i + 1]!.y);
  glowDot(ctx, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 3, edge);
  ctx.restore();
}

function putEnemy(ctx: CanvasRenderingContext2D, run: GridRun, enemy: GridEnemy) {
  const at = pointAlong(run.grid.path, enemy.along);
  const p = proj(at.x, at.y);
  const bob = Math.sin(run.time * 6 + enemy.uid) * 2;
  if (!enemy.alive) {
    glowDot(ctx, p.x, p.y, 4, EMBER_H);
    return;
  }
  const body = enemy.tag === "swift" ? FROST : enemy.tag === "plate" ? LIGHT : enemy.tag === "swarm" ? EMBER : METAL;
  const light = enemy.tag === "swift" ? FROST_H : enemy.tag === "swarm" ? EMBER_H : PAPER;
  if (!blitPack(ctx, enemy.tag, p.x, p.y + bob)) hull(ctx, p.x, p.y + bob, enemy.tag === "plate" ? 1.15 : enemy.tag === "swarm" ? 0.7 : 0.9, body, light);
  if (enemy.flash > 0) glowDot(ctx, p.x, p.y - 6, 3, PAPER);
}

function putShip(ctx: CanvasRenderingContext2D, run: GridRun) {
  const p = proj(run.grid.exit.x, run.grid.exit.y);
  const bob = Math.sin(run.time * 2.4) * 2;
  const key = run.companion === "comp-boost" ? "boost" : run.companion === "comp-shrike" ? "shrike" : "auger";
  const body = run.companion === "comp-boost" ? EMBER : run.companion === "comp-shrike" ? "#1f8f52" : PURPLE;
  const light = run.companion === "comp-boost" ? EMBER_H : run.companion === "comp-shrike" ? "#8dffb8" : PURPLE_H;
  if (!blitPack(ctx, key, p.x, p.y - 8 + bob)) hull(ctx, p.x, p.y - 8 + bob, 1.45, body, light);
  glowDot(ctx, p.x + 16, p.y - 6 + bob, run.abilityT > 0 ? 4 : 2.5, light);
  const filled = run.companionHp / run.companionMax;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(p.x - 16, p.y + 14, 32, 4);
  ctx.fillStyle = FROST_H;
  ctx.fillRect(p.x - 16, p.y + 14, 32 * filled, 4);
}

function putShot(ctx: CanvasRenderingContext2D, shot: GridRun["shots"][number]) {
  const t = 1 - Math.max(0, Math.min(1, shot.life / 0.18));
  const a = proj(shot.x, shot.y);
  const b = proj(shot.tx, shot.ty);
  const x = a.x + (b.x - a.x) * t;
  const y = a.y - 36 + (b.y - 8 - (a.y - 36)) * t;
  ctx.save();
  ctx.strokeStyle = shot.color;
  ctx.shadowColor = shot.color;
  ctx.shadowBlur = 8;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y - 36);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.restore();
  glowDot(ctx, x, y, 2.4, shot.color);
}

function stars(ctx: CanvasRenderingContext2D, cssW: number, cssH: number, seed: number) {
  let s = (seed || 1) >>> 0;
  for (let i = 0; i < 36; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const x = s % Math.max(1, Math.floor(cssW));
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const y = s % Math.max(1, Math.floor(cssH));
    ctx.fillStyle = i % 5 === 0 ? "rgba(126,246,238,0.35)" : "rgba(238,243,247,0.28)";
    ctx.fillRect(x, y, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
  }
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  run: GridRun,
  cssW: number,
  cssH: number,
  dpr: number,
  hover: Point | null,
) {
  const view = layout(cssW, cssH);
  ensurePack();
  placeCam(cssW, cssH, view.map, String(run.seed));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = "#05070d";
  ctx.fillRect(0, 0, cssW, cssH);
  stars(ctx, cssW, cssH, run.seed);
  ctx.save();
  ctx.translate(camX, camY);
  paintGround(ctx, run);

  const actors: { key: number; draw: () => void }[] = [];
  for (const tower of run.towers) {
    const period = 1 / GUNS[tower.id].rate;
    const flash = tower.cd > period - 0.09;
    const p = proj(tower.x, tower.y);
    actors.push({ key: tower.x + tower.y, draw: () => building(ctx, tower.id, p.x, p.y, flash) });
  }
  if (hover && run.selected && !run.towers.some((t) => t.x === hover.x && t.y === hover.y)) {
    const kind = run.grid.cells[hover.y * GRID_W + hover.x];
    if (kind === "button") {
      const p = proj(hover.x, hover.y);
      actors.push({
        key: hover.x + hover.y + 0.05,
        draw: () => {
          ctx.save();
          ctx.globalAlpha = 0.5;
          building(ctx, run.selected!, p.x, p.y, false);
          ctx.restore();
        },
      });
    }
  }
  for (const enemy of run.enemies) {
    const at = pointAlong(run.grid.path, enemy.along);
    actors.push({ key: at.x + at.y + 0.2, draw: () => putEnemy(ctx, run, enemy) });
  }
  actors.push({
    key: run.grid.exit.x + run.grid.exit.y + 0.3,
    draw: () => putShip(ctx, run),
  });
  actors.sort((a, b) => a.key - b.key);
  for (const actor of actors) actor.draw();
  for (const shot of run.shots) putShot(ctx, shot);
  ctx.restore();
}
