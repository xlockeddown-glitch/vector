import assert from "node:assert/strict";
import { test } from "node:test";
import { levelAt } from "../src/game/levels.ts";
import { castAbility, startLevel, stepRun } from "../src/game/grid-sim.ts";

test("eight levels then the scale", () => {
  assert.equal(levelAt(1).skin, "alloy");
  assert.equal(levelAt(1).waves[0].tag, "grunt");
  assert.equal(levelAt(5).skin, "dirt");
  assert.equal(levelAt(6).skin, "road");
  assert.ok(levelAt(3).waves.some((g) => g.tag === "swarm"));
  assert.ok(levelAt(4).waves.some((g) => g.tag === "plate"));
  assert.equal(levelAt(8).hpMul, 1);
  assert.ok(levelAt(9).hpMul > 1);
  assert.ok(levelAt(9).waves[0].count >= levelAt(8).waves[0].count);
  assert.equal(levelAt(40).speedMul, 1.6);
  assert.equal(startLevel(5, "comp-auger").grid.skin, "dirt");
});

test("endless health is the scaled grunt", () => {
  const run = startLevel(9, "comp-shrike", ["ship-hold"]);
  for (let i = 0; i < 180; i++) stepRun(run, 1 / 60);
  const grunt = run.enemies.find((e) => e.tag === "grunt");
  assert.ok(grunt);
  assert.ok(grunt.max > 100);
  assert.equal(run.level, 9);
  assert.equal(castAbility(run), true);
  assert.equal(run.abilityT, 4.5);
});
