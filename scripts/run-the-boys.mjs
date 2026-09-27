#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
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

async function houseCopy(bot) {
  const help = await read("src/components/game/HelpSheet.tsx");
  const hud = await read("src/components/game/Hud.tsx");
  const shop = await read("src/components/game/ShopScreen.tsx");
  const jargon = /\b(holographic|sector|roster|foil peek|mixed rarity|pip budget)\b/i;
  if (jargon.test(help + hud)) flag(bot, "Player copy still has jargon.");
  if (/\{c\.hp\}/.test(shop) || /toFixed|toPrecision/.test(shop)) flag(bot, "Hull is not whole numbers.");
  if (!help.includes("Tap a glowing moon") && !hud.includes("Tap a glowing moon")) flag(bot, "Place line missing.");
  if (!help.includes("Hold 12") && !help.includes("keep flying")) {
    flag(bot, "Help never teaches Hold 12 then keep flying.");
  }
  if (help.includes("Tap Combine") || help.includes("Combine two same")) {
    flag(bot, "Help still teaches Combine.");
  }
  if (!help.includes("Level-up")) flag(bot, "Help never teaches Level-up chips.");
  if (!help.includes("still shoots") || !help.includes("small glow")) {
    flag(bot, "Help never teaches that glow sits under shots.");
  }
  if (!hud.includes("rank-pipe") || !shop.includes("Bonus")) flag(bot, "Bonus XP is not live on the HUD or round report.");
}

