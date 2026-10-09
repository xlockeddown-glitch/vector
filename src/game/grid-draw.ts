import { PALETTE } from "./data/palette";
import type { Point } from "./grid";
import { pointAlong, type GridEnemy, type GridRun, type GridTower } from "./grid-sim";
import type { TowerId } from "./matchup";

function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function layout(cssW: number, cssH: number) {
  const cols = 16;
  const rows = 10;
  const gap = 4;
  const pad = 10;
  const cell = Math.max(8, Math.floor(Math.min((cssW - pad * 2 - gap) / cols, (cssH - pad * 2 - gap) / rows) - gap));
  const boardW = cols * cell + (cols - 1) * gap;
  const boardH = rows * cell + (rows - 1) * gap;
  const ox = Math.round((cssW - boardW) / 2);
  const oy = Math.round((cssH - boardH) / 2);
  return { cell, gap, ox, oy };
}

function cellOrigin(view: ReturnType<typeof layout>, x: number, y: number) {
  return {
    x: view.ox + x * (view.cell + view.gap),
    y: view.oy + y * (view.cell + view.gap),
  };
}

export function cellFromPoint(cssW: number, cssH: number, px: number, py: number): Point | null {
  const view = layout(cssW, cssH);
  const x = Math.floor((px - view.ox) / (view.cell + view.gap));
  const y = Math.floor((py - view.oy) / (view.cell + view.gap));
  if (x < 0 || y < 0 || x >= 16 || y >= 10) return null;
  const localX = px - view.ox - x * (view.cell + view.gap);
  const localY = py - view.oy - y * (view.cell + view.gap);
  if (localX > view.cell || localY > view.cell) return null;
  return { x, y };
}

function drawButton(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, hot: boolean, pressed: boolean) {
  const inset = Math.max(2, s * 0.1);
  const drop = pressed ? 1 : Math.max(2, s * 0.08);
  const r = Math.max(4, s * 0.22);
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  round(ctx, x + inset, y + inset + drop, s - inset * 2, s - inset * 2, r);
  ctx.fill();
  ctx.fillStyle = hot ? "#243044" : PALETTE.raised;
  round(ctx, x + inset, y + inset, s - inset * 2, s - inset * 2, r);
  ctx.fill();
  ctx.strokeStyle = hot ? PALETTE.moonstone : "rgba(154,163,178,0.28)";
  ctx.lineWidth = hot ? 2 : 1;
  ctx.stroke();
  ctx.fillStyle = "rgba(238,243,247,0.08)";
  round(ctx, x + inset + 2, y + inset + 2, s * 0.42, Math.max(3, s * 0.16), 3);
  ctx.fill();
}

function drawPath(ctx: CanvasRenderingContext2D, run: GridRun, gx: number, gy: number, x: number, y: number, s: number) {
  const skin = run.grid.skin;
  const r = Math.max(3, s * 0.18);
  const m = s * 0.06;
  ctx.fillStyle = skin === "dirt" ? "#1a140f" : skin === "road" ? "#141820" : "#071416";
  round(ctx, x + m, y + m, s - m * 2, s - m * 2, r);
  ctx.fill();
  const path = run.grid.path;
  const i = path.findIndex((p) => p.x === gx && p.y === gy);
  const prev = i > 0 ? path[i - 1] : null;
  const next = i >= 0 && i < path.length - 1 ? path[i + 1] : null;
  const cx = x + s / 2;
  const cy = y + s / 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = skin === "dirt" ? PALETTE.hot : skin === "road" ? PALETTE.moonstone : PALETTE.frost;
  ctx.lineWidth = skin === "alloy" ? Math.max(4, s * 0.16) : Math.max(2, s * 0.08);
  ctx.beginPath();
  const arm = (p: Point | null) => {
    if (!p) return;
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + (p.x - gx) * s * 0.5, cy + (p.y - gy) * s * 0.5);
  };
  arm(prev);
  arm(next);
  ctx.stroke();
  if (skin === "alloy") {
    ctx.strokeStyle = "#f4fbff";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  if (skin === "dirt") {
    ctx.fillStyle = PALETTE.hot;
    ctx.fillRect(cx - 1, cy - 1, 2, 2);
  }
}

