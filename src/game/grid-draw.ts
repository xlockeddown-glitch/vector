import { GRID_H, GRID_W, type Point } from "./grid";
import { pointAlong, type GridEnemy, type GridRun, type GridTower } from "./grid-sim";
import { TOWERS as GUNS, type TowerId } from "./matchup";

const HW = 12;
const HH = 6;
const PAD_X = 6;
const PAD_TOP = 52;

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

function layout(cssW: number, cssH: number) {
  const map = mapSize();
  const scale = Math.max(1, Math.floor(Math.min(cssW / map.w, cssH / map.h)));
  return {
    scale,
    ox: Math.floor((cssW - map.w * scale) / 2),
    oy: Math.floor((cssH - map.h * scale) / 2),
    map,
  };
}

export function cellFromPoint(cssW: number, cssH: number, px: number, py: number): Point | null {
  const view = layout(cssW, cssH);
  const lx = (px - view.ox) / view.scale;
  const ly = (py - view.oy) / view.scale;
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

function building(ctx: CanvasRenderingContext2D, id: TowerId, cx: number, cy: number, flash: boolean) {
  fillPoly(
    ctx,
    [
      { x: cx, y: cy - 2 },
      { x: cx + 14, y: cy + 5 },
      { x: cx, y: cy + 12 },
      { x: cx - 14, y: cy + 5 },
    ],
    "#000000",
  );
  if (id === "lance") {
    hall(ctx, cx, cy, 10, 5, 8, LIGHT, METAL, METAL_D);
    hall(ctx, cx, cy - 8, 5, 3, 20, FROST_H, FROST, "#0c3030");
    ctx.fillStyle = flash ? PAPER : FROST_H;
    ctx.fillRect(cx - 1, cy - 32, 3, flash ? 6 : 4);
    ctx.fillStyle = PAPER;
    ctx.fillRect(cx - 4, cy - 2, 2, 2);
  } else if (id === "halo") {
    hall(ctx, cx, cy, 11, 5, 14, "#123e3c", "#0c3030", METAL_D);
    ctx.fillStyle = flash ? PAPER : FROST_H;
    for (let i = -8; i <= 8; i += 2) ctx.fillRect(cx + i, cy - 18 - (Math.abs(i) > 4 ? 1 : 0), 2, 2);
    ctx.fillRect(cx - 2, cy - 20, 4, 4);
    ctx.fillStyle = FROST_H;
    ctx.fillRect(cx - 6, cy - 4, 2, 2);
  } else if (id === "crater") {
    hall(ctx, cx, cy, 12, 6, 11, "#8a3418", EMBER, "#4a180e");
    ctx.fillStyle = flash ? PAPER : EMBER_H;
    ctx.fillRect(cx - 4, cy - 14, 8, 5);
    ctx.fillStyle = INK;
    ctx.fillRect(cx - 1, cy - 13, 3, 3);
  } else if (id === "rail") {
    hall(ctx, cx, cy, 12, 5, 7, LIGHT, "#9aabbe", METAL_D);
    ctx.fillStyle = METAL_D;
    ctx.fillRect(cx + 8, cy - 10, 3, 6);
    ctx.fillStyle = flash ? PAPER : "#d7e4ef";
    ctx.fillRect(cx + 10, cy - 10, flash ? 8 : 6, 2);
    ctx.fillRect(cx + 10, cy - 6, flash ? 8 : 6, 2);
  } else {
    hall(ctx, cx, cy, 8, 4, 6, GOLD, "#6a5420", METAL_D);
    hall(ctx, cx, cy - 6, 2, 2, 16, GOLD_H, GOLD, "#3a3014");
    ctx.fillStyle = flash ? PAPER : GOLD_H;
    ctx.fillRect(cx - 4, cy - 28, 8, 8);
    ctx.fillStyle = PAPER;
    ctx.fillRect(cx - 1, cy - 25, 2, 2);
  }
}

function diamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, fill: string, light: string, dark: string) {
  for (let row = 0; row < 12; row++) {
    const k = row < 6 ? row : 11 - row;
    const w = (k + 1) * 4;
    const y = cy - 6 + row;
    const x = cx - w / 2;
    ctx.fillStyle = row < 6 ? light : fill;
    ctx.fillRect(x, y, w, 1);
    ctx.fillStyle = row < 3 ? PAPER : dark;
    ctx.fillRect(x, y, 1, 1);
    ctx.fillStyle = dark;
    ctx.fillRect(x + w - 1, y, 1, 1);
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
  const x = p.x - 10 + (run.flinch > 0 ? 1 : 0);
  const y = p.y - 16 + bob;
  const color = run.companion === "comp-boost" ? EMBER_H : run.companion === "comp-shrike" ? "#8dffb8" : PURPLE_H;
  const body = run.companion === "comp-boost" ? EMBER : run.companion === "comp-shrike" ? SAGE : PURPLE;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(x + 2, y + 14, 16, 3);
  hall(ctx, p.x, p.y, 9, 4, 10, color, body, INK);
  ctx.fillStyle = color;
  ctx.fillRect(x - 4, y + 6, 5, 4);
  ctx.fillStyle = Math.floor(run.time * 12) % 2 ? EMBER_H : PAPER;
  ctx.fillRect(x + 16, y + 7, 3, 2);
  if (run.abilityT > 0) {
    ctx.fillStyle = color;
    ctx.fillRect(x - 2, y, 2, 2);
    ctx.fillRect(x - 2, y + 14, 2, 2);
    ctx.fillRect(x + 8, y - 2, 2, 2);
  }
  const filled = Math.round((run.companionHp / run.companionMax) * 8);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i < filled ? FROST_H : METAL_D;
    ctx.fillRect(x + 2 + i * 2, y + 15, 1, 1);
  }
}

