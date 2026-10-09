import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ENEMY_TAGS,
  LEVEL_1,
  RANK_COST,
  START_CREDIT,
  TOWERS,
  TOWER_IDS,
  bestTower,
  canAfford,
  killPay,
  matchupSheet,
  timeToClear,
  wavePay,
} from "../src/game/matchup.ts";
import { scaleAt } from "../src/game/scale.ts";

const WINNER = {
  grunt: "rail",
  swift: "halo",
  plate: "lance",
  swarm: "crater",
};

test("no tower wins every row, and beacon never does", () => {
  const sheet = matchupSheet();
  const winners = sheet.map((row) => row.winner);
  assert.equal(new Set(winners).size, 4);
  for (const row of sheet) {
    assert.equal(row.winner, WINNER[row.tag], `${row.tag} won by ${row.winner}`);
    assert.notEqual(row.winner, "beacon");
    const times = TOWER_IDS.map((id) => row.seconds[id]).sort((a, b) => a - b);
    assert.ok(times[1] >= times[0] * 1.08, `${row.tag} winner is too close`);
    for (const id of TOWER_IDS) assert.ok(Number.isFinite(row.seconds[id]));
  }
});

test("specialists are bad at their bad fight", () => {
  assert.ok(timeToClear("lance", "plate") < timeToClear("lance", "swarm"));
  assert.ok(timeToClear("halo", "swift") < timeToClear("halo", "plate") * 0.5);
  assert.ok(timeToClear("crater", "swarm") < timeToClear("crater", "plate") * 0.25);
  assert.ok(timeToClear("rail", "plate") < timeToClear("rail", "swift"));
  assert.equal(TOWERS.halo.slow < 1, true);
  assert.ok(TOWER_IDS.filter((id) => id !== "halo").every((id) => TOWERS[id].slow === 1));
});

test("a mark pays more and dies faster, except under beacon's own gun", () => {
  for (const tag of ENEMY_TAGS) {
    assert.ok(killPay(tag, true) > killPay(tag, false));
    assert.ok(timeToClear("lance", tag, true) < timeToClear("lance", tag, false));
    assert.equal(timeToClear("beacon", tag, true), timeToClear("beacon", tag, false));
  }
});

test("start credit buys one shooter, not two, and not beacon", () => {
  assert.equal(canAfford(START_CREDIT, "lance"), true);
  assert.equal(canAfford(START_CREDIT, "halo"), true);
  assert.equal(canAfford(START_CREDIT, "crater"), true);
  assert.equal(canAfford(START_CREDIT, "rail"), true);
  assert.equal(canAfford(START_CREDIT, "beacon"), false);
  for (const id of ["lance", "halo", "crater", "rail"]) {
    assert.equal(canAfford(START_CREDIT - TOWERS[id].cost, id), false);
  }
  const after = START_CREDIT - TOWERS.lance.cost + wavePay(LEVEL_1);
  assert.ok(after >= RANK_COST[2]);
  assert.ok(after < TOWERS.beacon.cost + RANK_COST[2]);
});

test("endless scale stays finite and speed caps", () => {
  let prevHp = 0;
  for (let level = 1; level <= 40; level++) {
    const row = scaleAt(level);
    assert.equal(row.tier, Math.max(0, level - 8));
    assert.ok(Number.isFinite(row.hp));
    assert.ok(Number.isFinite(row.count));
    assert.ok(row.speed <= 1.6);
    assert.ok(row.hp >= prevHp);
    prevHp = row.hp;
  }
  assert.equal(scaleAt(8).hp, 1);
  assert.ok(scaleAt(40).hp > 10);
  assert.equal(scaleAt(40).speed, 1.6);
});
