/**
 * Opt-in 3D render slice (`?render=3d`). Loaded ONLY through dynamic import()
 * so three.js lands in its own chunk and never ships in the default bundle.
 *
 * Read-only view of the live sim: every frame it reads the same World the 2D
 * renderer reads (roster, enemies, lane) and mirrors it as voxel-ish blocks.
 * Camera follows docs/art-direction.md §2: orthographic, pitch 35°, yaw 45° fixed.
 */
import * as THREE from "three";
import { ENEMIES, HOME_PAD, MAX_TOWERS, WORLD } from "../constants";
import { PATHS } from "../data/map";
import { ELEMENTS } from "../data/elements";
import { towerPoint, type World } from "../sim";
import type { EnemyType } from "../types";
import { buildTileGrid, kindIndex, PATH_SINK, TILE_PX, worldToTile, type TileGrid } from "./grid";

const PITCH = (35 * Math.PI) / 180;
const YAW = (45 * Math.PI) / 180;
const MAX_DPR = 2;
const MAX_POOL_CAP = 4096;

/** Palette from prototypes/render/voxels.js (art-direction v3). sRGB hex. */
const PAL = {
  grass: 0x5fa83f,
  grassAlt: 0x6bb349,
  path: 0xe0c794,
  pathAlt: 0xd6bb86,
  stone: 0x6b6f80,
  purple: 0x8a6fc2,
  copper: 0xc9773e,
  cyan: 0x3fd0f5,
  bone: 0xe9e2d0,
};

/** Flat face shading: top 100%, screen-left 80%, screen-right 60% (+Z is screen-left at this yaw). */
const KEY = new THREE.Color("#FFF1D6");
const FILL = new THREE.Color("#CBBBF0");
function faceTint(factor: number, tint: THREE.Color, amount: number): THREE.Color {
  const t = new THREE.Color(1, 1, 1).lerp(tint.clone().convertLinearToSRGB(), amount);
  return new THREE.Color().setRGB(t.r * factor, t.g * factor, t.b * factor, THREE.SRGBColorSpace);
}
const TOP = faceTint(1, KEY, 0.2);
const LEFT = faceTint(0.8, FILL, 0.15);
const RIGHT = faceTint(0.6, FILL, 0.3);

