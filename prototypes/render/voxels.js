export const VOXEL = 1 / 16;
export const PITCH = 35 * Math.PI / 180;
export const YAW = 45 * Math.PI / 180;
export const PALETTE = Object.freeze({
  skyTop: 0xB7A6E6, skyMiddle: 0xE7C3E3, skyBottom: 0xFFD8C0,
  key: 0xFFF1D6, ambient: 0xCBBBF0, shadow: 0x3A2B5C,
  path: 0xE0C794, pathShadow: 0xB89A68, pathHighlight: 0xF2E2BC,
  curb: 0x746044, grass: 0x5FA83F, grassHighlight: 0xA8DC6E,
  dirt: 0x5A4630, stone: 0x6B6F80, cyan: 0x3FD0F5,
  purple: 0x8A6FC2, purpleShadow: 0x56408A,
  copper: 0xC9773E, glow: 0x7C8CFF, starOutline: 0x2B2338
});
export const STAR = ['..#..', '..#..', '#####', '.###.', '.#.#.'];
export const key = (x, y, z) => `${x},${y},${z}`;
export const hex = color => `#${color.toString(16).padStart(6, '0')}`;

export function rgb(color) {
  return [(color >> 16) & 255, (color >> 8) & 255, color & 255];
}
export function pack(channels) {
  return channels.reduce((n, c) => (n << 8) | Math.round(Math.max(0, Math.min(255, c))), 0);
}
// Change HSL lightness by a relative +/-6%, retaining hue.
function noisy(color, random) {
  const channels = rgb(color);
  const lightness = (Math.min(...channels) + Math.max(...channels)) / 510;
  const target = lightness * (0.94 + random() * 0.12);
  if (target < lightness) return pack(channels.map(c => c * target / lightness));
  const factor = (1 - target) / (1 - lightness);
  return pack(channels.map(c => 255 - (255 - c) * factor));
}
export function shade(color, multiplier = 1, ao = 0) {
  const lavender = rgb(PALETTE.ambient);
  return pack(rgb(color).map((c, i) =>
    c * multiplier * (1 - ao) * (1 - ao * 0.2) + lavender[i] * ao * 0.2));
}
// Face-local crevice test; ordinary coplanar neighbors do not produce AO.
export function faceAO(v, normal, occupancy) {
  const axes = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const tangents = axes.filter(a => a.every((c, i) => !c || !normal[i]));
  let count = 0;
  for (const t of tangents) for (const sign of [-1, 1]) {
    if (occupancy.has(key(
      v.x + normal[0] + t[0] * sign,
      v.y + normal[1] + t[1] * sign,
      v.z + normal[2] + t[2] * sign
    ))) count++;
  }
  return count ? Math.min(0.25, 0.15 + count * 0.025) : 0;
}

