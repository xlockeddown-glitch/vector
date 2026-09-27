import type { Assets } from "./assets";
import { ENEMIES, HOME_PAD, PALETTE, SKY_PAD, WORLD, PARAMS } from "./constants";
import { combatStats } from "./data/cards";
import { glowColor, glowRadius } from "./data/glow";
import { OPERATORS, SETS } from "./data/sets";
import { BASE, PATHS, GATES, padById, nearestPathMeta, PATH_WIDTH_DRAW, PATH_CORNER, CRAFT_DOCK, PAD_HUG, padReachMul } from "./data/map";
import { companionSpecialOf, type CompanionState } from "./data/companion";
import { scrapPaint } from "./data/enemies";
import { cutForHull } from "./data/cuts";
import { themeAt } from "./data/themes";
import { skinById } from "./data/skins";
import type { CoverShape, PadLook, RosterItem, ThemeId } from "./types";
import type { Enemy, World } from "./sim";
import { towerPoint, worldSets, bayMoon, BAY_ORBIT, livePads, fusePartnerOf } from "./sim";
import { COVER } from "./cover";
import { bondLookCount } from "./data/bond";
import { craftLookLevel } from "./data/level";

function strokeLane(ctx: CanvasRenderingContext2D, path = PATHS[0]!) {
  ctx.beginPath();
  ctx.moveTo(path[0]!.x, path[0]!.y);
  for (let i = 1; i < path.length - 1; i++) {
    const curr = path[i]!;
    const next = path[i + 1]!;
    ctx.arcTo(curr.x, curr.y, next.x, next.y, PATH_CORNER);
  }
  const last = path[path.length - 1]!;
  ctx.lineTo(last.x, last.y);
}

function drawAllPaths(
  ctx: CanvasRenderingContext2D,
  stroke: () => void,
) {
  for (const path of PATHS) {
    strokeLane(ctx, path);
    stroke();
  }
}

function drawGround(
  ctx: CanvasRenderingContext2D,
  theme: ReturnType<typeof themeAt>,
  _assets: Assets | null,
) {
  ctx.fillStyle = "#05060b";
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  const wash = ctx.createRadialGradient(WORLD.w * 0.5, WORLD.h * 0.48, 40, WORLD.w * 0.5, WORLD.h * 0.5, 620);
  wash.addColorStop(0, "rgba(18, 24, 36, 0.55)");
  wash.addColorStop(1, "rgba(5, 6, 11, 0)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);

  const cell = 40;
  ctx.save();
  ctx.strokeStyle = "rgba(238,243,247,0.055)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= WORLD.w; x += cell) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, WORLD.h);
    ctx.stroke();
  }
  for (let y = 0; y <= WORLD.h; y += cell) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(WORLD.w, y + 0.5);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  for (let i = 0; i < 42; i++) {
    const seed = i * 97.13;
    const x = (seed * 19) % WORLD.w;
    const y = (seed * 29) % WORLD.h;
    ctx.fillStyle = `rgba(238,243,247,${0.12 + (i % 5 === 0 ? 0.18 : 0)})`;
    ctx.fillRect(x, y, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
  }
  ctx.restore();

  const home = ctx.createRadialGradient(WORLD.w - 80, WORLD.h - 80, 8, WORLD.w - 80, WORLD.h - 80, 180);
  home.addColorStop(0, hexA(theme.glow, 0.12));
  home.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = home;
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);
}

