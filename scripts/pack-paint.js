/** Shared camera for the grid pack. Every picture uses the same light and the same foot. */
globalThis.paintPack = function paintPack(ctx, kind) {
  const c = ctx.canvas;
  ctx.clearRect(0, 0, c.width, c.height);
  const foot = footOf(kind);
  if (kind === "pad" || kind === "pad-hot" || kind === "exit") plate(ctx, foot, kind);
  else if (kind === "grunt" || kind === "swift" || kind === "plate" || kind === "swarm") troop(ctx, foot, kind);
  else if (kind === "auger" || kind === "boost" || kind === "shrike") ship(ctx, foot, kind);
  else tower(ctx, foot, kind);
};

function footOf(kind) {
  if (kind === "pad" || kind === "pad-hot" || kind === "exit") return { x: 84, y: 48 };
  if (kind === "grunt" || kind === "swift" || kind === "plate" || kind === "swarm") return { x: 80, y: 86 };
  if (kind === "auger" || kind === "boost" || kind === "shrike") return { x: 110, y: 108 };
  return { x: 120, y: 250 };
}

function ramp(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [t, color] of stops) g.addColorStop(t, color);
  return g;
}

function poly(ctx, pts, style) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fillStyle = style;
  ctx.fill();
}

function prism(ctx, cx, cy, hw, hh, tall, roof, left, right) {
  poly(ctx, [
    { x: cx - hw, y: cy },
    { x: cx, y: cy + hh },
    { x: cx, y: cy + hh - tall },
    { x: cx - hw, y: cy - tall },
  ], ramp(ctx, cx - hw, cy - tall, cx, cy + hh, [[0, left[0]], [1, left[1]]]));
  poly(ctx, [
    { x: cx + hw, y: cy },
    { x: cx, y: cy + hh },
    { x: cx, y: cy + hh - tall },
    { x: cx + hw, y: cy - tall },
  ], ramp(ctx, cx, cy - tall, cx + hw, cy + hh, [[0, right[0]], [1, right[1]]]));
  poly(ctx, [
    { x: cx, y: cy - hh - tall },
    { x: cx + hw, y: cy - tall },
    { x: cx, y: cy + hh - tall },
    { x: cx - hw, y: cy - tall },
  ], ramp(ctx, cx - hw, cy - hh - tall, cx + hw, cy - tall, [[0, roof[0]], [0.55, roof[1]], [1, roof[2] || roof[1]]]));
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - hh - tall);
  ctx.lineTo(cx - hw, cy - tall);
  ctx.lineTo(cx - hw, cy);
  ctx.stroke();
}

function contact(ctx, x, y, rx) {
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(x + 6, y + 8, rx, rx * 0.36, 0, 0, Math.PI * 2);
  ctx.fill();
}

function lamp(ctx, x, y, r, color) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
  g.addColorStop(0, "#fff");
  g.addColorStop(0.35, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function plate(ctx, foot, kind) {
  const top = kind === "exit" ? "#6a58b0" : kind === "pad-hot" ? "#9ff6f0" : "#8b98ab";
  const mid = kind === "exit" ? "#2a2150" : kind === "pad-hot" ? "#1a4a48" : "#243044";
  const edge = kind === "exit" ? "#100c20" : "#070b12";
  poly(ctx, [
    { x: foot.x, y: foot.y - 36 },
    { x: foot.x + 72, y: foot.y },
    { x: foot.x, y: foot.y + 36 },
    { x: foot.x - 72, y: foot.y },
  ], ramp(ctx, foot.x - 72, foot.y - 36, foot.x + 72, foot.y + 36, [[0, top], [0.42, mid], [1, edge]]));
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function cone(ctx, x, y, rx, ry, tall, light, mid, dark) {
  ctx.beginPath();
  ctx.moveTo(x, y - tall);
  ctx.lineTo(x - rx, y);
  ctx.quadraticCurveTo(x, y + ry, x, y);
  ctx.closePath();
  ctx.fillStyle = dark;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y - tall);
  ctx.lineTo(x + rx, y);
  ctx.quadraticCurveTo(x, y + ry, x, y);
  ctx.closePath();
  ctx.fillStyle = ramp(ctx, x, y - tall, x + rx, y, [[0, light], [1, mid]]);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI);
  ctx.fillStyle = dark;
  ctx.fill();
}

function disc(ctx, x, y, rx, ry, top, edge) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = ramp(ctx, x - rx, y - ry, x + rx, y + ry, [[0, top], [1, edge]]);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function dome(ctx, x, y, rx, ry, light, mid, dark) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, Math.PI, 0);
  ctx.quadraticCurveTo(x + rx * 0.2, y - ry * 1.7, x, y - ry * 1.55);
  ctx.quadraticCurveTo(x - rx * 0.2, y - ry * 1.7, x - rx, y);
  ctx.fillStyle = ramp(ctx, x - rx, y - ry * 1.6, x + rx, y, [[0, light], [0.5, mid], [1, dark]]);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI);
  ctx.fillStyle = dark;
  ctx.fill();
}

