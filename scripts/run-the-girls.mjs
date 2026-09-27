#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { recordSuite, tallyView } from "./fam-tally.mjs";

const issues = [];
const pass = [];

function flag(bot, msg) {
  issues.push({ bot, msg });
}
function ok(bot, msg) {
  pass.push({ bot, msg });
}

async function read(path) {
  return readFile(`/workspace/${path}`, "utf8");
}

function words(s) {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

async function tasteParams(bot) {
  const { PARAMS } = await import("../src/game/params.ts");
  const { SPEAK_WORDS } = await import("../src/game/data/speak.ts");
  const dict = await read(".grok/references/operator-dictionary.md");
  const needParams = [
    "lives",
    "craftsFly",
    "openingPicks",
    "wavesPerRound",
    "padsStart",
    "padsMax",
    "swapsStart",
    "swapsMax",
    "packSize",
    "coverHuntMul",
    "overclockMul",
    "ultEvery",
    "bondMax",
    "bondBase",
    "glowTick",
    "glowRMul",
  ];
  for (const k of needParams) {
    if (!(k in PARAMS)) flag(bot, `PARAMS missing ${k}.`);
  }
  const needSpeak = [
    "craft",
    "gun",
    "shade",
    "climb",
    "keep",
    "vault",
    "pack",
    "gem",
    "flux",
    "credit",
    "home",
    "moon",
    "bond",
    "lore",
    "the boys",
    "the girls",
    "the fam",
    "swap",
    "auger",
    "story",
    "arcade",
    "arena",
    "endless",
    "watch",
    "enemy",
    "glow",
  ];
  const dictLow = dict.toLowerCase();
  for (const w of needSpeak) {
    if (!SPEAK_WORDS.includes(w)) flag(bot, `SPEAK missing "${w}".`);
    if (!dictLow.includes(w)) flag(bot, `Dictionary missing "${w}".`);
  }
  if (!dict.includes("params.ts")) flag(bot, "Dictionary never points at params.ts.");
}

async function tasteWords(bot) {
  const hud = await read("src/components/game/Hud.tsx");
  const shop = await read("src/components/game/ShopScreen.tsx");
  const help = await read("src/components/game/HelpSheet.tsx");
  const title = await read("src/components/game/TitleScreen.tsx");
  const end = await read("src/components/game/EndScreen.tsx");
  const live = await read("src/components/game/LiveDraft.tsx");
  const hangar = await read("src/components/game/HangarScreen.tsx");
  const format = await read("src/game/format.ts");
  const chrome = [hud, shop, help, title, end, live, hangar].join("\n");

  const banner = hud.match(/Pick a gun\.[^`{<]*/);
  if (banner && words(banner[0]) > 8) flag(bot, `Placement banner is ${words(banner[0])} words.`);
  if (/Star of the round/.test(shop)) flag(bot, "Round report still says Star of the round.");
  if (/Nobody got through/.test(shop)) flag(bot, "S grade still uses a long line.");
  if (/Shade shows on every empty pad/.test(help) || /Tap the pad you like/.test(help)) {
    flag(bot, "Help place line is still long.");
  }
  if (/becomes a small moon/.test(help + title)) flag(bot, "Help still teaches that a pin becomes a moon.");
  const long = [...help.matchAll(/"([^"]{1,200})"/g)]
    .map((m) => m[1])
    .filter((s) => /[A-Za-z]/.test(s) && words(s) > 18);
  if (long.length) flag(bot, `Help has a ${words(long[0])}-word line: "${long[0]}"`);
  if (/\{c\.hp\}/.test(shop) || /\{c\.hpMax\}/.test(shop)) {
    flag(bot, "Round report prints raw hull with extra digits.");
  }
  const tag = title.match(/Hold the lane\.[^<"]*/);
  if (tag && words(tag[0]) > 8) flag(bot, `Tagline is ${words(tag[0])} words.`);

  if (!format.includes("NIST SP 811") || !format.includes("fmtCount") || !format.includes("fmtQty")) {
    flag(bot, "NIST SP 811 formatter missing (fmtCount / fmtQty).");
  }
  if (!format.includes("\\u2009") && !format.includes("\u2009")) flag(bot, "Digit groups must use a thin space, not a comma.");
  if (!hud.includes("fmtCount") || !end.includes("fmtCount") || !title.includes("fmtCount")) {
    flag(bot, "Gold / Credit / lives skip fmtCount.");
  }
  if (!live.includes("fmtQty")) flag(bot, "Timer skips fmtQty. Write 3.2 s, not 3.2s.");
  if (/\.toFixed\(/.test(chrome)) flag(bot, "Game chrome still calls toFixed. Use fmtCount / fmtQty.");
  if (/\.toLocaleString\(/.test(chrome)) flag(bot, "toLocaleString will comma-group. Ban it in chrome.");
  if (/\d,\d{3}/.test(chrome)) flag(bot, "Comma thousands in player chrome. NIST SP 811 uses a thin space.");
  if (/\d%`/.test(chrome) || /\d%\}/.test(chrome) || /bonusPct}%/.test(chrome)) {
    flag(bot, "Percent glued to the number. Write 12 %.");
  }
  if (/\.toFixed\(1\)\}s/.test(chrome) || /left\.toFixed/.test(chrome)) {
    flag(bot, "Seconds glued to the number. Write 3.2 s.");
  }
}