function drawMark(ctx: CanvasRenderingContext2D, id: TowerId, cx: number, cy: number, s: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(2, s * 0.07);
  if (id === "lance") {
    ctx.fillStyle = PALETTE.frost;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.28);
    ctx.lineTo(s * 0.1, s * 0.16);
    ctx.lineTo(-s * 0.1, s * 0.16);
    ctx.closePath();
    ctx.fill();
  } else if (id === "halo") {
    ctx.strokeStyle = PALETTE.frost;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.08, 0, Math.PI * 2);
    ctx.stroke();
  } else if (id === "crater") {
    ctx.strokeStyle = PALETTE.ember;
    ctx.beginPath();
    ctx.arc(0, -s * 0.02, s * 0.18, 0.3, Math.PI - 0.3);
    ctx.stroke();
    ctx.fillStyle = PALETTE.ember;
    ctx.beginPath();
    ctx.arc(0, s * 0.1, s * 0.05, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === "rail") {
    ctx.strokeStyle = PALETTE.moonstone;
    ctx.lineWidth = Math.max(3, s * 0.09);
    ctx.beginPath();
    ctx.moveTo(-s * 0.22, 0);
    ctx.lineTo(s * 0.22, 0);
    ctx.stroke();
  } else {
    ctx.fillStyle = PALETTE.legend;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.22);
    ctx.lineTo(s * 0.06, -s * 0.06);
    ctx.lineTo(s * 0.22, 0);
    ctx.lineTo(s * 0.06, s * 0.06);
    ctx.lineTo(0, s * 0.22);
    ctx.lineTo(-s * 0.06, s * 0.06);
    ctx.lineTo(-s * 0.22, 0);
    ctx.lineTo(-s * 0.06, -s * 0.06);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: GridEnemy, cx: number, cy: number, s: number, bob: number) {
  ctx.save();
  ctx.translate(cx, cy + bob);
  ctx.globalAlpha = e.alive ? 1 : 0.4;
  if (e.flash > 0) ctx.fillStyle = PALETTE.paper;
  else if (e.tag === "swift") ctx.fillStyle = PALETTE.frost;
  else if (e.tag === "plate") ctx.fillStyle = "#8b93a3";
  else if (e.tag === "swarm") ctx.fillStyle = PALETTE.ember;
  else ctx.fillStyle = "#5a6270";
  if (e.tag === "swarm") {
    for (const [dx, dy] of [[-6, 2], [0, -4], [6, 2]] as const) {
      ctx.beginPath();
      ctx.arc(dx, dy, s * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (e.tag === "swift") {
    ctx.beginPath();
    ctx.moveTo(s * 0.16, 0);
    ctx.lineTo(-s * 0.12, -s * 0.12);
    ctx.lineTo(-s * 0.12, s * 0.12);
    ctx.closePath();
    ctx.fill();
  } else if (e.tag === "plate") {
    round(ctx, -s * 0.2, -s * 0.14, s * 0.4, s * 0.28, 3);
    ctx.fill();
  } else {
    round(ctx, -s * 0.12, -s * 0.12, s * 0.24, s * 0.24, 3);
    ctx.fill();
  }
  if (e.marked) {
    ctx.strokeStyle = PALETTE.legend;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.22, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawShip(ctx: CanvasRenderingContext2D, run: GridRun, cx: number, cy: number, s: number) {
  const shake = run.flinch > 0 ? Math.sin(run.time * 48) * 3 : 0;
  ctx.save();
  ctx.translate(cx + shake, cy);
  const color = run.companion === "comp-boost" ? PALETTE.ember : run.companion === "comp-shrike" ? PALETTE.sage : PALETTE.epic;
  ctx.fillStyle = "#0c1018";
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.2);
  ctx.lineTo(s * 0.16, s * 0.14);
  ctx.lineTo(-s * 0.16, s * 0.14);
  ctx.closePath();
  ctx.fill();
  const pct = run.companionHp / run.companionMax;
  ctx.strokeStyle = pct < 0.35 ? PALETTE.ember : PALETTE.moonstone;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.48, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
  ctx.stroke();
  ctx.restore();
}

export function drawGrid(ctx: CanvasRenderingContext2D, run: GridRun, cssW: number, cssH: number, dpr: number, hover: Point | null) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(0, 0, cssW, cssH);
  const view = layout(cssW, cssH);
  const towers = new Map(run.towers.map((t) => [`${t.x},${t.y}`, t]));

  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 16; x++) {
      const kind = run.grid.cells[y * 16 + x]!;
      const o = cellOrigin(view, x, y);
      const pressed = run.press?.x === x && run.press.y === y;
      if (kind === "button") {
        const hot = hover?.x === x && hover?.y === y && !!run.selected;
        drawButton(ctx, o.x, o.y, view.cell, hot, !!pressed);
      } else {
        drawPath(ctx, run, x, y, o.x, o.y, view.cell);
      }
    }
  }

  const ship = cellOrigin(view, run.grid.exit.x, run.grid.exit.y);
  drawShip(ctx, run, ship.x + view.cell / 2, ship.y + view.cell / 2, view.cell);

  for (const tower of run.towers) drawTower(ctx, view, tower);
  if (hover && run.selected && !towers.has(`${hover.x},${hover.y}`)) {
    const kind = run.grid.cells[hover.y * 16 + hover.x];
    if (kind === "button") {
      ctx.save();
      ctx.globalAlpha = 0.45;
      drawTower(ctx, view, { x: hover.x, y: hover.y, id: run.selected, rank: 1, cd: 0 });
      ctx.restore();
    }
  }

  for (const e of run.enemies) {
    const p = pointAlong(run.grid.path, e.along);
    const o = cellOrigin(view, 0, 0);
    const step = view.cell + view.gap;
    const bob = Math.sin(run.time * 8 + e.uid) * 2;
    drawEnemy(ctx, e, o.x + p.x * step + view.cell / 2, o.y + p.y * step + view.cell / 2, view.cell, bob);
  }

  for (const shot of run.shots) {
    const a = cellOrigin(view, shot.x, shot.y);
    const b = cellOrigin(view, shot.tx, shot.ty);
    ctx.strokeStyle = shot.color;
    ctx.globalAlpha = Math.max(0.2, shot.life / 0.18);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.x + view.cell / 2, a.y + view.cell / 2);
    ctx.lineTo(b.x + view.cell / 2, b.y + view.cell / 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawTower(ctx: CanvasRenderingContext2D, view: ReturnType<typeof layout>, tower: GridTower) {
  const o = cellOrigin(view, tower.x, tower.y);
  drawMark(ctx, tower.id, o.x + view.cell / 2, o.y + view.cell / 2, view.cell);
  if (tower.rank > 1) {
    ctx.fillStyle = PALETTE.legend;
    for (let i = 0; i < tower.rank; i++) {
      ctx.fillRect(o.x + view.cell * 0.28 + i * 6, o.y + view.cell * 0.78, 4, 3);
    }
  }
}