/** Bake top/left/right face factors into a geometry as vertex colours. */
function shaded<G extends THREE.BufferGeometry>(geometry: G): G {
  const normals = geometry.getAttribute("normal");
  const colors = new Float32Array(normals.count * 3);
  for (let i = 0; i < normals.count; i++) {
    const nx = normals.getX(i);
    const ny = normals.getY(i);
    const nz = normals.getZ(i);
    const c = ny > 0.5 ? TOP : nz >= nx ? LEFT : RIGHT;
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

/** Unit-footprint shapes, base at y=0, height 1. Scaled per instance. */
function placeholderShapes(): THREE.BufferGeometry[] {
  const lift = (g: THREE.BufferGeometry) => g.translate(0, 0.5, 0);
  return [
    shaded(lift(new THREE.BoxGeometry(0.8, 1, 0.8))),
    shaded(lift(new THREE.CylinderGeometry(0.4, 0.4, 1, 8))),
    shaded(lift(new THREE.CylinderGeometry(0.12, 0.45, 1, 4))),
    shaded(lift(new THREE.CylinderGeometry(0.3, 0.45, 1, 6))),
  ];
}

const ENEMY_SHAPE: Record<EnemyType, number> = {
  grunt: 0,
  striker: 2,
  plate: 0,
  swarm: 1,
  colossus: 0,
  titan: 3,
  cache: 1,
  dart: 2,
  medic: 1,
  shard: 2,
  warden: 3,
  blink: 2,
  jammer: 3,
};
const ENEMY_COLOR: Record<EnemyType, number> = {
  grunt: 0xc8443c,
  striker: 0x7b4fc9,
  plate: 0x8e8c99,
  swarm: 0xa6e22e,
  colossus: 0x8a8794,
  titan: 0x5a4f73,
  cache: 0xf2c14e,
  dart: 0xff7aa8,
  medic: 0xe9e2d0,
  shard: 0x7ecbff,
  warden: 0x6b6f80,
  blink: 0xb05cc8,
  jammer: 0xc9773e,
};

type Pool = { mesh: THREE.InstancedMesh; cap: number; n: number };

export type Render3D = { dispose: () => void };
export type Render3DOptions = { onContextLost?: () => void };

/**
 * Mount a three.js view on `canvas`. `getWorld` is read every frame.
 * Returns a handle whose dispose() stops the loop and frees every GPU resource.
 */
export function mountRender3D(
  canvas: HTMLCanvasElement,
  getWorld: () => World | null | undefined,
  options?: Render3DOptions,
): Render3D {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
  const owned: { dispose: () => void }[] = [];
  const pools: Pool[] = [];
  let tiles: THREE.InstancedMesh | null = null;
  let raf = 0;
  let alive = true;
  let disposed = false;
  let ro: ResizeObserver | null = null;
  let resizeHandler: (() => void) | null = null;
  let contextLostHandler: ((e: Event) => void) | null = null;

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    alive = false;
    cancelAnimationFrame(raf);
    ro?.disconnect();
    ro = null;
    if (resizeHandler) {
      window.removeEventListener("resize", resizeHandler);
      resizeHandler = null;
    }
    if (contextLostHandler) {
      canvas.removeEventListener("webglcontextlost", contextLostHandler);
      contextLostHandler = null;
    }
    if (tiles) {
      tiles.dispose();
      tiles = null;
    }
    for (const p of pools) p.mesh.dispose();
    pools.length = 0;
    for (const o of owned) o.dispose();
    owned.length = 0;
    scene.clear();
    renderer.dispose();
  };

  try {
    renderer.setClearColor(0, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;

    const own = <T extends { dispose: () => void }>(x: T): T => {
      owned.push(x);
      return x;
    };

    const material = own(new THREE.MeshBasicMaterial({ vertexColors: true }));
    const tileGeo = own(shaded(new THREE.BoxGeometry(1, 1, 1).translate(0.5, -0.5, 0.5)));
    const shapes = placeholderShapes().map(own);
    const towerBase = own(shaded(new THREE.BoxGeometry(1, 2 / 16, 1).translate(0, 1 / 16, 0)));

    const matrix = new THREE.Matrix4();
    const copyMatrix = new THREE.Matrix4();
    const color = new THREE.Color();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);

    // ---- Tiles: rebuilt only when the lane layout object changes.
    let tilePaths: unknown = null;
    let grid: TileGrid | null = null;
    const buildTiles = () => {
      if (tiles) {
        scene.remove(tiles);
        tiles.dispose();
      }
      grid = buildTileGrid(PATHS, WORLD.w, WORLD.h);
      const count = grid.cols * grid.rows;
      tiles = new THREE.InstancedMesh(tileGeo, material, count);
      let i = 0;
      for (let row = 0; row < grid.rows; row++) {
        for (let col = 0; col < grid.cols; col++) {
          const isPath = grid.path[row * grid.cols + col] === 1;
          const top = isPath ? -PATH_SINK : 0;
          matrix.makeTranslation(col, top, row);
          tiles.setMatrixAt(i, matrix);
          // No per-tile element data exists in map/sim, so paths stay neutral cobble.
          const alt = (col + row) % 2 === 1;
          color.setHex(isPath ? (alt ? PAL.pathAlt : PAL.path) : alt ? PAL.grassAlt : PAL.grass);
          tiles.setColorAt(i, color);
          i++;
        }
      }
      tiles.instanceMatrix.needsUpdate = true;
      if (tiles.instanceColor) tiles.instanceColor.needsUpdate = true;
      tiles.computeBoundingSphere();
      scene.add(tiles);
      tilePaths = PATHS;
      fitCamera();
    };

    // ---- Dynamic pools (towers, tower bases, enemies). Grow by doubling up to MAX_POOL_CAP.
    const makePool = (geo: THREE.BufferGeometry, cap: number): Pool => {
      const mesh = new THREE.InstancedMesh(geo, material, cap);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.count = 0;
      mesh.frustumCulled = false;
      scene.add(mesh);
      const pool = { mesh, cap, n: 0 };
      pools.push(pool);
      return pool;
    };
    const push = (pool: Pool, m: THREE.Matrix4, hex: number) => {
      if (pool.n >= pool.cap) {
        if (pool.cap >= MAX_POOL_CAP) return;
        const nextCap = Math.min(pool.cap * 2, MAX_POOL_CAP);
        const next = new THREE.InstancedMesh(pool.mesh.geometry, material, nextCap);
        next.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        next.count = 0;
        next.frustumCulled = false;
        for (let k = 0; k < pool.n; k++) {
          pool.mesh.getMatrixAt(k, copyMatrix);
          next.setMatrixAt(k, copyMatrix);
          pool.mesh.getColorAt(k, color);
          next.setColorAt(k, color);
        }
        next.instanceColor?.setUsage(THREE.DynamicDrawUsage);
        scene.remove(pool.mesh);
        pool.mesh.dispose();
        scene.add(next);
        pool.mesh = next;
        pool.cap = nextCap;
      }
      pool.mesh.setMatrixAt(pool.n, m);
      pool.mesh.setColorAt(pool.n, color.setHex(hex));
      if (pool.mesh.instanceColor && pool.mesh.instanceColor.usage !== THREE.DynamicDrawUsage) {
        pool.mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
      }
      pool.n++;
    };
    const towerPools = shapes.map((g) => makePool(g, MAX_TOWERS + 2));
    const basePool = makePool(towerBase, MAX_TOWERS + 2);
    const enemyPools = shapes.map((g) => makePool(g, 64));

    // ---- Camera: fixed 3/4 view; frustum fitted to the map box plus tower height.
    const fitCamera = () => {
      const cols = grid?.cols ?? WORLD.w / TILE_PX;
      const rows = grid?.rows ?? WORLD.h / TILE_PX;
      const target = new THREE.Vector3(cols / 2, 0, rows / 2);
      const dir = new THREE.Vector3(Math.sin(YAW) * Math.cos(PITCH), Math.sin(PITCH), Math.cos(YAW) * Math.cos(PITCH));
      camera.position.copy(target).addScaledVector(dir, 100);
      camera.up.set(0, 1, 0);
      camera.lookAt(target);
      camera.updateMatrixWorld();
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      const v = new THREE.Vector3();
      for (const x of [0, cols]) {
        for (const y of [-1, 2.5]) {
          for (const z of [0, rows]) {
            v.set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
            minX = Math.min(minX, v.x);
            maxX = Math.max(maxX, v.x);
            minY = Math.min(minY, v.y);
            maxY = Math.max(maxY, v.y);
          }
        }
      }
      const w = Math.max(1, canvas.clientWidth);
      const h = Math.max(1, canvas.clientHeight);
      const aspect = w / h;
      const pad = 1.04;
      let halfW = ((maxX - minX) / 2) * pad;
      let halfH = ((maxY - minY) / 2) * pad;
      if (halfW / halfH > aspect) halfH = halfW / aspect;
      else halfW = halfH * aspect;
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      camera.left = cx - halfW;
      camera.right = cx + halfW;
      camera.top = cy + halfH;
      camera.bottom = cy - halfH;
      camera.updateProjectionMatrix();
    };

    const resize = () => {
      const w = Math.max(1, canvas.clientWidth);
      const h = Math.max(1, canvas.clientHeight);
      renderer.setPixelRatio(Math.min(MAX_DPR, window.devicePixelRatio || 1));
      renderer.setSize(w, h, false);
      fitCamera();
    };
    ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resizeHandler = resize;
    window.addEventListener("resize", resize);

    const onContextLost = () => {
      alive = false;
      cancelAnimationFrame(raf);
      options?.onContextLost?.();
    };
    contextLostHandler = onContextLost;
    canvas.addEventListener("webglcontextlost", onContextLost);

    // ---- Per-frame sync from sim state.
    const sync = (w: World) => {
      for (const p of pools) p.n = 0;

      for (const item of w.roster) {
        if (!item.placedPad) continue;
        if (item.card.kind !== "tower" && item.card.kind !== "defender") continue;
        const at = towerPoint(item);
        if (!at) continue;
        const t = worldToTile(at.x, at.y);
        const home = item.placedPad === HOME_PAD;
        const shape = kindIndex(item.card.templateId ?? item.card.id, towerPools.length);
        const defaultTint = home ? PAL.copper : PAL.purple;
        const infuseColor = item.infuse ? ELEMENTS[item.infuse]?.color : undefined;
        const tint = infuseColor ? parseInt(infuseColor.slice(1), 16) : defaultTint;
        const ground = grid && isPathAt(grid, t.x, t.z) ? -PATH_SINK : 0;
        // ~2 tiles tall, ~0.9 tile footprint; base slab carries a cyan trim tone.
        matrix.compose(pos.set(t.x, ground, t.z), quat.identity(), scl.set(0.9, 1, 0.9));
        push(basePool, matrix, home ? PAL.copper : PAL.cyan);
        matrix.compose(pos.set(t.x, ground + 2 / 16, t.z), quat.identity(), scl.set(1, home ? 2.4 : 2, 1));
        push(towerPools[shape]!, matrix, tint);
      }

      for (const e of w.enemies) {
        if (!e.alive) continue;
        const def = ENEMIES[e.type];
        const t = worldToTile(e.x, e.y);
        const size = Math.max(0.3, ((e.radius ?? def?.radius ?? 16) * 2) / TILE_PX);
        const ground = grid && isPathAt(grid, t.x, t.z) ? -PATH_SINK : 0;
        quat.setFromAxisAngle(up, -(e.hdg ?? 0));
        matrix.compose(pos.set(t.x, ground, t.z), quat, scl.set(size, size * 0.8, size));
        push(enemyPools[ENEMY_SHAPE[e.type] ?? 0]!, matrix, ENEMY_COLOR[e.type] ?? PAL.bone);
      }

      for (const p of pools) {
        p.mesh.count = p.n;
        if (p.n > 0) {
          p.mesh.instanceMatrix.needsUpdate = true;
          if (p.mesh.instanceColor) p.mesh.instanceColor.needsUpdate = true;
        }
      }
    };

    const frame = () => {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      try {
        if (tilePaths !== PATHS) buildTiles();
        const w = getWorld();
        if (w) sync(w);
        renderer.render(scene, camera);
      } catch (err) {
        console.warn("vector 3d frame", err);
      }
    };

    resize();
    buildTiles();
    raf = requestAnimationFrame(frame);

    return { dispose };
  } catch (err) {
    dispose();
    throw err;
  }
}

function isPathAt(grid: TileGrid, x: number, z: number): boolean {
  const col = Math.floor(x);
  const row = Math.floor(z);
  if (col < 0 || row < 0 || col >= grid.cols || row >= grid.rows) return false;
  return grid.path[row * grid.cols + col] === 1;
}
