import assert from "node:assert/strict";
import { test } from "node:test";
import { canPlace } from "../src/game/grid.ts";
import { cellFromPoint } from "../src/game/grid-draw.ts";
import { startRun, stepRun, tryPlace } from "../src/game/grid-sim.ts";

test("a tap on the board still picks a pad", () => {
  const hit = cellFromPoint(390, 654, 20, 220);
  assert.ok(hit);
  assert.equal(hit.x >= 0 && hit.x < 16, true);
  assert.equal(hit.y >= 0 && hit.y < 10, true);
});

test("a tower sits on a button and the path refuses it", () => {
  const run = startRun(4, "comp-auger");
  run.selected = "lance";
  const path = run.grid.path[2];
  assert.equal(tryPlace(run, path.x, path.y), false);
  assert.equal(tryPlace(run, run.grid.exit.x, run.grid.exit.y), false);
  let placed = false;
  for (let y = 0; y < run.grid.h && !placed; y++) {
    for (let x = 0; x < run.grid.w; x++) {
      if (!canPlace(run.grid, x, y)) continue;
      assert.equal(tryPlace(run, x, y), true);
      assert.equal(run.credit, 10);
      assert.equal(tryPlace(run, x, y), false);
      placed = true;
      break;
    }
  }
  assert.equal(placed, true);
});

test("a leak hurts the ship, and a short run stays finite", () => {
  const run = startRun(2, "comp-shrike");
  run.spawns.length = 0;
  run.enemies.push({
    uid: 1,
    tag: "grunt",
    along: run.grid.path.length - 1.05,
    hp: 30,
    max: 30,
    alive: true,
    flash: 0,
    slowT: 0,
    marked: false,
  });
  const before = run.companionHp;
  stepRun(run, 0.05);
  assert.ok(run.companionHp < before);
  const quiet = startRun(8, "comp-boost");
  for (let i = 0; i < 60 * 20; i++) stepRun(quiet, 1 / 60);
  assert.ok(Number.isFinite(quiet.credit));
  assert.ok(Number.isFinite(quiet.companionHp));
});