function putEnemy(ctx: CanvasRenderingContext2D, run: GridRun, enemy: GridEnemy) {
  const at = pointAlong(run.grid.path, enemy.along);
  const hop = Math.floor(run.time * 6 + enemy.uid) % 2;
  const p = proj(at.x, at.y + hop * 0.04);
  if (!enemy.alive) {
    ctx.fillStyle = PAPER;
    ctx.fillRect(p.x - 3, p.y, 7, 1);
    ctx.fillRect(p.x, p.y - 3, 1, 7);
    ctx.fillStyle = EMBER_H;
    ctx.fillRect(p.x, p.y, 1, 1);
    return;
  }
  if (enemy.tag === "swift") hall(ctx, p.x, p.y, 5, 2, 5, FROST_H, FROST, INK);
  else if (enemy.tag === "plate") hall(ctx, p.x, p.y, 7, 3, 7, PAPER, LIGHT, METAL_D);
  else if (enemy.tag === "swarm") {
    ctx.fillStyle = EMBER_H;
    ctx.fillRect(p.x - 4, p.y - 2, 2, 2);
    ctx.fillRect(p.x + 2, p.y - 4, 2, 2);
    ctx.fillRect(p.x, p.y + 1, 2, 2);
  } else hall(ctx, p.x, p.y, 5, 3, 7, LIGHT, METAL, METAL_D);
  if (enemy.flash > 0) {
    ctx.fillStyle = PAPER;
    ctx.fillRect(p.x - 1, p.y - 6, 3, 3);
  }
  if (enemy.marked) {
    ctx.fillStyle = GOLD_H;
    ctx.fillRect(p.x - 4, p.y - 8, 1, 1);
    ctx.fillRect(p.x + 3, p.y - 8, 1, 1);
  }
  ctx.fillStyle = enemy.tag === "swift" ? FROST_H : EMBER_H;
  ctx.fillRect(p.x - 1, p.y + 2, 2, 1);
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
  ctx.drawImage(board, view.ox, view.oy, board.width * view.scale, board.height * view.scale);
}
