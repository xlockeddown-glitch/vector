import assert from "node:assert/strict";
import { test } from "node:test";
import { levelAt } from "../src/game/levels.ts";
import { beginRound, castAbility, startLevel, stepRun, tryPlace, tryRank } from "../src/game/grid-sim.ts";
import { canPlace } from "../src/game/grid.ts";
import { GUN_CAP, TOWERS } from "../src/game/matchup.ts";

test("eight levels then the scale", () => {
  assert.equal(levelAt(1).skin, "alloy");
  assert.equal(levelAt(1).waves[0].tag, "grunt");
  assert.equal(levelAt(5).skin, "dirt");
  assert.equal(levelAt(6).skin, "road");
  assert.ok(levelAt(3).waves.some((g) => g.tag === "swarm"));
  assert.ok(levelAt(4).waves.some((g) => g.tag === "plate"));
  assert.equal(levelAt(8).hpMul, 1);
  assert.ok(levelAt(9).hpMul > 1);
  assert.equal(levelAt(9).blurb.startsWith("Debris"), true);
  assert.ok(levelAt(9).waves.some((g) => g.tag === "plate"));
  assert.equal(levelAt(2).credit, 45);
  assert.equal(levelAt(3).blurb.includes("Splash"), false);
  assert.equal(levelAt(12).blurb.startsWith("Convoy"), true);
  assert.equal(levelAt(15).blurb.startsWith("Swarm dump"), true);
  assert.ok(levelAt(9).waves[0].count >= levelAt(8).waves[0].count);
  assert.equal(levelAt(40).speedMul, 1.6);
  assert.equal(startLevel(5, "comp-auger").grid.skin, "dirt");
});

test("endless health is the scaled grunt", () => {
  const run = startLevel(9, "comp-shrike", ["ship-hold"]);
  run.hold = false;
  for (let i = 0; i < 180; i++) stepRun(run, 1 / 60);
  const grunt = run.enemies.find((e) => e.tag === "grunt");
  assert.ok(grunt);
  assert.ok(grunt.max > 100);
  assert.equal(run.level, 9);
  assert.equal(castAbility(run), true);
  assert.equal(run.abilityT, 4.5);
});

function spots(run) {
  const list = [];
  for (let y = 0; y < run.grid.h; y++) {
    for (let x = 0; x < run.grid.w; x++) {
      if (!canPlace(run.grid, x, y)) continue;
      if (run.towers.some((tower) => tower.x === x && tower.y === y)) continue;
      const straight = run.grid.path.filter((cell) => cell.x === x || cell.y === y).length;
      list.push({ x, y, straight });
    }
  }
  list.sort((a, b) => b.straight - a.straight);
  return list;
}

function spend(run, order) {
  let guard = 0;
  while (guard < 12 && run.towers.length < GUN_CAP) {
    guard += 1;
    const counts = {};
    for (const tower of run.towers) counts[tower.id] = (counts[tower.id] ?? 0) + 1;
    const want = {};
    let next = null;
    for (const id of order) {
      want[id] = (want[id] ?? 0) + 1;
      if ((counts[id] ?? 0) < want[id]) {
        next = id;
        break;
      }
    }
    const spot = spots(run)[0];
    if (!next || !spot || run.credit < TOWERS[next].cost) break;
    run.selected = next;
    if (!tryPlace(run, spot.x, spot.y)) break;
  }
  let ranked = 0;
  while (ranked < 6) {
    ranked += 1;
    const pool = [...run.towers].filter((tower) => tower.rank < 3).sort((a, b) => a.rank - b.rank);
    if (!pool[0] || !tryRank(run, pool[0].x, pool[0].y)) break;
  }
}

function climb(order, to = 8) {
  let kept = [];
  let bank = 0;
  let maxGuns = 0;
  for (let level = 1; level <= to; level++) {
    const run = startLevel(level, "comp-auger", [], kept, 0, bank);
    spend(run, order);
    maxGuns = Math.max(maxGuns, run.towers.length);
    beginRound(run);
    for (let n = 0; n < 60 * 100 && !run.won && !run.lost; n++) stepRun(run, 1 / 60);
    if (!run.won) return { won: false, level, hp: run.companionHp, maxGuns };
    kept = run.towers.map((tower) => ({ ...tower }));
    bank = run.credit;
    if (level === to) return { won: true, level, hp: run.companionHp, maxGuns };
  }
  return { won: false, level: to, hp: 0, maxGuns };
}

test("a halo-only climb does not clear level 8 at full hull", () => {
  const idle = climb(["halo", "halo", "halo", "halo", "halo", "halo"]);
  assert.ok(idle.maxGuns <= GUN_CAP);
  assert.equal(idle.won && idle.level === 8 && idle.hp >= 100, false);
});

test("a mixed table is still standing at level 8", () => {
  const keen = climb(["lance", "halo", "crater", "rail", "lance", "beacon"]);
  assert.equal(keen.won, true);
  assert.equal(keen.level, 8);
  assert.ok(keen.hp > 0);
  assert.ok(keen.maxGuns <= GUN_CAP);
});

