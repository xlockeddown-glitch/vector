import { GRID_H, GRID_W, type Point } from "./grid";
import { pointAlong, type GridEnemy, type GridRun, type GridTower } from "./grid-sim";
import { TOWERS as GUNS, type TowerId } from "./matchup";
import { bloom, blit } from "./pixel/blit";
import { BUILDINGS, HULLS, TROOPS } from "./pixel/buildings";
import type { Sprite } from "./pixel/ink";

const HW = 14;
const HH = 7;
const PAD_X = 8;
const PAD_TOP = 40;

const INK = "#070b12";
const METAL = "#3d4b60";
const METAL_D = "#141c2a";
const LIGHT = "#8b98ab";
const FROST = "#147a78";
const FROST_H = "#7ef6ee";
const EMBER = "#c43a16";
const EMBER_H = "#ffb089";
const GOLD = "#a8842e";
const GOLD_H = "#ffe08a";
const PAPER = "#eef3f7";
const PURPLE = "#6a48c4";
const PURPLE_H = "#d4c4ff";
const SAGE = "#1f8f52";

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
    w: Math.ceil(far.x + HW + 10),
    h: Math.ceil(deep.y + HH + 18),
  };
}

let camX = 0;
let camY = 0;
let camKey = "";

function layout(cssW: number, cssH: number) {
  const map = mapSize();
  const scale = cssW < 700 ? 4 : 3;
  void cssH;
  return { scale, map };
}

function placeCam(cssW: number, cssH: number, scale: number, map: { w: number; h: number }, key: string) {
  if (camKey !== key) {
    camKey = key;
    camX = (cssW - map.w * scale) / 2;
    camY = (cssH - map.h * scale) / 2;
  }
  const mw = map.w * scale;
  const mh = map.h * scale;
  camX = mw <= cssW ? (cssW - mw) / 2 : Math.max(cssW - mw, Math.min(0, camX));
  camY = mh <= cssH ? (cssH - mh) / 2 : Math.max(cssH - mh, Math.min(0, camY));
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
  placeCam(cssW, cssH, view.scale, view.map, camKey || "board");
  const lx = (px - camX) / view.scale;
  const ly = (py - camY) / view.scale;
  const rx = lx - ((GRID_H - 1) * HW + PAD_X);
  const ry = ly - PAD_TOP;
  const gx = (rx / HW + ry / HH) / 2;
  const gy = (ry / HH - rx / HW) / 2;
  const x = Math.round(gx);
  const y = Math.round(gy);
  if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) return null;
  return { x, y };
}

function fillPoly(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[], color: string) {
  const minY = Math.ceil(Math.min(...pts.map((p) => p.y)));
  const maxY = Math.floor(Math.max(...pts.map((p) => p.y)));
  ctx.fillStyle = color;
  for (let y = minY; y <= maxY; y++) {
    const xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i]!;
      const b = pts[(i + 1) % pts.length]!;
      if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) {
        const t = (y - a.y) / (b.y - a.y);
        xs.push(a.x + (b.x - a.x) * t);
      }
    }
    xs.sort((a, b) => a - b);
    if (xs.length < 2) continue;
    const x0 = Math.round(xs[0]!);
    const x1 = Math.round(xs[xs.length - 1]!);
    if (x1 > x0) ctx.fillRect(x0, y, x1 - x0, 1);
  }
}

function hall(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  hw: number,
  hh: number,
  tall: number,
  top: string,
  left: string,
  right: string,
) {
  const roof = [
    { x: cx, y: cy - hh - tall },
    { x: cx + hw, y: cy - tall },
    { x: cx, y: cy + hh - tall },
    { x: cx - hw, y: cy - tall },
  ];
  fillPoly(ctx, [
    { x: cx - hw, y: cy },
    { x: cx, y: cy + hh },
    { x: cx, y: cy + hh - tall },
    { x: cx - hw, y: cy - tall },
  ], left);
  fillPoly(ctx, [
    { x: cx + hw, y: cy },
    { x: cx, y: cy + hh },
    { x: cx, y: cy + hh - tall },
    { x: cx + hw, y: cy - tall },
  ], right);
  fillPoly(ctx, roof, top);
  ctx.fillStyle = INK;
  ctx.fillRect(cx, cy + hh - tall, 1, tall);
}