function drawSpaceBleed(ctx: CanvasRenderingContext2D, cssW: number, cssH: number) {
  ctx.fillStyle = "#05060b";
  ctx.fillRect(-32, -32, cssW + 64, cssH + 64);
  ctx.save();
  for (let i = 0; i < 36; i++) {
    const seed = i * 97.13;
    const x = (seed * 19) % Math.max(1, cssW);
    const y = (seed * 29) % Math.max(1, cssH);
    ctx.fillStyle = `rgba(238,243,247,${0.1 + (i % 5 === 0 ? 0.14 : 0)})`;
    ctx.fillRect(x, y, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
  }
  ctx.restore();
}

function drawPath(ctx: CanvasRenderingContext2D, theme: ReturnType<typeof themeAt>, ion = false, t = 0, pathStyle: "frost" | "ember" | "ion" | null = null) {
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.miterLimit = 2;

  ctx.save();
  ctx.translate(0, 5);
  drawAllPaths(ctx, () => {
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = PATH_WIDTH_DRAW + 6;
    ctx.stroke();
  });
  ctx.restore();

  drawAllPaths(ctx, () => {
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = PATH_WIDTH_DRAW + 3;
    ctx.stroke();
  });

  PATHS.forEach((path, i) => {
    const tint = GATES[i]?.color ?? theme.pathLine;
    const rim =
      pathStyle === "ember"
        ? PALETTE.ember
        : pathStyle === "frost"
          ? PALETTE.frost
          : ion || pathStyle === "ion"
            ? "#7ec8ff"
            : tint || "#5eebff";
    ctx.save();
    ctx.shadowColor = rim;
    ctx.shadowBlur = 10;
    strokeLane(ctx, path);
    ctx.strokeStyle = hexA(rim, 0.55);
    ctx.lineWidth = PATH_WIDTH_DRAW + 5;
    ctx.stroke();
    ctx.shadowBlur = 0;
    strokeLane(ctx, path);
    ctx.strokeStyle = "#e8f4ff";
    ctx.lineWidth = PATH_WIDTH_DRAW - 2;
    ctx.stroke();
    strokeLane(ctx, path);
    ctx.strokeStyle = "#f5fbff";
    ctx.lineWidth = Math.max(4, PATH_WIDTH_DRAW - 10);
    ctx.stroke();
    ctx.restore();
  });

  ctx.setLineDash([7, 16]);
  ctx.lineDashOffset = -t * 38;
  drawAllPaths(ctx, () => {
    ctx.strokeStyle = ion ? "rgba(126,200,255,0.55)" : "rgba(240,241,244,0.28)";
    ctx.lineWidth = 1.6;
    ctx.stroke();
  });
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
  ctx.restore();

  ctx.save();
  ctx.font = "700 13px 'D-DIN Condensed', sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  for (let i = 0; i < PATHS.length; i++) {
    const g = GATES[i] ?? GATES[0]!;
    const s = PATHS[i]![0]!;
    ctx.fillStyle = "rgba(5,6,11,0.82)";
    ctx.beginPath();
    ctx.moveTo(s.x - 8, s.y - 28);
    ctx.lineTo(s.x + 72, s.y - 28);
    ctx.lineTo(s.x + 66, s.y - 10);
    ctx.lineTo(s.x - 8, s.y - 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = g.color;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = g.color;
    ctx.fillText(g.name, s.x, s.y - 18);
  }
  ctx.restore();
}

function drawBores(ctx: CanvasRenderingContext2D, w: World, visT: number) {
  if (!w.bores?.length) return;
  for (const b of w.bores) {
    const fade = Math.max(0.28, b.life / Math.max(0.01, b.max));
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.shadowColor = b.pit ? "#9b6cff" : "#3cd6cc";
    ctx.shadowBlur = b.pit ? 18 : 12;
    ctx.translate(b.x, b.y);
    if (b.kind === "fire") {
      ctx.shadowColor = "#ff5c2a";
      ctx.shadowBlur = 14;
      ctx.fillStyle = hexA("#ff5c2a", 0.22);
      ctx.beginPath();
      ctx.arc(0, 0, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = hexA("#ff5c2a", 0.9);
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, b.r * (0.9 + Math.sin(visT * 8) * 0.05), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (b.kind === "ice") {
      ctx.shadowColor = "#3cd6cc";
      ctx.shadowBlur = 12;
      ctx.fillStyle = hexA("#3cd6cc", 0.18);
      ctx.beginPath();
      ctx.arc(0, 0, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = hexA("#eef3f7", 0.85);
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, b.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (b.pit) {
      const pulse = 0.88 + Math.sin(visT * 7) * 0.05;
      ctx.fillStyle = "rgba(14, 10, 28, 0.55)";
      ctx.beginPath();
      ctx.arc(0, 0, b.r, 0, Math.PI * 2);
      ctx.arc(0, 0, b.r * 0.42, 0, Math.PI * 2, true);
      ctx.fill("evenodd");
      ctx.strokeStyle = hexA("#9b6cff", 0.95);
      ctx.lineWidth = 3;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, b.r * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = hexA("#3cd6cc", 0.8);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, b.r * 0.42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = hexA("#3cd6cc", 0.9);
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-b.r * 0.72, 0);
      ctx.lineTo(b.r * 0.72, 0);
      ctx.moveTo(0, -b.r * 0.72);
      ctx.lineTo(0, b.r * 0.72);
      ctx.stroke();
    } else {
      const dx = b.r * 1.15;
      const dy = b.r * 0.62;
      ctx.fillStyle = hexA("#121028", 0.78);
      ctx.beginPath();
      ctx.moveTo(0, -dy);
      ctx.lineTo(dx, 0);
      ctx.lineTo(0, dy);
      ctx.lineTo(-dx, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = hexA("#3cd6cc", 0.95);
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.strokeStyle = hexA("#9b6cff", 0.7);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -dy * 0.55);
      ctx.lineTo(dx * 0.55, 0);
      ctx.lineTo(0, dy * 0.55);
      ctx.lineTo(-dx * 0.55, 0);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }
}

function paintMoonBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  limb: string,
  lit: boolean,
  look: PadLook | undefined,
  t: number,
  plot?: string,
) {
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.72, r * 1.15, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  const rift = look === "rift";
  const hi = lit ? (rift ? "#8a5344" : "#6a7380") : hexA(plot || "#3a4048", 0.7) || "#3a4048";
  const mid = lit ? (rift ? "#3a221c" : "#2a3038") : "#1a1e26";
  const body = ctx.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.08, x, y, r);
  if (rift && lit) {
    body.addColorStop(0, hexA(PALETTE.ember, 0.62));
    body.addColorStop(0.22, hi);
    body.addColorStop(0.72, mid);
    body.addColorStop(1, "#05060b");
  } else {
    body.addColorStop(0, hi);
    body.addColorStop(0.3, mid);
    body.addColorStop(0.72, "#0b0d12");
    body.addColorStop(1, "#05060b");
  }
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = limb;
  ctx.lineWidth = lit ? 1.35 : 1;
  ctx.shadowColor = lit ? limb : "transparent";
  ctx.shadowBlur = lit ? 8 : 0;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = lit ? "rgba(238,243,247,0.18)" : "rgba(238,243,247,0.07)";
  ctx.beginPath();
  ctx.ellipse(x - r * 0.32, y - r * 0.32, r * 0.38, r * 0.2, -0.55, 0, Math.PI * 2);
  ctx.fill();
  if (rift) {
    ctx.strokeStyle = lit ? hexA(PALETTE.ember, 0.5) : "rgba(0,0,0,0.55)";
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.55, y - r * 0.12);
    ctx.lineTo(x - r * 0.08, y + r * 0.18);
    ctx.lineTo(x + r * 0.42, y + r * 0.08);
    ctx.moveTo(x + r * 0.1, y - r * 0.48);
    ctx.lineTo(x + r * 0.22, y + r * 0.52);
    ctx.stroke();
    if (lit) {
      const pulse = 0.35 + Math.sin(t * 5 + x * 0.02) * 0.12;
      ctx.fillStyle = hexA(PALETTE.ember, pulse);
      ctx.beginPath();
      ctx.arc(x + r * 0.08, y + r * 0.06, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (look === "ring") {
    ctx.strokeStyle = hexA(lit ? PALETTE.legend : PALETTE.steel, lit ? 0.52 : 0.26);
    ctx.lineWidth = lit ? 1.35 : 1;
    ctx.beginPath();
    ctx.ellipse(x, y, r + 5.4, r * 0.34, -0.16, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (look === "pair") {
    const cr = r * 0.5;
    const cx = x + r * 0.98;
    const cy = y - r * 0.38;
    const pebble = ctx.createRadialGradient(cx - cr * 0.3, cy - cr * 0.3, 1, cx, cy, cr);
    pebble.addColorStop(0, lit ? "#5a6270" : "#2a3038");
    pebble.addColorStop(1, "#05060b");
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fillStyle = pebble;
    ctx.fill();
    ctx.strokeStyle = hexA(limb, lit ? 0.7 : 0.4);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawPebbleMoon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  limb: string,
  far: boolean,
  lit: boolean,
  plot?: string,
  look?: PadLook,
  t = 0,
) {
  ctx.save();
  paintMoonBody(ctx, x, y, r, limb, lit, far && look !== "pair" && look !== "rift" ? "ring" : look, t, plot);
  ctx.restore();
}

function drawPads(ctx: CanvasRenderingContext2D, w: World, plot: string) {
  const picking = w.roster.find((r) => r.uid === w.selectedCard);
  const cover = picking?.card.stats?.cover;
  const painting =
    !!picking &&
    (picking.card.kind === "tower" || picking.card.kind === "defender") &&
    (w.phase === "placement" || w.phase === "combat") &&
    (!picking.placedPad || picking.card.kind === "tower");
  if (painting) {
    ctx.save();
    ctx.strokeStyle = hexA("#4aa8e8", 0.14);
    ctx.lineWidth = PAD_HUG * 1.85;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    strokeLane(ctx);
    ctx.stroke();
    ctx.restore();
  }
  for (const pad of livePads(w)) {
    const occupied = w.roster.some((r) => r.placedPad === pad.id && r.card.kind === "tower");
    const rigged = w.roster.some((r) => r.placedPad === pad.id && r.card.kind === "socket");
    const selected = w.selectedPad === pad.id;
    const swapping =
      !!picking &&
      !!picking.placedPad &&
      picking.placedPad !== HOME_PAD &&
      picking.card.kind === "tower" &&
      (w.swapTokens ?? 0) > 0 &&
      picking.placedPad !== pad.id;
    const canPlace =
      !!picking &&
      (w.phase === "placement" || w.phase === "combat") &&
      ((picking.card.kind === "tower" && !occupied && (!picking.placedPad || swapping)) ||
        (picking.card.kind === "socket" && !rigged && !picking.placedPad));
    const job = canPlace && cover && pad.seat === cover;
    if (occupied) continue;
    const r = selected || job ? PARAMS.moonR + 3.5 : canPlace ? PARAMS.moonR + 2 : PARAMS.moonR;
    const zone = GATES.find((g) => g.id === pad.zone)?.color ?? (pad.zone === "merge" ? PALETTE.legend : PALETTE.steel);
    const limb = selected
      ? PALETTE.paper
      : job
        ? PALETTE.frost
        : canPlace
          ? PALETTE.ember
          : hexA(zone, 0.38);
    drawPebbleMoon(ctx, pad.x, pad.y, r, limb, !!pad.far, selected || job || canPlace, plot, pad.look, w.visT);
    if (rigged) {
      ctx.save();
      ctx.fillStyle = PALETTE.frost;
      ctx.fillRect(pad.x + r * 0.2, pad.y + r * 0.1, 3.2, 3.2);
      ctx.restore();
    }
  }
}

function hpBar(ctx: CanvasRenderingContext2D, e: Enemy) {
  const w = Math.max(22, e.radius * 2.1);
  const x = e.x - w / 2;
  const y = e.y - e.radius - (ENEMIES[e.type].scale > 1 ? 20 : 12);
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(x, y, w, 4);
  ctx.fillStyle = e.hp / e.maxHp < 0.3 ? PALETTE.ember : PALETTE.accent;
  ctx.fillRect(x, y, w * Math.max(0, e.hp / e.maxHp), 4);
}

function drawCore(
  ctx: CanvasRenderingContext2D,
  aim: number,
  t: number,
  name: string | null,
  gold = false,
  stickers: { name: string }[] = [],
) {
  const { x, y } = BASE;
  ctx.save();
  ctx.translate(x, y);
  const cy = -6;
  const R = PARAMS.homeR;
  const pulse = 0.55 + Math.sin(t * 1.6) * 0.08;
  const oceanDeep = gold ? "#1c140c" : "#07141e";
  const ocean = gold ? "#3a2a14" : "#123044";
  const landA = gold ? "#8a6a32" : "#3e4a36";
  const landB = gold ? "#c4a060" : "#5a6248";
  const ice = gold ? "#efe4c8" : "#d7e4ef";
  const limb = gold ? PALETTE.legend : PALETTE.frost;

  ctx.fillStyle = hexA(limb, 0.1 + pulse * 0.06);
  ctx.beginPath();
  ctx.arc(0, cy, R + 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(0,0,0,0.48)";
  ctx.beginPath();
  ctx.ellipse(0, cy + R + 8, R * 0.82, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, cy, R, 0, Math.PI * 2);
  ctx.clip();

  const sea = ctx.createRadialGradient(-10, cy - 12, 6, 0, cy, R);
  sea.addColorStop(0, ocean);
  sea.addColorStop(0.55, oceanDeep);
  sea.addColorStop(1, "#05060b");
  ctx.fillStyle = sea;
  ctx.fillRect(-R, cy - R, R * 2, R * 2);

  const blob = (ox: number, oy: number, rw: number, rh: number, rot: number, col: string) => {
    ctx.save();
    ctx.translate(ox, cy + oy);
    ctx.rotate(rot);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  blob(-9, -5, 21, 13, -0.4, landA);
  blob(7, 9, 19, 10.5, 0.35, landB);
  blob(-21, 14, 12, 7, 0.2, landA);
  blob(19, -12, 10.5, 8, -0.5, landB);
  blob(2, -19, 9.5, 5.3, 0.1, landA);
  blob(-5, 21, 16, 7, 0.15, landB);

  ctx.fillStyle = ice;
  ctx.beginPath();
  ctx.ellipse(2, cy - R + 8, 16, 7.5, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-1, cy + R - 7, 18, 6.5, -0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = hexA("#eef3f7", 0.16);
  blob(-6, -8, 22, 5, -0.2, hexA("#eef3f7", 0.14));
  blob(10, 4, 18, 4, 0.28, hexA("#eef3f7", 0.1));

  const night = ctx.createLinearGradient(-R, cy, R, cy);
  night.addColorStop(0, "rgba(5,6,11,0.08)");
  night.addColorStop(0.42, "rgba(5,6,11,0.05)");
  night.addColorStop(0.62, "rgba(5,6,11,0.45)");
  night.addColorStop(1, "rgba(5,6,11,0.72)");
  ctx.fillStyle = night;
  ctx.fillRect(-R, cy - R, R * 2, R * 2);

  ctx.fillStyle = gold ? PALETTE.legend : "#e8c15a";
  for (let i = 0; i < 9; i++) {
    const a = 0.4 + i * 0.28;
    const px = Math.cos(a) * R * 0.62;
    if (px < 6) continue;
    const py = cy + Math.sin(a * 1.7) * R * 0.48;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(px, py, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const spec = ctx.createRadialGradient(-14, cy - 16, 2, -8, cy - 8, 22);
  spec.addColorStop(0, "rgba(238,243,247,0.28)");
  spec.addColorStop(1, "rgba(238,243,247,0)");
  ctx.fillStyle = spec;
  ctx.beginPath();
  ctx.arc(0, cy, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(0, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = hexA(limb, 0.55 + pulse * 0.12);
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, cy, R + 3.2, 0, Math.PI * 2);
  ctx.strokeStyle = hexA(limb, 0.18);
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.save();
  ctx.translate(0, cy);
  ctx.rotate(aim);
  ctx.fillStyle = "#12151c";
  ctx.fillRect(R - 8, -5.5, 16, 11);
  ctx.fillStyle = PALETTE.steel;
  ctx.fillRect(R - 6, -3.6, 20, 7.2);
  ctx.fillStyle = limb;
  ctx.fillRect(R + 12, -1.8, 10, 3.6);
  ctx.restore();

  ctx.fillStyle = hexA(PALETTE.paper, 0.85);
  ctx.font = "700 9px 'D-DIN', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("HOME", 0, cy + R + 8);
  ctx.fillStyle = PALETTE.steel;
  ctx.font = "700 10px 'D-DIN Condensed', sans-serif";
  ctx.fillText(name ?? "VECTOR", 0, cy + R + 19);

  for (let i = 0; i < stickers.length; i++) {
    const a = t * 0.35 + (i * Math.PI * 2) / Math.max(1, stickers.length);
    const sx = Math.cos(a) * (R + 11);
    const sy = Math.sin(a) * (R * 0.48) + cy;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.legend;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function setColor(set: string | null, art: string) {
  if (set && set in SETS) return SETS[set as keyof typeof SETS].color;
  if (art === "ember") return PALETTE.ember;
  if (art === "rime") return PALETTE.frost;
  if (art === "hex") return PALETTE.accent;
  if (art === "grove") return PALETTE.sage;
  if (art === "arc") return "#c4b8ff";
  if (art === "captain") return PALETTE.paper;
  return PALETTE.steel;
}

function drawSteelPad(
  ctx: CanvasRenderingContext2D,
  c: string,
  streak = 0,
  hot = false,
  ult = false,
  far = false,
  look?: PadLook,
  t = 0,
) {
  const cy = 9;
  const r = PARAMS.moonRHot;
  paintMoonBody(ctx, 0, cy, r, hot ? "#eef3f7" : hexA(c, 0.78), true, far && look !== "rift" && look !== "pair" ? "ring" : look ?? (far ? "ring" : "plain"), t);
  ctx.strokeStyle = hot ? "#eef3f7" : hexA(c, 0.78);
  ctx.lineWidth = hot ? 2 : 1.4;
  ctx.shadowColor = hot ? "#eef3f7" : c;
  ctx.shadowBlur = hot ? 12 : 4;
  ctx.beginPath();
  ctx.arc(0, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  const pips = Math.min(3, Math.floor(streak / 3) || (ult ? 3 : 0));
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(-8 + i * 8, cy + r + 3, 2, 0, Math.PI * 2);
    ctx.fillStyle = i < pips ? (hot || ult ? "#eef3f7" : "#e8c15a") : "rgba(238,243,247,0.18)";
    ctx.shadowColor = i < pips ? "#e8c15a" : "transparent";
    ctx.shadowBlur = i < pips ? 6 : 0;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function drawCraftDock(ctx: CanvasRenderingContext2D, w: World) {
  if (w.phase !== "placement" && w.phase !== "combat") return;
  const crafts = (w.companions ?? []).filter((c) => c.placedPad === "sky");
  if (!crafts.length) return;
  const x = CRAFT_DOCK.x;
  const y = CRAFT_DOCK.y;
  const rows = crafts.slice(0, 3);
  const h = 24 + rows.length * 28;
  ctx.save();
  roundRect(ctx, x - 80, y - h / 2, 160, h, 8);
  ctx.fillStyle = "rgba(5,6,11,0.8)";
  ctx.fill();
  ctx.strokeStyle = hexA("#4aa8e8", 0.55);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "#4aa8e8";
  ctx.font = "600 9px 'D-DIN Condensed', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("CRAFTS", x - 72, y - h / 2 + 14);
  rows.forEach((c, i) => {
    const yy = y - h / 2 + 30 + i * 28;
    const spec = companionSpecialOf(c.card.companion?.role ?? "hunter");
    ctx.fillStyle = "#eef3f7";
    ctx.font = "700 12px 'D-DIN Condensed', sans-serif";
    ctx.fillText(c.card.name, x - 72, yy);
    ctx.fillStyle = "#8b93a0";
    ctx.font = "500 10px 'D-DIN', sans-serif";
    ctx.fillText(c.home ? "bay" : c.crit ? "crit" : spec.name, x + 16, yy);
    const frac = Math.max(0, Math.min(1, c.hpMax > 0 ? c.hp / c.hpMax : 0));
    roundRect(ctx, x - 72, yy + 5, 90, 4, 2);
    ctx.fillStyle = "#12151c";
    ctx.fill();
    roundRect(ctx, x - 72, yy + 5, 90 * frac, 4, 2);
    ctx.fillStyle = frac < 0.35 ? PALETTE.ember : "#4aa8e8";
    ctx.fill();
  });
  ctx.restore();
}

function drawMast(ctx: CanvasRenderingContext2D) {
  const steel = ctx.createLinearGradient(-5, -36, 6, 6);
  steel.addColorStop(0, "#f4f6f8");
  steel.addColorStop(0.28, "#c5ccd3");
  steel.addColorStop(0.62, "#6a7280");
  steel.addColorStop(1, "#1a1e26");
  ctx.fillStyle = steel;
  roundRect(ctx, -5, -36, 10, 40, 5);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  roundRect(ctx, -3.2, -34, 2.2, 34, 1);
  ctx.fill();
  ctx.fillStyle = "#0a0c10";
  roundRect(ctx, -5, -12, 10, 3.2, 1);
  ctx.fill();
  ctx.fillStyle = "#ff5c2a";
  ctx.fillRect(-5, -10.6, 10, 1.15);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, w, h, r);
  else {
    ctx.rect(x, y, w, h);
  }
}

function gunsOnField(w: World) {
  return w.roster.some((r) => r.placedPad && r.placedPad !== HOME_PAD && r.card.kind === "tower");
}

export function placeDefendHit(
  canvas: HTMLCanvasElement,
  cx: number,
  cy: number,
  w: World,
): boolean {
  if (w.phase !== "placement") return false;
  if (!gunsOnField(w)) return false;
  const rect = canvas.getBoundingClientRect();
  const { cssW, cssH, scale, oy } = viewTransform(canvas);
  const mapBottom = oy + WORLD.h * scale;
  const gap = cssH - mapBottom;
  if (gap < 40) return false;
  const x = cx - rect.left - cssW / 2;
  const y = cy - rect.top - (mapBottom + gap * 0.5);
  return Math.abs(x) <= 100 && Math.abs(y) <= 32;
}

function drawPlacePrompt(
  ctx: CanvasRenderingContext2D,
  w: World,
  view: { dpr: number; cssW: number; cssH: number; scale: number; oy: number },
) {
  if (w.phase !== "placement") return;
  const { dpr, cssW, cssH, scale, oy } = view;
  const mapBottom = oy + WORLD.h * scale;
  const gap = cssH - mapBottom;
  if (gap < 40) return;
  const planted = gunsOnField(w);
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const x = cssW / 2;
  const y = mapBottom + gap * 0.5;
  if (planted) {
    const pulse = 1 + Math.sin((w.visT ?? 0) * 5) * 0.05;
    const tw = 168 * pulse;
    const th = 48 * pulse;
    ctx.fillStyle = PALETTE.ember;
    roundRect(ctx, x - tw / 2, y - th / 2, tw, th, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.ink;
    ctx.font = "700 22px 'D-DIN Condensed', 'Arial Narrow', sans-serif";
    ctx.fillText("Defend", x, y + 1);
  } else {
    ctx.fillStyle = PALETTE.paper;
    ctx.font = "600 15px 'D-DIN', sans-serif";
    ctx.fillText("Tap a glowing moon.", x, y);
  }
  ctx.restore();
}

function drawTowerShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  item: RosterItem,
  t: number,
  extraOrbit = false,
  skinId?: string,
  buffed = false,
  world?: World,
) {
  const card = item.card;
  const op = item.mod ? OPERATORS[item.mod] : null;
  const family = card.set ? SETS[card.set] : null;
  const c = op?.color ?? family?.color ?? setColor(card.set, card.art);
  const resting = (item.patchCd ?? 0) > 0;
  const glow = resting ? PALETTE.steel : c;
  const pulse = 0.55 + Math.sin(t * 3 + x * 0.01) * 0.2;
  ctx.save();
  ctx.translate(x, y);
  const pop = 1 + (item.levelPop ?? 0) * 0.75;
  const grow = (1 + 0.1 * (Math.max(1, Math.min(4, item.level || 1)) - 1)) * pop;
  ctx.scale(grow, grow);

  if ((item.levelPop ?? 0) > 0.02) {
    const a = item.levelPop ?? 0;
    ctx.save();
    ctx.strokeStyle = hexA("#e8c15a", 0.4 + a * 0.5);
    ctx.shadowColor = "#e8c15a";
    ctx.shadowBlur = 22 + a * 18;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, -8, 20 + a * 18 + Math.sin(t * 16) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = hexA(PALETTE.frost, 0.35 + a * 0.4);
    ctx.shadowColor = PALETTE.frost;
    ctx.beginPath();
    ctx.arc(0, -8, 14 + a * 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  const age = item.appearT != null ? t - item.appearT : 9;
  if (age >= 0 && age < 0.55) {
    const u = Math.min(1, age / 0.4);
    const ease = 1 - (1 - u) * (1 - u) * (1 - u);
    ctx.translate(0, -78 * (1 - ease));
    const squash = age > 0.4 ? 1 + (0.55 - age) * 0.8 : 1;
    ctx.scale(0.42 + 0.58 * ease, (0.42 + 0.58 * ease) * squash);
    ctx.save();
    ctx.globalAlpha = 1 - u;
    const beam = ctx.createLinearGradient(0, -110, 0, 8);
    beam.addColorStop(0, hexA(c, 0));
    beam.addColorStop(0.45, hexA(c, 0.55));
    beam.addColorStop(1, hexA("#eef3f7", 0.85));
    ctx.fillStyle = beam;
    ctx.fillRect(-3, -110, 6, 118);
    ctx.restore();
  }

  if (buffed) {
    const hue = (t * 140) % 360;
    ctx.strokeStyle = `hsla(${hue}, 85%, 62%, 0.85)`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, 28 + Math.sin(t * 6) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  const hot = (item.overclockT ?? 0) > 0;
  const ult = (item.ultT ?? 0) > 0;
  if (hot || ult) {
    ctx.save();
    ctx.strokeStyle = hexA(ult ? "#e8c15a" : "#eef3f7", 0.9);
    ctx.shadowColor = ult ? "#e8c15a" : "#eef3f7";
    ctx.shadowBlur = 18;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, -8, 26 + Math.sin(t * 9) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = ult ? "#e8c15a" : "#eef3f7";
    ctx.fillRect(-9, -18, 18, 3.2);
    ctx.restore();
  }
  const lv = Math.max(1, item.level || 1);
  if (lv >= 2) {
    ctx.save();
    ctx.strokeStyle = hexA(c, 0.45 + Math.min(0.35, (Math.min(4, lv) - 1) * 0.12));
    ctx.shadowColor = c;
    ctx.shadowBlur = 16 + Math.min(4, lv) * 3;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -8, 24 + Math.sin(t * 4) * 1.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (item.trick === "lip") {
    ctx.save();
    ctx.strokeStyle = hexA("#eef3f7", 0.7);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, -2, 30 + Math.sin(t * 5) * 1.6, -0.4, Math.PI + 0.4);
    ctx.stroke();
    ctx.restore();
  }
  if (item.trick === "drones") {
    ctx.save();
    for (let i = 0; i < 2; i++) {
      const a = t * 2.4 + i * Math.PI;
      const dx = Math.cos(a) * 22;
      const dy = Math.sin(a) * 14 - 8;
      ctx.fillStyle = "#eef3f7";
      ctx.shadowColor = c;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(dx, dy, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  if (item.trick === "wake") {
    ctx.save();
    ctx.strokeStyle = hexA(c, 0.55);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, -8, 34, 16, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = hexA(c, 0.18 + pulse * 0.12);
  ctx.shadowColor = hot ? "#eef3f7" : c;
  ctx.shadowBlur = hot ? 22 : 14;
  ctx.beginPath();
  ctx.arc(0, -8, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  drawSteelPad(
    ctx,
    c,
    item.streak ?? 0,
    hot,
    ult,
    !!(world && item.placedPad && livePads(world).find((p) => p.id === item.placedPad)?.far),
    item.placedPad ? padById(item.placedPad)?.look : undefined,
    t,
  );
  {
    const freeze = card.stats?.projectile === "frost" || (card.stats?.slowT ?? 0) > 0;
    const burn = (card.stats?.burnDps ?? 0) > 0 || card.stats?.role === "kiln";
    if (freeze) {
      ctx.save();
      ctx.strokeStyle = hexA(PALETTE.frost, 0.55);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 4, 19 + Math.sin(t * 4) * 1.1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = hexA(PALETTE.frost, 0.7);
      for (let i = 0; i < 3; i++) {
        const a = t * 1.6 + (i * Math.PI * 2) / 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 17, 4 + Math.sin(a) * 11 - 3);
        ctx.lineTo(Math.cos(a) * 21, 4 + Math.sin(a) * 14);
        ctx.lineTo(Math.cos(a + 0.4) * 17, 4 + Math.sin(a + 0.4) * 11);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    if (burn) {
      ctx.save();
      ctx.fillStyle = hexA(PALETTE.ember, 0.55 + Math.sin(t * 6) * 0.12);
      for (let i = 0; i < 4; i++) {
        const a = t * 3 + i * 1.7;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 14, 8 + Math.sin(a * 1.4) * 6, 2.1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
  paintJerseyHull(ctx, card.stats?.hull ?? card.art, c, item.level);
  if (item.extraShot && card.stats?.hull !== "twin") {
    ctx.fillStyle = c;
    roundRect(ctx, -13, -50, 7, 14, 2);
    ctx.fill();
    roundRect(ctx, 6, -50, 7, 14, 2);
    ctx.fill();
  }
  {
    const lv = Math.max(1, Math.min(4, item.level || 1));
    const pair = world ? !!fusePartnerOf(world, item.uid) : false;
    ctx.save();
    ctx.translate(-14, 10);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i < lv ? hexA(c, pair ? 0.95 : 0.85) : "rgba(26,30,40,0.9)";
      if (pair && i < lv) {
        ctx.shadowColor = c;
        ctx.shadowBlur = 6;
      }
      ctx.fillRect(i * 7, 0, 6, 3);
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }
  const art = card.art;
  const hull = card.stats?.hull ?? art;
  if (false) {
  const skipMast = hull === "cone" || hull === "invert" || hull === "mill" || hull === "spin" || hull === "tube" || hull === "halo" || hull === "dish" || hull === "drum";
  if (!skipMast) drawMast(ctx);

  ctx.lineJoin = "round";
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = "rgba(5,6,11,0.35)";
  const glass = ctx.createLinearGradient(-12, -56, 12, -32);
  glass.addColorStop(0, hexA("#ffffff", 0.45));
  glass.addColorStop(0.45, hexA(c, 0.85));
  glass.addColorStop(1, hexA("#05060b", 0.55));
  ctx.fillStyle = glass;
  if (hull === "cone") {
    ctx.beginPath();
    ctx.moveTo(0, -64);
    ctx.lineTo(13, -26);
    ctx.lineTo(-13, -26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = hexA("#ffffff", 0.35);
    ctx.beginPath();
    ctx.moveTo(0, -58);
    ctx.lineTo(4, -34);
    ctx.lineTo(-1, -34);
    ctx.closePath();
    ctx.fill();
  } else if (hull === "invert" || hull === "mortar" || art === "ember") {
    ctx.beginPath();
    ctx.moveTo(-15, -56);
    ctx.lineTo(15, -56);
    ctx.lineTo(9, -28);
    ctx.lineTo(-9, -28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = hexA("#05060b", 0.45);
    ctx.beginPath();
    ctx.ellipse(0, -50, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (hull === "mill" || hull === "fan") {
    ctx.save();
    ctx.translate(0, -40);
    ctx.rotate(t * 2.2);
    for (let i = 0; i < 3; i++) {
      ctx.rotate((Math.PI * 2) / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(10, -6, 18, -2);
      ctx.quadraticCurveTo(8, 4, 0, 0);
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = PALETTE.paper;
    ctx.beginPath();
    ctx.arc(0, -40, 3.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (hull === "spin" || hull === "saw") {
    ctx.save();
    ctx.translate(0, -40);
    ctx.rotate(t * 4.4);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6;
      const r = i % 2 === 0 ? 16 : 7;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath();
    ctx.arc(0, -40, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (hull === "tube" || hull === "rail") {
    ctx.beginPath();
    ctx.ellipse(0, -52, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    roundRect(ctx, -8, -52, 16, 26, 3);
    ctx.fill();
    ctx.fillStyle = hexA("#ffffff", 0.28);
    ctx.beginPath();
    ctx.ellipse(0, -52, 5, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c;
    roundRect(ctx, -2, -48, 4, 18, 1);
    ctx.fill();
  } else if (hull === "crystal" || art === "rime") {
    ctx.beginPath();
    ctx.moveTo(0, -56);
    ctx.lineTo(10, -34);
    ctx.lineTo(-10, -34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = hexA("#eef3f7", 0.3);
    ctx.fillRect(-2, -48, 4, 12);
  } else if (hull === "prism" || art === "hex") {
    ctx.beginPath();
    ctx.moveTo(0, -56);
    ctx.lineTo(11, -40);
    ctx.lineTo(0, -26);
    ctx.lineTo(-11, -40);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.paper;
    ctx.beginPath();
    ctx.arc(0, -42, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (hull === "dish" || hull === "halo" || art === "grove") {
    ctx.save();
    ctx.translate(0, -40);
    if (hull === "halo") ctx.rotate(t * 1.6);
    ctx.strokeStyle = c;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = PALETTE.paper;
    ctx.beginPath();
    ctx.arc(0, 0, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (hull === "coil" || art === "arc") {
    roundRect(ctx, -4, -54, 8, 18, 3);
    ctx.fill();
    roundRect(ctx, -16, -44, 10, 6, 3);
    ctx.fill();
    roundRect(ctx, 6, -44, 10, 6, 3);
    ctx.fill();
  } else if (hull === "stamp" || art === "captain") {
    ctx.beginPath();
    ctx.ellipse(0, -42, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath();
    ctx.ellipse(0, -42, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (hull === "lens") {
    ctx.beginPath();
    ctx.arc(0, -42, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hexA("#7ef0ea", 0.8);
    ctx.beginPath();
    ctx.arc(0, -42, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (hull === "crane") {
    roundRect(ctx, -3, -56, 6, 22, 2);
    ctx.fill();
    ctx.fillStyle = c;
    roundRect(ctx, 2, -54, 16, 5, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(18, -51, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (hull === "furnace") {
    roundRect(ctx, -10, -48, 20, 18, 4);
    ctx.fill();
    ctx.fillStyle = hexA("#ff5c2a", 0.9);
    ctx.beginPath();
    ctx.moveTo(-4, -48);
    ctx.lineTo(0, -60);
    ctx.lineTo(4, -48);
    ctx.fill();
  } else if (hull === "drill") {
    ctx.beginPath();
    ctx.moveTo(0, -58);
    ctx.lineTo(8, -36);
    ctx.lineTo(-8, -36);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(0, -34, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (hull === "drum") {
    ctx.beginPath();
    ctx.ellipse(0, -42, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hexA("#ffffff", 0.25);
    ctx.beginPath();
    ctx.ellipse(0, -46, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (hull === "twin") {
    roundRect(ctx, -14, -52, 8, 16, 3);
    ctx.fill();
    roundRect(ctx, 6, -52, 8, 16, 3);
    ctx.fill();
  } else if (item.extraShot) {
    roundRect(ctx, -12, -52, 7, 15, 3);
    ctx.fill();
    roundRect(ctx, 5, -52, 7, 15, 3);
    ctx.fill();
  } else if (hull === "barrier") {
    roundRect(ctx, -16, -46, 32, 10, 2);
    ctx.fill();
    ctx.fillStyle = hexA("#ffffff", 0.3);
    roundRect(ctx, -12, -43, 24, 4, 1);
    ctx.fill();
  } else {
    roundRect(ctx, -5, -54, 10, 18, 4);
    ctx.fill();
    ctx.fillStyle = c;
    roundRect(ctx, 4, -46, 16, 5, 2);
    ctx.fill();
  }
  }

  ctx.fillStyle = hexA("#4aa8e8", resting ? 0.18 : 0.55);
  roundRect(ctx, -9, -50, 2.4, 11, 1);
  ctx.fill();
  ctx.fillStyle = resting ? PALETTE.steel : "#4aa8e8";
  roundRect(ctx, -12, -36, 24, 2, 1);
  ctx.fill();
  ctx.fillStyle = hexA(glow, resting ? 0.4 : 0.9);
  ctx.beginPath();
  ctx.arc(0, -42, 2.2, 0, Math.PI * 2);
  ctx.fill();

  const glyph = op?.glyph ?? family?.glyph ?? "·";
  ctx.fillStyle = PALETTE.paper;
  ctx.font = "700 12px 'D-DIN Condensed', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(glyph, 0, 2);

  if (item.level > 1) {
    ctx.fillStyle = c;
    roundRect(ctx, -10, 16, 20, 8, 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.ink;
    ctx.font = "700 10px 'D-DIN', sans-serif";
    ctx.fillText(`${op ? op.glyph : ""}${item.level}`, 0, 23);
  }

  const spin = t * 1.6 + x * 0.02;
  drawOrbiters(ctx, item, t, c, spin, extraOrbit);

  const skin = skinById(skinId);
  if (skin.id !== "stock") {
    ctx.shadowColor = skin.glow;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = skin.stroke;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, 8, 20, 6.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}


function drawOrbiters(
  ctx: CanvasRenderingContext2D,
  item: RosterItem,
  t: number,
  c: string,
  spin: number,
  extraOrbit = false,
) {
  const op = item.mod;
  const extra = item.card.affixes?.length ? Math.min(2, item.card.affixes.length) : 0;
  const n = 1 + (op ? 1 : 0) + (item.level > 3 ? 1 : 0) + extra + (extraOrbit ? 1 : 0);
  const feel = op ?? (item.card.set === "heat" ? "mul" : item.card.set === "cold" ? "add" : item.card.set === "spark" ? "raise" : "take");
  for (let i = 0; i < n; i++) {
    const spinMul = feel === "mul" ? 1.8 : feel === "add" ? 0.7 : feel === "raise" ? 2.2 : 0.9;
    const a = spin * spinMul + (i * Math.PI * 2) / n;
    const rx = Math.cos(a) * (18 + i * 3);
    const ry = Math.sin(a) * (8 + i * 2) - 16;
    ctx.save();
    ctx.translate(rx, ry);
    const pulse = feel === "raise" ? 1 + Math.sin(t * 7 + i) * 0.2 : feel === "mul" ? 1 + Math.sin(t * 3) * 0.08 : 1;
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = hexA(c, 0.7);
    ctx.fillStyle = hexA(c, 0.28);
    ctx.lineWidth = 1.6;
    if (feel === "mul") {
      ctx.fillRect(-4, -4, 8, 8);
      ctx.strokeRect(-4, -4, 8, 8);
    } else if (feel === "add") {
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-3.5, -3.5, 7, 7);
      ctx.strokeRect(-3.5, -3.5, 7, 7);
    } else if (feel === "raise") {
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(4, 4);
      ctx.lineTo(-4, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(-5, -2, 10, 4);
      ctx.strokeRect(-5, -2, 10, 4);
    }
    ctx.restore();
  }
}

type GunCover = {
  x: number;
  y: number;
  range: number;
  cover: CoverShape | undefined;
  aim: number;
  inner: number | undefined;
  arc: number | undefined;
  home: boolean;
  selected: boolean;
  ghost?: boolean;
  color: string;
};

function aimForGhost(cover: CoverShape | undefined, pad: { x: number; y: number }) {
  const meta = nearestPathMeta(pad.x, pad.y);
  if ((cover ?? "circle") === "cone") return Math.atan2(meta.py - pad.y, meta.px - pad.x);
  return meta.aim;
}

function pickingGun(w: World) {
  const picking = w.roster.find((r) => r.uid === w.selectedCard);
  if (!picking) return null;
  if (picking.card.kind !== "tower" && picking.card.kind !== "defender") return null;
  const unplaced = !picking.placedPad;
  const swapping =
    !!picking.placedPad &&
    picking.placedPad !== HOME_PAD &&
    picking.card.kind === "tower" &&
    (w.swapTokens ?? 0) > 0;
  if (!unplaced && !swapping) return null;
  return picking;
}

function ghostCovers(w: World): GunCover[] {
  const picking = pickingGun(w);
  if (!picking) return [];
  const sets = worldSets(w);
  const stats = combatStats(
    picking.card,
    picking.level,
    picking.mod,
    sets,
    w.forge[picking.card.templateId] ?? 0,
    { dmg: w.stampDmg, range: w.stampRange * (w.mapRangeMul ?? 1), rate: w.stampRate },
    picking.tuneJob,
    picking.tuneCap,
    picking.jobs,
  );
  if (!stats) return [];
  const family = picking.card.set ? SETS[picking.card.set] : null;
  const color = family?.color ?? PALETTE.frost;
  const out: GunCover[] = [];
  for (const pad of livePads(w)) {
    if (pad.id === HOME_PAD) continue;
    if (picking.placedPad === pad.id) continue;
    if (w.roster.some((r) => r.placedPad === pad.id && r.card.kind === "tower")) continue;
    out.push({
      x: pad.x,
      y: pad.y,
      range: stats.range * padReachMul(pad.id),
      cover: stats.cover,
      aim: aimForGhost(stats.cover, pad),
      inner: stats.coverInner,
      arc: stats.coverArc,
      home: false,
      selected: w.hoverPad === pad.id,
      ghost: true,
      color,
    });
  }
  return out;
}

function gunsForCover(w: World): GunCover[] {
  const sets = worldSets(w);
  const out: GunCover[] = [];
  for (const item of w.roster) {
    if (!item.placedPad) continue;
    if (item.card.kind !== "tower" && item.card.kind !== "defender") continue;
    const pos = towerPoint(item);
    const stats = combatStats(
      item.card,
      item.level,
      item.mod,
      sets,
      w.forge[item.card.templateId] ?? 0,
      { dmg: w.stampDmg, range: w.stampRange * (w.mapRangeMul ?? 1), rate: w.stampRate },
      item.tuneJob,
      item.tuneCap,
      item.jobs,
    );
    if (!pos || !stats) continue;
    const home = item.placedPad === HOME_PAD;
    const selected = w.selectedPad === item.placedPad || w.selectedCard === item.uid;
    const family = item.card.set ? SETS[item.card.set] : null;
    out.push({
      x: pos.x,
      y: pos.y,
      range: stats.range * padReachMul(item.placedPad),
      cover: stats.cover,
      aim: item.aim,
      inner: stats.coverInner,
      arc: stats.coverArc,
      home,
      selected,
      color: family?.color ?? (home ? PALETTE.legend : PALETTE.accent),
    });
  }
  return out;
}

function drawGlowPuddles(ctx: CanvasRenderingContext2D, w: World) {
  if (w.phase !== "placement" && w.phase !== "combat" && w.phase !== "shop") return;
  const sets = worldSets(w);
  const pulse = 0.42 + 0.58 * Math.sin((w.visT ?? 0) * 3.4);
  ctx.save();
  for (const item of w.roster) {
    if (!item.placedPad || item.placedPad === HOME_PAD) continue;
    if (item.card.kind !== "tower" && item.card.kind !== "defender") continue;
    const pos = towerPoint(item);
    const stats = combatStats(
      item.card,
      item.level,
      item.mod,
      sets,
      w.forge[item.card.templateId] ?? 0,
      { dmg: w.stampDmg, range: w.stampRange * (w.mapRangeMul ?? 1), rate: w.stampRate },
      item.tuneJob,
      item.tuneCap,
      item.jobs,
    );
    if (!pos || !stats) continue;
    const range = glowRadius(stats.range * padReachMul(item.placedPad), stats.role, stats.projectile);
    const color = glowColor(stats.role);
    const selected = w.selectedPad === item.placedPad || w.selectedCard === item.uid;
    const a = (selected ? 0.16 : 0.07) * (0.62 + 0.38 * pulse);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, range, 0, Math.PI * 2);
    ctx.fillStyle = hexA(color, a);
    ctx.fill();
    ctx.strokeStyle = hexA(color, selected ? 0.3 : 0.14);
    ctx.lineWidth = selected ? 1.4 : 1;
    ctx.stroke();
  }
  ctx.restore();
}

function paintCover(ctx: CanvasRenderingContext2D, g: GunCover, pulse = 0) {
  const hot = g.home || g.selected;
  const ghost = !!g.ghost;
  ctx.fillStyle = hexA(g.color, ghost ? (hot ? 0.1 + pulse * 0.5 : 0.045) : hot ? 0.07 : 0.025);
  ctx.strokeStyle = hexA(g.color, ghost ? (hot ? 0.55 : 0.22) : hot ? 0.36 : 0.12);
  ctx.lineWidth = ghost ? (hot ? 2 : 1.2) : hot ? 1.6 : 1;
  ctx.setLineDash(ghost && !hot ? [4, 6] : hot ? [] : [5, 7]);
  strokeCover(ctx, g.x, g.y, g.range, g.cover, g.aim, g.inner ?? COVER.ringInner, g.arc ?? COVER.coneArc);
  ctx.fill("evenodd");
  ctx.stroke();
}

function drawCoverage(ctx: CanvasRenderingContext2D, w: World, mode: "placed" | "ghost" = "placed") {
  const guns = mode === "placed" ? gunsForCover(w) : [];
  const ghosts = mode === "ghost" ? ghostCovers(w) : [];
  if (!guns.length && !ghosts.length) return;
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const pulse = 0.03 * (0.5 + 0.5 * Math.sin((w.visT ?? 0) * 6));
  for (const g of ghosts.filter((x) => !x.selected)) paintCover(ctx, g);
  for (const g of guns) paintCover(ctx, g);
  for (const g of ghosts.filter((x) => x.selected)) paintCover(ctx, g, pulse);
  ctx.setLineDash([]);
  ctx.restore();
}

function drawBoostRocket(ctx: CanvasRenderingContext2D, bob: number) {
  const pulse = Math.sin(bob * 12);
  const hull = ctx.createLinearGradient(-7, 0, 7, 0);
  hull.addColorStop(0, PALETTE.paper);
  hull.addColorStop(0.28, PALETTE.steel);
  hull.addColorStop(0.62, "#5c6472");
  hull.addColorStop(1, "#1a1f28");

  ctx.fillStyle = hexA(PALETTE.ember, 0.9);
  ctx.beginPath();
  ctx.moveTo(-5, 18);
  ctx.lineTo(0, 32 + pulse * 4);
  ctx.lineTo(5, 18);
  ctx.fill();
  ctx.fillStyle = hexA(PALETTE.paper, 0.8);
  ctx.beginPath();
  ctx.moveTo(-2, 18);
  ctx.lineTo(0, 26 + pulse * 2);
  ctx.lineTo(2, 18);
  ctx.fill();
  ctx.fillStyle = hexA(PALETTE.frost, 0.5);
  ctx.beginPath();
  ctx.moveTo(-3, 18);
  ctx.lineTo(0, 24);
  ctx.lineTo(3, 18);
  ctx.fill();

  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.quadraticCurveTo(7, -14, 6.5, -6);
  ctx.lineTo(-6.5, -6);
  ctx.quadraticCurveTo(-7, -14, 0, -22);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PALETTE.steel;
  ctx.lineWidth = 1.1;
  ctx.stroke();

  ctx.fillStyle = hull;
  ctx.fillRect(-6.5, -6, 13, 24);
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(-1.4, -6, 2.8, 24);
  ctx.fillStyle = hexA(PALETTE.paper, 0.45);
  ctx.fillRect(-0.5, -5, 1, 20);

  ctx.fillStyle = "#12151c";
  ctx.fillRect(-3.4, -2.4, 6.8, 5.2);
  ctx.fillStyle = hexA("#4aa8e8", 0.85);
  ctx.fillRect(-2.6, -1.6, 5.2, 3.4);
  ctx.fillStyle = hexA(PALETTE.paper, 0.55);
  ctx.fillRect(-1.6, -1.1, 2.2, 1.4);

  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(-6.8, 4, 13.6, 3.2);

  ctx.fillStyle = PALETTE.steel;
  ctx.beginPath();
  ctx.moveTo(-6.5, 1);
  ctx.lineTo(-13, -1);
  ctx.lineTo(-13, 6);
  ctx.lineTo(-6.5, 8);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(6.5, 1);
  ctx.lineTo(13, -1);
  ctx.lineTo(13, 6);
  ctx.lineTo(6.5, 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PALETTE.steel;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(-12, 0.5);
  ctx.lineTo(-7, 2.5);
  ctx.moveTo(-12, 4.5);
  ctx.lineTo(-7, 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(12, 0.5);
  ctx.lineTo(7, 2.5);
  ctx.moveTo(12, 4.5);
  ctx.lineTo(7, 6);
  ctx.stroke();

  ctx.fillStyle = "#1a1f28";
  ctx.beginPath();
  ctx.moveTo(-6.5, 16);
  ctx.lineTo(-11, 24);
  ctx.lineTo(-8, 24);
  ctx.lineTo(-4.5, 18);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(6.5, 16);
  ctx.lineTo(11, 24);
  ctx.lineTo(8, 24);
  ctx.lineTo(4.5, 18);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#2a313c";
  ctx.beginPath();
  ctx.ellipse(-3.6, 19, 2.1, 3.2, 0, 0, Math.PI * 2);
  ctx.ellipse(0, 20, 2.4, 3.6, 0, 0, Math.PI * 2);
  ctx.ellipse(3.6, 19, 2.1, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.ember;
  ctx.beginPath();
  ctx.ellipse(-3.6, 18, 1.1, 1.1, 0, 0, Math.PI * 2);
  ctx.ellipse(0, 18.6, 1.2, 1.2, 0, 0, Math.PI * 2);
  ctx.ellipse(3.6, 18, 1.1, 1.1, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawShrikeJet(ctx: CanvasRenderingContext2D, bob: number) {
  const pulse = Math.sin(bob * 14);
  const hull = ctx.createLinearGradient(-9, 0, 9, 0);
  hull.addColorStop(0, "#1a0c0c");
  hull.addColorStop(0.32, "#2a1014");
  hull.addColorStop(0.55, "#121418");
  hull.addColorStop(1, "#05060b");

  const frost = PALETTE.frost;
  const sage = PALETTE.sage;

  ctx.fillStyle = hexA(frost, 0.9);
  ctx.beginPath();
  ctx.moveTo(-8, 18);
  ctx.lineTo(-5, 32 + pulse * 3);
  ctx.lineTo(-2, 18);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-2, 20);
  ctx.lineTo(0, 34 + pulse * 3);
  ctx.lineTo(2, 20);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(2, 18);
  ctx.lineTo(5, 32 + pulse * 3);
  ctx.lineTo(8, 18);
  ctx.fill();
  ctx.fillStyle = hexA(sage, 0.7);
  ctx.beginPath();
  ctx.moveTo(-1, 20);
  ctx.lineTo(0, 28 + pulse * 2);
  ctx.lineTo(1, 20);
  ctx.fill();

  ctx.strokeStyle = PALETTE.steel;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -26);
  ctx.lineTo(0, -20);
  ctx.stroke();
  ctx.fillStyle = PALETTE.paper;
  ctx.beginPath();
  ctx.arc(0, -25, 1.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.arc(0, -14, 7.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ember;
  ctx.lineWidth = 0.9;
  ctx.stroke();
  ctx.fillStyle = hexA(PALETTE.paper, 0.55);
  ctx.beginPath();
  ctx.arc(0, -15.4, 2.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.moveTo(-7.4, -8);
  ctx.quadraticCurveTo(0, -11, 7.4, -8);
  ctx.lineTo(9.2, 2);
  ctx.quadraticCurveTo(0, 6, -9.2, 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PALETTE.ember;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 2, 9.2, 1.8, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = hexA(PALETTE.paper, 0.28);
  ctx.fillRect(-2.2, -6, 4.4, 4);

  ctx.fillStyle = hull;
  ctx.fillRect(-6.2, 2, 12.4, 16);
  ctx.fillStyle = PALETTE.ember;
  ctx.fillRect(-1, 3, 2, 14);

  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.moveTo(-6.2, 6);
  ctx.lineTo(-20, 8);
  ctx.lineTo(-20, 16);
  ctx.lineTo(-6.2, 14);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(6.2, 6);
  ctx.lineTo(20, 8);
  ctx.lineTo(20, 16);
  ctx.lineTo(6.2, 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.ember;
  ctx.fillRect(-19.4, 7.4, 13, 1.3);
  ctx.fillRect(6.4, 7.4, 13, 1.3);
  ctx.strokeStyle = hexA(frost, 0.35);
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-18, 10);
  ctx.lineTo(-8, 9.4);
  ctx.moveTo(-18, 13);
  ctx.lineTo(-8, 12.4);
  ctx.moveTo(18, 10);
  ctx.lineTo(8, 9.4);
  ctx.moveTo(18, 13);
  ctx.lineTo(8, 12.4);
  ctx.stroke();

  ctx.fillStyle = "#121418";
  ctx.beginPath();
  ctx.moveTo(-6.4, 16);
  ctx.lineTo(6.4, 16);
  ctx.lineTo(10, 22);
  ctx.lineTo(-10, 22);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#0c1816";
  ctx.beginPath();
  ctx.ellipse(-5.4, 22, 2.4, 3.2, 0, 0, Math.PI * 2);
  ctx.ellipse(-1.6, 23, 2.6, 3.6, 0, 0, Math.PI * 2);
  ctx.ellipse(1.6, 23, 2.6, 3.6, 0, 0, Math.PI * 2);
  ctx.ellipse(5.4, 22, 2.4, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = frost;
  ctx.beginPath();
  ctx.ellipse(-5.4, 21.2, 1.1, 1.1, 0, 0, Math.PI * 2);
  ctx.ellipse(-1.6, 22, 1.2, 1.2, 0, 0, Math.PI * 2);
  ctx.ellipse(1.6, 22, 1.2, 1.2, 0, 0, Math.PI * 2);
  ctx.ellipse(5.4, 21.2, 1.1, 1.1, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawAuger(ctx: CanvasRenderingContext2D, bob: number) {
  const spin = bob * 8.4;
  const hull = ctx.createLinearGradient(0, -8, 0, 8);
  hull.addColorStop(0, "#ffffff");
  hull.addColorStop(0.28, "#eef6ff");
  hull.addColorStop(0.62, "#d8e4f4");
  hull.addColorStop(1, "#9aa0c4");

  ctx.fillStyle = hexA("#3cd6cc", 0.5 + Math.sin(bob * 10) * 0.12);
  ctx.beginPath();
  ctx.moveTo(18, -5);
  ctx.quadraticCurveTo(34 + Math.sin(bob * 9) * 3, 0, 18, 6);
  ctx.fill();
  ctx.fillStyle = hexA("#9b6cff", 0.7);
  ctx.beginPath();
  ctx.arc(24 + Math.sin(bob * 11) * 2, -2.4, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(21, 3.2, 1.2, 0, Math.PI * 2);
  ctx.fill();

  const bell = ctx.createRadialGradient(-22, -2, 0.4, -22, 0, 5);
  bell.addColorStop(0, "#d4f6f2");
  bell.addColorStop(0.45, "#3cd6cc");
  bell.addColorStop(1, "#2a1840");
  ctx.fillStyle = bell;
  ctx.beginPath();
  ctx.ellipse(-22, -4.2, 2.4, 3.2, 0, 0, Math.PI * 2);
  ctx.ellipse(-23.5, 0, 3, 3.8, 0, 0, Math.PI * 2);
  ctx.ellipse(-22, 4.2, 2.4, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.moveTo(-18, -6.5);
  ctx.quadraticCurveTo(-2, -9, 10, -6);
  ctx.lineTo(12, 6);
  ctx.quadraticCurveTo(-2, 9, -18, 6.5);
  ctx.quadraticCurveTo(-20, 0, -18, -6.5);
  ctx.fill();
  ctx.strokeStyle = "#1a1014";
  ctx.lineWidth = 1.05;
  ctx.stroke();
  const stripe = ctx.createLinearGradient(-16, 0, 8, 0);
  stripe.addColorStop(0, "#9b6cff");
  stripe.addColorStop(1, "#3cd6cc");
  ctx.fillStyle = stripe;
  ctx.fillRect(-16, -1.2, 24, 2.4);
  ctx.fillStyle = "#1a1014";
  ctx.fillRect(-4, -4.4, 7, 3.4);
  ctx.fillStyle = hexA("#7ef0ea", 0.9);
  ctx.fillRect(-3, -3.4, 5, 1.6);

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#9b6cff";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-2, -7);
  ctx.lineTo(6, -11.5);
  ctx.lineTo(8, -9.5);
  ctx.lineTo(1, -5.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-2, 7);
  ctx.lineTo(6, 11.5);
  ctx.lineTo(8, 9.5);
  ctx.lineTo(1, 5.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(8, -7);
  ctx.quadraticCurveTo(4, -13, -2, -8);
  ctx.lineTo(6, -4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#3cd6cc";
  ctx.lineWidth = 0.9;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(8, 7);
  ctx.quadraticCurveTo(4, 13, -2, 8);
  ctx.lineTo(6, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.translate(16.5, 0);
  ctx.rotate(spin);
  const head = ctx.createRadialGradient(-3, -3, 1, 0, 0, 12);
  head.addColorStop(0, "#ffffff");
  head.addColorStop(0.5, "#d4f6f2");
  head.addColorStop(1, "#9b6cff");
  ctx.fillStyle = head;
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1a1014";
  ctx.lineWidth = 1.15;
  ctx.stroke();
  ctx.strokeStyle = "#3cd6cc";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, 8.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(3.2, -2.2);
  ctx.lineTo(8, 0);
  ctx.lineTo(3.2, 2.2);
  ctx.lineTo(0, 8);
  ctx.lineTo(-3.2, 2.2);
  ctx.lineTo(-8, 0);
  ctx.lineTo(-3.2, -2.2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#9b6cff";
  ctx.lineWidth = 1.1;
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ctx.fillStyle = "#d4f6f2";
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 6.4, Math.sin(a) * 6.4, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3cd6cc";
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 6.4, Math.sin(a) * 6.4, 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, 0, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#9b6cff";
  ctx.beginPath();
  ctx.arc(0, 0, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBay(ctx: CanvasRenderingContext2D, w: World, t: number) {
  const moon = bayMoon(t);
  const home = (w.companions ?? []).filter((c) => c.placedPad === SKY_PAD && c.home);
  const occupied = home.length > 0;
  ctx.save();
  ctx.strokeStyle = hexA(PALETTE.steel, 0.22);
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.ellipse(BASE.x + BAY_ORBIT.ox, BASE.y + BAY_ORBIT.oy, BAY_ORBIT.rx, BAY_ORBIT.ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.translate(moon.x, moon.y);
  const r = BAY_ORBIT.r;
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(0, r * 0.7, r * 1.05, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  const body = ctx.createRadialGradient(-5, -6, 2, 0, 0, r);
  body.addColorStop(0, occupied ? "#8a9088" : "#5a6270");
  body.addColorStop(0.45, "#2a3038");
  body.addColorStop(1, "#0b0d12");
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(-4, 2, 4.2, 3.1, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(6, -4, 3.1, 2.3, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = occupied ? PALETTE.sage : hexA(PALETTE.steel, 0.55);
  ctx.shadowColor = occupied ? PALETTE.sage : "transparent";
  ctx.shadowBlur = occupied ? 12 : 0;
  ctx.lineWidth = occupied ? 2 : 1.3;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = occupied ? hexA(PALETTE.sage, 0.22) : "rgba(238,243,247,0.12)";
  ctx.beginPath();
  ctx.ellipse(-5, -6, 6.5, 3.4, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = occupied ? PALETTE.sage : PALETTE.steel;
  ctx.font = "700 10px 'D-DIN', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("BAY", 0, r + 5);
  ctx.restore();
}

function drawFuseArrows(_ctx: CanvasRenderingContext2D, _w: World) {
  /* Combine is gone. Level-up chips live on the craft bar and gun bench. */
}

function drawZeek(ctx: CanvasRenderingContext2D, bob: number) {
  const hover = Math.sin(bob * 5) * 1.2;
  ctx.fillStyle = hexA(PALETTE.sage, 0.28 + Math.sin(bob * 8) * 0.08);
  ctx.beginPath();
  ctx.moveTo(-10, 10);
  ctx.quadraticCurveTo(0, 28 + hover * 2, 10, 10);
  ctx.fill();
  const rim = ctx.createLinearGradient(0, -6, 0, 10);
  rim.addColorStop(0, "#ffe56a");
  rim.addColorStop(0.5, "#ffc72c");
  rim.addColorStop(1, "#8a6a10");
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.ellipse(0, 4 + hover, 22, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1a1a12";
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.fillStyle = "#1a1c16";
  ctx.beginPath();
  ctx.ellipse(0, 3 + hover, 16, 4.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.sage;
  ctx.lineWidth = 2.2;
  ctx.stroke();
  const dome = ctx.createRadialGradient(-4, -8, 1, 0, -4, 14);
  dome.addColorStop(0, "#fff6c8");
  dome.addColorStop(0.55, "#ffc72c");
  dome.addColorStop(1, "#c48a00");
  ctx.fillStyle = dome;
  ctx.beginPath();
  ctx.ellipse(0, -4 + hover, 11, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#121418";
  ctx.beginPath();
  ctx.ellipse(0, -5 + hover, 6.5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.sage;
  ctx.beginPath();
  ctx.ellipse(2.2, -5.4 + hover, 2.6, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(3, -6 + hover, 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hexA("#ffffff", 0.35);
  ctx.beginPath();
  ctx.ellipse(-4, -8 + hover, 6, 2.4, -0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawJoule(ctx: CanvasRenderingContext2D, bob: number) {
  const pulse = Math.sin(bob * 14);
  ctx.fillStyle = hexA("#7ef0ea", 0.7);
  ctx.beginPath();
  ctx.moveTo(-18, -3);
  ctx.lineTo(-28 - pulse * 2, 0);
  ctx.lineTo(-18, 3);
  ctx.fill();
  const hull = ctx.createLinearGradient(0, -8, 0, 8);
  hull.addColorStop(0, "#c5ccd3");
  hull.addColorStop(0.4, "#2a2e28");
  hull.addColorStop(1, "#070806");
  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.moveTo(-16, -5);
  ctx.lineTo(10, -6);
  ctx.lineTo(18, -4);
  ctx.lineTo(18, 4);
  ctx.lineTo(10, 6);
  ctx.lineTo(-16, 5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#e31937";
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.fillStyle = "#e31937";
  ctx.fillRect(-10, -1.4, 22, 2.8);
  ctx.fillStyle = "#e31937";
  ctx.beginPath();
  ctx.ellipse(4, 0, 5, 4.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f5e6d3";
  ctx.beginPath();
  ctx.ellipse(5.2, -1, 2, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#121410";
  ctx.fillRect(16, -12, 6, 24);
  ctx.strokeStyle = "#e31937";
  ctx.lineWidth = 1;
  ctx.strokeRect(16, -12, 6, 24);
  ctx.fillStyle = hexA("#7ef0ea", 0.55);
  ctx.fillRect(17.2, -3, 3.6, 6);
  ctx.fillStyle = "#070806";
  ctx.beginPath();
  ctx.arc(-8, 7, 3.2, 0, Math.PI * 2);
  ctx.arc(10, 7.4, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#7ef0ea";
  ctx.beginPath();
  ctx.arc(-8, 7, 1.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e31937";
  ctx.beginPath();
  ctx.arc(10, 7.4, 1.1, 0, Math.PI * 2);
  ctx.fill();
}

function drawKelvin(ctx: CanvasRenderingContext2D, bob: number) {
  const hover = Math.sin(bob * 4) * 0.8;
  ctx.fillStyle = hexA("#3cd6cc", 0.35);
  ctx.beginPath();
  ctx.ellipse(-12, hover, 6, 3, 0, 0, Math.PI * 2);
  ctx.ellipse(12, hover, 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#eef8ff";
  ctx.beginPath();
  ctx.roundRect(-9, 4 + hover, 18, 10, 5);
  ctx.fill();
  ctx.strokeStyle = "#3cd6cc";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = "#3cd6cc";
  ctx.fillRect(-6, 7 + hover, 12, 3);
  ctx.fillStyle = "#f7fcff";
  ctx.beginPath();
  ctx.arc(0, -4 + hover, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(-8, -14 + hover, 4.2, 4.8, 0, 0, Math.PI * 2);
  ctx.ellipse(8, -14 + hover, 4.2, 4.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#12151c";
  ctx.beginPath();
  ctx.roundRect(-8, -7 + hover, 16, 6, 3);
  ctx.fill();
  ctx.fillStyle = "#3cd6cc";
  ctx.beginPath();
  ctx.roundRect(-7, -6 + hover, 6, 4, 2);
  ctx.roundRect(1, -6 + hover, 6, 4, 2);
  ctx.fill();
  ctx.fillStyle = "#12151c";
  ctx.beginPath();
  ctx.ellipse(0, 2 + hover, 2.4, 1.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0.4, 1.4 + hover, 0.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawTorr(ctx: CanvasRenderingContext2D, bob: number) {
  const hover = Math.sin(bob * 4) * 0.6;
  const steel = ctx.createLinearGradient(-18, -10, 20, 12);
  steel.addColorStop(0, "#eef3f7");
  steel.addColorStop(0.22, "#e8c15a");
  steel.addColorStop(0.58, "#6a5a28");
  steel.addColorStop(1, "#1a1408");
  ctx.fillStyle = hexA("#e8c15a", 0.22);
  ctx.beginPath();
  ctx.ellipse(0, 2 + hover, 24, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = steel;
  ctx.beginPath();
  ctx.moveTo(20, 0 + hover);
  ctx.quadraticCurveTo(8, -12 + hover, -10, -8 + hover);
  ctx.lineTo(-18, 1 + hover);
  ctx.lineTo(-10, 8 + hover);
  ctx.quadraticCurveTo(8, 13 + hover, 20, 1 + hover);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#05060b";
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.fillStyle = "#0b0d12";
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(-6, 3 + hover);
  ctx.quadraticCurveTo(10, 10 + hover, 18, 2 + hover);
  ctx.quadraticCurveTo(6, 8 + hover, -8, 5 + hover);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = PALETTE.legend;
  ctx.fillRect(-10, -1.6 + hover, 18, 2.8);
  ctx.fillStyle = hexA("#ffe56a", 0.75);
  ctx.fillRect(-10, -1.6 + hover, 18, 0.9);
  ctx.fillStyle = PALETTE.legend;
  ctx.beginPath();
  ctx.moveTo(1, -7 + hover);
  ctx.lineTo(7, -16 + hover);
  ctx.lineTo(9, -5 + hover);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-16, -3 + hover);
  ctx.lineTo(-22, -10 + hover);
  ctx.lineTo(-16, 3 + hover);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#121418";
  ctx.beginPath();
  ctx.arc(12, -2 + hover, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffe56a";
  ctx.beginPath();
  ctx.arc(12.8, -2.4 + hover, 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#eef3f7";
  ctx.beginPath();
  ctx.moveTo(18, -2 + hover);
  ctx.lineTo(28, 1 + hover);
  ctx.lineTo(18, 3 + hover);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-12, 5 + hover);
  ctx.lineTo(-8, 10 + hover);
  ctx.lineTo(-14, 8 + hover);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-6, 7 + hover);
  ctx.lineTo(-2, 12 + hover);
  ctx.lineTo(-8, 10 + hover);
  ctx.fill();
  ctx.fillStyle = hexA("#ffffff", 0.28);
  ctx.beginPath();
  ctx.ellipse(-4, -5 + hover, 8, 3, -0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawRook(ctx: CanvasRenderingContext2D, bob: number) {
  const bounce = Math.abs(Math.sin(bob * 8)) * 1.2;
  ctx.fillStyle = "#1a1e24";
  ctx.beginPath();
  ctx.ellipse(-10, 8 + bounce, 6.5, 6.5, 0, 0, Math.PI * 2);
  ctx.ellipse(10, 8 + bounce, 7, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#c5ccd3";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = "#9aa3b2";
  ctx.beginPath();
  ctx.arc(-10, 8 + bounce, 2, 0, Math.PI * 2);
  ctx.arc(10, 8 + bounce, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2a3038";
  ctx.beginPath();
  ctx.moveTo(-14, -2 + bounce);
  ctx.lineTo(14, -4 + bounce);
  ctx.lineTo(16, 6 + bounce);
  ctx.lineTo(-16, 6 + bounce);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#e8ecef";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = "#12151c";
  ctx.fillRect(-8, -12 + bounce, 5, 10);
  ctx.fillRect(4, -12 + bounce, 5, 10);
  ctx.strokeRect(-8, -12 + bounce, 5, 10);
  ctx.strokeRect(4, -12 + bounce, 5, 10);
  ctx.fillStyle = PALETTE.ember;
  ctx.fillRect(12, -1 + bounce, 8, 4);
  ctx.fillStyle = PALETTE.frost;
  ctx.fillRect(-4, -1 + bounce, 10, 3);
}

function drawTorch(ctx: CanvasRenderingContext2D, bob: number) {
  const pulse = Math.sin(bob * 10);
  const hover = Math.sin(bob * 3.4) * 0.5;
  const steel = ctx.createLinearGradient(-18, -10, 20, 12);
  steel.addColorStop(0, "#eef3f7");
  steel.addColorStop(0.2, "#ff8a4a");
  steel.addColorStop(0.55, "#9a3a18");
  steel.addColorStop(1, "#1a1008");
  ctx.fillStyle = hexA("#ff5c2a", 0.22);
  ctx.beginPath();
  ctx.ellipse(0, 2 + hover, 24, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hexA("#ff5c2a", 0.92);
  ctx.beginPath();
  ctx.moveTo(-2, -8 + hover);
  ctx.lineTo(-8, -20 - pulse * 2 + hover);
  ctx.lineTo(6, -6 + hover);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(4, -6 + hover);
  ctx.lineTo(10, -18 - pulse + hover);
  ctx.lineTo(12, -4 + hover);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = steel;
  ctx.beginPath();
  ctx.moveTo(-18, 3 + hover);
  ctx.quadraticCurveTo(-6, -11 + hover, 8, -7 + hover);
  ctx.quadraticCurveTo(18, -2 + hover, 16, 5 + hover);
  ctx.quadraticCurveTo(8, 12 + hover, -16, 8 + hover);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#05060b";
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.strokeStyle = "#ff5c2a";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-10, -1 + hover);
  ctx.quadraticCurveTo(-8, 6 + hover, -8, 8 + hover);
  ctx.moveTo(-2, -3 + hover);
  ctx.quadraticCurveTo(0, 6 + hover, 0, 8 + hover);
  ctx.moveTo(6, -2 + hover);
  ctx.quadraticCurveTo(8, 6 + hover, 7, 8 + hover);
  ctx.stroke();
  ctx.fillStyle = PALETTE.ember;
  ctx.fillRect(-10, -0.6 + hover, 18, 2.6);
  ctx.fillStyle = hexA("#ffe08a", 0.7);
  ctx.fillRect(-10, -0.6 + hover, 18, 0.8);
  ctx.fillStyle = "#ff7a18";
  ctx.beginPath();
  ctx.moveTo(12, -4 + hover);
  ctx.lineTo(22, -9 + hover);
  ctx.lineTo(26, 1 + hover);
  ctx.lineTo(16, 5 + hover);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#05060b";
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.fillStyle = "#121418";
  ctx.beginPath();
  ctx.arc(20, 0 + hover, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffe56a";
  ctx.beginPath();
  ctx.arc(20.7, -0.5 + hover, 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ff5c2a";
  ctx.beginPath();
  ctx.moveTo(22, 1 + hover);
  ctx.lineTo(32 + pulse, 2 + hover);
  ctx.lineTo(22, 4 + hover);
  ctx.fill();
  ctx.fillStyle = hexA("#ffffff", 0.28);
  ctx.beginPath();
  ctx.ellipse(-6, -4 + hover, 8, 3, -0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawHaloCraft(ctx: CanvasRenderingContext2D, bob: number, visT: number) {
  const spin = bob * 3.2;
  const arms = [PALETTE.tile, PALETTE.ember, PALETTE.legend, PALETTE.sage];
  for (let i = 0; i < 4; i++) {
    const a = spin + (i * Math.PI) / 2;
    ctx.fillStyle = arms[i]!;
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * 14, Math.sin(a) * 14, 5.5, 2.2, a, 0, Math.PI * 2);
    ctx.fill();
  }
  const hue = (visT * 90) % 360;
  ctx.strokeStyle = `hsla(${hue}, 90%, 62%, 0.9)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 10 + Math.sin(bob * 4) * 1.2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#f8f9fa";
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#202124";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = PALETTE.tile;
  ctx.beginPath();
  ctx.arc(0, 0, 2.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawPuckCraft(ctx: CanvasRenderingContext2D, bob: number) {
  ctx.rotate(bob * 2.4);
  const gloss = ctx.createRadialGradient(-4, -5, 2, 0, 0, 18);
  gloss.addColorStop(0, "#f4f7fb");
  gloss.addColorStop(0.35, "#c5ccd3");
  gloss.addColorStop(0.7, "#2a3038");
  gloss.addColorStop(1, "#0b0d12");
  ctx.shadowColor = "rgba(227,25,55,0.55)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = gloss;
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(8, 14);
  ctx.lineTo(-8, 14);
  ctx.lineTo(-16, 0);
  ctx.lineTo(-8, -14);
  ctx.lineTo(8, -14);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#e8ecef";
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.strokeStyle = "#e31937";
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(-11, 0);
  ctx.lineTo(11, 0);
  ctx.stroke();
  ctx.fillStyle = hexA("#e31937", 0.35);
  ctx.fillRect(-11, -2.2, 22, 4.4);
  ctx.fillStyle = "#7ef0ea";
  ctx.beginPath();
  ctx.arc(0, 0, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(-1.2, -1.4, 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e31937";
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 14, Math.sin(a) * 14);
    ctx.lineTo(Math.cos(a) * 19, Math.sin(a) * 19);
    ctx.lineTo(Math.cos(a + 0.22) * 14, Math.sin(a + 0.22) * 14);
    ctx.fill();
  }
  ctx.fillStyle = hexA("#ffffff", 0.28);
  ctx.beginPath();
  ctx.ellipse(-4, -6, 7, 3.2, -0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawPoppy(ctx: CanvasRenderingContext2D, bob: number) {
  ctx.fillStyle = hexA("#05060b", 0.35);
  ctx.beginPath();
  ctx.ellipse(0, 16, 8, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  const mast = ctx.createLinearGradient(-4, 6, 4, 6);
  mast.addColorStop(0, "#2a3038");
  mast.addColorStop(0.35, "#eef3f7");
  mast.addColorStop(1, "#16121c");
  ctx.fillStyle = mast;
  ctx.fillRect(-3, 6, 6, 12);
  ctx.fillStyle = "#ff5c2a";
  ctx.fillRect(-1.2, 7, 1.4, 10);
  ctx.save();
  ctx.rotate(bob * 4.1);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    ctx.save();
    ctx.rotate(a);
    const petal = ctx.createLinearGradient(2, 0, 20, 0);
    petal.addColorStop(0, PALETTE.moonstone);
    petal.addColorStop(0.45, "#7c6cf0");
    petal.addColorStop(1, "#2a3038");
    ctx.fillStyle = petal;
    ctx.beginPath();
    ctx.moveTo(3, 0);
    ctx.quadraticCurveTo(12, -6.5, 20, 0);
    ctx.quadraticCurveTo(12, 6.5, 3, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#e8ecef";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.strokeStyle = "#ff5c2a";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(17, 0);
    ctx.stroke();
    ctx.restore();
  }
  const hub = ctx.createRadialGradient(-2, -2, 1, 0, 0, 7);
  hub.addColorStop(0, "#ffffff");
  hub.addColorStop(0.4, "#9aa3b2");
  hub.addColorStop(1, "#12151c");
  ctx.fillStyle = hub;
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#7c6cf0";
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.fillStyle = "#ff5c2a";
  ctx.beginPath();
  ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffe56a";
  ctx.beginPath();
  ctx.arc(-0.9, -0.9, 1.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawChis(ctx: CanvasRenderingContext2D, bob: number) {
  const flap = Math.sin(bob * 8) * 3;
  ctx.fillStyle = hexA("#3ecf7a", 0.35);
  ctx.beginPath();
  ctx.ellipse(0, 8, 16, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  const wing = ctx.createLinearGradient(-22, -8, 0, 6);
  wing.addColorStop(0, "#ffffff");
  wing.addColorStop(1, "#3ecf7a");
  ctx.fillStyle = wing;
  ctx.beginPath();
  ctx.moveTo(-2, 0);
  ctx.quadraticCurveTo(-18, -10 + flap, -22, 2);
  ctx.quadraticCurveTo(-10, 4, -2, 4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.quadraticCurveTo(18, -10 - flap, 22, 2);
  ctx.quadraticCurveTo(10, 4, 2, 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#3ecf7a";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  const body = ctx.createRadialGradient(-2, -2, 2, 0, 2, 10);
  body.addColorStop(0, "#1f4a32");
  body.addColorStop(1, "#0a1a12");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 2, 7, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#3ecf7a";
  ctx.stroke();
  ctx.fillStyle = "#3ecf7a";
  ctx.fillRect(-1.6, -4, 3.2, 12);
  ctx.fillRect(-5.5, 1, 11, 3.2);
  ctx.fillStyle = "#ffe56a";
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(3, -4);
  ctx.lineTo(-3, -4);
  ctx.closePath();
  ctx.fill();
}

function paintBondLook(ctx: CanvasRenderingContext2D, level: number) {
  const n = bondLookCount(level);
  if (n < 1) return;
  ctx.save();
  ctx.strokeStyle = hexA(PALETTE.legend, 0.62 + n * 0.14);
  ctx.shadowColor = PALETTE.legend;
  ctx.shadowBlur = 10 + n * 6;
  ctx.lineWidth = 1.6 + n * 0.4;
  ctx.beginPath();
  ctx.ellipse(0, 2, 19 + n * 2, 9 + n, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (n >= 2) {
    ctx.shadowBlur = 8;
    ctx.fillStyle = PALETTE.legend;
    ctx.fillRect(-9, 10, 18, 2.4);
    ctx.fillStyle = "#eef3f7";
    ctx.fillRect(-3, 10, 6, 2.4);
    ctx.strokeStyle = hexA(PALETTE.legend, 0.7);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.ellipse(0, 2, 24, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (n >= 3) {
    ctx.strokeStyle = hexA(PALETTE.legend, 0.95);
    ctx.lineWidth = 2.1;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(0, 0, 24, -1.05, 0.72);
    ctx.stroke();
    ctx.fillStyle = hexA("#eef3f7", 0.9);
    ctx.beginPath();
    ctx.arc(18, -8, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSinkCraft(ctx: CanvasRenderingContext2D, bob: number, visT: number) {
  const spin = visT * 1.8 + bob;
  ctx.save();
  ctx.shadowColor = "rgba(90,40,180,0.85)";
  ctx.shadowBlur = 18;
  const well = ctx.createRadialGradient(0, 0, 2, 0, 0, 16);
  well.addColorStop(0, "rgba(8,6,16,1)");
  well.addColorStop(0.45, "rgba(40,18,72,0.95)");
  well.addColorStop(1, "rgba(155,108,255,0.35)");
  ctx.fillStyle = well;
  ctx.beginPath();
  ctx.arc(0, 0, 13 + Math.sin(visT * 4) * 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hexA("#9b6cff", 0.7);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, 15, spin, spin + Math.PI * 1.4);
  ctx.stroke();
  ctx.strokeStyle = hexA("#3cd6cc", 0.45);
  ctx.beginPath();
  ctx.arc(0, 0, 18, -spin, -spin + Math.PI * 0.9);
  ctx.stroke();
  ctx.fillStyle = "#eef3f7";
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

function drawCompanion(ctx: CanvasRenderingContext2D, c: CompanionState, visT: number, bondLevel = 1, lookLevel = 1) {
  if (c.placedPad !== SKY_PAD) return;
  const y = c.y + Math.sin(c.bob * 3.1) * (c.home ? 2 : 5);
  const role = c.card.companion?.role ?? "hunter";
  if (c.home) {
    const bay = bayMoon(visT);
    ctx.save();
    ctx.strokeStyle = hexA(PALETTE.sage, 0.55);
    ctx.setLineDash([5, 6]);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(c.x, y);
    ctx.lineTo(bay.x, bay.y);
    ctx.stroke();
    ctx.restore();
  }
  if (c.commandT > 0 && !c.home) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, c.commandT / 0.4);
    ctx.strokeStyle = PALETTE.legend;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(c.commandX, c.commandY, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(c.commandX - 6, c.commandY);
    ctx.lineTo(c.commandX + 6, c.commandY);
    ctx.moveTo(c.commandX, c.commandY - 6);
    ctx.lineTo(c.commandX, c.commandY + 6);
    ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  if (c.home) ctx.globalAlpha = 0.72;
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(
    c.x,
    y + (role === "rocket" || role === "jet" || role === "borer" || role === "racer" || role === "ufo" || role === "spinner" ? 18 : 14),
    role === "orb" || role === "medic"
      ? 16
      : role === "rocket" || role === "jet" || role === "puck" || role === "borer" || role === "racer" || role === "ufo" || role === "spinner"
        ? 18
        : 14,
    5,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.translate(c.x, y);
  ctx.scale(1.12, 1.12);
  if ((c.levelPop ?? 0) > 0) {
    const pop = 1 + (c.levelPop ?? 0) * 0.75;
    ctx.scale(pop, pop);
    ctx.save();
    const a = c.levelPop ?? 0;
    ctx.strokeStyle = hexA("#e8c15a", 0.38 + a * 0.52);
    ctx.shadowColor = "#e8c15a";
    ctx.shadowBlur = 22 + a * 18;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, 0, 18 + a * 16 + Math.sin(visT * 18) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = hexA(PALETTE.frost, 0.4 + a * 0.4);
    ctx.shadowColor = PALETTE.frost;
    ctx.beginPath();
    ctx.arc(0, 0, 12 + a * 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if ((c.boostT ?? 0) > 0) {
    ctx.save();
    ctx.strokeStyle = hexA(PALETTE.ember, 0.9);
    ctx.shadowColor = PALETTE.ember;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, 22 + Math.sin(visT * 9) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (lookLevel >= 2) {
    ctx.save();
    ctx.strokeStyle = hexA(PALETTE.frost, 0.4 + lookLevel * 0.1);
    ctx.shadowColor = PALETTE.frost;
    ctx.shadowBlur = 10 + lookLevel * 3;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, 20 + lookLevel, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (c.trick === "wing") {
    ctx.save();
    ctx.strokeStyle = hexA("#eef3f7", 0.75);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 26 + Math.sin(visT * 5) * 1.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (c.trick === "trail") {
    ctx.save();
    ctx.fillStyle = hexA(PALETTE.ember, 0.5);
    ctx.beginPath();
    ctx.arc(-14, 6, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  const tid = c.card.templateId ?? c.card.id;
  if (tid === "comp-kelvin") {
    ctx.rotate(c.hdg * 0.18);
    ctx.shadowColor = "rgba(60,214,204,0.75)";
    ctx.shadowBlur = 14;
    drawKelvin(ctx, c.bob);
    ctx.shadowBlur = 0;
  } else if (tid === "comp-torr") {
    ctx.rotate(c.hdg);
    ctx.shadowColor = "rgba(232,193,90,0.75)";
    ctx.shadowBlur = 14;
    drawTorr(ctx, c.bob);
    ctx.shadowBlur = 0;
  } else if (tid === "comp-rook") {
    ctx.rotate(c.hdg * 0.08);
    ctx.shadowColor = "rgba(197,204,211,0.6)";
    ctx.shadowBlur = 12;
    drawRook(ctx, c.bob);
    ctx.shadowBlur = 0;
  } else if (tid === "comp-torch") {
    ctx.rotate(c.hdg);
    ctx.shadowColor = "rgba(255,92,42,0.75)";
    ctx.shadowBlur = 16;
    drawTorch(ctx, c.bob);
    ctx.shadowBlur = 0;
  } else if (tid === "comp-halo") {
    ctx.shadowColor = "rgba(66,133,244,0.7)";
    ctx.shadowBlur = 16;
    drawHaloCraft(ctx, c.bob, visT);
    ctx.shadowBlur = 0;
  } else if (tid === "comp-puck") {
    ctx.shadowColor = "rgba(227,25,55,0.55)";
    ctx.shadowBlur = 12;
    drawPuckCraft(ctx, c.bob);
    ctx.shadowBlur = 0;
  } else if (tid === "comp-chis") {
    ctx.rotate(c.hdg * 0.12);
    ctx.shadowColor = "rgba(62,207,122,0.75)";
    ctx.shadowBlur = 14;
    drawChis(ctx, c.bob);
    ctx.shadowBlur = 0;
  } else if (tid === "comp-sink" || role === "lens") {
    drawSinkCraft(ctx, c.bob, visT);
  } else if (role === "orb") {
    const hue = (visT * 90) % 360;
    ctx.shadowColor = `hsla(${hue}, 90%, 60%, 0.85)`;
    ctx.shadowBlur = 18;
    ctx.fillStyle = `hsla(${(hue + 40) % 360}, 85%, 62%, 0.95)`;
    ctx.beginPath();
    ctx.arc(0, 0, 11 + Math.sin(c.bob * 5) * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `hsla(${(hue + 180) % 360}, 80%, 70%, 0.9)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 16 + Math.sin(c.bob * 4) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(-2, -2, 4, 4);
  } else if (role === "medic") {
    ctx.shadowColor = "rgba(62,207,122,0.7)";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#143322";
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.sage;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = PALETTE.sage;
    ctx.fillRect(-2.2, -7, 4.4, 14);
    ctx.fillRect(-7, -2.2, 14, 4.4);
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(-1.2, -5, 2.4, 10);
    ctx.fillRect(-5, -1.2, 10, 2.4);
  } else if (role === "puck") {
    ctx.shadowColor = "rgba(227,25,55,0.55)";
    ctx.shadowBlur = 12;
    drawPuckCraft(ctx, c.bob);
    ctx.shadowBlur = 0;
  } else if (role === "rocket") {
    ctx.rotate(c.hdg + Math.PI / 2);
    ctx.shadowColor = "rgba(255,92,42,0.55)";
    ctx.shadowBlur = 14;
    drawBoostRocket(ctx, c.bob);
    ctx.shadowBlur = 0;
  } else if (role === "jet") {
    ctx.rotate(c.hdg + Math.PI / 2);
    ctx.shadowColor = "rgba(60,214,204,0.75)";
    ctx.shadowBlur = 16;
    drawShrikeJet(ctx, c.bob);
    ctx.shadowBlur = 0;
  } else if (role === "borer") {
    ctx.rotate(c.hdg);
    ctx.shadowColor = "rgba(155,108,255,0.7)";
    ctx.shadowBlur = 14;
    drawAuger(ctx, c.bob);
    ctx.shadowBlur = 0;
  } else if (role === "ufo" || tid === "comp-zeek") {
    ctx.shadowColor = "rgba(255,199,44,0.7)";
    ctx.shadowBlur = 16;
    drawZeek(ctx, c.bob);
    ctx.shadowBlur = 0;
  } else if (role === "racer" || tid === "comp-joule") {
    ctx.rotate(c.hdg);
    ctx.shadowColor = "rgba(227,25,55,0.65)";
    ctx.shadowBlur = 14;
    drawJoule(ctx, c.bob);
    ctx.shadowBlur = 0;
  } else if (role === "spinner" || tid === "comp-poppy") {
    ctx.shadowColor = "rgba(255,92,42,0.7)";
    ctx.shadowBlur = 16;
    drawPoppy(ctx, c.bob);
    ctx.shadowBlur = 0;
  } else if (role === "ship") {
    ctx.rotate(c.hdg * 0.2);
    const hull = ctx.createLinearGradient(-16, -8, 16, 8);
    hull.addColorStop(0, "#e8ecef");
    hull.addColorStop(0.45, "#9aa3b2");
    hull.addColorStop(1, "#12151c");
    ctx.fillStyle = hull;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(4, 10);
    ctx.lineTo(-16, 6);
    ctx.lineTo(-16, -6);
    ctx.lineTo(4, -10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#e8ecef";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = PALETTE.ember;
    ctx.fillRect(-2, -3.2, 14, 2.4);
    ctx.fillStyle = PALETTE.frost;
    ctx.fillRect(-6, 1.2, 10, 2.2);
    ctx.fillStyle = "#7ef0ea";
    ctx.beginPath();
    ctx.arc(2, 0, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hexA(PALETTE.ember, 0.85);
    ctx.beginPath();
    ctx.moveTo(-16, -4);
    ctx.lineTo(-26, 0);
    ctx.lineTo(-16, 4);
    ctx.fill();
  } else {
    ctx.rotate(c.hdg * 0.15);
    const hull = ctx.createLinearGradient(-12, -8, 12, 8);
    hull.addColorStop(0, "#ffffff");
    hull.addColorStop(0.4, "#c5ccd3");
    hull.addColorStop(1, "#1a1e28");
    ctx.fillStyle = hull;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(2, 8);
    ctx.lineTo(-12, 3);
    ctx.lineTo(-12, -3);
    ctx.lineTo(2, -8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = role === "hunter" && c.card.companion?.burnDps ? PALETTE.ember : PALETTE.accent;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = PALETTE.ember;
    ctx.fillRect(-4, -2, 12, 1.8);
    ctx.fillStyle = PALETTE.frost;
    ctx.beginPath();
    ctx.arc(1, 0, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hexA(PALETTE.ember, 0.8);
    ctx.beginPath();
    ctx.moveTo(-12, -2);
    ctx.lineTo(-20, 0);
    ctx.lineTo(-12, 2);
    ctx.fill();
  }
  if (c.bound) paintBondLook(ctx, bondLevel);
  ctx.restore();
  const name = c.card.name;
  const hpMax = Math.max(1, c.hpMax || 1);
  const hp = Math.max(0, c.hp ?? hpMax);
  ctx.save();
  ctx.font = "700 11px 'D-DIN Condensed', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = PALETTE.paper;
  ctx.fillText(name, c.x, y - (role === "rocket" || role === "jet" || role === "borer" || role === "racer" || role === "ufo" || role === "spinner" ? 26 : 22));
  const bw = 36;
  const bh = 3;
  const bx = c.x - bw / 2;
  const by = y - (role === "rocket" || role === "jet" || role === "borer" || role === "racer" || role === "ufo" || role === "spinner" ? 20 : 16);
  ctx.fillStyle = "rgba(5,6,11,0.85)";
  ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
  ctx.fillStyle = c.home ? PALETTE.sage : hp / hpMax < 0.35 ? PALETTE.ember : PALETTE.legend;
  ctx.fillRect(bx, by, bw * (hp / hpMax), bh);
  ctx.restore();
  if (c.bubble && c.bubbleT > 0) {
    ctx.save();
    ctx.globalAlpha = Math.max(0.15, Math.min(1, c.bubbleT / 0.35, 1));
    ctx.font = "700 12px 'D-DIN', sans-serif";
    const text = c.bubble;
    const tw = Math.min(220, ctx.measureText(text).width + 16);
    const bxx = c.x + 16;
    const byy = y - 34;
    ctx.fillStyle = "rgba(10,14,22,0.92)";
    ctx.strokeStyle =
      role === "orb" || role === "medic"
        ? PALETTE.sage
        : role === "puck"
          ? PALETTE.steel
          : role === "rocket"
            ? PALETTE.legend
            : role === "borer"
              ? "#9b6cff"
              : role === "ufo"
                ? "#ffc72c"
                : role === "racer"
                  ? "#e31937"
                  : role === "spinner"
                    ? "#ff5c2a"
                  : PALETTE.ember;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect?.(bxx, byy, tw, 22, 4);
    if (!ctx.roundRect) ctx.rect(bxx, byy, tw, 22);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = PALETTE.paper;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, bxx + 8, byy + 11, tw - 12);
    ctx.restore();
  }
}

function drawNades(ctx: CanvasRenderingContext2D, w: World) {
  if (!w.nades?.length) return;
  ctx.save();
  for (const n of w.nades) {
    if (!n.alive) continue;
    ctx.fillStyle = "rgba(255,92,42,0.22)";
    ctx.beginPath();
    ctx.arc(n.x, n.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.ember;
    ctx.beginPath();
    ctx.arc(n.x, n.y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.paper;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(n.x, n.y, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = hexA(PALETTE.ember, 0.5);
    ctx.beginPath();
    ctx.moveTo(n.x - n.vx * 0.12, n.y - n.vy * 0.12);
    ctx.lineTo(n.x, n.y);
    ctx.stroke();
  }
  ctx.restore();
}

function hexA(hex: string, a: number) {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function strokeCover(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  range: number,
  shape: CoverShape | undefined,
  aim: number,
  innerFrac = COVER.ringInner,
  halfArc = COVER.coneArc,
) {
  const kind = shape ?? "circle";
  ctx.beginPath();
  if (kind === "circle") {
    ctx.arc(x, y, range, 0, Math.PI * 2);
  } else if (kind === "ring") {
    const inner = range * innerFrac;
    ctx.arc(x, y, range, 0, Math.PI * 2);
    ctx.moveTo(x + inner, y);
    ctx.arc(x, y, inner, 0, Math.PI * 2, true);
  } else if (kind === "diamond") {
    const r = range * COVER.diamond;
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r, y);
    ctx.closePath();
  } else if (kind === "cone") {
    ctx.moveTo(x, y);
    ctx.arc(x, y, range, aim - halfArc, aim + halfArc);
    ctx.closePath();
  } else if (kind === "lane") {
    const c = Math.cos(aim);
    const s = Math.sin(aim);
    const halfW = range * COVER.laneHalf;
    const back = range * COVER.laneBack;
    const fwd = range * COVER.laneFwd;
    const fx = x + c * fwd;
    const fy = y + s * fwd;
    const bx = x - c * back;
    const by = y - s * back;
    const px = -s * halfW;
    const py = c * halfW;
    ctx.moveTo(bx + px, by + py);
    ctx.lineTo(fx + px, fy + py);
    ctx.lineTo(fx - px, fy - py);
    ctx.lineTo(bx - px, by - py);
    ctx.closePath();
  }
}

function paintJerseyHull(ctx: CanvasRenderingContext2D, art: string, color: string, level = 1) {
  const cut = cutForHull(art);
  const lv = Math.max(1, Math.min(4, level));
  ctx.save();
  ctx.translate(-22, -58);
  ctx.scale(0.58, 0.58);
  if (typeof Path2D === "undefined") {
    ctx.restore();
    return;
  }
  const p = new Path2D(cut.d);
  const steel = ctx.createLinearGradient(18, 4, 62, 48);
  steel.addColorStop(0, "#eef3f7");
  steel.addColorStop(0.28, color);
  steel.addColorStop(0.72, "#2a3038");
  steel.addColorStop(1, "#12151c");
  ctx.fillStyle = steel;
  ctx.strokeStyle = lv >= 4 ? "#e8c15a" : hexA("#eef3f7", 0.9);
  ctx.lineWidth = lv >= 3 ? 3.2 : 2.4;
  ctx.lineJoin = "round";
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.fill(p);
  ctx.shadowBlur = 0;
  ctx.stroke(p);
  ctx.fillStyle = hexA("#4aa8e8", 0.7);
  ctx.fillRect(37, 16, 6, 22);
  ctx.restore();
}

function drawEnemyShape(ctx: CanvasRenderingContext2D, e: Enemy, _assets: Assets | null, theme: ThemeId) {
  const r = Math.max(11, e.radius);
  const flash = e.flash > 0;
  const paint = scrapPaint(theme);
  const hull = flash ? paint.flash : paint.fill;
  const strap = e.type === "cache" ? PALETTE.ink : paint.strap;
  const limb = paint.limb;
  const long = e.type === "striker" || e.type === "titan" || e.type === "dart";
  const tall = e.type === "colossus";
  const bw = long ? r * 2.35 : r * 1.95;
  const bh = tall ? r * 1.85 : long ? r * 1.12 : r * 1.42;
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(e.hdg ?? 0);
  ctx.translate(0, Math.sin((e.anim ?? 0) * 7) * 2.2);

  ctx.fillStyle = "rgba(0,0,0,0.42)";
  ctx.beginPath();
  ctx.ellipse(0, bh * 0.48, bw * 0.48, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  const body = (ox: number, oy: number, w: number, h: number, col: string) => {
    ctx.fillStyle = col;
    ctx.strokeStyle = hexA(limb, 0.55);
    ctx.lineWidth = 1.6;
    roundRect(ctx, ox - w / 2, oy - h / 2, w, h, 3.2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = strap;
    ctx.fillRect(ox - w * 0.18, oy - h / 2, 3.2, h);
    ctx.fillRect(ox + w * 0.1, oy - h / 2, 3.2, h);
    ctx.fillStyle = hexA(paint.hi, 0.55);
    ctx.fillRect(ox - w / 2 + 3, oy - h / 2 + 3, w * 0.28, 3);
    ctx.fillStyle = hexA(limb, 0.7);
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(ox + w * 0.22, oy - 4 + i * 4, 5 - (i % 2), 2);
    }
  };

  if (e.type === "colossus") {
    body(0, -bh * 0.22, bw * 0.92, bh * 0.55, hull);
    body(0, bh * 0.28, bw, bh * 0.52, hull);
  } else if (e.type === "titan") {
    body(0, 0, bw, bh, hull);
    ctx.strokeStyle = hexA("#eef3f7", 0.25);
    ctx.lineWidth = 1.2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo((i * bw) / 6, -bh / 2 + 4);
      ctx.lineTo((i * bw) / 6, bh / 2 - 4);
      ctx.stroke();
    }
  } else if (e.type === "swarm") {
    body(-r * 0.45, r * 0.1, bw * 0.55, bh * 0.7, hull);
    body(r * 0.4, -r * 0.05, bw * 0.5, bh * 0.6, hull);
  } else if (e.type === "cache") {
    ctx.fillStyle = hexA(PALETTE.legend, 0.22);
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.45 * (1 + Math.sin(e.anim * 4) * 0.08), 0, Math.PI * 2);
    ctx.fill();
    body(0, 0, bw, bh, hull);
    ctx.strokeStyle = PALETTE.paper;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -bh * 0.22);
    ctx.lineTo(0, bh * 0.22);
    ctx.moveTo(-bw * 0.18, 0);
    ctx.lineTo(bw * 0.18, 0);
    ctx.stroke();
  } else if (e.type === "striker" || e.type === "dart") {
    ctx.fillStyle = hull;
    ctx.beginPath();
    ctx.moveTo(bw / 2, 0);
    ctx.lineTo(bw * 0.15, -bh / 2);
    ctx.lineTo(-bw / 2, -bh / 2);
    ctx.lineTo(-bw / 2, bh / 2);
    ctx.lineTo(bw * 0.15, bh / 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hexA(limb, 0.55);
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = strap;
    ctx.fillRect(-bw * 0.12, -bh / 2, 3, bh);
    ctx.fillRect(bw * 0.02, -bh / 2, 3, bh);
  } else if (e.type === "plate") {
    body(0, 0, bw, bh, hull);
    ctx.strokeStyle = hexA("#eef3f7", 0.4);
    ctx.lineWidth = 2;
    ctx.strokeRect(-bw * 0.28, -bh * 0.22, bw * 0.56, bh * 0.44);
  } else if (e.type === "medic") {
    body(0, 0, bw, bh, hull);
    ctx.strokeStyle = hexA(PALETTE.sage, 0.55);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = PALETTE.paper;
    ctx.beginPath();
    ctx.moveTo(0, -bh * 0.18);
    ctx.lineTo(0, bh * 0.18);
    ctx.moveTo(-bw * 0.16, 0);
    ctx.lineTo(bw * 0.16, 0);
    ctx.stroke();
  } else {
    body(0, 0, bw, bh, hull);
  }

  if (paint.ring) {
    ctx.strokeStyle = hexA(limb, 0.55);
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    ctx.ellipse(0, 2, bw * 0.62, bh * 0.38, -0.16, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = hexA(paint.hi, 0.35);
  ctx.fillRect(-bw * 0.42, -bh * 0.42, bw * 0.35, 4);

  const stick = e.hat ?? 0;
  ctx.fillStyle = stick === 1 ? PALETTE.frost : stick === 2 ? PALETTE.legend : stick === 3 ? PALETTE.ember : PALETTE.accent;
  ctx.fillRect(-bw * 0.22, -bh * 0.08, bw * 0.28, bh * 0.22);
  ctx.fillStyle = "#05060b";
  ctx.fillRect(-bw * 0.16, -bh * 0.02, bw * 0.16, 2);

  if (stick === 0) {
    ctx.fillStyle = "#e8c15a";
    ctx.beginPath();
    ctx.ellipse(-bw * 0.12, -bh * 0.58, 6, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff5c2a";
    ctx.beginPath();
    ctx.moveTo(-bw * 0.22, -bh * 0.58);
    ctx.lineTo(-bw * 0.38, -bh * 0.52);
    ctx.lineTo(-bw * 0.22, -bh * 0.5);
    ctx.fill();
  } else if (stick === 1) {
    ctx.fillStyle = "#eef3f7";
    ctx.beginPath();
    ctx.ellipse(0, -bh * 0.58, bw * 0.28, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#4aa8e8";
    ctx.lineWidth = 1.4;
    ctx.stroke();
  } else if (stick === 2) {
    ctx.fillStyle = hexA("#4aa8e8", 0.7);
    ctx.fillRect(-bw * 0.55, -bh * 0.2, 8, bh * 0.4);
    ctx.fillRect(bw * 0.42, -bh * 0.2, 8, bh * 0.4);
  }

  if ((e.flash ?? 0) > 0) {
    ctx.fillStyle = PALETTE.paper;
    ctx.font = "700 11px 'D-DIN Condensed', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ow", 0, -bh * 0.72);
  }

  if ((e.fold ?? 0) > 0) {
    ctx.strokeStyle = hexA(PALETTE.frost, 0.55);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, r + 5 + Math.sin(e.anim * 3) * 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  if ((e.slowT ?? 0) > 0 || (e.freezeT ?? 0) > 0) {
    const iced = (e.freezeT ?? 0) > 0;
    ctx.strokeStyle = hexA(PALETTE.frost, iced ? 0.88 : 0.52);
    ctx.lineWidth = iced ? 2.2 : 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = hexA(PALETTE.frost, iced ? 0.8 : 0.45);
    for (let i = 0; i < 3; i++) {
      const a = (e.anim ?? 0) + (i * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (r + 3), Math.sin(a) * (r * 0.7) - 4);
      ctx.lineTo(Math.cos(a) * (r + 8), Math.sin(a) * (r * 0.85));
      ctx.lineTo(Math.cos(a + 0.35) * (r + 3), Math.sin(a + 0.35) * (r * 0.7));
      ctx.closePath();
      ctx.fill();
    }
  }

  if ((e.burnT ?? 0) > 0) {
    ctx.fillStyle = hexA(PALETTE.ember, 0.7);
    for (let i = 0; i < 3; i++) {
      const a = (e.anim ?? 0) * 4 + i * 2.1;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (r * 0.7), Math.sin(a) * (r * 0.45) - 2, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, w: World, kind: "rain" | "dust" | "stars") {
  const n = kind === "stars" ? 28 : 36;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const seed = i * 97.13;
    const drift = Math.sin(w.visT * (0.31 + (i % 7) * 0.07) + i) * (12 + (i % 5) * 6);
    const speed = 0.72 + ((i * 13) % 9) * 0.08;
    if (kind === "rain") {
      const x = ((seed * 13 + w.visT * (140 + (i % 5) * 28) + drift) % (WORLD.w + 40)) - 20;
      const y = ((seed * 7 + w.visT * (320 + (i % 4) * 40)) % (WORLD.h + 40)) - 20;
      ctx.fillStyle = `rgba(220,230,240,${0.18 + (i % 4) * 0.06})`;
      ctx.fillRect(x, y, 2, 6 + (i % 3) * 2);
    } else if (kind === "dust") {
      const x = ((seed * 11 + w.visT * (18 + (i % 6) * 6) + drift) % (WORLD.w + 20)) - 10;
      const y = (seed * 5 + Math.sin(w.visT * speed + i) * (8 + (i % 4) * 3)) % WORLD.h;
      ctx.fillStyle = "rgba(200,176,140,0.18)";
      ctx.fillRect(x, y, 2 + (i % 3), 2 + (i % 3));
    } else {
      const x = (seed * 19 + drift * 0.4) % WORLD.w;
      const y = (seed * 29 + Math.sin(w.visT * 0.2 + i) * 6) % WORLD.h;
      const a = 0.1 + 0.12 * (0.5 + 0.5 * Math.sin(w.visT * (1.1 + (i % 5) * 0.3) + i));
      ctx.fillStyle = `rgba(238,243,247,${a})`;
      ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
    }
  }
  ctx.restore();
}

function drawVaultSky(ctx: CanvasRenderingContext2D, w: World) {
  if (w.vaultSun) {
    ctx.save();
    const sx = WORLD.w * 0.82;
    const sy = WORLD.h * 0.16;
    const g = ctx.createRadialGradient(sx, sy, 6, sx, sy, 220);
    g.addColorStop(0, "rgba(255,210,120,0.42)");
    g.addColorStop(0.35, "rgba(255,140,60,0.16)");
    g.addColorStop(1, "rgba(255,140,60,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WORLD.w, WORLD.h);
    ctx.fillStyle = "rgba(255,224,160,0.9)";
    ctx.beginPath();
    ctx.arc(sx, sy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  if (!w.vaultStars) return;
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const cycle = ((w.visT * (0.18 + i * 0.04) + i * 0.37) % 1);
    const x = ((i * 211 + cycle * (WORLD.w + 160)) % (WORLD.w + 160)) - 80;
    const y = 30 + ((i * 97) % (WORLD.h * 0.55));
    const hue = (i * 52 + w.visT * 40) % 360;
    ctx.strokeStyle = `hsla(${hue}, 90%, 68%, 0.55)`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 42, y + 14);
    ctx.stroke();
    ctx.fillStyle = `hsla(${hue}, 95%, 78%, 0.9)`;
    ctx.fillRect(x + 40, y + 12, 3, 3);
  }
  ctx.restore();
}

function drawMapWash(ctx: CanvasRenderingContext2D, w: World, theme: ReturnType<typeof themeAt>) {
  ctx.save();
  if (w.mapId === "map-helios" || (w.mapBurn ?? 0) > 0) {
    const g = ctx.createRadialGradient(WORLD.w * 0.5, 30, 10, WORLD.w * 0.5, 90, 560);
    g.addColorStop(0, "rgba(255,92,42,0.2)");
    g.addColorStop(1, "rgba(255,92,42,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  }
  if (w.mapId === "map-mare") {
    ctx.fillStyle = "rgba(60,214,204,0.045)";
    ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  }
  if (w.mapId === "map-void") {
    ctx.fillStyle = "rgba(8,8,16,0.18)";
    ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  }
  if (w.mapId === "map-lagrange") {
    ctx.strokeStyle = hexA(theme.glow, 0.18);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(WORLD.w * 0.5, WORLD.h * 0.52, 120, 48, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawEnvWash(ctx: CanvasRenderingContext2D, w: World) {
  if (!w.environmentId) return;
  const t = w.visT;
  ctx.save();
  if (w.environmentId === "blizzard") {
    ctx.fillStyle = "rgba(60,214,204,0.055)";
    ctx.fillRect(0, 0, WORLD.w, WORLD.h);
    for (let i = 0; i < 46; i++) {
      const x = (i * 97 + t * (55 + (i % 5) * 12) + Math.sin(t * 0.4 + i) * 18) % WORLD.w;
      const y = (i * 53 + t * (140 + (i % 4) * 20)) % WORLD.h;
      ctx.strokeStyle = "rgba(238,243,247,0.42)";
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 5, y + 16);
      ctx.stroke();
    }
  } else if (w.environmentId === "hail") {
    for (let i = 0; i < 22; i++) {
      const x = (i * 113 + t * 50) % WORLD.w;
      const y = (i * 71 + t * 160) % WORLD.h;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(0.4);
      ctx.fillStyle = "rgba(154,163,178,0.55)";
      ctx.fillRect(-3, -3, 6, 6);
      ctx.restore();
    }
  } else if (w.environmentId === "gas") {
    ctx.fillStyle = "rgba(90,140,90,0.1)";
    ctx.fillRect(0, 0, WORLD.w, WORLD.h);
    for (let i = 0; i < 6; i++) {
      const x = (i * 211 + Math.sin(t * 0.4 + i) * 40) % WORLD.w;
      const y = 120 + ((i * 97) % 420);
      ctx.fillStyle = "rgba(111,143,120,0.08)";
      ctx.beginPath();
      ctx.ellipse(x, y, 140, 70, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (w.environmentId === "pressure") {
    ctx.fillStyle = "rgba(90,140,90,0.07)";
    ctx.fillRect(0, 0, WORLD.w, WORLD.h);
    const cx = WORLD.w * 0.5;
    const cy = WORLD.h * 0.52;
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(156,163,178,${0.18 - i * 0.03})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 90 + i * 55 + Math.sin(t * 1.4) * 6, 36 + i * 18, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (w.environmentId === "static") {
    ctx.fillStyle = "rgba(118,185,0,0.05)";
    ctx.fillRect(0, 0, WORLD.w, WORLD.h);
    for (let y = 0; y < WORLD.h; y += 7) {
      ctx.fillStyle = `rgba(118,185,0,${0.04 + ((y / 7 + t * 8) % 3) * 0.03})`;
      ctx.fillRect(0, y, WORLD.w, 1.2);
    }
  } else if (w.environmentId === "ion") {
    ctx.fillStyle = "rgba(124,108,240,0.07)";
    ctx.fillRect(0, 0, WORLD.w, WORLD.h);
    for (let y = 0; y < WORLD.h; y += 10) {
      ctx.fillStyle = "rgba(124,108,240,0.08)";
      ctx.fillRect(0, y, WORLD.w, 1);
    }
    for (let i = 0; i < 20; i++) {
      const x = (i * 137 + t * 36) % WORLD.w;
      const y = (i * 89 + t * 70) % WORLD.h;
      ctx.fillStyle = "rgba(196,184,255,0.32)";
      ctx.fillRect(x, y, 2, 2);
    }
  } else if (w.environmentId === "solar") {
    const g = ctx.createRadialGradient(WORLD.w * 0.5, 40, 20, WORLD.w * 0.5, 80, 520);
    g.addColorStop(0, "rgba(255,92,42,0.18)");
    g.addColorStop(1, "rgba(255,92,42,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  } else if (w.environmentId === "slick") {
    ctx.fillStyle = "rgba(60,214,204,0.045)";
    ctx.fillRect(0, 0, WORLD.w, WORLD.h);
    ctx.strokeStyle = "rgba(238,243,247,0.16)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, WORLD.h * 0.42);
    ctx.quadraticCurveTo(WORLD.w * 0.5, WORLD.h * 0.36, WORLD.w - 40, WORLD.h * 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

export function viewTransform(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const dpr = canvas.width / Math.max(1, rect.width);
  const cssW = canvas.width / dpr;
  const cssH = canvas.height / dpr;
  const scaleW = cssW / WORLD.w;
  const scaleH = cssH / WORLD.h;
  let scale = Math.min(scaleW, scaleH);
  let ox = (cssW - WORLD.w * scale) / 2;
  let oy = (cssH - WORLD.h * scale) / 2;
  // Spawn sits near y 200. Clip empty sky before Home or the lane.
  const fitTop = 120;
  const playH = WORLD.h - fitTop;
  if (ox > 4 && playH * scaleW <= cssH + 0.5) {
    scale = scaleW;
    ox = 0;
    oy = cssH - WORLD.h * scale;
    if (oy + fitTop * scale < 0) oy = -fitTop * scale;
  }
  return { scale, ox, oy, dpr, cssW, cssH };
}

export function screenToWorld(canvas: HTMLCanvasElement, cx: number, cy: number) {
  const rect = canvas.getBoundingClientRect();
  const { scale, ox, oy } = viewTransform(canvas);
  return {
    x: (cx - rect.left - ox) / scale,
    y: (cy - rect.top - oy) / scale,
  };
}

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  w: World,
  assets: Assets | null,
) {
  const { scale, ox, oy, dpr, cssW, cssH } = viewTransform(canvas);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const shake = w.trauma * w.trauma;
  const sx = (Math.random() * 2 - 1) * shake * 8;
  const sy = (Math.random() * 2 - 1) * shake * 6;
  const theme = themeAt(w.wave, w.mapTheme);

  ctx.save();
  ctx.translate(sx, sy);
  drawSpaceBleed(ctx, cssW, cssH);
  if ((w.flashT ?? 0) > 0) {
    ctx.fillStyle = hexA("#eef3f7", Math.min(0.38, w.flashT * 1.5));
    ctx.fillRect(0, 0, cssW, cssH);
  }

  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);

  drawGround(ctx, theme, assets);
  drawVaultSky(ctx, w);
  drawMapWash(ctx, w, theme);
  drawPath(ctx, theme, w.looks?.includes("ion-path") || w.vaultPath === "ion", w.visT, w.vaultPath ?? null);
  drawBores(ctx, w, w.visT);
  drawCoverage(ctx, w, "placed");
  drawPads(ctx, w, theme.plot);
  drawGlowPuddles(ctx, w);
  drawEnvWash(ctx, w);
  drawCoverage(ctx, w, "ghost");
  if (w.phase === "placement" || w.phase === "combat" || w.phase === "shop") {
    drawParticles(ctx, w, theme.particle);
  }

  const sets = worldSets(w);
  if (w.selectedCard) {
    const item = w.roster.find((r) => r.uid === w.selectedCard);
    const stats = item
      ? combatStats(item.card, item.level, item.mod, sets, w.forge[item.card.templateId] ?? 0, {
          dmg: w.stampDmg,
          range: w.stampRange * (w.mapRangeMul ?? 1),
          rate: w.stampRate,
        }, item.tuneJob, item.tuneCap, item.jobs)
      : null;
    const pad = w.selectedPad ? padById(w.selectedPad) : null;
    if (stats && pad && item && !item.placedPad) {
      ctx.save();
      ctx.fillStyle = "rgba(255,92,42,0.12)";
      ctx.strokeStyle = "rgba(255,92,42,0.75)";
      ctx.lineWidth = 2.2;
      strokeCover(
        ctx,
        pad.x,
        pad.y,
        stats.range,
        stats.cover,
        nearestPathMeta(pad.x, pad.y).aim,
        stats.coverInner,
        stats.coverArc,
      );
      ctx.fill("evenodd");
      ctx.stroke();
      ctx.restore();
    }
  }

  const def = w.roster.find((r) => r.placedPad === HOME_PAD);
  const moon = bayMoon(w.visT);
  const moonFront = moon.y >= BASE.y + BAY_ORBIT.oy;
  if (!moonFront) drawBay(ctx, w, w.visT);
  drawCore(ctx, w.defenderAim, w.visT, def ? def.card.name : null, w.looks?.includes("gold-core"), w.stickers ?? []);
  if (moonFront) drawBay(ctx, w, w.visT);

  const drawables: { y: number; draw: () => void }[] = [];

  for (const e of w.enemies) {
    if (!e.alive) continue;
    drawables.push({
      y: e.y,
      draw: () => {
        drawEnemyShape(ctx, e, assets, theme.id);
        if (e.marked) {
          ctx.fillStyle = PALETTE.paper;
          ctx.fillRect(e.x - 3, e.y - e.radius - 10, 6, 6);
        }
        hpBar(ctx, e);
      },
    });
  }

  for (const c of w.companions ?? []) {
    if (c.placedPad !== SKY_PAD) continue;
    drawables.push({
      y: c.y,
      draw: () =>
        drawCompanion(
          ctx,
          c,
          w.visT,
          c.bound ? w.bondLevel : 0,
          craftLookLevel(c.runLevel ?? 1, !!c.bound, c.bound ? w.bondLevel ?? 1 : 1),
        ),
    });
  }

  for (const item of w.roster) {
    if (!item.placedPad || item.placedPad === HOME_PAD) continue;
    const pad = padById(item.placedPad);
    if (!pad) continue;
    if (item.card.kind === "socket") {
      drawables.push({
        y: pad.y + 1,
        draw: () => {
          ctx.fillStyle = PALETTE.frost;
          ctx.fillRect(pad.x - 7, pad.y + 10, 14, 6);
          ctx.fillStyle = PALETTE.ink;
          ctx.fillRect(pad.x - 4, pad.y + 12, 8, 2);
        },
      });
      continue;
    }
    drawables.push({
      y: pad.y,
      draw: () =>
        drawTowerShape(
          ctx,
          pad.x,
          pad.y,
          item,
          w.visT,
          w.looks?.includes("drift-orbit"),
          w.skin,
          !!(item.placedPad && w.padBuff?.[item.placedPad] > 0),
          w,
        ),
    });
  }

  drawables.sort((a, b) => a.y - b.y);
  for (const d of drawables) d.draw();
  drawFuseArrows(ctx, w);
  drawCraftDock(ctx, w);

  for (const p of w.projectiles) {
    if (!p.alive) continue;
    const col =
      p.style === "brand"
        ? "#e8c15a"
        : p.kind === "ember"
          ? PALETTE.ember
          : p.kind === "frost"
            ? PALETTE.frost
            : p.kind === "hex"
              ? PALETTE.accent
              : PALETTE.paper;
    ctx.save();
    ctx.strokeStyle = hexA(col, 0.55);
    ctx.lineWidth = p.kind === "ember" ? 2.6 : 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(p.ox ?? p.x, p.oy ?? p.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.strokeStyle = hexA(col, 0.9);
    ctx.lineWidth = 1.1;
    ctx.stroke();
    if (p.style === "brand") {
      const dx = p.tx - p.x;
      const dy = p.ty - p.y;
      const ang = Math.atan2(dy, dx);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(ang);
      ctx.fillStyle = "#e8c15a";
      ctx.fillRect(-10, -2.4, 16, 4.8);
      ctx.restore();
    } else if (p.kind === "frost") {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 6);
      ctx.lineTo(p.x + 4.2, p.y);
      ctx.lineTo(p.x, p.y + 6);
      ctx.lineTo(p.x - 4.2, p.y);
      ctx.closePath();
      ctx.fill();
    } else if (p.kind === "ember") {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === "hex") {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 4.5);
      ctx.lineTo(p.x + 4, p.y);
      ctx.lineTo(p.x, p.y + 4.5);
      ctx.lineTo(p.x - 4, p.y);
      ctx.closePath();
      ctx.fill();
    } else {
      const dx = p.tx - p.x;
      const dy = p.ty - p.y;
      const ang = Math.atan2(dy, dx);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(ang);
      ctx.fillStyle = col;
      ctx.fillRect(-7, -1.6, 12, 3.2);
      ctx.restore();
    }
    ctx.restore();
  }

  drawNades(ctx, w);

  for (const fx of w.fx) {
    const k = 1 - fx.t / fx.life;
    ctx.save();
    ctx.globalAlpha = Math.max(0, k);
    if (fx.kind === "ring") {
      ctx.strokeStyle = fx.color;
      ctx.shadowColor = fx.color;
      ctx.shadowBlur = fx.size >= 70 ? 18 : 8;
      ctx.lineWidth = fx.size >= 70 ? 4.2 : 3;
      if (fx.size >= 70) {
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.size * (1.35 - k * 0.55), 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeRect(fx.x - fx.size * (1.2 - k * 0.4), fx.y - fx.size * (1.2 - k * 0.4), fx.size * 2, fx.size * 2);
      }
      ctx.shadowBlur = 0;
    } else if (fx.kind === "mote") {
      ctx.fillStyle = fx.color;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, Math.max(0.6, fx.size * k), 0, Math.PI * 2);
      ctx.fill();
    } else if (fx.kind === "spark" || fx.kind === "smoke") {
      ctx.fillStyle = fx.color;
      ctx.fillRect(fx.x - fx.size * k, fx.y - fx.size * k, fx.size * 2 * k, fx.size * 2 * k);
    } else if (fx.kind === "beam") {
      ctx.strokeStyle = hexA(fx.color, 0.28);
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(fx.x, fx.y);
      ctx.lineTo(fx.x2 ?? fx.x, fx.y2 ?? fx.y);
      ctx.stroke();
      ctx.strokeStyle = fx.color;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(fx.x, fx.y);
      ctx.lineTo(fx.x2 ?? fx.x, fx.y2 ?? fx.y);
      ctx.stroke();
    } else if (fx.kind === "patch") {
      const r = fx.size * (0.55 + k * 0.9);
      ctx.strokeStyle = fx.color;
      ctx.lineWidth = 2.6;
      ctx.shadowColor = fx.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(fx.x - r * 0.55, fx.y);
      ctx.lineTo(fx.x + r * 0.55, fx.y);
      ctx.moveTo(fx.x, fx.y - r * 0.55);
      ctx.lineTo(fx.x, fx.y + r * 0.55);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = hexA(fx.color, 0.55);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + k * 2;
        ctx.fillRect(fx.x + Math.cos(a) * r * 0.82 - 1.6, fx.y + Math.sin(a) * r * 0.82 - 1.6, 3.2, 3.2);
      }
    } else if (fx.kind === "drop") {
      const h = fx.size * (0.35 + k * 1.15);
      const grad = ctx.createLinearGradient(fx.x, fx.y - h, fx.x, fx.y + 8);
      grad.addColorStop(0, hexA(fx.color, 0));
      grad.addColorStop(0.55, hexA(fx.color, 0.55));
      grad.addColorStop(1, hexA("#eef3f7", 0.8));
      ctx.fillStyle = grad;
      ctx.fillRect(fx.x - 3.5, fx.y - h, 7, h + 6);
      ctx.strokeStyle = hexA(fx.color, 0.7);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fx.x - 14 * (1.1 - k), fx.y);
      ctx.lineTo(fx.x, fx.y - 8);
      ctx.lineTo(fx.x + 14 * (1.1 - k), fx.y);
      ctx.stroke();
    } else if (fx.kind === "float" && fx.text) {
      const sz = Math.max(12, fx.size || 12);
      ctx.fillStyle = fx.color;
      ctx.font = `700 ${sz}px 'D-DIN Condensed', 'D-DIN', sans-serif`;
      ctx.textAlign = "center";
      ctx.shadowColor = fx.color;
      ctx.shadowBlur = sz > 16 ? 14 : 0;
      ctx.fillText(fx.text, fx.x, fx.y - (1 - k) * (18 + sz * 0.4));
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  ctx.restore();
  ctx.restore();
  drawPlacePrompt(ctx, w, { dpr, cssW, cssH, scale, oy });
}