function capsule(ctx, x, y, len, rad, light, dark) {
  ctx.beginPath();
  ctx.ellipse(x, y, rad, rad * 0.55, 0, 0, Math.PI * 2);
  ctx.ellipse(x + len, y - len * 0.18, rad, rad * 0.55, 0, 0, Math.PI * 2);
  ctx.fillStyle = dark;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y - rad * 0.45);
  ctx.lineTo(x + len, y - len * 0.18 - rad * 0.45);
  ctx.lineTo(x + len, y - len * 0.18 + rad * 0.45);
  ctx.lineTo(x, y + rad * 0.45);
  ctx.closePath();
  ctx.fillStyle = ramp(ctx, x, y - rad, x, y + rad, [[0, light], [1, dark]]);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + len, y - len * 0.18, rad * 0.72, rad * 0.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = light;
  ctx.fill();
}

function tower(ctx, foot, kind) {
  const x = foot.x;
  const y = foot.y;
  contact(ctx, x, y, kind === "rail" || kind === "crater" ? 58 : 36);
  if (kind === "lance") {
    disc(ctx, x, y, 34, 14, "#d7e4ef", "#141c2a");
    cone(ctx, x, y - 4, 22, 10, 92, "#d9fffb", "#147a78", "#062220");
    cone(ctx, x, y - 96, 8, 4, 48, "#ffffff", "#7ef6ee", "#0c3030");
    lamp(ctx, x, y - 148, 14, "#7ef6ee");
  } else if (kind === "halo") {
    disc(ctx, x, y, 28, 12, "#8b98ab", "#070b12");
    cone(ctx, x, y - 2, 10, 6, 36, "#9aa8ba", "#243044", "#070b12");
    ctx.save();
    ctx.strokeStyle = "#7ef6ee";
    ctx.lineWidth = 10;
    ctx.shadowColor = "#7ef6ee";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.ellipse(x, y - 78, 48, 18, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#eef3f7";
    ctx.beginPath();
    ctx.ellipse(x, y - 78, 48, 18, 0, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.restore();
    lamp(ctx, x, y - 78, 8, "#7ef6ee");
  } else if (kind === "crater") {
    disc(ctx, x, y + 4, 62, 24, "#6a4030", "#140804");
    dome(ctx, x, y, 52, 22, "#ffd0b0", "#e07040", "#4a180e");
    ctx.beginPath();
    ctx.ellipse(x, y - 28, 18, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#1a0804";
    ctx.fill();
    lamp(ctx, x, y - 30, 14, "#ffb089");
  } else if (kind === "rail") {
    disc(ctx, x, y + 2, 64, 22, "#8b98ab", "#070b12");
    capsule(ctx, x - 10, y - 16, 78, 11, "#eef3f7", "#3d4b60");
    capsule(ctx, x - 10, y - 2, 78, 11, "#d7e4ef", "#141c2a");
    lamp(ctx, x + 70, y - 30, 6, "#eef3f7");
  } else {
    disc(ctx, x, y, 26, 11, "#c4a15a", "#1a1408");
    ctx.strokeStyle = "#a8842e";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x, y - 78);
    ctx.stroke();
    lamp(ctx, x, y - 96, 26, "#ffe08a");
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y - 96, 16, 16, 0, Math.PI * 1.1, Math.PI * 1.7);
    ctx.stroke();
  }
}

function troop(ctx, foot, kind) {
  contact(ctx, foot.x, foot.y, 28);
  const body = kind === "swift" ? "#147a78" : kind === "plate" ? "#8b98ab" : kind === "swarm" ? "#c43a16" : "#3d4b60";
  const light = kind === "swift" ? "#7ef6ee" : kind === "plate" ? "#eef3f7" : kind === "swarm" ? "#ffb089" : "#d7e4ef";
  hull(ctx, foot.x, foot.y - 8, kind === "plate" ? 1.15 : kind === "swarm" ? 0.72 : 0.95, body, light);
}

function ship(ctx, foot, kind) {
  contact(ctx, foot.x, foot.y, 40);
  const body = kind === "boost" ? "#c43a16" : kind === "shrike" ? "#1f8f52" : "#6a48c4";
  const light = kind === "boost" ? "#ffb089" : kind === "shrike" ? "#8dffb8" : "#d4c4ff";
  hull(ctx, foot.x, foot.y - 16, 1.7, body, light);
  lamp(ctx, foot.x + 28, foot.y - 22, 8, light);
}

function hull(ctx, x, y, scale, body, light) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const g = ctx.createLinearGradient(-28, -18, 30, 12);
  g.addColorStop(0, light);
  g.addColorStop(0.45, body);
  g.addColorStop(1, "#070b12");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(34, 0);
  ctx.quadraticCurveTo(6, -22, -30, -6);
  ctx.quadraticCurveTo(-12, 4, -30, 8);
  ctx.quadraticCurveTo(4, 14, 34, 0);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.beginPath();
  ctx.ellipse(-4, -6, 7, 3, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