function stamp(ctx: CanvasRenderingContext2D, sprite: Sprite, cx: number, cy: number) {
  const x = Math.round(cx - sprite[0]!.length / 2);
  const y = Math.round(cy - sprite.length + 6);
  bloom(ctx, sprite, x, y);
  blit(ctx, sprite, x, y);
}

function building(ctx: CanvasRenderingContext2D, id: TowerId, cx: number, cy: number, flash: boolean) {
  const art = BUILDINGS[id];
  stamp(ctx, flash ? art.flash : art.idle, cx, cy);
}

function diamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, fill: string, light: string, dark: string) {
  for (let y = -HH; y < HH; y++) {
    const half = HW - Math.abs(y) * (HW / HH);
    const w = Math.max(2, Math.round(half * 2));
    const x = Math.round(cx - w / 2);
    const py = Math.round(cy + y);
    ctx.fillStyle = y < 0 ? light : fill;
    ctx.fillRect(x, py, w, 1);
    ctx.fillStyle = dark;
    ctx.fillRect(x, py, 1, 1);
    ctx.fillRect(x + w - 1, py, 1, 1);
  }
}

function paintGround(ctx: CanvasRenderingContext2D, run: GridRun) {
  const onPath = new Set(run.grid.path.map((p) => `${p.x},${p.y}`));
  const skin = run.grid.skin;
  const cells: Point[] = [];
  for (let y = 0; y < GRID_H; y++) for (let x = 0; x < GRID_W; x++) cells.push({ x, y });
  cells.sort((a, b) => a.x + a.y - (b.x + b.y));
  const march = Math.floor(run.time * 8);
  for (const cell of cells) {
    const p = proj(cell.x, cell.y);
    const key = `${cell.x},${cell.y}`;
    const exit = cell.x === run.grid.exit.x && cell.y === run.grid.exit.y;
    if (onPath.has(key) && !exit) {
      const fill = skin === "dirt" ? "#3a2418" : skin === "road" ? "#232a38" : "#0c2426";
      const light = skin === "dirt" ? "#c47a3a" : skin === "road" ? "#8b98ab" : FROST;
      diamond(ctx, p.x, p.y, fill, light, INK);
      const hot = skin === "dirt" ? GOLD_H : skin === "road" ? PAPER : FROST_H;
      ctx.fillStyle = hot;
      ctx.fillRect(p.x - 4, p.y - 1, 8, 2);
      const index = run.grid.path.findIndex((q) => q.x === cell.x && q.y === cell.y);
      if (index >= 0 && (index + march) % 4 === 0) {
        ctx.fillStyle = PAPER;
        ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
      }
    } else if (exit) {
      diamond(ctx, p.x, p.y, "#1a1430", PURPLE, INK);
    } else {
      const hot = run.selected && run.press?.x === cell.x && run.press.y === cell.y;
      diamond(ctx, p.x, p.y, hot ? "#243044" : "#121820", hot ? FROST_H : METAL, INK);
    }
  }
}

function putShip(ctx: CanvasRenderingContext2D, run: GridRun) {
  const p = proj(run.grid.exit.x, run.grid.exit.y);
  const bob = Math.floor(run.time * 3) % 2;
  stamp(ctx, HULLS[run.companion], p.x + (run.flinch > 0 ? 1 : 0), p.y + bob);
  const filled = Math.round((run.companionHp / run.companionMax) * 8);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i < filled ? FROST_H : METAL_D;
    ctx.fillRect(p.x - 6 + i * 2, p.y + 4, 1, 1);
  }
}

