import { PALETTE } from "./data/palette";
import type { Point } from "./grid";
import { pointAlong, type GridEnemy, type GridRun, type GridTower } from "./grid-sim";
import type { TowerId } from "./matchup";

const COLS = 16;
const ROWS = 10;

function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function layout(cssW: number, cssH: number) {
  const gap = 3;
  const pad = 8;
  const cell = Math.max(
    8,
    Math.floor(
      Math.min(
        (cssW - pad * 2 - gap * (COLS - 1)) / COLS,
        (cssH - pad * 2 - gap * (ROWS - 1)) / ROWS,
      ),
    ),
  );
  const boardW = COLS * cell + (COLS - 1) * gap;
  const boardH = ROWS * cell + (ROWS - 1) * gap;
  return {
    cell,
    gap,
    ox: Math.round((cssW - boardW) / 2),
    oy: Math.round((cssH - boardH) / 2),
  };
}

function cellOrigin(view: ReturnType<typeof layout>, x: number, y: number) {
  return {
    x: view.ox + x * (view.cell + view.gap),
    y: view.oy + y * (view.cell + view.gap),
  };
}

/** Nearest pad, including the gap between them. A near miss still counts. */
export function cellFromPoint(cssW: number, cssH: number, px: number, py: number): Point | null {
  const view = layout(cssW, cssH);
  const pitch = view.cell + view.gap;
  const x = Math.round((px - view.ox - view.cell / 2) / pitch);
  const y = Math.round((py - view.oy - view.cell / 2) / pitch);
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return null;
  return { x, y };
}

function stars(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  let s = (seed || 1) >>> 0;
  for (let i = 0; i < 48; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const x = (s % 10000) / 10000 * w;
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const y = (s % 10000) / 10000 * h;
    ctx.fillStyle = i % 7 === 0 ? "rgba(60,214,204,0.35)" : "rgba(215,228,239,0.28)";
    ctx.fillRect(x, y, i % 9 === 0 ? 2 : 1, i % 9 === 0 ? 2 : 1);
  }
}