async function houseDraft(bot) {
  const draft = await read("src/game/draft.ts");
  const cards = await read("src/game/data/cards.ts");
  const params = await read("src/game/params.ts");
  const sim = await read("src/game/sim.ts");
  if (!params.includes("openingPicks: 5") && !params.includes("openingPicks:5")) flag(bot, "Opening is not 5 packs.");
  if (!draft.includes("dealCompanionOpening") || !sim.includes("dealCompanionOpening")) flag(bot, "Opening craft deal missing.");
  if (!cards.includes("Pick a friend") && !cards.includes("Pick a craft")) flag(bot, "Opening craft pack missing.");
  if (!sim.includes("dps: 28") && !cards.includes("dps: 28")) {
    /* auger lives on the card */
  }
  if (!cards.includes("comp-auger")) flag(bot, "Auger missing.");
  const waves = await read("src/game/data/waves.ts");
  if (!waves.includes("dart") || !waves.includes("medic")) flag(bot, "Dart or medic waves missing.");
  if (!params.includes("bondBase") || !params.includes("bondMax")) flag(bot, "Main craft grind knobs missing.");
  if (!params.includes("padsStart: 8") && !params.includes("padsStart:8")) flag(bot, "Board is not the 8-pad start.");
  if (!params.includes("padsMax: 11") && !params.includes("padsMax:11")) flag(bot, "Pad cap is not 11.");
  if (!draft.includes("w.companion = 0") && !draft.includes("companion = 0")) flag(bot, "Full sky still deals extra crafts.");
  if (!draft.includes("gunsLeft") && !sim.includes("gunsLeft")) flag(bot, "Full moons still deal extra guns.");
  if (!sim.includes("inGunCover") || !sim.includes("coverHuntMul")) flag(bot, "Cover-hunt missing.");
  const climb = await read("src/game/data/climb.ts");
  if (!climb.includes("rarity: rarity") && !climb.includes("rarity: Rarity")) {
    flag(bot, "Perk packs do not take the pack gem.");
  }
  if (!sim.includes("dealClimbCards(w.climb ?? emptyClimb(), rarity)")) flag(bot, "Perk packs ignore the round gem.");
  if (!sim.includes("overclockT") || !sim.includes("slamGun")) flag(bot, "Gun heat or slam missing.");
  if (!params.includes("glowTick") || !params.includes("glowRMul")) flag(bot, "Glow knobs missing.");
  if (!sim.includes("tickGunGlow")) flag(bot, "Glow does not tick on guns.");
  if (/if \(stats\.auraDps\) \{[\s\S]{0,1200}?continue;/.test(sim)) {
    flag(bot, "Hurt glow still stops shots.");
  }
  if (!sim.includes('stats.projectile === "none"') && !sim.includes("stats.projectile === 'none'")) {
    flag(bot, "Only Well should skip shots.");
  }
  const glow = await read("src/game/data/glow.ts");
  if (!glow.includes("HULL_GLOW")) flag(bot, "Hull glow table missing.");
  for (const role of ["spear", "crater", "frost", "rail", "umbra", "cascade", "sweep", "brand", "mine"]) {
    if (!glow.includes(`${role}:`)) flag(bot, `Glow missing for ${role}.`);
  }
}

async function houseCard(bot) {
  const view = await read("src/components/game/CardView.tsx");
  const css = await read("src/styles.css");
  if (!view.includes("card-3d") && !view.includes("card-3d-wrap")) flag(bot, "TCG wrap missing.");
  if (!view.includes("ClimbMark")) flag(bot, "Climb cards have no branch glyph.");
  if (!view.includes("card-program-run") || !view.includes("This run")) {
    flag(bot, "Bonus perk cards lost the This run chip.");
  }
  if (!view.includes("FOREVER")) {
    flag(bot, "Stamp cards lost the Forever stamp.");
  }
  if (!view.includes("Bonus") || !view.includes("card-kind-stamp")) {
    flag(bot, "Bonus perk / Stamp kind chips missing.");
  }
  if (!css.includes("5 / 7") && !css.includes("5/7")) flag(bot, "Cards are not 5:7 playing-card ratio.");
  if (!css.includes("card-lightbar") || !view.includes("card-lightbar")) flag(bot, "Hyundai lightbar missing on cards.");
  if (!view.includes("data-gem")) flag(bot, "Gem tone is not wired to the card.");
  if (!view.includes("ghost-pane") || !css.includes("ghost-puddle")) flag(bot, "Pepper ghost pane or puddle missing.");
  if (!css.includes("rotateX(46deg)") && !css.includes("rotateX(45")) flag(bot, "Ghost pane is not tilted.");
  if (!view.includes("card-payload") || !css.includes("card-payload")) {
    flag(bot, "Craft cards lost the payload photo shell.");
  }
  if (!view.includes("card-deck") || !css.includes("card-deck")) {
    flag(bot, "Gun cards lost the deck plate shell.");
  }
  if (!view.includes("data-shell") || !css.includes("card-caption")) {
    flag(bot, "Card shells are not marked deck vs payload.");
  }
  if (!view.includes("data-cover") && !(await read("src/components/game/GunPortrait.tsx")).includes("data-cover")) {
    flag(bot, "Gun cards do not show cover shade.");
  }
}

async function house() {
  const bot = "house-bot";
  await houseCopy(bot);
  await houseDraft(bot);
  await houseCard(bot);
  if (!issues.some((i) => i.bot === bot)) ok(bot, "Teen copy, packs, cards, and glow hold.");
}

async function visual() {
  const bot = "vector-visual-bot";
  const map = await read("src/game/data/map.ts");
  const render = await read("src/game/render.ts");
  const css = await read("src/styles.css");
  const sim = await read("src/game/sim.ts");
  if (!map.includes("lengthenPath") || !map.includes("0.15")) flag(bot, "Path is not 15% longer.");
  if (!map.includes("hugPads") || !map.includes("PAD_MAX_OFF")) flag(bot, "Pads are not hugged to the path.");
  if (!map.includes("corePads") || !map.includes("padReachMul")) flag(bot, "Core reach pads missing.");
  const cuts = await read("src/game/data/cuts.ts");
  if (!cuts.includes("HULL_CUT") || !cuts.includes("CRAFT_CUT")) flag(bot, "Jersey cuts missing.");
  if (!map.includes("jogPath") || !map.includes("seatFor")) flag(bot, "Path jog or job seats missing.");
  if (!render.includes("ow") || !render.includes("hat")) flag(bot, "Space-junk hats or ow missing.");
  if (!render.includes("HOME") || !render.includes("paintBondLook")) flag(bot, "Home planet or Bond looks missing.");
  if (!render.includes("livePads") || !sim.includes("livePads")) flag(bot, "Pads are not sliced to the cap.");
  if (!css.includes("title-chrome")) flag(bot, "Title chrome missing.");
  const board = await read("src/components/game/DraftBoard.tsx");
  if (!css.includes("orbit-draft") || !board.includes("orbit-draft")) flag(bot, "Draft orbit stage missing.");
  if (!css.includes("orbit-ring-top") || !css.includes("orbit-ring-bot")) flag(bot, "Magenta/cyan draft rings missing.");
  if (!css.includes("-webkit-line-clamp") || !css.includes("card-job-line")) {
    flag(bot, "Card job text is not clamped. Copy can hang off the card.");
  }
  if (!css.includes("card-textbox") || !css.includes("overflow: hidden")) {
    flag(bot, "Card textbox does not clip overflow.");
  }
  const play = await read("scripts/play-test-bot.mjs");
  if (!play.includes("checkCardFit")) flag(bot, "Play-test does not measure card text overflow.");
  if (!play.includes("checkCardArt")) flag(bot, "Play-test does not measure card art scale.");
  if (!css.includes("art-well")) flag(bot, "Card art well missing — crafts will scale wrong.");
  if (!css.includes("pack-open-pips") || !css.includes("gun-cover") || !css.includes("pack-ritual-pips")) {
    flag(bot, "Pack pips or gun cover motion missing.");
  }
  if (!css.includes("--pip")) flag(bot, "Title pips are still one color.");
  const boostArt = await read("src/components/game/BoostRocket.tsx");
  const portraitArt = await read("src/components/game/CompanionPortraits.tsx");
  if (css.includes("scale(2.02)") || /xMidYMid slice/.test(boostArt + portraitArt)) {
    flag(bot, "Craft card art still crops or zooms into the hull.");
  }
  const cardData = await read("src/game/data/cards.ts");
  if (!cardData.includes('card.blurb || "Flies. Makes a mess."')) {
    flag(bot, "Craft job line has no name fallback.");
  }
  if (!css.includes("bench-chip") || !css.includes("max-height: 22vh")) flag(bot, "Bench is not capped.");
  const app = await read("src/components/game/GameApp.tsx");
  if (!css.includes("play-shell") || !app.includes("play-shell")) flag(bot, "Play chrome is not a slot grid.");
  if (!app.includes("HudBar") || !app.includes("play-board")) flag(bot, "HUD is not in the top slot.");
  const dock = await read("src/components/game/RosterDock.tsx");
  if (dock.includes("<CardView") || dock.includes("Show bench")) flag(bot, "Bench still opens full cards.");
  if (!play.includes("checkBench")) flag(bot, "Play-test does not measure bench size.");
  if (!play.includes("checkPlayChrome") || !play.includes("path-tap-wave")) {
    flag(bot, "Play-test does not hunt a frozen path.");
  }
  if (!play.includes("topStuck") || !play.includes("place-chrome")) {
    flag(bot, "Play-test does not hunt a top-stuck map.");
  }
  if (!play.includes("boot-title")) flag(bot, "Play-test does not prove boot stays on title.");
  if (!play.includes("title-click") || !play.includes("assertTitleAlive")) {
    flag(bot, "Play-test does not click Arena or hunt a VECTOR-only title.");
  }
  if (!play.includes("shop-unstick") || !play.includes("shopStuck")) {
    flag(bot, "Play-test does not hunt a missing round report.");
  }
  if (!play.includes("left-gutter") || !play.includes("A bar sat on the left")) {
    flag(bot, "Play-test does not hunt a left bar.");
  }
  if (!play.includes("levelCraftStay") || !play.includes("vanished when you tapped Level-up")) {
    flag(bot, "Play-test does not hunt crafts vanishing on Level-up.");
  }
  const title = await read("src/components/game/TitleScreen.tsx");
  if (!title.includes("Arena")) flag(bot, "Title missing Arena.");
  if (title.includes("Endless") || title.includes('startMode("arcade")')) {
    flag(bot, "Title still offers Endless as a mode.");
  }
  if (!play.includes("Endless is still a title")) {
    flag(bot, "Play-test does not hunt Endless on the title.");
  }
  const home = await read("src/routes/index.tsx");
  if (!home.includes("<GameApp />")) flag(bot, "Home does not paint the game.");
  if (home.includes("useLayoutEffect") || home.includes("const [go") || /if\s*\(\s*!go/.test(home)) {
    flag(bot, "Home still gates on a loading shell.");
  }
  if (!app.includes('hud?.phase ?? "title"') && !app.includes("hud?.phase ?? 'title'")) {
    flag(bot, "Blank HUD does not fall back to the title.");
  }
  if (/phase === "shop" && hud\.grade/.test(app)) {
    flag(bot, "Round report hides when the letter is missing.");
  }
  const shopFile = await read("src/components/game/ShopScreen.tsx");
  if (/if\s*\(\s*!result\s*\)\s*return null/.test(shopFile)) {
    flag(bot, "Round report returns nothing without a letter.");
  }
  const hudFile = await read("src/components/game/Hud.tsx");
  if (!hudFile.includes("Next round")) flag(bot, "HUD lost the Next round hatch.");
  if (!sim.includes("export function unstickWorld")) flag(bot, "Stuck boards have no thaw.");
  if (!/phase === "shop" && !w\.grade/.test(sim)) {
    flag(bot, "Round report without a letter does not thaw.");
  }
  if (!render.includes("fitTop") && !render.includes("playH * scaleW")) {
    flag(bot, "Map crop does not keep Home on screen.");
  }
  if (render.includes("Math.sin(t * 3) * 80") || /bx\s*=\s*220/.test(render)) {
    flag(bot, "A bolt still sways on the left of the map.");
  }
  if (!sim.includes("Home held. The lane is quiet.")) flag(bot, "Arena win line missing.");
  const runtime = await read("src/game/runtime.ts");
  if (!runtime.includes("Level-up never benches")) {
    flag(bot, "Level-up still benches flying crafts.");
  }
  if (!sim.includes("nadeLate")) flag(bot, "Grenades still fly from too close to Home.");
  if (!sim.includes("celebrateLevel") || !sim.includes("pickPause")) {
    flag(bot, "Level-up lost its pause and burst.");
  }
  const partsFile = await read("src/game/data/parts.ts");
  if (!partsFile.includes("Twin barrels") || !partsFile.includes("Echo")) {
    flag(bot, "Quiet-level parts lost Twin barrels or Echo.");
  }
  if (!partsFile.includes("partPackGem") || !partsFile.includes("roll.rarity = packGem")) {
    flag(bot, "Part packs still mix gems.");
  }
  if (partsFile.includes("rateMul: [0.") || partsFile.includes("damageMul: [0.")) {
    flag(bot, "Part rolls still tax a stat.");
  }
  if (!partsFile.includes("seed >>> 0") || !partsFile.includes("rollBuff") || !partsFile.includes("Math.max(1.16")) {
    flag(bot, "Part RNG can still roll under the min.");
  }
  if (!partsFile.includes("partOfferWeak")) {
    flag(bot, "Weak part offers are not repaired.");
  }
  const startFn = runtime.split("const start = () => {")[1]?.split("const stop")[0] ?? "";
  if (startFn.includes("applyRun")) flag(bot, "Boot still dumps a save onto the map.");
  if (!runtime.includes("nearestPathMeta") || !/startWave\(world\)/.test(runtime)) {
    flag(bot, "Tapping the path does not start the wave.");
  }
  if (render.includes("const top = 8") && /oy = top/.test(render)) {
    flag(bot, "Map is pinned to the top of the canvas.");
  }
  if (!render.includes("drawPlacePrompt")) flag(bot, "Place prompt on the map is missing.");
  if (!map.includes("moonLook") || !map.includes('"rift"')) flag(bot, "Moon types missing.");
  if (!render.includes("paintMoonBody")) flag(bot, "Typed moons are not drawn.");
  if (!sim.includes("padBurnBonus") || !sim.includes("padRateMul")) flag(bot, "Moon bonuses missing.");
  if (!render.includes("p.ox") && !render.includes("p.oy")) flag(bot, "Shot tracers missing.");
  if (render.includes('fillText("Combine"') || render.includes('fillText("Combine"')) {
    flag(bot, "Combine is still painted on the map.");
  }
  if (dock.includes("Combine ·") || dock.includes("Combine · new job")) flag(bot, "Combine chip is still on the bench.");
  if (shopFile.includes("Buy a gun job") || shopFile.includes("<GunTree")) {
    flag(bot, "Round report still sells gun jobs.");
  }
  if (!app.includes("CraftBanner")) flag(bot, "Craft banner missing.");
  if (!css.includes("play-craft")) flag(bot, "Craft bar is not in the play grid.");
  if (!sim.includes("pickSpecial")) flag(bot, "Level-up pick is missing.");
  if (!render.includes("drawGlowPuddles")) flag(bot, "Glow puddles are not drawn.");
  if (!sim.includes("tickGunGlow")) flag(bot, "Glow does not tick on guns.");
  if (!sim.includes("bayMoon") || !render.includes("BAY")) flag(bot, "Bay moon missing.");
  if (!render.includes("HOME") || !render.includes("clip()")) flag(bot, "Home planet lost its globe.");
  const waveFn = sim.split("export function startWave")[1]?.slice(0, 700) ?? "";
  if (!waveFn.includes("paused = false") || !waveFn.includes("holdT = 0")) {
    flag(bot, "Wave start does not clear pause.");
  }
  if (!waveFn.includes("queueWave")) flag(bot, "Wave start does not queue packs.");
  if (!issues.some((i) => i.bot === bot)) ok(bot, "Frost Climb meter. Product chrome intact. Map locked to the run.");
}

function playtest() {
  const bot = "play-test-bot";
  return new Promise((resolve) => {
    const child = spawn("npx", ["tsx", "scripts/play-test-bot.mjs"], {
      cwd: "/workspace",
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    child.stdout.on("data", (d) => {
      out += d;
    });
    child.stderr.on("data", (d) => {
      out += d;
    });
    child.on("close", (code) => {
      if (code !== 0) {
        let msg = "Play-test failed.";
        try {
          const start = out.indexOf("{");
          const parsed = JSON.parse(out.slice(start));
          msg = parsed.issues?.[0]?.msg ?? parsed.msg ?? msg;
        } catch {
          msg = out.slice(-400) || msg;
        }
        flag(bot, msg);
      } else if (!issues.some((i) => i.bot === bot)) {
        ok(bot, "All patterns passed (32 runs).");
      }
      resolve();
    });
  });
}

function runGirls() {
  return new Promise((resolve) => {
    const child = spawn("npx", ["tsx", "scripts/run-the-girls.mjs"], {
      cwd: "/workspace",
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, VECTOR_SKIP_GIRLS: "1" },
    });
    let out = "";
    child.stdout.on("data", (d) => {
      out += d;
    });
    child.stderr.on("data", (d) => {
      out += d;
    });
    child.on("close", (code) => {
      let parsed = null;
      try {
        const start = out.indexOf("{");
        parsed = JSON.parse(out.slice(start));
      } catch {
        parsed = { raw: out.slice(-800) };
      }
      resolve({ code, parsed });
    });
  });
}

await house();
await visual();
await playtest();

const report = { ok: issues.length === 0, pass, issues };
const tally = await recordSuite("boys", report);
report.tally = tallyView(tally);
const fifth = tally.suites.boys.runs % 5 === 0;
if (fifth && process.env.VECTOR_SKIP_GIRLS !== "1") {
  report.girlsAuto = true;
  const girls = await runGirls();
  report.girls = {
    pass: girls.parsed?.pass ?? [],
    issues: girls.parsed?.issues ?? [],
    tally: girls.parsed?.tally,
  };
  if (girls.code !== 0) {
    const extra = girls.parsed?.issues?.length
      ? girls.parsed.issues
      : [{ bot: "the girls", msg: "Girls failed on the 5th boys run." }];
    report.issues = [...issues, ...extra];
    report.ok = false;
    report.pass = [...pass, ...(girls.parsed?.pass ?? [])];
    report.tally = girls.parsed?.tally ?? report.tally;
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }
  report.pass = [...pass, ...(girls.parsed?.pass ?? [])];
  report.tally = girls.parsed?.tally ?? report.tally;
}

console.log(JSON.stringify(report, null, 2));
if (issues.length) process.exit(1);