function putEnemy(ctx: CanvasRenderingContext2D, run: GridRun, enemy: GridEnemy) {
  const at = pointAlong(run.grid.path, enemy.along);
  const hop = Math.floor(run.time * 6 + enemy.uid) % 2;
  const p = proj(at.x, at.y);
  if (!enemy.alive) {
    ctx.fillStyle = PAPER;
    ctx.fillRect(p.x - 3, p.y, 7, 1);
    ctx.fillRect(p.x, p.y - 3, 1, 7);
    return;
  }
  stamp(ctx, TROOPS[enemy.tag], p.x, p.y + hop);
  if (enemy.flash > 0) {
    ctx.fillStyle = PAPER;
    ctx.fillRect(p.x - 1, p.y - 4, 3, 2);
  }
}

function putShot(ctx: CanvasRenderingContext2D, shot: GridRun["shots"][number]) {
  const t = 1 - Math.max(0, Math.min(1, shot.life / 0.18));
  const a = proj(shot.x, shot.y);
  const b = proj(shot.tx, shot.ty);
  const x = Math.round(a.x + (b.x - a.x) * t);
  const y = Math.round(a.y - 18 + (b.y - 6 - (a.y - 18)) * t);
  ctx.fillStyle = shot.color;
  ctx.fillRect(x - 1, y, 3, 1);
  ctx.fillRect(x, y - 1, 1, 3);
  ctx.fillStyle = PAPER;
  ctx.fillRect(x, y, 1, 1);
  if (t > 0.72) {
    ctx.fillStyle = shot.color;
    ctx.fillRect(Math.round(b.x - 3), Math.round(b.y - 6), 7, 1);
    ctx.fillRect(Math.round(b.x), Math.round(b.y - 9), 1, 7);
  }
}

let board: HTMLCanvasElement | null = null;

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  run: GridRun,
  cssW: number,
  cssH: number,
  dpr: number,
  hover: Point | null,
) {
  const view = layout(cssW, cssH);
  placeCam(cssW, cssH, view.scale, view.map, String(run.seed));
  if (typeof document === "undefined") return;
  if (!board) board = document.createElement("canvas");
  board.width = view.map.w;
  board.height = view.map.h;
  const pen = board.getContext("2d");
  if (!pen) return;
  pen.imageSmoothingEnabled = false;
  pen.fillStyle = "#05060b";
  pen.fillRect(0, 0, board.width, board.height);
  let s = (run.seed || 1) >>> 0;
  for (let i = 0; i < 28; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const x = s % board.width;
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    pen.fillStyle = i % 5 === 0 ? "#143836" : "#1a2433";
    pen.fillRect(x, s % board.height, 1, 1);
  }
  paintGround(pen, run);

  const actors: { key: number; draw: () => void }[] = [];
  for (const tower of run.towers) {
    const period = 1 / GUNS[tower.id].rate;
    const flash = tower.cd > period - 0.09;
    const p = proj(tower.x, tower.y);
    actors.push({
      key: tower.x + tower.y,
      draw: () => building(pen, tower.id, p.x, p.y, flash),
    });
  }
  if (hover && run.selected && !run.towers.some((t) => t.x === hover.x && t.y === hover.y)) {
    const kind = run.grid.cells[hover.y * GRID_W + hover.x];
    if (kind === "button") {
      const p = proj(hover.x, hover.y);
      actors.push({
        key: hover.x + hover.y + 0.05,
        draw: () => {
          pen.save();
          pen.globalAlpha = 0.55;
          building(pen, run.selected!, p.x, p.y, false);
          pen.restore();
        },
      });
    }
  }
  for (const enemy of run.enemies) {
    const at = pointAlong(run.grid.path, enemy.along);
    actors.push({ key: at.x + at.y + 0.2, draw: () => putEnemy(pen, run, enemy) });
  }
  actors.push({
    key: run.grid.exit.x + run.grid.exit.y + 0.3,
    draw: () => putShip(pen, run),
  });
  actors.sort((a, b) => a.key - b.key);
  for (const actor of actors) actor.draw();
  for (const shot of run.shots) putShot(pen, shot);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#05060b";
  ctx.fillRect(0, 0, cssW, cssH);
  ctx.drawImage(board, camX, camY, board.width * view.scale, board.height * view.scale);
}
