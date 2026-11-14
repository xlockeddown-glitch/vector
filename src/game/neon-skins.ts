/**
 * Gun finish decorations for the neon look. Drawn around the gun base, which sits
 * at (0, 9) with radius ~26 in the caller's transform. "stock" draws nothing.
 * Kept cheap: a few arcs and lines per frame, one shadow pass at most.
 */

const BASE_Y = 9;
const R = 26;

function hsl(h: number, s: number, l: number, a = 1) {
  return `hsla(${((h % 360) + 360) % 360},${s}%,${l}%,${a})`;
}

function ring(ctx: CanvasRenderingContext2D, r: number, rx = r, ry = r * 0.32) {
  ctx.beginPath();
  ctx.ellipse(0, BASE_Y, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
}

export function paintGunSkin(ctx: CanvasRenderingContext2D, skinId: string, color: string, t: number): void {
  if (skinId === "stock" || !skinId) return;
  ctx.save();
  ctx.lineCap = "round";
  switch (skinId) {
    case "synthwave": {
      // Magenta to orange rim, with three sunset slats across the base.
      const g = ctx.createLinearGradient(-R, 0, R, 0);
      g.addColorStop(0, "#ff3dd0");
      g.addColorStop(1, "#ff9a3c");
      ctx.strokeStyle = g;
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(255,61,208,0.6)";
      ctx.shadowBlur = 8;
      ring(ctx, R);
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) {
        const y = BASE_Y - 4 + i * 4;
        const half = Math.sqrt(Math.max(0, 1 - ((y - BASE_Y) / (R * 0.32)) ** 2)) * R * 0.85;
        ctx.strokeStyle = i === 1 ? "#ff9a3c" : "#ff3dd0";
        ctx.beginPath();
        ctx.moveTo(-half, y);
        ctx.lineTo(half, y);
        ctx.stroke();
      }
      break;
    }
    case "circuit": {
      // Green rim with ticks that run out from the base. One pulse travels a trace.
      ctx.strokeStyle = "#5cff7a";
      ctx.lineWidth = 1.4;
      ring(ctx, R);
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.85;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        const x0 = Math.cos(a) * (R + 1);
        const y0 = BASE_Y + Math.sin(a) * (R * 0.32 + 1);
        const x1 = Math.cos(a) * (R + 6);
        const y1 = y0 + (Math.sin(a) > 0 ? 4 : -4);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x1 + (Math.cos(a) > 0 ? 3 : -3), y1);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const p = (t * 0.8) % 1;
      const a = p * Math.PI * 2;
      ctx.fillStyle = "#c6ffd2";
      ctx.beginPath();
      ctx.arc(Math.cos(a) * R, BASE_Y + Math.sin(a) * R * 0.32, 1.6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "prism": {
      // Rim hue cycles over time, with three facet lines.
      const h = (t * 60) % 360;
      ctx.strokeStyle = hsl(h, 100, 70);
      ctx.lineWidth = 2;
      ring(ctx, R);
      ctx.strokeStyle = hsl(h + 120, 100, 70, 0.7);
      ctx.lineWidth = 1;
      ring(ctx, R * 0.6, R * 0.6, R * 0.6 * 0.32);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + t * 0.5;
        ctx.strokeStyle = hsl(h + i * 120, 100, 75, 0.8);
        ctx.beginPath();
        ctx.moveTo(0, BASE_Y);
        ctx.lineTo(Math.cos(a) * R, BASE_Y + Math.sin(a) * R * 0.32);
        ctx.stroke();
      }
      break;
    }
    case "ghost": {
      // Pale dashed outline that flickers and fades in and out.
      const flick = 0.45 + 0.25 * Math.sin(t * 5) + 0.2 * Math.sin(t * 17) * Math.sin(t * 3.1);
      ctx.globalAlpha = Math.max(0.15, Math.min(0.9, flick));
      ctx.strokeStyle = "#dfe8f5";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 5]);
      ctx.lineDashOffset = -t * 12;
      ring(ctx, R + 2);
      ctx.setLineDash([]);
      ctx.globalAlpha = Math.max(0.1, flick * 0.4);
      ctx.fillStyle = "#dfe8f5";
      ctx.beginPath();
      ctx.ellipse(0, BASE_Y, R * 0.7, R * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "holo": {
      // Two offset rims in cyan and magenta, with a shimmer band that sweeps around.
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = "rgba(127,245,255,0.8)";
      ctx.beginPath();
      ctx.ellipse(-0.8, BASE_Y - 0.8, R, R * 0.32, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,120,230,0.8)";
      ctx.beginPath();
      ctx.ellipse(0.8, BASE_Y + 0.8, R, R * 0.32, 0, 0, Math.PI * 2);
      ctx.stroke();
      const shift = ((t * 0.6) % 1) * R * 2 - R;
      const g = ctx.createLinearGradient(shift - 10, 0, shift + 10, 0);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.5, "rgba(255,255,255,0.85)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 2.2;
      ring(ctx, R);
      break;
    }
    case "nova": {
      // Gold rim with a pulsing starburst behind it.
      ctx.strokeStyle = "#ffd46b";
      ctx.lineWidth = 1.8;
      ctx.shadowColor = "rgba(255,212,107,0.7)";
      ctx.shadowBlur = 8;
      ring(ctx, R);
      ctx.shadowBlur = 0;
      const pulse = 0.75 + 0.25 * Math.sin(t * 4);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255,230,160,0.9)";
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + t * 0.3;
        const inner = R * 0.9;
        const outer = R * (1.15 + 0.25 * pulse) + (i % 2) * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * inner, BASE_Y + Math.sin(a) * inner * 0.32);
        ctx.lineTo(Math.cos(a) * outer, BASE_Y + Math.sin(a) * outer * 0.32);
        ctx.stroke();
      }
      break;
    }
    default:
      // Unknown ids fall back to a plain rim in the caller's colour.
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ring(ctx, R);
  }
  ctx.restore();
}