function drawButton(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, hot: boolean, pressed: boolean) {
  const m = Math.max(1, s * 0.06);
  const r = Math.max(5, s * 0.28);
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  round(ctx, x + m, y + m + 2, s - m * 2, s - m * 2, r);
  ctx.fill();
  const grad = ctx.createLinearGradient(x, y, x, y + s);
  grad.addColorStop(0, hot ? "#31445c" : "#243044");
  grad.addColorStop(1, hot ? "#1a2838" : "#141b28");
  ctx.fillStyle = grad;
  round(ctx, x + m, y + m + (pressed ? 1 : 0), s - m * 2, s - m * 2, r);
  ctx.fill();
  ctx.strokeStyle = hot ? PALETTE.moonstone : "rgba(154,163,178,0.45)";
  ctx.lineWidth = hot ? 2 : 1;
  ctx.stroke();
  ctx.fillStyle = "#0b1018";
  ctx.beginPath();
  ctx.arc(x + s / 2, y + s / 2 + (pressed ? 1 : 0), s * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(215,228,239,0.18)";
  ctx.stroke();
}

function drawLane(ctx: CanvasRenderingContext2D, run: GridRun, view: ReturnType<typeof layout>) {
  const path = run.grid.path;
  if (path.length < 2) return;
  const skin = run.grid.skin;
  const at = (p: Point) => {
    const o = cellOrigin(view, p.x, p.y);
    return [o.x + view.cell / 2, o.y + view.cell / 2] as const;
  };
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  path.forEach((p, i) => {
    const [x, y] = at(p);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = skin === "dirt" ? "#3a2618" : skin === "road" ? "#2a3142" : "#12383a";
  ctx.lineWidth = view.cell * 0.78;
  ctx.stroke();
  ctx.strokeStyle = skin === "dirt" ? PALETTE.hot : skin === "road" ? PALETTE.moonstone : PALETTE.frost;
  ctx.lineWidth = Math.max(3, view.cell * 0.16);
  ctx.stroke();
  if (skin === "alloy") {
    ctx.strokeStyle = "#f7fdff";
    ctx.lineWidth = Math.max(1.5, view.cell * 0.05);
    ctx.stroke();
  }
  ctx.restore();
}

const GUN: Record<TowerId, string> = {
  lance: PALETTE.frost,
  halo: PALETTE.frost,
  crater: PALETTE.ember,
  rail: PALETTE.moonstone,
  beacon: PALETTE.legend,
};

function mount(ctx: CanvasRenderingContext2D, color: string) {
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  ctx.ellipse(0, 9, 11, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#101722";
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  round(ctx, -8, 2, 16, 7, 2);
  ctx.fill();
  ctx.stroke();
}

function drawMark(ctx: CanvasRenderingContext2D, id: TowerId, cx: number, cy: number, s: number, time: number) {
  const color = GUN[id];
  const pulse = 0.55 + 0.45 * Math.sin(time * 6);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s / 22, s / 22);
  mount(ctx, color);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (id === "lance") {
    ctx.fillStyle = "#1c2a36";
    round(ctx, -3, -12, 6, 16, 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(0, -14);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.4 + pulse * 0.6;
    ctx.beginPath();
    ctx.arc(0, -14, 2.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === "halo") {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, -4, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.45 + pulse * 0.4;
    ctx.beginPath();
    ctx.arc(0, -4, 4.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -4, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === "crater") {
    ctx.fillStyle = "#2a1a16";
    round(ctx, -6, -8, 12, 12, 3);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.35 + pulse * 0.5;
    ctx.beginPath();
    ctx.arc(0, -3, 3.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === "rail") {
    ctx.strokeStyle = "#9aa3b2";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-11, -2);
    ctx.lineTo(11, -2);
    ctx.moveTo(-11, -6);
    ctx.lineTo(11, -6);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillRect(8, -8, 3, 8);
    ctx.globalAlpha = pulse;
    ctx.fillRect(11, -7, 2, 2);
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-6, 2);
    ctx.lineTo(0, -6);
    ctx.lineTo(6, 2);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.4 + pulse * 0.6;
    ctx.beginPath();
    ctx.arc(0, -8, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(0, -8, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function hull(ctx: CanvasRenderingContext2D, color: string) {
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(238,243,247,0.7)";
  ctx.lineWidth = 1;
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: GridEnemy, cx: number, cy: number, s: number, bob: number, angle: number) {
  ctx.save();
  ctx.translate(cx, cy + bob);
  ctx.rotate(angle);
  ctx.scale(s / 26, s / 26);
  ctx.globalAlpha = e.alive ? 1 : 0.35;
  const flash = e.flash > 0;
  if (e.tag === "swift") {
    hull(ctx, flash ? PALETTE.paper : PALETTE.frost);
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -5);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = PALETTE.ember;
    ctx.fillRect(-9, -1.2, 3, 2.4);
  } else if (e.tag === "plate") {
    hull(ctx, flash ? PALETTE.paper : "#8d98a8");
    round(ctx, -9, -7, 16, 14, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#2a3342";
    round(ctx, -2, -4, 8, 8, 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.moonstone;
    ctx.stroke();
  } else if (e.tag === "swarm") {
    ctx.fillStyle = flash ? PALETTE.paper : PALETTE.ember;
    for (const [dx, dy] of [[6, 0], [-5, -5], [-5, 5]] as const) {
      ctx.beginPath();
      ctx.ellipse(dx, dy, 3.2, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    hull(ctx, flash ? PALETTE.paper : "#6b7382");
    round(ctx, -8, -5, 14, 10, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#0e141d";
    ctx.beginPath();
    ctx.ellipse(3, 0, 3, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.ember;
    ctx.fillRect(-9, -1.4, 2.5, 2.8);
  }
  ctx.restore();
  if (e.marked) {
    ctx.save();
    ctx.translate(cx, cy + bob);
    ctx.strokeStyle = PALETTE.legend;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawShip(ctx: CanvasRenderingContext2D, run: GridRun, cx: number, cy: number, s: number) {
  const shake = run.flinch > 0 ? Math.sin(run.time * 48) * 3 : 0;
  const color = run.companion === "comp-boost" ? PALETTE.ember : run.companion === "comp-shrike" ? PALETTE.sage : PALETTE.epic;
  ctx.save();
  ctx.translate(cx + shake, cy);
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  ctx.ellipse(0, s * 0.28, s * 0.36, s * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.rotate(Math.PI);
  ctx.scale(s / 34, s / 34);
  ctx.fillStyle = "#141b28";
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-6, -8);
  ctx.lineTo(-10, -3);
  ctx.lineTo(-10, 3);
  ctx.lineTo(-6, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.ellipse(2, 0, 3, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = PALETTE.ember;
  ctx.fillRect(-12, -2, 4, 4);
  ctx.restore();
  const pct = run.companionHp / run.companionMax;
  ctx.strokeStyle = pct < 0.35 ? PALETTE.ember : color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.46, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
  ctx.stroke();
  ctx.restore();
}

function heading(path: Point[], along: number) {
  const a = pointAlong(path, along);
  const b = pointAlong(path, Math.min(path.length - 1, along + 0.35));
  return Math.atan2(b.y - a.y, b.x - a.x);
}

export function drawGrid(ctx: CanvasRenderingContext2D, run: GridRun, cssW: number, cssH: number, dpr: number, hover: Point | null) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(0, 0, cssW, cssH);
  stars(ctx, cssW, cssH, run.seed);
  const view = layout(cssW, cssH);
  const towers = new Map(run.towers.map((t) => [`${t.x},${t.y}`, t]));

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const kind = run.grid.cells[y * COLS + x]!;
      const o = cellOrigin(view, x, y);
      const pressed = run.press?.x === x && run.press.y === y;
      if (kind === "button") {
        const hot = hover?.x === x && hover?.y === y && !!run.selected;
        drawButton(ctx, o.x, o.y, view.cell, hot, !!pressed);
      }
      if (pressed && kind !== "button") {
        ctx.strokeStyle = PALETTE.ember;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(o.x + view.cell / 2, o.y + view.cell / 2, view.cell * 0.28, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  drawLane(ctx, run, view);

  const ship = cellOrigin(view, run.grid.exit.x, run.grid.exit.y);
  drawShip(ctx, run, ship.x + view.cell / 2, ship.y + view.cell / 2, view.cell * 1.35);

  for (const tower of run.towers) drawTower(ctx, view, tower, run.time);
  if (hover && run.selected && !towers.has(`${hover.x},${hover.y}`)) {
    const kind = run.grid.cells[hover.y * COLS + hover.x];
    if (kind === "button") {
      ctx.save();
      ctx.globalAlpha = 0.55;
      drawTower(ctx, view, { x: hover.x, y: hover.y, id: run.selected, rank: 1, cd: 0 }, run.time);
      ctx.restore();
    }
  }

  for (const e of run.enemies) {
    const p = pointAlong(run.grid.path, e.along);
    const o = cellOrigin(view, 0, 0);
    const step = view.cell + view.gap;
    const bob = Math.sin(run.time * 8 + e.uid) * 1.5;
    drawEnemy(
      ctx,
      e,
      o.x + p.x * step + view.cell / 2,
      o.y + p.y * step + view.cell / 2,
      view.cell * 1.35,
      bob,
      heading(run.grid.path, e.along),
    );
  }

  ctx.lineCap = "round";
  for (const shot of run.shots) {
    const a = cellOrigin(view, shot.x, shot.y);
    const b = cellOrigin(view, shot.tx, shot.ty);
    const x0 = a.x + view.cell / 2;
    const y0 = a.y + view.cell / 2;
    const x1 = b.x + view.cell / 2;
    const y1 = b.y + view.cell / 2;
    ctx.globalAlpha = Math.max(0.25, shot.life / 0.18);
    ctx.strokeStyle = shot.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.fillStyle = PALETTE.paper;
    ctx.beginPath();
    ctx.arc(x1, y1, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawTower(ctx: CanvasRenderingContext2D, view: ReturnType<typeof layout>, tower: GridTower, time: number) {
  const o = cellOrigin(view, tower.x, tower.y);
  drawMark(ctx, tower.id, o.x + view.cell / 2, o.y + view.cell / 2 - view.cell * 0.12, view.cell * 1.85, time + tower.x);
  if (tower.rank > 1) {
    ctx.fillStyle = PALETTE.legend;
    for (let i = 0; i < tower.rank; i++) {
      ctx.fillRect(o.x + view.cell * 0.28 + i * 5, o.y + view.cell * 0.78, 3, 3);
    }
  }
}
