import type { Point } from "./grid";
import { pointAlong, type GridEnemy, type GridRun, type GridTower } from "./grid-sim";
import { bloom, blit, rotate } from "./pixel/blit";
import { CELL_PX, type Sprite } from "./pixel/ink";
import { ENEMIES } from "./pixel/enemies";
import { SHIPS } from "./pixel/ships";
import { PAD, PAD_HOT } from "./pixel/tiles";
import { TOWERS } from "./pixel/towers";
import { TOWERS as GUNS } from "./matchup";

const COLS = 16;
const ROWS = 10;

function layout(cssW: number, cssH: number) {
  const boardW = COLS * CELL_PX;
  const boardH = ROWS * CELL_PX;
  const scale = Math.max(1, Math.floor(Math.min(cssW / boardW, cssH / boardH)));
  return {
    scale,
    ox: Math.floor((cssW - boardW * scale) / 2),
    oy: Math.floor((cssH - boardH * scale) / 2),
    cell: CELL_PX * scale,
  };
}

export function cellFromPoint(cssW: number, cssH: number, px: number, py: number): Point | null {
  const view = layout(cssW, cssH);
  const x = Math.floor((px - view.ox) / view.cell);
  const y = Math.floor((py - view.oy) / view.cell);
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return null;
  return { x, y };
}

function band(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  bed: string,
  edge: string,
  core: string,
  hot: string,
  horizontal: boolean,
) {
  ctx.fillStyle = bed;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = edge;
  if (horizontal) {
    ctx.fillRect(x, y, w, 1);
    ctx.fillRect(x, y + h - 1, w, 1);
    ctx.fillStyle = core;
    ctx.fillRect(x, y + 2, w, 2);
    ctx.fillStyle = hot;
    ctx.fillRect(x, y + 2, w, 1);
  } else {
    ctx.fillRect(x, y, 1, h);
    ctx.fillRect(x + w - 1, y, 1, h);
    ctx.fillStyle = core;
    ctx.fillRect(x + 2, y, 2, h);
    ctx.fillStyle = hot;
    ctx.fillRect(x + 2, y, 1, h);
  }
}

function paintLane(ctx: CanvasRenderingContext2D, run: GridRun) {
  const skin = run.grid.skin;
  const bed = skin === "dirt" ? "#4a2a1c" : skin === "road" ? "#2c3548" : "#0d2a2c";
  const edge = skin === "dirt" ? "#c47a3a" : skin === "road" ? "#8b98ab" : "#147a78";
  const core = skin === "dirt" ? "#e8c15a" : skin === "road" ? "#d7e4ef" : "#7ef6ee";
  const hot = skin === "alloy" ? "#f7fdff" : core;
  const onPath = new Set(run.grid.path.map((p) => `${p.x},${p.y}`));
  for (const cell of run.grid.path) {
    if (cell.x === run.grid.exit.x && cell.y === run.grid.exit.y) continue;
    const left = onPath.has(`${cell.x - 1},${cell.y}`);
    const right = onPath.has(`${cell.x + 1},${cell.y}`);
    const up = onPath.has(`${cell.x},${cell.y - 1}`);
    const down = onPath.has(`${cell.x},${cell.y + 1}`);
    const x0 = cell.x * CELL_PX;
    const y0 = cell.y * CELL_PX;
    if (left || right) band(ctx, x0, y0 + 2, CELL_PX, 8, bed, edge, core, hot, true);
    if (up || down) band(ctx, x0 + 2, y0, 8, CELL_PX, bed, edge, core, hot, false);
    ctx.fillStyle = bed;
    ctx.fillRect(x0 + 2, y0 + 2, 8, 8);
    ctx.fillStyle = edge;
    ctx.fillRect(x0 + 3, y0 + 3, 6, 6);
    ctx.fillStyle = core;
    ctx.fillRect(x0 + 4, y0 + 4, 4, 4);
    ctx.fillStyle = hot;
    ctx.fillRect(x0 + 5, y0 + 5, 2, 2);
  }
  const march = Math.floor(run.time * 14);
  for (let i = 0; i < run.grid.path.length; i++) {
    if ((i + march) % 3 !== 0) continue;
    const cell = run.grid.path[i]!;
    if (cell.x === run.grid.exit.x && cell.y === run.grid.exit.y) continue;
    ctx.fillStyle = hot;
    ctx.fillRect(cell.x * CELL_PX + 5, cell.y * CELL_PX + 4 + ((i + march) % 2), 2, 1);
  }
}

