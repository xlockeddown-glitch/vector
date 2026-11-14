/**
 * Neon vector look. Everything on the board is a glowing outline on near-black:
 * cyan for your side, magenta for enemies, element colors only where they mean something.
 * render.ts calls these when NEON_LOOK is on; flip it off to get the old painted look back.
 */
import type { CompanionState } from "./data/companion";
import type { Enemy } from "./sim";

export const NEON_LOOK = true;

export const NEON = {
  bg: "#04050a",
  friend: "#3cf2ff",
  foe: "#ff3d9a",
  gold: "#ffd46b",
  heat: "#ff7a3c",
  cold: "#7ecbff",
  white: "#eef6ff",
};

export function rgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function poly(ctx: CanvasRenderingContext2D, n: number, r: number, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** Outline with glow plus a faint fill of the same color. */
function glowStroke(ctx: CanvasRenderingContext2D, color: string, width = 2, blur = 10, fillA = 0.08) {
  if (fillA > 0) {
    ctx.fillStyle = rgba(color, fillA);
    ctx.fill();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

/** Moons and gun bases: a dark disc with a thin neon rim. */
export function neonMoon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rim: string, lit: boolean, ring = false) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "#070a12";
  ctx.fill();
  ctx.strokeStyle = lit ? rim : rgba(NEON.friend, 0.32);
  ctx.lineWidth = lit ? 1.8 : 1.2;
  ctx.shadowColor = lit ? rim : "transparent";
  ctx.shadowBlur = lit ? 10 : 0;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
  ctx.strokeStyle = lit ? rim : NEON.friend;
  ctx.globalAlpha = lit ? 0.35 : 0.14;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.globalAlpha = 1;
  if (ring) {
    ctx.beginPath();
    ctx.ellipse(x, y, r + 6, r * 0.32, -0.16, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(NEON.gold, lit ? 0.55 : 0.25);
    ctx.stroke();
  }
  ctx.restore();
}

/** Home: nested rotating hexes and a core. */
export function neonHome(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, gold = false, hit = 0) {
  const c = hit > 0 ? NEON.foe : gold ? NEON.gold : NEON.friend;
  ctx.save();
  ctx.translate(x, y - 30);
  ctx.save();
  ctx.rotate(t * 0.25);
  poly(ctx, 6, 46);
  glowStroke(ctx, c, 2.4, 18, 0.06);
  ctx.restore();
  ctx.save();
  ctx.rotate(-t * 0.4);
  poly(ctx, 6, 32);
  glowStroke(ctx, c, 1.6, 10, 0);
  ctx.restore();
  const p = 0.75 + Math.sin(t * 2.2) * 0.15;
  ctx.beginPath();
  ctx.arc(0, 0, 13 * p + 4, 0, Math.PI * 2);
  glowStroke(ctx, hit > 0 ? NEON.foe : NEON.white, 2, 16, 0.25);
  if (hit > 0) {
    // Magenta flash over the hexes, fading with the hit timer.
    const k = Math.min(1, hit / 0.45);
    ctx.save();
    ctx.globalAlpha = k * 0.5;
    poly(ctx, 6, 46 + (1 - k) * 8);
    ctx.fillStyle = NEON.foe;
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

const FOE_SHAPE: Record<string, { sides: number; spin: number; inner?: boolean; color?: string }> = {
  grunt: { sides: 3, spin: 0 },
  striker: { sides: 3, spin: 0 },
  dart: { sides: 3, spin: 0 },
  swarm: { sides: 4, spin: 2 },
  plate: { sides: 4, spin: 0, inner: true },
  medic: { sides: 4, spin: 0.6 },
  colossus: { sides: 6, spin: 0.3, inner: true },
  titan: { sides: 8, spin: 0.25, inner: true },
  cache: { sides: 12, spin: 0.8, color: NEON.gold },
};

/** Enemies: magenta outlines; shape says what it is, inner color says what's on it. */
export function neonEnemy(ctx: CanvasRenderingContext2D, e: Enemy, t: number) {
  const s = FOE_SHAPE[e.type] ?? FOE_SHAPE.grunt!;
  let col = s.color ?? NEON.foe;
  if ((e.flash ?? 0) > 0) col = NEON.white;
  const r = e.radius;
  ctx.save();
  // Spawn-in: scale and fade over ~0.25s.
  const spawnK = e.age == null ? 1 : Math.min(1, e.age / 0.25);
  if (spawnK < 1) {
    ctx.globalAlpha *= spawnK;
    ctx.translate(e.x, e.y);
    const sc = 0.4 + 0.6 * (1 - (1 - spawnK) * (1 - spawnK));
    ctx.scale(sc, sc);
    ctx.translate(-e.x, -e.y);
  }
  ctx.save();
  ctx.translate(e.x, e.y);
  const pointy = s.sides === 3;
  const rot = pointy ? e.hdg ?? 0 : t * s.spin + (e.anim ?? 0) * 0.1;
  ctx.rotate(rot);
  if (e.type === "striker" || e.type === "dart") {
    // Thin chevron: fast.
    ctx.beginPath();
    ctx.moveTo(r * 1.2, 0);
    ctx.lineTo(-r * 0.8, r * 0.75);
    ctx.lineTo(-r * 0.35, 0);
    ctx.lineTo(-r * 0.8, -r * 0.75);
    ctx.closePath();
  } else {
    poly(ctx, s.sides, r, pointy ? 0 : Math.PI / s.sides);
  }
  const frozen = (e.freezeT ?? 0) > 0 || (e.slowT ?? 0) > 0;
  const burning = (e.burnT ?? 0) > 0;
  glowStroke(ctx, col, e.type === "titan" || e.type === "colossus" ? 2.6 : 1.8, 10, frozen ? 0 : 0.1);
  if (frozen) {
    ctx.fillStyle = rgba(NEON.cold, 0.32);
    ctx.fill();
  }
  if (s.inner) {
    poly(ctx, s.sides, r * 0.55, Math.PI / s.sides);
    ctx.strokeStyle = rgba(col, 0.6);
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  if (e.type === "cache") {
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, 0);
    ctx.lineTo(r * 0.4, 0);
    ctx.moveTo(0, -r * 0.4);
    ctx.lineTo(0, r * 0.4);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
  if (burning) {
    ctx.save();
    ctx.strokeStyle = rgba(NEON.heat, 0.55 + Math.sin(t * 14 + e.x) * 0.25);
    ctx.lineWidth = 1.4;
    ctx.shadowColor = NEON.heat;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(e.x, e.y, r + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

/** Crafts: cyan delta-wing, with a role mark inside. Points along its heading. */
export function neonCraft(ctx: CanvasRenderingContext2D, c: CompanionState, role: string, t: number) {
  const col = NEON.friend;
  ctx.save();
  ctx.rotate((c.hdg ?? 0) + Math.PI / 2);
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(12, 12);
  ctx.lineTo(0, 6);
  ctx.lineTo(-12, 12);
  ctx.closePath();
  glowStroke(ctx, col, 2, 12, 0.1);
  // Engine glow.
  ctx.fillStyle = rgba(col, 0.55 + Math.sin(t * 20) * 0.2);
  ctx.fillRect(-2, 8, 4, 6 + Math.sin(t * 24) * 2);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = rgba(NEON.white, 0.85);
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  if (role === "medic") {
    ctx.moveTo(-4, 0);
    ctx.lineTo(4, 0);
    ctx.moveTo(0, -4);
    ctx.lineTo(0, 4);
  } else if (role === "orb" || role === "lens" || role === "spinner") {
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
  } else {
    ctx.moveTo(-3, 2);
    ctx.lineTo(0, -3);
    ctx.lineTo(3, 2);
  }
  ctx.stroke();
  ctx.restore();
}

/** Short engine trail: a few recent positions, fading. */
const TRAILS = new WeakMap<object, { x: number; y: number; t: number }[]>();
export function neonCraftTrail(ctx: CanvasRenderingContext2D, key: object, x: number, y: number, t: number) {
  let tr = TRAILS.get(key);
  if (!tr) {
    tr = [];
    TRAILS.set(key, tr);
  }
  const last = tr[tr.length - 1];
  if (last && (t < last.t || (x - last.x) ** 2 + (y - last.y) ** 2 > 80 * 80)) tr.length = 0;
  if (!tr.length || t - tr[tr.length - 1]!.t >= 0.045) {
    tr.push({ x, y, t });
    if (tr.length > 7) tr.shift();
  }
  while (tr.length && t - tr[0]!.t > 0.32) tr.shift();
  if (tr.length < 2) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.globalCompositeOperation = "lighter";
  for (let i = 1; i < tr.length; i++) {
    const a = tr[i - 1]!;
    const b = tr[i]!;
    const k = i / tr.length;
    ctx.strokeStyle = rgba(NEON.friend, 0.45 * k);
    ctx.lineWidth = 1 + 3 * k;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();
}

/** Gun juice: detects a shot (cooldown jumps up), returns recoil offset and records a muzzle flash. */
const GUN_STATE = new WeakMap<object, { cd: number; kick: number; ang: number; at: number }>();
export const MUZZLE_FLASHES: { x: number; y: number; ang: number; t: number }[] = [];
export function neonGunJuice(ctx: CanvasRenderingContext2D, item: { cd: number; aim?: number }, x: number, y: number, t: number) {
  let st = GUN_STATE.get(item);
  if (!st) {
    st = { cd: item.cd ?? 0, kick: -9, ang: 0, at: t };
    GUN_STATE.set(item, st);
  }
  if ((item.cd ?? 0) > st.cd + 0.01) {
    st.kick = t;
    st.ang = item.aim ?? -Math.PI / 2;
    if (MUZZLE_FLASHES.length < 24) MUZZLE_FLASHES.push({ x, y: y - 8, ang: st.ang, t });
  }
  st.cd = item.cd ?? 0;
  const age = t - st.kick;
  if (age >= 0 && age < 0.12) {
    const k = 1 - age / 0.12;
    ctx.translate(-Math.cos(st.ang) * 3 * k, -Math.sin(st.ang) * 3 * k);
  }
  // Idle: slow subtle pulse of the base ring.
  ctx.save();
  ctx.strokeStyle = rgba(NEON.friend, 0.07 + 0.07 * (0.5 + 0.5 * Math.sin(t * 1.6 + x * 0.02)));
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 8, 27 + Math.sin(t * 1.6 + x * 0.02) * 1.2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** Draws pending muzzle flashes (additive, ~0.09s) and drops expired ones. */
export function drawMuzzleFlashes(ctx: CanvasRenderingContext2D, t: number) {
  for (let i = MUZZLE_FLASHES.length - 1; i >= 0; i--) {
    const f = MUZZLE_FLASHES[i]!;
    const age = t - f.t;
    if (age < 0 || age > 0.09) {
      MUZZLE_FLASHES.splice(i, 1);
      continue;
    }
    const k = 1 - age / 0.09;
    ctx.save();
    ctx.translate(f.x + Math.cos(f.ang) * 18, f.y + Math.sin(f.ang) * 18);
    ctx.rotate(f.ang);
    ctx.strokeStyle = rgba(NEON.white, 0.9 * k);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.lineTo(10 * k + 3, 0);
    ctx.moveTo(0, -3 * k);
    ctx.lineTo(6 * k, -6 * k);
    ctx.moveTo(0, 3 * k);
    ctx.lineTo(6 * k, 6 * k);
    ctx.stroke();
    ctx.restore();
  }
}
