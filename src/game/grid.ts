/** 16×10 board. A cell is a button, a path tile, or the companion's exit. */

export const GRID_W = 16;
export const GRID_H = 10;

export type Skin = "alloy" | "road" | "dirt";
export type CellKind = "button" | "path" | "exit";
export type CompanionId = "comp-auger" | "comp-boost" | "comp-shrike";

export type Point = { x: number; y: number };

export type Grid = {
  w: number;
  h: number;
  seed: number;
  skin: Skin;
  companion: CompanionId;
  cells: CellKind[];
  path: Point[];
  entry: Point;
  exit: Point;
};

export function cellIndex(w: number, x: number, y: number) {
  return y * w + x;
}

export function cellAt(grid: Grid, x: number, y: number): CellKind | null {
  if (x < 0 || y < 0 || x >= grid.w || y >= grid.h) return null;
  return grid.cells[cellIndex(grid.w, x, y)] ?? null;
}

/** Towers only. Path and the companion's exit refuse. */
export function canPlace(grid: Grid, x: number, y: number) {
  return cellAt(grid, x, y) === "button";
}

export function gridFromPath(opts: {
  seed: number;
  skin: Skin;
  companion: CompanionId;
  path: Point[];
  w?: number;
  h?: number;
}): Grid {
  const w = opts.w ?? GRID_W;
  const h = opts.h ?? GRID_H;
  const cells: CellKind[] = Array.from({ length: w * h }, () => "button");
  const path = opts.path.map((p) => ({ x: p.x, y: p.y }));
  path.forEach((p, i) => {
    if (p.x < 0 || p.y < 0 || p.x >= w || p.y >= h) return;
    cells[cellIndex(w, p.x, p.y)] = i === path.length - 1 ? "exit" : "path";
  });
  return {
    w,
    h,
    seed: opts.seed,
    skin: opts.skin,
    companion: opts.companion,
    cells,
    path,
    entry: path[0] ?? { x: 0, y: 0 },
    exit: path[path.length - 1] ?? { x: 0, y: 0 },
  };
}

function onEdge(grid: Grid, p: Point) {
  return p.x === 0 || p.y === 0 || p.x === grid.w - 1 || p.y === grid.h - 1;
}

/** Longest run of cells walking one direction, corner included. */
export function longestStraight(path: Point[]) {
  if (path.length === 0) return 0;
  let best = 1;
  let run = 1;
  let pdx = 0;
  let pdy = 0;
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1]!;
    const cur = path[i]!;
    const dx = Math.sign(cur.x - prev.x);
    const dy = Math.sign(cur.y - prev.y);
    if (dx === pdx && dy === pdy) run += 1;
    else run = 2;
    pdx = dx;
    pdy = dy;
    if (run > best) best = run;
  }
  return best;
}

export function turnCount(path: Point[]) {
  let turns = 0;
  let pdx = 0;
  let pdy = 0;
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1]!;
    const cur = path[i]!;
    const dx = Math.sign(cur.x - prev.x);
    const dy = Math.sign(cur.y - prev.y);
    if (i > 1 && (dx !== pdx || dy !== pdy)) turns += 1;
    pdx = dx;
    pdy = dy;
  }
  return turns;
}

function craterPocket(grid: Grid) {
  const path = grid.path;
  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1]!;
    const cur = path[i]!;
    const next = path[i + 1]!;
    const inDx = Math.sign(cur.x - prev.x);
    const inDy = Math.sign(cur.y - prev.y);
    const outDx = Math.sign(next.x - cur.x);
    const outDy = Math.sign(next.y - cur.y);
    if (inDx === outDx && inDy === outDy) continue;
    const neighbors = [
      { x: cur.x + 1, y: cur.y },
      { x: cur.x - 1, y: cur.y },
      { x: cur.x, y: cur.y + 1 },
      { x: cur.x, y: cur.y - 1 },
    ];
    if (neighbors.some((n) => cellAt(grid, n.x, n.y) === "button")) return true;
  }
  return false;
}

/** Empty list means the board is legal. */
export function auditGrid(grid: Grid): string[] {
  const problems: string[] = [];
  const { path } = grid;
  if (grid.w !== GRID_W || grid.h !== GRID_H) problems.push("size");
  if (grid.cells.length !== grid.w * grid.h) problems.push("cells");
  if (path.length < 2) problems.push("short");
  const seen = new Set<string>();
  for (let i = 0; i < path.length; i++) {
    const p = path[i]!;
    if (p.x < 0 || p.y < 0 || p.x >= grid.w || p.y >= grid.h) {
      problems.push("bounds");
      continue;
    }
    const key = `${p.x},${p.y}`;
    if (seen.has(key)) problems.push("reused");
    seen.add(key);
    if (i > 0) {
      const prev = path[i - 1]!;
      const manhattan = Math.abs(p.x - prev.x) + Math.abs(p.y - prev.y);
      if (manhattan !== 1) problems.push("step");
    }
  }
  if (!onEdge(grid, grid.entry)) problems.push("entry-edge");
  if (!onEdge(grid, grid.exit)) problems.push("exit-edge");
  if (cellAt(grid, grid.exit.x, grid.exit.y) !== "exit") problems.push("exit-kind");
  for (let i = 0; i < path.length - 1; i++) {
    const p = path[i]!;
    if (cellAt(grid, p.x, p.y) !== "path") problems.push("path-kind");
  }
  let buttons = 0;
  for (let y = 0; y < grid.h; y++) {
    for (let x = 0; x < grid.w; x++) {
      if (cellAt(grid, x, y) === "button") buttons += 1;
    }
  }
  if (buttons !== grid.w * grid.h - path.length) problems.push("fill");
  if (longestStraight(path) < 4) problems.push("rail");
  if (turnCount(path) < 1) problems.push("turn");
  if (!craterPocket(grid)) problems.push("crater");
  if (canPlace(grid, grid.exit.x, grid.exit.y)) problems.push("exit-place");
  for (let i = 0; i < path.length - 1; i++) {
    const p = path[i]!;
    if (canPlace(grid, p.x, p.y)) problems.push("path-place");
  }
  return [...new Set(problems)];
}