function stars(ctx: CanvasRenderingContext2D, seed: number) {
  let s = (seed || 1) >>> 0;
  for (let i = 0; i < 40; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const x = s % (COLS * CELL_PX);
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const y = s % (ROWS * CELL_PX);
    ctx.fillStyle = i % 6 === 0 ? "#1a4a48" : "#1a2433";
    ctx.fillRect(x, y, 1, 1);
  }
}

function facing(path: Point[], along: number) {
  const a = pointAlong(path, along);
  const b = pointAlong(path, Math.min(path.length - 1, along + 0.4));
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 0 : 2;
  return dy >= 0 ? 1 : 3;
}

let board: HTMLCanvasElement | null = null;

function boardCanvas() {
  if (typeof document === "undefined") return null;
  if (!board) {
    board = document.createElement("canvas");
    board.width = COLS * CELL_PX;
    board.height = ROWS * CELL_PX;
  }
  return board;
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
  const off = boardCanvas();
  if (!off) return;
  const pen = off.getContext("2d");
  if (!pen) return;
  pen.imageSmoothingEnabled = false;
  pen.fillStyle = "#05060b";
  pen.fillRect(0, 0, off.width, off.height);
  stars(pen, run.seed);

  const towers = new Map(run.towers.map((t) => [`${t.x},${t.y}`, t]));
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const kind = run.grid.cells[y * COLS + x];
      if (kind !== "button") continue;
      const hot = hover?.x === x && hover?.y === y && !!run.selected;
      const pressed = run.press?.x === x && run.press.y === y;
      blit(pen, hot || pressed ? PAD_HOT : PAD, x * CELL_PX, y * CELL_PX);
    }
  }
  paintLane(pen, run);

  for (const tower of run.towers) putTower(pen, tower);
  if (hover && run.selected && !towers.has(`${hover.x},${hover.y}`)) {
    const kind = run.grid.cells[hover.y * COLS + hover.x];
    if (kind === "button") {
      pen.save();
      pen.globalAlpha = 0.55;
      putTower(pen, { x: hover.x, y: hover.y, id: run.selected, rank: 1, cd: 0 });
      pen.restore();
    }
  }

  for (const enemy of run.enemies) putEnemy(pen, run, enemy);
  putShip(pen, run);

  for (const shot of run.shots) putShot(pen, shot);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#05060b";
  ctx.fillRect(0, 0, cssW, cssH);
  ctx.drawImage(off, view.ox, view.oy, off.width * view.scale, off.height * view.scale);
}

function putShot(ctx: CanvasRenderingContext2D, shot: GridRun["shots"][number]) {
  const t = 1 - Math.max(0, Math.min(1, shot.life / 0.18));
  const x0 = shot.x * CELL_PX + 6;
  const y0 = shot.y * CELL_PX + 3;
  const x1 = shot.tx * CELL_PX + 6;
  const y1 = shot.ty * CELL_PX + 5;
  const x = Math.round(x0 + (x1 - x0) * t);
  const y = Math.round(y0 + (y1 - y0) * t);
  ctx.fillStyle = shot.color;
  ctx.fillRect(x - 1, y, 3, 1);
  ctx.fillRect(x, y - 1, 1, 3);
  ctx.fillStyle = "#eef3f7";
  ctx.fillRect(x, y, 1, 1);
  if (t > 0.72) {
    ctx.fillStyle = shot.color;
    ctx.fillRect(x1 - 2, y1, 5, 1);
    ctx.fillRect(x1, y1 - 2, 1, 5);
  }
}

