import assert from "node:assert/strict";
import { test } from "node:test";
import { canPlace } from "../src/game/grid.ts";
import { cellFromPoint } from "../src/game/grid-draw.ts";
import { beginRound, startLevel, startRun, stepRun, tryPlace } from "../src/game/grid-sim.ts";
import { TOWERS } from "../src/game/matchup.ts";

test("a tap on the board still picks a pad", () => {
  const hit = cellFromPoint(390, 654, 195, 327);
  assert.ok(hit);
  assert.equal(hit.x >= 0 && hit.x < 8, true);
  assert.equal(hit.y >= 0 && hit.y < 6, true);
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
      const before = run.credit;
      assert.equal(tryPlace(run, x, y), true);
      assert.equal(run.credit, before - TOWERS.lance.cost);
      assert.equal(run.towers.length, 1);
      assert.equal(tryPlace(run, x, y), true);
      assert.equal(run.towers.length, 1);
      assert.equal(run.towers[0].rank, 2);
      assert.equal(tryPlace(run, x, y), false);
      placed = true;
      break;
    }
  }
  assert.equal(placed, true);
});

test("towers stay between levels when the new path does not cover them", () => {
  const first = startLevel(1, "comp-auger");
  first.selected = "lance";
  let spot = null;
  for (let y = 0; y < first.grid.h && !spot; y++) {
    for (let x = 0; x < first.grid.w; x++) {
      if (!canPlace(first.grid, x, y)) continue;
      assert.equal(tryPlace(first, x, y), true);
      spot = { x, y };
      break;
    }
  }
  const next = startLevel(2, "comp-auger", [], first.towers);
  assert.equal(next.credit, 110);
  const kept = next.towers.find((tower) => tower.x === spot.x && tower.y === spot.y);
  if (canPlace(next.grid, spot.x, spot.y)) {
    assert.ok(kept);
    assert.equal(kept.id, "lance");
  } else {
    assert.equal(kept, undefined);
  }
});

test("a round waits until you start, then money and towers are fresh", () => {
  const run = startRun(1, "comp-auger");
  run.selected = "lance";
  assert.equal(run.hold, true);
  assert.equal(run.towers.length, 0);
  for (let i = 0; i < 180; i++) stepRun(run, 1 / 60);
  assert.equal(run.enemies.length, 0);
  assert.equal(run.time, 0);
  beginRound(run);
  for (let i = 0; i < 180; i++) stepRun(run, 1 / 60);
  assert.ok(run.enemies.length > 0);
});

test("a leak hurts the ship, and a short run stays finite", () => {
  const run = startRun(2, "comp-shrike");
  run.hold = false;
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
  quiet.hold = false;
  for (let i = 0; i < 60 * 20; i++) stepRun(quiet, 1 / 60);
  assert.ok(Number.isFinite(quiet.credit));
  assert.ok(Number.isFinite(quiet.companionHp));
});
