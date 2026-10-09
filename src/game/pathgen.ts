import { mulberry32, randInt } from "./rng";
import {
  GRID_H,
  GRID_W,
  auditGrid,
  gridFromPath,
  type CompanionId,
  type Grid,
  type Point,
  type Skin,
} from "./grid";

const SKINS: Skin[] = ["alloy", "road", "dirt"];

export function skinOf(seed: number): Skin {
  return SKINS[Math.abs(seed) % SKINS.length] ?? "alloy";
}

function walk(path: Point[], to: Point) {
  const last = path[path.length - 1];
  if (!last) {
    path.push({ x: to.x, y: to.y });
    return;
  }
  const dx = Math.sign(to.x - last.x);
  const dy = Math.sign(to.y - last.y);
  if (dx !== 0 && dy !== 0) throw new Error("diagonal walk");
  if (dx === 0 && dy === 0) return;
  let x = last.x;
  let y = last.y;
  while (x !== to.x || y !== to.y) {
    x += dx;
    y += dy;
    path.push({ x, y });
  }
}

/**
 * One orthogonal path from the left edge to a companion on the right edge.
 * Same seed, same board. Throws if the result fails audit.
 */
export function buildGrid(
  seed: number,
  opts?: { skin?: Skin; companion?: CompanionId },
): Grid {
  const rng = mulberry32(seed);
  const entryY = randInt(rng, 1, GRID_H - 2);
  let exitY = randInt(rng, 1, GRID_H - 2);
  const companion = opts?.companion ?? "comp-auger";
  const skin = opts?.skin ?? skinOf(seed);
  const path: Point[] = [{ x: 0, y: entryY }];

  if (entryY === exitY) {
    const midY = entryY <= 2 ? entryY + 2 : entryY - 2;
    const x1 = 3;
    const x2 = 5;
    walk(path, { x: x1, y: entryY });
    walk(path, { x: x1, y: midY });
    walk(path, { x: x2, y: midY });
    walk(path, { x: x2, y: entryY });
    walk(path, { x: GRID_W - 2, y: entryY });
    walk(path, { x: GRID_W - 1, y: entryY });
  } else {
    const x1 = 3;
    walk(path, { x: x1, y: entryY });
    walk(path, { x: x1, y: exitY });
    walk(path, { x: GRID_W - 2, y: exitY });
    walk(path, { x: GRID_W - 1, y: exitY });
  }

  const grid = gridFromPath({ seed, skin, companion, path });
  const problems = auditGrid(grid);
  if (problems.length) throw new Error(`seed ${seed}: ${problems.join(",")}`);
  return grid;
}