function putTower(ctx: CanvasRenderingContext2D, tower: GridTower) {
  const art = TOWERS[tower.id];
  const period = 1 / GUNS[tower.id].rate;
  const sprite = tower.cd > period - 0.09 ? art.flash : art.idle;
  const x = tower.x * CELL_PX;
  const y = tower.y * CELL_PX;
  bloom(ctx, sprite, x, y);
  blit(ctx, sprite, x, y);
  if (tower.rank > 1) {
    ctx.fillStyle = "#ffe08a";
    for (let i = 0; i < tower.rank; i++) ctx.fillRect(x + 2 + i * 3, y + 10, 2, 1);
  }
}

function putEnemy(ctx: CanvasRenderingContext2D, run: GridRun, enemy: GridEnemy) {
  const p = pointAlong(run.grid.path, enemy.along);
  const x = Math.round(p.x * CELL_PX);
  const y = Math.round(p.y * CELL_PX);
  if (!enemy.alive) {
    ctx.fillStyle = "#eef3f7";
    ctx.fillRect(x + 3, y + 5, 5, 1);
    ctx.fillRect(x + 5, y + 3, 1, 5);
    ctx.fillStyle = "#ffb089";
    ctx.fillRect(x + 5, y + 5, 1, 1);
    return;
  }
  const hop = Math.floor(run.time * 6 + enemy.uid) % 2;
  const frame = hop === 0 ? ENEMIES[enemy.tag].a : ENEMIES[enemy.tag].b;
  const turned = rotate(frame, facing(run.grid.path, enemy.along));
  blit(ctx, turned, x, y + hop);
  if (enemy.flash > 0) {
    ctx.fillStyle = "#eef3f7";
    ctx.fillRect(x + 5, y + 4, 2, 2);
  }
  if (enemy.slowT > 0) {
    ctx.fillStyle = "#7ef6ee";
    ctx.fillRect(x + 2, y + 8, 1, 1);
    ctx.fillRect(x + 4, y + 9, 1, 1);
  }
  if (enemy.marked) {
    const tick = Math.floor(run.time * 8) % 2;
    ctx.fillStyle = "#ffe08a";
    ctx.fillRect(x + 2, y + 1 + tick, 1, 1);
    ctx.fillRect(x + 9, y + 1 + tick, 1, 1);
    ctx.fillRect(x + 2, y + 9 - tick, 1, 1);
    ctx.fillRect(x + 9, y + 9 - tick, 1, 1);
  }
}

function putShip(ctx: CanvasRenderingContext2D, run: GridRun) {
  const sprite: Sprite = SHIPS[run.companion];
  const bob = Math.floor(run.time * 3) % 2;
  const x = run.grid.exit.x * CELL_PX + (run.flinch > 0 ? 1 : 0);
  const y = run.grid.exit.y * CELL_PX + bob;
  bloom(ctx, sprite, x, y);
  blit(ctx, sprite, x, y);
  const engine = Math.floor(run.time * 12) % 2 === 0 ? "#ffb089" : "#7ef6ee";
  ctx.fillStyle = engine;
  ctx.fillRect(x + 10, y + 5, 2, 1);
  if (run.abilityT > 0) {
    ctx.fillStyle = run.companion === "comp-shrike" ? "#8dffb8" : run.companion === "comp-boost" ? "#ffb089" : "#d4c4ff";
    ctx.fillRect(x - 1, y + 2, 1, 1);
    ctx.fillRect(x - 1, y + 8, 1, 1);
    ctx.fillRect(x + 4, y - 1, 1, 1);
    ctx.fillRect(x + 4, y + 11, 1, 1);
  }
  const filled = Math.round((run.companionHp / run.companionMax) * 8);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i < filled ? "#7ef6ee" : "#141c2a";
    ctx.fillRect(x + 2 + i, y + 10, 1, 1);
  }
}
