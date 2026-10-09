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

function tower(ctx, foot, kind) {
  const x = foot.x;
  const y = foot.y;
  contact(ctx, x, y, kind === "crater" || kind === "rail" ? 52 : 40);
  if (kind === "lance") {
    prism(ctx, x, y, 36, 16, 18, ["#d7e4ef", "#6a7c90", "#243044"], ["#8b98ab", "#141c2a"], ["#243044", "#070b12"]);
    prism(ctx, x, y - 18, 18, 10, 78, ["#bffff8", "#147a78", "#0c3030"], ["#1a9a96", "#0c3030"], ["#0c3030", "#070b12"]);
    prism(ctx, x, y - 96, 8, 5, 28, ["#ffffff", "#7ef6ee", "#147a78"], ["#7ef6ee", "#0c3030"], ["#0c3030", "#070b12"]);
    lamp(ctx, x, y - 132, 16, "#7ef6ee");
  } else if (kind === "halo") {
    prism(ctx, x, y, 40, 18, 48, ["#d7e4ef", "#3d4b60", "#141c2a"], ["#5a7088", "#141c2a"], ["#1a2433", "#070b12"]);
    ctx.strokeStyle = "#7ef6ee";
    ctx.lineWidth = 6;
    ctx.shadowColor = "#7ef6ee";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(x, y - 78, 36, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    lamp(ctx, x, y - 78, 10, "#7ef6ee");
  } else if (kind === "crater") {
    prism(ctx, x, y, 56, 24, 36, ["#ffb089", "#c43a16", "#4a180e"], ["#e07040", "#4a180e"], ["#4a180e", "#070b12"]);
    ctx.beginPath();
    ctx.ellipse(x, y - 40, 22, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = ramp(ctx, x - 22, y - 50, x + 22, y - 30, [[0, "#fff2c4"], [0.4, "#ffb089"], [1, "#c43a16"]]);
    ctx.fill();
    lamp(ctx, x, y - 42, 12, "#ffb089");
  } else if (kind === "rail") {
    prism(ctx, x, y, 58, 22, 28, ["#eef3f7", "#8b98ab", "#243044"], ["#b7c4d4", "#243044"], ["#1a2433", "#070b12"]);
    prism(ctx, x + 28, y - 18, 26, 7, 8, ["#ffffff", "#d7e4ef", "#8b98ab"], ["#d7e4ef", "#3d4b60"], ["#3d4b60", "#070b12"]);
    lamp(ctx, x + 56, y - 26, 7, "#eef3f7");
  } else {
    prism(ctx, x, y, 30, 14, 16, ["#ffe08a", "#a8842e", "#3a3014"], ["#c4a15a", "#3a3014"], ["#3a3014", "#070b12"]);
    prism(ctx, x, y - 16, 7, 4, 70, ["#ffe08a", "#a8842e", "#3a3014"], ["#a8842e", "#3a3014"], ["#3a3014", "#070b12"]);
    lamp(ctx, x, y - 100, 22, "#ffe08a");
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
