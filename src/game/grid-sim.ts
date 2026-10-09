import { auditGrid, canPlace, type CompanionId, type Point, type Skin } from "./grid";
import { buildGrid } from "./pathgen";
import { levelAt } from "./levels";
import type { SkillId } from "./skills";
import {
  ENEMIES,
  LEVEL_1,
  MATCHUP,
  MARK_BONUS,
  RANK_COST,
  START_CREDIT,
  TOWERS,
  killPay,
  type EnemyTag,
  type TowerId,
  type WaveGroup,
} from "./matchup";

const RANGE: Record<TowerId, number> = {
  lance: 6,
  halo: 2,
  crater: 3,
  rail: 8,
  beacon: 4,
};

const LEAK: Record<EnemyTag, number> = {
  grunt: 8,
  swift: 6,
  plate: 16,
  swarm: 4,
};

export type GridEnemy = {
  uid: number;
  tag: EnemyTag;
  along: number;
  hp: number;
  max: number;
  alive: boolean;
  flash: number;
  slowT: number;
  marked: boolean;
};

export type GridTower = {
  x: number;
  y: number;
  id: TowerId;
  rank: 1 | 2 | 3;
  cd: number;
};

export type GridShot = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  life: number;
  color: string;
};

export type GridRun = {
  seed: number;
  companion: CompanionId;
  grid: ReturnType<typeof buildGrid>;
  credit: number;
  selected: TowerId | null;
  towers: GridTower[];
  enemies: GridEnemy[];
  shots: GridShot[];
  spawns: { tag: EnemyTag; at: number }[];
  spawnTotal: number;
  companionHp: number;
  companionMax: number;
  abilityCd: number;
  abilityT: number;
  flinch: number;
  time: number;
  won: boolean;
  lost: boolean;
  /** True until the player starts the round. Money and towers are already set; nothing spawns. */
  hold: boolean;
  nextUid: number;
  press: { x: number; y: number; life: number } | null;
  level: number;
  hpMul: number;
  speedMul: number;
  skills: SkillId[];
};

function rankMul(rank: number) {
  return rank >= 3 ? 1.85 : rank === 2 ? 1.4 : 1;
}

