import assert from "node:assert/strict";
import { test } from "node:test";
// grid.ts has no imports and only erasable TS syntax, so Node's type stripping loads it directly.
import {
  buildTileGrid,
  cellCenter,
  kindIndex,
  TILE_PX,
  wants3d,
  worldToTile,
} from "../src/game/render3d/grid.ts";

test("wants3d is on only for an explicit ?render=3d", () => {
  assert.equal(wants3d("?render=3d"), true);
  assert.equal(wants3d("?foo=1&render=3D"), true);
  assert.equal(wants3d("render=3d"), true);
  assert.equal(wants3d(""), false);
  assert.equal(wants3d(null), false);
  assert.equal(wants3d(undefined), false);
  assert.equal(wants3d("?render=2d"), false);
  assert.equal(wants3d("?render"), false);
  assert.equal(wants3d("?render3d=1"), false);
});

test("worldToTile maps world px onto the XZ ground plane", () => {
  assert.deepEqual(worldToTile(0, 0), { x: 0, z: 0 });
  assert.deepEqual(worldToTile(TILE_PX * 3, TILE_PX * 2), { x: 3, z: 2 });
  assert.deepEqual(worldToTile(20, 60, 40), { x: 0.5, z: 1.5 });
  assert.deepEqual(cellCenter(4, 7), { x: 4.5, z: 7.5 });
});

test("buildTileGrid covers the world and marks only tiles near the lane", () => {
  const lane = [
    { x: 0, y: 60 },
    { x: 200, y: 60 },
  ];
  const g = buildTileGrid([lane], 200, 120, 40, 24);
  assert.equal(g.cols, 5);
  assert.equal(g.rows, 3);
  assert.equal(g.path.length, 15);
  // Row 1 centres sit at y=60, on the lane; rows 0 and 2 centres are 40 px away.
  for (let col = 0; col < 5; col++) {
    assert.equal(g.path[0 * 5 + col], 0);
    assert.equal(g.path[1 * 5 + col], 1);
    assert.equal(g.path[2 * 5 + col], 0);
  }
});

test("buildTileGrid rounds partial tiles up and handles no lanes", () => {
  const g = buildTileGrid([], 1280, 720, 40);
  assert.equal(g.cols, 32);
  assert.equal(g.rows, 18);
  assert.ok(g.path.every((v) => v === 0));
  assert.equal(buildTileGrid([], 41, 1, 40).cols, 2);
});

test("kindIndex is stable and in range", () => {
  assert.equal(kindIndex("tower-a", 4), kindIndex("tower-a", 4));
  for (const id of ["a", "b", "gun-rail", "gun-flak", ""]) {
    const i = kindIndex(id, 4);
    assert.ok(i >= 0 && i < 4);
  }
  assert.equal(kindIndex("x", 0), 0);
});
