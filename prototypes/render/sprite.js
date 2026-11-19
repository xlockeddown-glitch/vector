import {
  buildScene, PITCH, YAW, PALETTE, STAR, key, hex, faceAO, shade
} from './voxels.js';

const started = performance.now();
const data = buildScene();
const canvas = document.querySelector('#scene');
const ctx = canvas.getContext('2d');
const W = 1280, H = 800, SCALE = 5.8;
const target = { x: 39.5, y: 7, z: 39.5 };
const sinP = Math.sin(PITCH), cosP = Math.cos(PITCH);
const sinY = Math.sin(YAW), cosY = Math.cos(YAW);

// Same orthographic basis, target, framing, and world scale as version A.
function project(p) {
  return {
    x: SCALE * (cosY * p.x - sinY * p.z),
    y: SCALE * (sinP * (sinY * p.x + cosY * p.z) - cosP * p.y)
  };
}
const targetScreen = project(target);
const origin = { x: W / 2 - targetScreen.x, y: H / 2 - targetScreen.y };
function screen(p) {
  const q = project(p);
  return { x: q.x + origin.x, y: q.y + origin.y };
}
function depth(v) {
  return cosP * (sinY * v.x + cosY * v.z) + sinP * v.y;
}
const faces = [
  { normal: [0, 0, 1], factor: 0.8, corners:
    [[-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]] },
  { normal: [1, 0, 0], factor: 0.6, corners:
    [[0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5]] },
  { normal: [0, 1, 0], factor: 1, corners:
    [[-0.5, 0.5, -0.5], [-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5]] }
];
function polygon(context, points, color) {
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) context.lineTo(points[i].x, points[i].y);
  context.closePath();
  context.fillStyle = color;
  context.fill();
}
function rasterize(voxels, occupancy) {
  const projected = voxels.map(project);
  const left = Math.floor(Math.min(...projected.map(p => p.x)) - 10);
  const top = Math.floor(Math.min(...projected.map(p => p.y)) - 10);
  const right = Math.ceil(Math.max(...projected.map(p => p.x)) + 10);
  const bottom = Math.ceil(Math.max(...projected.map(p => p.y)) + 10);
  const image = document.createElement('canvas');
  image.width = right - left;
  image.height = bottom - top;
  const context = image.getContext('2d');
  const sorted = [...voxels].sort((a, b) => depth(a) - depth(b) ||
    a.y - b.y || a.x - b.x || a.z - b.z);
  for (const v of sorted) for (const face of faces) {
    const [nx, ny, nz] = face.normal;
    if (occupancy.has(key(v.x + nx, v.y + ny, v.z + nz))) continue;
    const points = face.corners.map(([dx, dy, dz]) => {
      const p = project({ x: v.x + dx, y: v.y + dy, z: v.z + dz });
      return { x: p.x - left, y: p.y - top };
    });
    const ao = faceAO(v, face.normal, occupancy);
    polygon(context, points, hex(shade(v.color, face.factor, ao)));
  }
  return { image, left, top };
}

// Patch and model have distinct caches. Tower coordinates are local to its anchor.
const patchSprite = rasterize(data.patch, data.occupancy);
const localTower = data.tower.map(v => ({
  ...v, x: v.x - data.anchor.x, y: v.y - data.anchor.y, z: v.z - data.anchor.z
}));
// Translate full occupancy as well, preserving AO and base/ground contact.
const localOccupancy = new Set([...data.occupancy].map(k => {
  const [x, y, z] = k.split(',').map(Number);
  return key(x - data.anchor.x, y - data.anchor.y, z - data.anchor.z);
}));
const towerSprite = rasterize(localTower, localOccupancy);

const sky = ctx.createLinearGradient(0, 0, 0, H);
sky.addColorStop(0, hex(PALETTE.skyTop));
sky.addColorStop(0.53, hex(PALETTE.skyMiddle));
sky.addColorStop(1, hex(PALETTE.skyBottom));
ctx.fillStyle = sky;
ctx.fillRect(0, 0, W, H);
ctx.drawImage(patchSprite.image, origin.x + patchSprite.left, origin.y + patchSprite.top);

// Draw a soft, upper-left-key cast shadow into a separate layer, clipped to
// actual visible top faces. It cannot spill into the sky or across island sides.
const shadowLayer = document.createElement('canvas');
shadowLayer.width = W; shadowLayer.height = H;
const shadow = shadowLayer.getContext('2d');
shadow.filter = 'blur(7px)';
const shadowPoints = [
  { x: 49, y: 0.6, z: 34 }, { x: 63, y: 0.6, z: 34 },
  { x: 78, y: 0.6, z: 24 }, { x: 70, y: 0.6, z: 19 }
].map(screen);
polygon(shadow, shadowPoints, 'rgba(58,43,92,0.35)');
shadow.filter = 'none';
shadow.globalCompositeOperation = 'destination-in';
shadow.fillStyle = '#fff';
shadow.beginPath();
for (const v of data.patch) {
  if (data.occupancy.has(key(v.x, v.y + 1, v.z))) continue;
  const points = faces[2].corners.map(([dx, dy, dz]) =>
    screen({ x: v.x + dx, y: v.y + dy, z: v.z + dz }));
  shadow.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) shadow.lineTo(points[i].x, points[i].y);
  shadow.closePath();
}
shadow.fill();
ctx.drawImage(shadowLayer, 0, 0);

const anchor = screen(data.anchor);
ctx.drawImage(towerSprite.image, anchor.x + towerSprite.left, anchor.y + towerSprite.top);

const bulb = screen(data.bulb);
const halo = ctx.createRadialGradient(bulb.x, bulb.y, 0, bulb.x, bulb.y, 36);
halo.addColorStop(0, '#dce2ffcc');
halo.addColorStop(0.3, '#7c8cff88');
halo.addColorStop(1, '#7c8cff00');
ctx.fillStyle = halo;
ctx.fillRect(bulb.x - 36, bulb.y - 36, 72, 72);

const arcPoints = data.arc.map(screen);
function strokeArc(color, width, blur = 0) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'miter';
  ctx.shadowColor = hex(PALETTE.glow);
  ctx.shadowBlur = blur;
  ctx.beginPath();
  ctx.moveTo(arcPoints[0].x, arcPoints[0].y);
  for (const p of arcPoints.slice(1)) ctx.lineTo(p.x, p.y);
  ctx.stroke();
  ctx.restore();
}
strokeArc('#7c8cff66', SCALE * 2.2, 12);
strokeArc('#aeb7ff', SCALE * 0.65);

function drawStar(position) {
  const p = screen(position);
  const pixel = SCALE;
  const left = p.x - 3.5 * pixel, top = p.y - 3.5 * pixel;
  ctx.fillStyle = hex(PALETTE.starOutline);
  for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
    if (STAR[y][x] === '#') {
      ctx.fillRect(left + x * pixel, top + y * pixel, 3 * pixel, 3 * pixel);
    }
  }
  ctx.fillStyle = hex(PALETTE.cyan);
  for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
    if (STAR[y][x] === '#') {
      ctx.fillRect(left + (x + 1) * pixel, top + (y + 1) * pixel, pixel, pixel);
    }
  }
}
for (const star of data.stars) drawStar(star);

document.querySelector('#status').textContent =
  `${data.voxels.length.toLocaleString()} surface voxels · two cached sprites · ` +
  `${Math.round(performance.now() - started)} ms initial generation · 1280×800`;
window.__ready = true;