export function buildScene() {
  let seed = 0x56454354;
  const random = () => {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
  const cells = new Map();
  const put = (x, y, z, color, group = 'patch') =>
    cells.set(key(x, y, z), { x, y, z, color, group });
  const pathTiles = new Set(['0,1', '1,1', '2,1', '2,2', '2,3', '2,4']);
  const isPath = (x, z) => pathTiles.has(`${Math.floor(x / 16)},${Math.floor(z / 16)}`);
  const within = (x, z) => x >= 0 && x < 80 && z >= 0 && z < 80;
  const directions = [[1, 0, 0], [-1, 0, 0], [0, 1, 0],
    [0, -1, 0], [0, 0, 1], [0, 0, -1]];

  // Construct a solid temporarily; only boundary voxels are returned.
  for (let y = -31; y <= 0; y++) {
    const inset = Math.floor(Math.max(0, -y - 3) * 0.55);
    for (let x = inset; x < 80 - inset; x++) {
      for (let z = inset; z < 80 - inset; z++) {
        const path = isPath(x, z);
        if (path && y > -2) continue;
        let color = PALETTE.dirt;
        if (y === 0) {
          const curb = [[1, 0], [-1, 0], [0, 1], [0, -1]]
            .some(([dx, dz]) => within(x + dx, z + dz) && isPath(x + dx, z + dz));
          color = curb ? PALETTE.curb : PALETTE.grass;
          if (!curb && ((x * 17 + z * 31) % 71 < 5)) color = PALETTE.grassHighlight;
        } else if (path && y === -2) {
          // Four-voxel cobbles, with staggered joints one voxel wide.
          const joint = z % 4 === 0 || (x + (Math.floor(z / 4) % 2) * 2) % 4 === 0;
          color = joint ? PALETTE.pathShadow :
            ((x * 7 + z * 11) % 13 < 2 ? PALETTE.pathHighlight : PALETTE.path);
        } else if (!path && y === -1) color = PALETTE.curb;
        put(x, y, z, color);
      }
    }
  }

  const anchor = { x: 55.5, y: 0.5, z: 39.5, tile: [3, 2] };
  const towerPut = (x, y, z, color) => put(x, y, z, color, 'tower');
  for (let y = 1; y <= 2; y++) for (let x = 48; x < 64; x++) {
    for (let z = 32; z < 48; z++) {
      const trim = y === 2 && (x === 48 || x === 63 || z === 32 || z === 47);
      towerPut(x, y, z, trim ? PALETTE.cyan : PALETTE.stone);
    }
  }
  for (let y = 3; y <= 42; y++) {
    const radius = y >= 40 ? 2 : 7 - Math.min(4, Math.floor((y - 3) / 7));
    const band = y % 7 === 0 || y >= 40;
    for (let x = 48; x < 64; x++) for (let z = 32; z < 48; z++) {
      const r = Math.hypot(x - anchor.x, z - anchor.z);
      if (r > radius + (band ? 0.7 : 0.2)) continue;
      const recessed = !band && y % 7 === 1;
      towerPut(x, y, z, band ? PALETTE.copper :
        recessed ? PALETTE.purpleShadow : PALETTE.purple);
    }
  }
  for (let y = 43; y <= 48; y++) for (let x = 52; x <= 59; x++) {
    for (let z = 36; z <= 43; z++) {
      if (((x - anchor.x) ** 2 + (z - anchor.z) ** 2) / 10 +
          ((y - 45.5) / 3) ** 2 <= 1) towerPut(x, y, z, PALETTE.copper);
    }
  }

  for (const [x, z, flower] of [[8, 8, true], [23, 8, false], [68, 12, true],
    [72, 58, false], [13, 58, true], [62, 68, true], [10, 72, false]]) {
    if (isPath(x, z)) continue;
    put(x, 1, z, PALETTE.grassHighlight);
    put(x, 2, z, flower ? 0xF4BFDD : PALETTE.grassHighlight);
  }

  const occupancy = new Set(cells.keys());
  const patch = [], tower = [];
  for (const v of cells.values()) {
    if (directions.every(([dx, dy, dz]) => occupancy.has(key(v.x + dx, v.y + dy, v.z + dz)))) {
      continue;
    }
    const voxel = { x: v.x, y: v.y, z: v.z, color: noisy(v.color, random) };
    (v.group === 'tower' ? tower : patch).push(voxel);
  }
  const bulb = { x: anchor.x, y: 47, z: anchor.z };
  const arc = [
    bulb, { x: 51, y: 39, z: 43 }, { x: 52, y: 34, z: 46 },
    { x: 44, y: 27, z: 45 }, { x: 46, y: 21, z: 50 },
    { x: 39, y: 13, z: 49 }, { x: 41, y: 7, z: 53 },
    { x: 38, y: -1.4, z: 54 }
  ];
  // Seven-pixel outlined stars: bottom at y=54.5, six voxels above the bulb top.
  const stars = [-8, 0, 8].map(offset => ({
    x: anchor.x + offset / Math.SQRT2,
    y: 58,
    z: anchor.z - offset / Math.SQRT2
  }));
  const voxels = [...patch, ...tower];
  if (voxels.length >= 60000) throw new Error('Surface voxel budget exceeded');
  return { voxels, patch, tower, occupancy, anchor, bulb, arc, stars };
}
