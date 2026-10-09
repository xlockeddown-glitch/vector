import assert from "node:assert/strict";
import { test } from "node:test";
import { auditGrid, canPlace, gridFromPath, longestStraight, turnCount } from "../src/game/grid.ts";
import { buildGrid } from "../src/game/pathgen.ts";

test("forty seeds are legal boards", () => {
  for (let seed = 1; seed <= 40; seed++) {
    const grid = buildGrid(seed);
    assert.deepEqual(auditGrid(grid), [], `seed ${seed}`);
    assert.equal(grid.w, 8);
    assert.equal(grid.h, 6);
    assert.equal(grid.entry.x, 0);
    assert.equal(grid.exit.x, 7);
    assert.equal(grid.path.at(-1).x, grid.exit.x);
    assert.equal(grid.path.at(-1).y, grid.exit.y);
    assert.ok(longestStraight(grid.path) >= 4);
    assert.ok(turnCount(grid.path) >= 1);
    assert.equal(canPlace(grid, grid.exit.x, grid.exit.y), false);
    for (const cell of grid.path.slice(0, -1)) {
      assert.equal(canPlace(grid, cell.x, cell.y), false);
    }
    const button = grid.cells.findIndex((kind) => kind === "button");
    assert.ok(button >= 0);
    assert.equal(canPlace(grid, button % 8, Math.floor(button / 8)), true);
    assert.equal(canPlace(grid, -1, 0), false);
    assert.equal(canPlace(grid, 8, 0), false);
  }
});

test("same seed is the same path", () => {
  const a = buildGrid(7);
  const b = buildGrid(7);
  assert.deepEqual(a.path, b.path);
  assert.equal(a.skin, b.skin);
});

test("skins cycle and companion can be seated", () => {
  const skins = new Set([1, 2, 3, 4, 5, 6].map((seed) => buildGrid(seed).skin));
  assert.ok(skins.has("alloy"));
  assert.ok(skins.has("road"));
  assert.ok(skins.has("dirt"));
  const seated = buildGrid(3, { companion: "comp-shrike" });
  assert.equal(seated.companion, "comp-shrike");
  assert.equal(canPlace(seated, seated.exit.x, seated.exit.y), false);
});

test("a straight road fails the turn rule", () => {
  const path = [];
  for (let x = 0; x < 16; x++) path.push({ x, y: 4 });
  const grid = gridFromPath({
    seed: 0,
    skin: "road",
    companion: "comp-auger",
    path,
  });
  assert.ok(auditGrid(grid).includes("turn"));
});

test("a diagonal step fails", () => {
  const grid = gridFromPath({
    seed: 0,
    skin: "alloy",
    companion: "comp-boost",
    path: [
      { x: 0, y: 4 },
      { x: 1, y: 4 },
      { x: 2, y: 4 },
      { x: 3, y: 4 },
      { x: 4, y: 5 },
      { x: 4, y: 6 },
      { x: 5, y: 6 },
      { x: 6, y: 6 },
      { x: 15, y: 6 },
    ],
  });
  assert.ok(auditGrid(grid).includes("step"));
});