export function pointAlong(path: Point[], along: number) {
  const max = Math.max(0, path.length - 1);
  const clamped = Math.max(0, Math.min(max, along));
  const i = Math.floor(clamped);
  const j = Math.min(max, i + 1);
  const t = clamped - i;
  const a = path[i] ?? { x: 0, y: 0 };
  const b = path[j] ?? a;
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function startRun(
  seed: number,
  companion: CompanionId = "comp-auger",
  opts?: {
    waves?: WaveGroup[];
    credit?: number;
    skin?: Skin;
    hpMul?: number;
    speedMul?: number;
    skills?: SkillId[];
    level?: number;
  },
): GridRun {
  const grid = buildGrid(seed, { companion, skin: opts?.skin });
  const problems = auditGrid(grid);
  if (problems.length) throw new Error(problems.join(","));
  const spawns: GridRun["spawns"] = [];
  let at = 1.1;
  for (const group of opts?.waves ?? LEVEL_1) {
    for (let i = 0; i < group.count; i++) {
      spawns.push({ tag: group.tag, at });
      at += 0.85;
    }
    at += 1.3;
  }
  return {
    seed,
    companion,
    grid,
    credit: opts?.credit ?? START_CREDIT,
    selected: null,
    towers: [],
    enemies: [],
    shots: [],
    spawns,
    spawnTotal: spawns.length,
    companionHp: 100,
    companionMax: 100,
    abilityCd: 0,
    abilityT: 0,
    flinch: 0,
    time: 0,
    won: false,
    lost: false,
    hold: true,
    nextUid: 1,
    press: null,
    level: opts?.level ?? 1,
    hpMul: opts?.hpMul ?? 1,
    speedMul: opts?.speedMul ?? 1,
    skills: opts?.skills ?? [],
  };
}

export function startLevel(
  level: number,
  companion: CompanionId,
  skills: SkillId[] = [],
  keep: GridTower[] = [],
) {
  const def = levelAt(level);
  const run = startRun(def.seed, companion, {
    waves: def.waves,
    credit: def.credit,
    skin: def.skin,
    hpMul: def.hpMul,
    speedMul: def.speedMul,
    skills,
    level: def.level,
  });
  const seen = new Set<string>();
  run.towers = keep.flatMap((tower) => {
    const key = `${tower.x},${tower.y}`;
    if (seen.has(key) || !canPlace(run.grid, tower.x, tower.y)) return [];
    seen.add(key);
    return [{ x: tower.x, y: tower.y, id: tower.id, rank: tower.rank, cd: 0.35 }];
  });
  return run;
}

function hasSkill(run: GridRun, id: SkillId) {
  return run.skills.includes(id);
}

function towerAt(run: GridRun, x: number, y: number) {
  return run.towers.find((t) => t.x === x && t.y === y);
}

export function tryPlace(run: GridRun, x: number, y: number) {
  if (run.won || run.lost) return false;
  const held = towerAt(run, x, y);
  if (held) return tryRank(run, x, y);
  const id = run.selected;
  if (!id) return false;
  if (!canPlace(run.grid, x, y)) return false;
  const cost = TOWERS[id].cost;
  if (run.credit < cost) return false;
  run.credit -= cost;
  run.towers.push({ x, y, id, rank: 1, cd: 0.35 });
  run.press = { x, y, life: 0.16 };
  return true;
}

export function tryRank(run: GridRun, x: number, y: number) {
  const tower = towerAt(run, x, y);
  if (!tower || tower.rank >= 3) return false;
  const next = (tower.rank + 1) as 2 | 3;
  const cost = RANK_COST[next];
  if (run.credit < cost) return false;
  run.credit -= cost;
  tower.rank = next;
  run.press = { x, y, life: 0.16 };
  return true;
}

export function castAbility(run: GridRun) {
  if (run.abilityCd > 0 || run.won || run.lost) return false;
  const lasting = hasSkill(run, "ship-hold");
  run.abilityT = lasting ? 4.5 : 3;
  run.abilityCd = lasting ? 12 : 16;
  if (run.companion === "comp-shrike") {
    const row = run.grid.exit.y;
    for (const e of run.enemies) {
      if (!e.alive) continue;
      const cell = enemyCell(run, e);
      if (cell.y !== row) continue;
      hurt(run, e, 22, false);
    }
  }
  return true;
}

function enemyCell(run: GridRun, e: GridEnemy) {
  const p = pointAlong(run.grid.path, e.along);
  return { x: Math.round(p.x), y: Math.round(p.y) };
}

function manhattan(a: Point, b: Point) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function chebyshev(a: Point, b: Point) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

function rangeOf(run: GridRun, id: TowerId) {
  if (id === "halo" && hasSkill(run, "halo-ring")) return 3;
  if (id === "rail" && hasSkill(run, "rail-long")) return 11;
  return RANGE[id];
}

function inRange(run: GridRun, id: TowerId, from: Point, to: Point) {
  const range = rangeOf(run, id);
  if (id === "lance" || id === "rail") {
    const line = from.x === to.x || from.y === to.y;
    return line && manhattan(from, to) <= range && manhattan(from, to) > 0;
  }
  if (id === "halo") return chebyshev(from, to) <= range;
  return manhattan(from, to) <= range && manhattan(from, to) > 0;
}

function hurt(run: GridRun, e: GridEnemy, amount: number, mark: boolean) {
  if (!e.alive || amount <= 0) return;
  e.hp -= amount;
  e.flash = 0.12;
  if (mark) e.marked = true;
  if (e.hp > 0) return;
  e.alive = false;
  run.credit += killPay(e.tag, e.marked);
}

function fire(run: GridRun, tower: GridTower, targets: GridEnemy[]) {
  const from = { x: tower.x, y: tower.y };
  for (const e of targets) {
    const mark = hasSkill(run, "beacon-mark") ? 0.5 : MARK_BONUS;
    const punch = tower.id === "crater" && hasSkill(run, "crater-punch") ? 1.3 : 1;
    const mult =
      MATCHUP[tower.id][e.tag] * (e.marked && tower.id !== "beacon" ? 1 + mark : 1) * rankMul(tower.rank) * punch;
    hurt(run, e, TOWERS[tower.id].damage * mult, tower.id === "beacon");
    if (tower.id === "halo") e.slowT = Math.max(e.slowT, 1.1);
    const at = enemyCell(run, e);
    run.shots.push({
      x: from.x,
      y: from.y,
      tx: at.x,
      ty: at.y,
      life: 0.18,
      color: shotColor(tower.id),
    });
  }
}

function shotColor(id: TowerId) {
  if (id === "crater") return "#ff5c2a";
  if (id === "beacon") return "#e8c15a";
  if (id === "rail") return "#d7e4ef";
  return "#3cd6cc";
}

function targetsFor(run: GridRun, tower: GridTower) {
  const from = { x: tower.x, y: tower.y };
  const live = run.enemies.filter((e) => e.alive && inRange(run, tower.id, from, enemyCell(run, e)));
  live.sort((a, b) => manhattan(from, enemyCell(run, a)) - manhattan(from, enemyCell(run, b)));
  if (tower.id === "halo") return live;
  if (tower.id === "lance") return live.slice(0, hasSkill(run, "lance-pierce") ? 3 : 2);
  const first = live[0];
  if (!first) return [];
  if (tower.id !== "crater") return [first];
  const impact = enemyCell(run, first);
  return run.enemies.filter((e) => e.alive && manhattan(impact, enemyCell(run, e)) <= 1);
}

export function beginRound(run: GridRun) {
  if (run.won || run.lost) return;
  run.hold = false;
}

export function stepRun(run: GridRun, dt: number) {
  if (run.won || run.lost) return;
  const step = Math.max(0, Math.min(0.05, dt));
  if (run.hold) {
    if (run.press) {
      run.press.life -= step;
      if (run.press.life <= 0) run.press = null;
    }
    return;
  }
  run.time += step;
  if (run.press) {
    run.press.life -= step;
    if (run.press.life <= 0) run.press = null;
  }
  if (run.flinch > 0) run.flinch -= step;
  if (run.abilityT > 0) run.abilityT -= step;
  if (run.abilityCd > 0) run.abilityCd -= step;
  for (const shot of run.shots) shot.life -= step;
  run.shots = run.shots.filter((s) => s.life > 0);

  while (run.spawns[0] && run.spawns[0].at <= run.time) {
    const spawn = run.spawns.shift()!;
    const stats = ENEMIES[spawn.tag];
    const hp = Math.round(stats.hp * run.hpMul);
    run.enemies.push({
      uid: run.nextUid++,
      tag: spawn.tag,
      along: 0,
      hp,
      max: hp,
      alive: true,
      flash: 0,
      slowT: 0,
      marked: false,
    });
  }

  const auger = run.abilityT > 0 && run.companion === "comp-auger";
  for (const e of run.enemies) {
    if (!e.alive) continue;
    if (e.flash > 0) e.flash -= step;
    if (e.slowT > 0) e.slowT -= step;
    let speed = ENEMIES[e.tag].speed * 1.15 * run.speedMul;
    if (e.slowT > 0) speed *= 0.55;
    if (auger) speed *= 0.55;
    e.along += speed * step;
    if (e.along >= run.grid.path.length - 1) {
      e.alive = false;
      run.companionHp -= LEAK[e.tag];
      run.flinch = 0.28;
      if (run.companionHp <= 0) {
        run.companionHp = 0;
        run.lost = true;
        return;
      }
    }
  }
  run.enemies = run.enemies.filter((e) => e.alive || e.flash > 0);

  const boost = run.abilityT > 0 && run.companion === "comp-boost" ? 1.35 : 1;
  for (const tower of run.towers) {
    tower.cd -= step * boost;
    if (tower.cd > 0) continue;
    const targets = targetsFor(run, tower);
    if (!targets.length) continue;
    fire(run, tower, targets);
    tower.cd = 1 / TOWERS[tower.id].rate;
  }

  const pending = run.spawns.length > 0;
  const alive = run.enemies.some((e) => e.alive);
  if (!pending && !alive) run.won = true;
}
