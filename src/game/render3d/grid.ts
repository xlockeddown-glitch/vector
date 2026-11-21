/**
 * Pure helpers for the opt-in 3D renderer. No imports on purpose: this file is
 * loaded by node:test directly (type stripping), and by the default bundle for
 * the flag check, so it must never pull in three or game modules.
 */

export type Point = { x: number; y: number };

/** World pixels per 3D tile. 1280 × 720 world → 32 × 18 tiles. */
export const TILE_PX = 40;
/** A tile is path when its centre is within this many world px of the lane. */
export const PATH_HALF_PX = 24;
/** Path tops sit this far below ground tops (2 voxels of 16 per tile). */
export const PATH_SINK = 2 / 16;

/** True only for an explicit `?render=3d` query param. Everything else is 2D. */
export function wants3d(search: string | null | undefined): boolean {
  if (!search) return false;
  try {
    return new URLSearchParams(search).get("render")?.trim().toLowerCase() === "3d";
  } catch {
    return false;
  }
}

/** World pixels → 3D tile units on the ground plane. World +x → +X, world +y → +Z. */
export function worldToTile(x: number, y: number, tile = TILE_PX): { x: number; z: number } {
  return { x: x / tile, z: y / tile };
}

/** Centre of grid cell (col, row) in tile units. */
export function cellCenter(col: number, row: number): { x: number; z: number } {
  return { x: col + 0.5, z: row + 0.5 };
}

function segDist(px: number, py: number, a: Point, b: Point): number {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const len2 = vx * vx + vy * vy;
  let t = len2 ? ((px - a.x) * vx + (py - a.y) * vy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (a.x + vx * t), py - (a.y + vy * t));
}

export type TileGrid = {
  cols: number;
  rows: number;
  /** 1 = path tile, 0 = ground. Row-major: index = row * cols + col. */
  path: Uint8Array;
};

/** Rasterise lane polylines (world px) onto a tile grid covering the world rect. */
export function buildTileGrid(
  paths: readonly (readonly Point[])[],
  worldW: number,
  worldH: number,
  tile = TILE_PX,
  halfWidth = PATH_HALF_PX,
): TileGrid {
  const cols = Math.max(1, Math.ceil(worldW / tile));
  const rows = Math.max(1, Math.ceil(worldH / tile));
  const path = new Uint8Array(cols * rows);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = (col + 0.5) * tile;
      const cy = (row + 0.5) * tile;
      let hit = false;
      for (const lane of paths) {
        for (let i = 1; i < lane.length && !hit; i++) {
          if (segDist(cx, cy, lane[i - 1]!, lane[i]!) <= halfWidth) hit = true;
        }
        if (hit) break;
      }
      if (hit) path[row * cols + col] = 1;
    }
  }
  return { cols, rows, path };
}

/** Small stable string hash, used to pick a placeholder mesh per tower kind. */
export function kindIndex(id: string, count: number): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return count > 0 ? (h >>> 0) % count : 0;
}
