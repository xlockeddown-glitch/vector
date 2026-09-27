#!/usr/bin/env node
import { readFile, writeFile, mkdir } from "node:fs/promises";

const PATH = "/workspace/artifacts/fam-tally.json";

const BOTS = [
  "house-bot",
  "vector-visual-bot",
  "play-test-bot",
  "taste-bot",
  "lore-bot",
];

const FOLDED = {
  "house-bot": ["eli15-bot", "eli10-bot", "draft-balance-bot", "vector-card-rule-bot"],
  "taste-bot": ["simplify-bot", "textually-bot", "neonify-bot"],
};

function emptyBot() {
  return { runs: 0, catches: 0, fixes: 0 };
}

function foldBots(bots) {
  const out = { ...bots };
  for (const [into, froms] of Object.entries(FOLDED)) {
    const cur = out[into] ?? emptyBot();
    const parts = froms.map((f) => out[f]).filter(Boolean);
    out[into] = {
      runs: Math.max(cur.runs, ...parts.map((p) => p.runs), 0),
      catches: (cur.catches ?? 0) + parts.reduce((s, p) => s + (p.catches ?? 0), 0),
      fixes: (cur.fixes ?? 0) + parts.reduce((s, p) => s + (p.fixes ?? 0), 0),
      dirty: !!(cur.dirty || parts.some((p) => p.dirty)),
    };
    for (const f of froms) delete out[f];
  }
  return out;
}

function empty() {
  return {
    since: "2026-08-24",
    suites: {
      boys: { runs: 0, catches: 0 },
      girls: { runs: 0, catches: 0 },
      fam: { runs: 0, catches: 0 },
    },
    bots: Object.fromEntries(BOTS.map((id) => [id, emptyBot()])),
  };
}

export async function loadTally() {
  try {
    const raw = JSON.parse(await readFile(PATH, "utf8"));
    const base = empty();
    return {
      ...base,
      ...raw,
      suites: { ...base.suites, ...(raw.suites ?? {}) },
      bots: foldBots({ ...base.bots, ...(raw.bots ?? {}) }),
    };
  } catch {
    return empty();
  }
}

async function save(tally) {
  await mkdir("/workspace/artifacts", { recursive: true });
  tally.updated = new Date().toISOString();
  await writeFile(PATH, JSON.stringify(tally, null, 2) + "\n");
  return tally;
}

/** Tick a suite run. Each bot that ran gets +1 run. Issues tick catches. Clean after a catch ticks a fix. */
export async function recordSuite(suite, report, opts = {}) {
  const tally = await loadTally();
  if (!tally.suites[suite]) tally.suites[suite] = { runs: 0, catches: 0 };
  tally.suites[suite].runs += 1;

  const issues = report?.issues ?? [];
  const pass = report?.pass ?? [];
  if (issues.length) tally.suites[suite].catches += issues.length;

  if (opts.bots === false) return save(tally);

  const ran = new Set([...pass.map((p) => p.bot), ...issues.map((i) => i.bot)].filter(Boolean));
  const caught = {};
  for (const i of issues) {
    if (!i.bot) continue;
    caught[i.bot] = (caught[i.bot] ?? 0) + 1;
  }

  for (const id of ran) {
    if (!tally.bots[id]) tally.bots[id] = emptyBot();
    const b = tally.bots[id];
    const hadCatchLast = !!b.dirty;
    b.runs += 1;
    const n = caught[id] ?? 0;
    if (n) {
      b.catches += n;
      b.dirty = true;
    } else {
      if (hadCatchLast) b.fixes += 1;
      b.dirty = false;
    }
  }

  return save(tally);
}

export function tallyView(tally) {
  const bots = Object.entries(tally.bots).map(([id, b]) => ({
    id,
    runs: b.runs,
    catches: b.catches,
    fixes: b.fixes,
  }));
  return {
    boys: tally.suites.boys.runs,
    girls: tally.suites.girls.runs,
    fam: tally.suites.fam.runs,
    boysCatches: tally.suites.boys.catches,
    girlsCatches: tally.suites.girls.catches,
    famCatches: tally.suites.fam.catches,
    bots,
  };
}