async function tasteLight(bot) {
  const css = await read("src/styles.css");
  const pal = (await read("src/game/data/palette.ts")) + "\n" + (await read("src/game/constants.ts"));
  const render = await read("src/game/render.ts");
  if (!/frost:\s*"#3cd6cc"/.test(pal)) flag(bot, "Frost glow missing from palette.");
  if (!/ember:\s*"#ff5c2a"/.test(pal)) flag(bot, "Ember glow missing from palette.");
  if (!/accent:\s*"#7c6cf0"/.test(pal)) flag(bot, "Accent glow missing from palette.");
  if (!/legend:\s*PALETTE.legend/.test(pal)) flag(bot, "Legend prestige glow missing from GLOW.");
  if (!/sage:\s*PALETTE.sage/.test(pal) && !/sage:\s*"#3ecf7a"/.test(pal)) flag(bot, "Sage heal glow missing.");
  if (!css.includes("climb-pop")) flag(bot, "Climb pop glow missing.");
  if (!css.includes("craft-report-mvp")) flag(bot, "Report star glow missing.");
  if (!css.includes("card-gloss")) flag(bot, "Card gloss missing.");
  if (!render.includes("ghostCovers")) flag(bot, "Ghost shade missing.");
  if (!render.includes("drawPebbleMoon")) flag(bot, "Empty moons missing.");
  if (!/shadowBlur = lit \?/.test(render)) flag(bot, "Empty moons glow even when dark.");
  if (/coveredPath|pathNeon|brightPath/.test(css + render)) flag(bot, "Path neon coverage crept back.");
  if (!render.includes("drawGlowPuddles")) flag(bot, "Gun glow puddles are not drawn.");
}

async function taste() {
  const bot = "taste-bot";
  await tasteParams(bot);
  await tasteWords(bot);
  await tasteLight(bot);
  if (!issues.some((i) => i.bot === bot)) ok(bot, "Params, short words, and glow lanes hold.");
}

async function lore() {
  const bot = "lore-bot";
  const help = await read("src/components/game/HelpSheet.tsx");
  const title = await read("src/components/game/TitleScreen.tsx");
  const hud = await read("src/components/game/Hud.tsx");
  const end = await read("src/components/game/EndScreen.tsx");
  const loop = await read("src/components/game/LoopScreen.tsx");
  const hangar = await read("src/game/data/hangar.ts");
  const vault = await read("src/game/data/vault.ts");
  const render = await read("src/game/render.ts");
  const chrome = [help, title, hud, end, loop, vault].join("\n");

  if (!title.includes("Hold the lane. Keep the planet.")) flag(bot, "Title lost the outpost tagline.");
  if (!help.includes("Hold the lane. Keep the planet.")) flag(bot, "How it Works lost the outpost tagline.");
  if (!help.includes("Empty ones stay dark") && !help.includes("moons are already there")) {
    flag(bot, "Help does not teach that moons already exist.");
  }
  if (/becomes a small moon|quiet post/.test(chrome)) flag(bot, "Copy still creates moons on plant. Worlds exist first.");
  if (/label="Core"/.test(hud) || />Core</.test(hud)) flag(bot, "HUD lives still say Core. Say Home.");
  if (/Core fell/.test(end)) flag(bot, "Run-over still says Core fell. Say Home fell.");
  const helpQuotes = [...help.matchAll(/"([^"]{1,240})"/g)]
    .map((m) => m[1])
    .filter((q) => /[A-Za-z]/.test(q) && (q.includes(" ") || /^[A-Z]/.test(q)));
  const coreLine = helpQuotes.find((q) => /\bCore\b/.test(q) && !/Gold Core/.test(q));
  if (coreLine) flag(bot, `Help still says Core: "${coreLine}"`);
  const padLine = helpQuotes.find((q) => /\bpad\b/i.test(q) && !/Pad boost/.test(q));
  if (padLine) flag(bot, `Help still says pad: "${padLine}"`);
  if (!render.includes("drawPebbleMoon") || !render.includes("drawSteelPad")) {
    flag(bot, "Field moons missing. Empty pebbles + occupied moons.");
  }
  if (!render.includes("HOME")) flag(bot, "Home planet label missing.");
  if (!title.includes("keeps forever")) flag(bot, "Title saves do not show the main number.");
  if (/id:\s*"bond"/.test(hangar) || /name:\s*"Bond"/.test(hangar)) flag(bot, "Bond is being sold. Bond is never sold.");
  if (!loop.includes("Home held this loop") || !loop.includes("They'll be back")) {
    flag(bot, "Loop gate lost Home held / They'll be back.");
  }
  if (/becomes a moon/.test(loop)) flag(bot, "Loop gate creates moons. Worlds exist first.");
  if (!issues.some((i) => i.bot === bot)) ok(bot, "Outpost lore holds. Home, moons, main number, tagline.");
}

await taste();
await lore();

const report = { ok: issues.length === 0, pass, issues };
report.tally = tallyView(await recordSuite("girls", report));
console.log(JSON.stringify(report, null, 2));
if (issues.length) process.exit(1);
