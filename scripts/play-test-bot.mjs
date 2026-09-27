#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const url = process.argv[2] || "http://127.0.0.1:8080/";
const dir = "/workspace/screenshots";
await mkdir(dir, { recursive: true });

const issues = [];
const results = [];
const JARGON = /\b(holographic|sector|roster|foil peek|mixed rarity|pip budget)\b/i;

const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 390, height: 844 };
const TABLET = { width: 768, height: 1024 };
const SHORT = { width: 1280, height: 560 };
const WIDE = { width: 1600, height: 900 };
const PREVIEW = { width: 900, height: 820 };
const NEED_CASES = 32;

function flag(pattern, msg, extra = {}) {
  issues.push({ pattern, msg, ...extra });
}

async function skipRitual(page) {
  for (let i = 0; i < 5; i++) {
    if (await page.locator(".draft-rail .card-3d-wrap").count()) return;
    const stage = page.locator(".orbit-stage");
    if (await stage.count()) {
      await stage.click({ force: true }).catch(() => {});
    } else {
      await page.locator(".pack-ritual-pips, button:has-text('Open'), button:has-text('Unfolding')").first().click({ force: true }).catch(() => {});
    }
    await page.waitForTimeout(90);
  }
}

async function snap(page) {
  return page.evaluate(() => (window.__gridironQA ? window.__gridironQA.snap() : { phase: "none" }));
}

async function qa(page, fn, arg) {
  return page.evaluate(({ fn, arg }) => {
    const api = window.__gridironQA;
    if (!api || typeof api[fn] !== "function") return { phase: "missing-qa", fn };
    return arg === undefined ? api[fn]() : api[fn](arg);
  }, { fn, arg });
}

async function checkScale(page, pattern) {
  const v = await qa(page, "view");
  if (!v || v.phase === "missing-qa") {
    flag(pattern, "Scale probe missing.");
    return;
  }
  if (v.tiny) flag(pattern, `Map is tiny. Fill ${Math.round((v.axisFill ?? 0) * 100)}%.`, v);
  if (v.collapsed) flag(pattern, "Canvas is too short for the window.", v);
  if (v.narrow) flag(pattern, "Canvas does not fill the window width.", v);
  if ((v.axisFill ?? 0) < 0.72) flag(pattern, "Map does not fill the play area.", v);
  if (v.topStuck) flag(pattern, "Map is stuck to the top. Empty space under the path.", v);
  if (v.homeCut) flag(pattern, "Home is cut off.", v);
  if (v.spawnCut) flag(pattern, "Spawn is cut off.", v);
}

async function checkPlayChrome(page, pattern) {
  const s = await snap(page);
  if (s.phase !== "placement" && s.phase !== "combat") return;
  const chrome = await page.evaluate(() => {
    const top = document.querySelector(".play-top");
    const craft = document.querySelector(".play-craft");
    const bench = document.querySelector(".play-bench, .bench-dock");
    const defend = [...document.querySelectorAll("button")].find((b) => (b.textContent || "").trim() === "Defend");
    const gold = /credit/i.test(document.body.innerText);
    const vis = (r) => !!(r && r.height > 8 && r.bottom > 4 && r.top < window.innerHeight - 4);
    const tr = top?.getBoundingClientRect();
    const cr = craft?.getBoundingClientRect();
    const br = bench?.getBoundingClientRect();
    const dr = defend?.getBoundingClientRect();
    return {
      gold,
      topH: tr ? Math.round(tr.height) : 0,
      craftH: cr ? Math.round(cr.height) : 0,
      benchH: br ? Math.round(br.height) : 0,
      defend: vis(dr),
      topVis: vis(tr),
      craftVis: vis(cr),
      benchVis: vis(br),
    };
  });
  if (!chrome.gold) flag(pattern, "Credit is missing from the HUD.");
  if (!chrome.topVis || chrome.topH < 20) flag(pattern, "Top bar is missing on the map.");
  if (s.phase === "placement" && !chrome.defend) flag(pattern, "Defend is not on screen.");
  if ((s.crafts ?? 0) > 0 && (!chrome.craftVis || chrome.craftH < 12)) {
    flag(pattern, "Craft bar is missing on the map.");
  }
  if (!chrome.benchVis || chrome.benchH < 12) flag(pattern, "Gun bench is missing on the map.");
}

async function checkCraftStay(page, pattern) {
  const v = await qa(page, "levelCraftStay");
  if (!v || v.phase === "missing-qa" || v.missing) return;
  if (!v.stayed) flag(pattern, "A craft vanished when you tapped Level-up.", v);
}

async function assertTitleAlive(page, pattern) {
  const report = await page.evaluate(() => {
    const body = (document.body?.innerText || "").replace(/\s+/g, " ").trim();
    const labels = [...document.querySelectorAll("button")].map((b) => (b.textContent || "").trim());
    return {
      body: body.slice(0, 120),
      arena: labels.includes("Arena"),
      how: labels.includes("Briefing"),
    };
  });
  if (!report.arena && /VECTOR/i.test(report.body)) {
    flag(pattern, "Only the word VECTOR. No Arena.");
  } else if (!report.arena) {
    flag(pattern, "Arena is missing on the title.");
  }
  if (!report.how) flag(pattern, "Briefing is missing on the title.");
}

async function assertBoardHasNext(page, pattern) {
  const s = await snap(page);
  if (s.phase === "placement" || s.phase === "combat") {
    await checkPlayChrome(page, pattern);
    return s;
  }
  const body = await page.locator("body").innerText();
  if (s.phase === "shop") {
    if (!s.grade) flag(pattern, "Round report was gone so there was nothing to tap.");
    const next = await page.getByRole("button", { name: /Next round|Open draft|Perk pack next|Engrave a gun/i }).count();
    if (!next && !/Round report/i.test(body)) {
      flag(pattern, "Round report was gone so there was nothing to tap.");
    }
    return s;
  }
  if (s.phase === "opening" || s.phase === "draft" || s.phase === "loot") {
    if ((s.draftCount ?? 0) < 1) flag(pattern, "Empty pack. No cards to pick.", { phase: s.phase });
  }
  return s;
}

async function tapPath(page) {
  const canvas = page.locator("canvas");
  const box = await canvas.boundingBox();
  const v = await qa(page, "view");
  if (!box || !v || v.phase === "missing-qa") return false;
  const pt = await qa(page, "pathPoint");
  const xw = Number(pt?.x ?? 400);
  const yw = Number(pt?.y ?? 200);
  await page.mouse.click(
    box.x + (v.ox ?? 0) + xw * (v.scale ?? 1),
    box.y + (v.oy ?? 0) + yw * (v.scale ?? 1),
  );
  return true;
}

async function drainPicks(page) {
  for (let i = 0; i < 8; i++) {
    const s = await snap(page);
    if (!((s.specialReady ?? 0) > 0 || s.pickPause)) return;
    await qa(page, "pickSpecialFirst");
    await page.waitForTimeout(40);
  }
}

async function expectLiveWave(page, pattern, how) {
  const started = await page
    .waitForFunction(() => window.__gridironQA?.snap?.().phase === "combat", { timeout: 8000 })
    .then(() => true)
    .catch(() => false);
  if (!started) {
    flag(pattern, `${how} did not start the wave.`);
    return false;
  }
  await page.waitForTimeout(450);
  await drainPicks(page);
  const s = await snap(page);
  if ((s.enemyCount ?? 0) < 1 && (s.spawnLeft ?? 0) < 1) {
    flag(pattern, "Wave started but nothing spawned. Path looks frozen.");
    return false;
  }
  if (s.paused && !s.pickPause) {
    flag(pattern, "Wave started paused. Path looks frozen.");
    return false;
  }
  return true;
}

function checkCopy(pattern, text, need = []) {
  if (JARGON.test(text)) flag(pattern, `Jargon on screen: "${text.match(JARGON)?.[0]}".`);
  for (const n of need) {
    if (!text.toLowerCase().includes(n.toLowerCase())) flag(pattern, `Missing "${n}".`);
  }
}

async function checkTitleCta(page, pattern) {
  const report = await page.evaluate(() => {
    const help = document.querySelector("button.help-btn");
    const keep = document.querySelector("button.keep-bank, button.keep-btn, button[aria-label='Vault']");
    const h1 = document.querySelector("h1");
    if (!help || !keep || !h1) return { missing: true };
    const hb = help.getBoundingClientRect();
    const kb = keep.getBoundingClientRect();
    const tb = h1.getBoundingClientRect();
    const issues = [];
    if (hb.height < 40 || kb.height < 40) issues.push("cta-too-small");
    const filt = getComputedStyle(h1).filter || "";
    if (filt && filt !== "none") issues.push("title-filter-ghost");
    const glowLeak = (el) => /0px 0px (1[3-9]|[2-9]\d)px/.test(getComputedStyle(el).boxShadow || "");
    if (glowLeak(help)) issues.push("help-glow-leak");
    if (glowLeak(keep)) issues.push("keep-glow-leak");
    const slab = (el) => /0px 8px 0px/.test(getComputedStyle(el).boxShadow || "");
    const overlap = (a, b) => a && b && a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
    const orbit = document.querySelector(".title-orbit, .orbit-bar")?.getBoundingClientRect();
    if (orbit && (overlap(orbit, hb) || overlap(orbit, kb))) issues.push("orbit-on-cta");
    const flying = [...document.querySelectorAll(".orbit-chip")].some((el) => {
      const r = el.getBoundingClientRect();
      return overlap(r, hb) || overlap(r, kb);
    });
    const save = document.querySelector(".save-bank");
    if (save) {
      const sh = getComputedStyle(save).boxShadow || "";
      if (/0px 0px (1[4-9]|[2-9]\d)px/.test(sh)) issues.push("save-glow-up");
    }
    const hits = [];
    for (const r of [hb, kb]) {
      for (let x = r.left + 8; x < r.right - 8; x += 10) {
        const el = document.elementFromPoint(x, r.bottom + 8);
        if (!el) continue;
        if (el.closest(".exhaust-glyph, .rocket-reflect-well, .title-puddle")) hits.push("paint-under-cta");
      }
    }
    return { issues, hits, gap: Math.round(hb.top - tb.bottom) };
  });
  if (report.missing) {
    flag(pattern, "Title CTAs missing.");
    return;
  }
  for (const i of report.issues ?? []) {
    if (i === "help-glow-leak" || i === "keep-glow-leak") flag(pattern, "Glow pools under a title button.", report);
    else if (i === "bevel-slab-under-cta") flag(pattern, "3D slab sits under a title button.", report);
    else if (i === "title-eats-cta") flag(pattern, "VECTOR title collides with Briefing / Vault.", report);
    else if (i === "title-filter-ghost") flag(pattern, "VECTOR chrome filter would smear under Briefing / Vault.", report);
    else if (i === "save-glow-up") flag(pattern, "Save bank glow leaks up under Vault.", report);
    else flag(pattern, `Title CTA issue: ${i}.`, report);
  }
  if (report.hits?.length) flag(pattern, "Craft exhaust or puddle sits under Briefing / Vault.", report);
}

async function checkCardArt(page, pattern) {
  const bad = await page.evaluate(() => {
    const hits = [];
    const nodes = [...document.querySelectorAll(".draft-rail .card-3d-wrap")];
    const wraps = nodes.map((el) => el.getBoundingClientRect());
    if (nodes.length >= 2) {
      const ws = nodes.map((el) => el.offsetWidth);
      const hs = nodes.map((el) => el.offsetHeight);
      const dw = Math.max(...ws) - Math.min(...ws);
      const dh = Math.max(...hs) - Math.min(...hs);
      if (dw > 14) hits.push({ why: "uneven-width", fill: Math.round(dw) });
      if (dh > 14) hits.push({ why: "uneven-height", fill: Math.round(dh) });
    }
    for (const el of nodes) {
      if (el.offsetWidth < 40) continue;
      const ratio = el.offsetHeight / el.offsetWidth;
      if (ratio < 1.22 || ratio > 1.55) hits.push({ why: "ratio", ratio: Math.round(ratio * 100) / 100 });
    }
    for (const win of document.querySelectorAll(".draft-rail .card-window")) {
      const wr = win.getBoundingClientRect();
      if (wr.height < 24) continue;
      const svg = win.querySelector(".ghost-subject .art-well svg") || win.querySelector(".art-well svg");
      if (!svg) {
        hits.push({ why: "no-art" });
        continue;
      }
      let fill = 0;
      const ar = svg.getBoundingClientRect();
      if (ar.width > 2 && ar.height > 2) {
        fill = Math.max(ar.width / wr.width, ar.height / wr.height);
      }
      const payload = !!win.closest("[data-shell='payload']");
      if (fill < 0.5) hits.push({ why: "tiny", fill: Math.round(fill * 100) });
      if (!payload && fill > 1.12) hits.push({ why: "overflow", fill: Math.round(fill * 100) });
      if (payload && fill > 2.2) hits.push({ why: "overflow", fill: Math.round(fill * 100) });
    }
    for (const line of document.querySelectorAll(".draft-rail .card-job-line")) {
      const t = (line.textContent || "").trim();
      if (t === "Flies. Makes a mess.") hits.push({ why: "fallback-job" });
    }
    return hits;
  }).catch(() => []);
  if (bad.length) {
    const h = bad[0];
    if (h.why === "fallback-job") {
      flag(pattern, "Craft job line says Flies. Makes a mess.");
      return;
    }
    const extra = h.fill != null ? ` ${h.fill}%` : h.ratio != null ? ` ${h.ratio}` : "";
    flag(pattern, `Card art scale is off (${h.why}${extra}).`);
  }
}

async function checkBench(page, pattern) {
  const r = await page.evaluate(() => {
    const dock = document.querySelector(".bench-dock");
    if (!dock) return null;
    const box = dock.getBoundingClientRect();
    const chip = dock.querySelector(".bench-chip, .card-3d-wrap, .card-3d");
    const chipBox = chip?.getBoundingClientRect();
    return {
      frac: box.height / Math.max(1, window.innerHeight),
      h: Math.round(box.height),
      chipH: chipBox ? Math.round(chipBox.height) : 0,
    };
  }).catch(() => null);
  if (r && r.frac > 0.24) flag(pattern, `Bench eats ${Math.round(r.frac * 100)}% of the screen.`);
  if (r && r.chipH > 120) flag(pattern, `Bench chips are ${r.chipH}px tall.`);
}

async function checkCardFit(page, pattern) {
  const spill = await page.evaluate(() => {
    const cards = [...document.querySelectorAll(".draft-rail .card-3d.card-face")];
    const hits = [];
    for (const el of cards) {
      const box = el.getBoundingClientRect();
      if (box.height < 8) continue;
      for (const node of el.querySelectorAll("p, .card-textbox, .card-nameplate, .set-combo, .card-job-line")) {
        const r = node.getBoundingClientRect();
        if (r.height < 2) continue;
        const hang = r.bottom - box.bottom;
        if (hang > 3) hits.push({ hang: Math.round(hang), cls: node.className });
      }
    }
    return hits;
  }).catch(() => []);
  if (spill.length) {
    flag(pattern, `Card text hangs off the bottom (${spill[0].hang}px).`);
  }
}

async function inspectPack(page, pattern) {
  const s = await snap(page);
  if (s.phase !== "opening" && s.phase !== "draft" && s.phase !== "loot") return s;
  await checkCardFit(page, pattern);
  await checkCardArt(page, pattern);
  if ((s.draftCount ?? 0) === 0) flag(pattern, "Empty pack. No cards to pick.", { phase: s.phase, title: s.draftTitle });
  if (s.packPure === false) flag(pattern, "Pack mixed kind or gem.", { kinds: s.draftKinds, rarity: s.packRarity });
  const ids = s.draftTemplates ?? [];
  if (ids.length && new Set(ids).size !== ids.length) {
    const kind = s.packKind ?? (s.draftKinds ?? [])[0];
    if (s.phase === "opening" || kind === "companion" || kind === "kit") {
      flag(pattern, "Pack has two of the same card.", { ids });
    }
  }
  if (s.packGift && (s.giftLean ?? 0) < (s.draftCount ?? 0)) {
    flag(pattern, "Gift chip on a pack that does not all lean that job.", {
      gift: s.packGift,
      lean: s.giftLean,
      count: s.draftCount,
    });
  }
  return s;
}

async function draftUntilPlacement(page, pattern, opts = {}) {
  const { pick = "first", skip = false, ban = false, double = false } = opts;
  let lastTitle = "";
  let same = 0;
  for (let i = 0; i < 16; i++) {
    await page.waitForFunction(() => window.__gridironQA, { timeout: 15000 }).catch(() => {});
    await skipRitual(page);
    const s = await inspectPack(page, pattern);
    if (s.phase === "placement" || s.phase === "combat" || s.phase === "shop" || s.phase === "end") return s;
    if (s.phase === "fit") {
      await qa(page, "fitFirst");
      await page.waitForTimeout(50);
      continue;
    }
    if (s.draftTitle === lastTitle) same += 1;
    else same = 0;
    lastTitle = s.draftTitle;
    if (same >= 4) {
      flag(pattern, "Stuck on the same pack.", { title: s.draftTitle, picks: s.draftPicksLeft });
      return s;
    }
    if (skip && s.phase === "draft") {
      await qa(page, "skipOffer");
      await page.waitForTimeout(60);
      continue;
    }
    if (ban && (s.bansThisRound ?? 0) === 0 && (s.draftCount ?? 0) >= 2 && s.phase !== "opening") {
      /* Ban is gone. Pick as normal. */
    }
    if (double && /take two/i.test(s.draftTitle ?? "")) {
      const left = s.draftPicksLeft;
      await qa(page, "pickFirst");
      await qa(page, "pickFirst");
      const mid = await snap(page);
      if (mid.phase === "opening" && mid.draftPicksLeft === left) {
        flag(pattern, "Double-click froze take-two.", { left, mid: mid.draftPicksLeft });
        return mid;
      }
      await page.waitForTimeout(50);
      continue;
    }
    if (pick === "last") await qa(page, "pickLast");
    else await qa(page, "pickFirst");
    await page.waitForTimeout(50);
  }
  flag(pattern, "Never reached placement.");
  return snap(page);
}

async function bootRaw(page) {
  await page.addInitScript(() => {
    try {
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith("vector-run")) localStorage.removeItem(k);
      }
      sessionStorage.removeItem("vector-live");
    } catch {
      /* */
    }
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  return page
    .waitForFunction(() => window.__gridironQA, { timeout: 20000 })
    .then(() => true)
    .catch(() => false);
}

async function boot(page) {
  const ok = await bootRaw(page);
  if (!ok) throw new Error("Title never woke up.");
  await page.waitForSelector("button:has-text('Arena')", { timeout: 20000 });
}

async function clickStart(page, mode = "story") {
  const label = mode === "arcade" ? "Endless" : "Arena";
  const start = page.getByRole("button", { name: label, exact: true });
  const retry = page.getByRole("button", { name: /Play again|Retry|New draft/i });
  if (await start.count()) await start.first().click();
  else if (await retry.count()) await retry.first().click();
  else await page.getByRole("button", { name: label }).click();
  const bind = page.locator(".save-bind-card");
  if (await bind.count()) await bind.first().click();
  const skipGate = page.getByRole("button", { name: /Just play|No thanks/i });
  if (await skipGate.count()) await skipGate.click();
  const opened = await page
    .waitForFunction(() => window.__gridironQA?.snap?.().phase === "opening", { timeout: 4000 })
    .then(() => true)
    .catch(() => false);
  if (!opened) {
    const still = page.getByRole("button", { name: label, exact: true });
    if (await still.count()) await still.click({ force: true });
    await page.waitForFunction(() => window.__gridironQA?.snap?.().phase === "opening", { timeout: 20000 });
  }
}

async function clickNewDraft(page) {
  return clickStart(page, "story");
}

async function toPlace(page, id, opts) {
  await boot(page);
  await clickNewDraft(page);
  const s = await draftUntilPlacement(page, id, opts);
  if (s.phase === "placement") {
    await page.locator(".play-top").waitFor({ state: "visible", timeout: 4000 }).catch(() => {});
    await checkScale(page, id);
    await checkBench(page, id);
    await checkPlayChrome(page, id);
    await checkCraftStay(page, id);
  }
  return s;
}

const browser = await chromium.launch({ args: ["--no-sandbox"] });

async function withPage(viewport, fn) {
  const page = await browser.newPage({ viewport });
  page.setDefaultTimeout(20000);
  const logs = [];
  page.on("pageerror", (e) => logs.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") logs.push(m.text());
  });
  try {
    await fn(page, logs);
  } finally {
    for (const l of logs) {
      if (/Failed to load|favicon|net::/i.test(l)) continue;
      if (/Expected static flag was missing|Please notify the React team/i.test(l)) continue;
      flag("console", l.slice(0, 180));
    }
    await page.close();
  }
}

const cases = [
  {
    id: "help-keep",
    vp: DESKTOP,
    run: async (page, id) => {
      await boot(page);
      await page.getByRole("button", { name: "Briefing", exact: true }).click();
      await page.waitForSelector("text=Hold the lane");
      for (let i = 0; i < 12; i++) {
        const next = page.getByRole("button", { name: "Next", exact: true });
        const got = page.getByRole("button", { name: "Got it", exact: true });
        if (await got.count()) {
          await got.click();
          break;
        }
        if (await next.count()) await next.click();
        else break;
      }
      if (await page.getByRole("heading", { name: "Hold the lane" }).count()) flag(id, "Briefing did not close.");
      await page.getByRole("button", { name: "Vault", exact: true }).click();
      await page.waitForSelector("text=What you saved");
      const close = page.getByRole("button", { name: /Close|Got it/i }).first();
      if (await close.count()) await close.click();
    },
  },
  {
    id: "first-picks",
    vp: DESKTOP,
    shot: "boys-first-picks.png",
    run: async (page, id) => {
      const s = await toPlace(page, id, { pick: "first" });
      if (s.phase !== "placement") return;
      await qa(page, "placeBench");
      const placed = await snap(page);
      if (!placed.canStart && placed.placed < 1) flag(id, "No gun on a pad after place.");
      if (placed.canStart) {
        await qa(page, "startWave");
        await qa(page, "speed3");
        const okWave = await expectLiveWave(page, id, "Defend");
        if (okWave) await checkScale(page, id);
      }
      const more = page.getByRole("button", { name: "More" });
      if (await more.count()) await more.click();
      const body = await page.locator("body").innerText();
      if (!/Bonus/i.test(body)) flag(id, "Bonus meter missing on the HUD.");
    },
  },
  {
    id: "last-picks",
    vp: DESKTOP,
    run: async (page, id) => {
      const s = await toPlace(page, id, { pick: "last" });
      if (s.phase !== "placement") flag(id, "Last-card path never placed.", { phase: s.phase });
    },
  },
  {
    id: "double-click",
    vp: DESKTOP,
    run: async (page, id) => {
      await toPlace(page, id, { pick: "first", double: true });
    },
  },
  {
    id: "ban-then-pick",
    vp: DESKTOP,
    run: async (page, id) => {
      const s = await toPlace(page, id, { pick: "first" });
      if (s.phase !== "placement") flag(id, "Place path never landed.", { phase: s.phase });
    },
  },
  {
    id: "skip-spam",
    vp: DESKTOP,
    run: async (page, id) => {
      await boot(page);
      await clickNewDraft(page);
      if (await page.getByRole("button", { name: /Skip this pack/i }).count()) flag(id, "Skip showed on the opening pack.");
      await draftUntilPlacement(page, id, { pick: "first" });
      await qa(page, "placeBench");
      await qa(page, "flatNow");
      await page.waitForTimeout(80);
      if (await page.getByRole("button", { name: /Skip this pack/i }).count()) flag(id, "Skip showed on a round pack.");
      await inspectPack(page, id);
    },
  },
  {
    id: "skill-fail",
    vp: DESKTOP,
    run: async (page, id) => {
      await boot(page);
      await clickNewDraft(page);
      await skipRitual(page);
      await page.waitForFunction(() => window.__gridironQA);
      const fail = await qa(page, "tryBadSkill");
      if (fail && fail.picksUnchanged === false) flag(id, "Bad skill ate the pick.");
      if (fail && fail.stillInPack === false) flag(id, "Bad skill vanished from the pack.");
    },
  },
  {
    id: "mobile-first",
    vp: PHONE,
    shot: "boys-mobile.png",
    run: async (page, id) => {
      const s = await toPlace(page, id, { pick: "first" });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
      if (overflow) flag(id, "Page scrolls sideways on a phone.");
      if (s.phase !== "placement") flag(id, "Mobile never reached place.", { phase: s.phase });
    },
  },
  {
    id: "scale-desktop",
    vp: DESKTOP,
    run: async (page, id) => {
      await toPlace(page, id, { pick: "first" });
    },
  },
  {
    id: "scale-phone",
    vp: PHONE,
    run: async (page, id) => {
      await toPlace(page, id, { pick: "first" });
    },
  },
  {
    id: "scale-tablet",
    vp: TABLET,
    run: async (page, id) => {
      await toPlace(page, id, { pick: "first" });
    },
  },
  {
    id: "scale-short",
    vp: SHORT,
    shot: "boys-scale-short.png",
    run: async (page, id) => {
      await toPlace(page, id, { pick: "first" });
    },
  },
  {
    id: "scale-wide",
    vp: WIDE,
    run: async (page, id) => {
      await toPlace(page, id, { pick: "first" });
    },
  },
  {
    id: "text-title",
    vp: DESKTOP,
    run: async (page, id) => {
      await boot(page);
      const body = await page.locator("body").innerText();
      checkCopy(id, body, ["VECTOR", "Tower Defense", "Arena", "Briefing", "Vault"]);
      await checkTitleCta(page, id);
    },
  },
  {
    id: "text-help",
    vp: DESKTOP,
    run: async (page, id) => {
      await boot(page);
      await page.getByRole("button", { name: "Briefing", exact: true }).click();
      let all = "";
      for (let i = 0; i < 12; i++) {
        all += `\n${await page.locator("body").innerText()}`;
        const got = page.getByRole("button", { name: "Got it", exact: true });
        const next = page.getByRole("button", { name: "Next", exact: true });
        if (await got.count()) {
          await got.click();
          break;
        }
        if (await next.count()) await next.click();
        else break;
      }
      checkCopy(id, all, ["Hold 12", "Keep flying", "Credit", "Signal"]);
    },
  },
  {
    id: "text-place",
    vp: DESKTOP,
    shot: "boys-text-place.png",
    run: async (page, id) => {
      const s = await toPlace(page, id, { pick: "first" });
      if (s.phase !== "placement") return;
      const body = await page.locator("body").innerText();
      checkCopy(id, body, ["Tap a glowing moon", "Credit", "Home", "Defend"]);
      const banner = body.match(/Tap a glowing moon\.?/);
      if (banner && banner[0].split(/\s+/).length > 8) flag(id, "Place banner is too long.");
    },
  },
  {
    id: "text-hud",
    vp: DESKTOP,
    run: async (page, id) => {
      const s = await toPlace(page, id, { pick: "first" });
      if (s.phase !== "placement") return;
      const body = await page.locator("body").innerText();
      checkCopy(id, body, ["Credit", "Home", "More"]);
      if (/\broster\b/i.test(body)) flag(id, "HUD still says roster.");
    },
  },
  {
    id: "text-cards",
    vp: DESKTOP,
    run: async (page, id) => {
      await boot(page);
      await clickNewDraft(page);
      await skipRitual(page);
      const body = await page.locator("body").innerText();
      if (!/\bGun\b/i.test(body) && !/\bCraft\b/i.test(body)) flag(id, "Cards never say Gun or Craft.");
      checkCopy(id, body);
    },
  },
  {
    id: "feature-more",
    vp: DESKTOP,
    run: async (page, id) => {
      const s = await toPlace(page, id, { pick: "first" });
      if (s.phase !== "placement") return;
      await page.getByRole("button", { name: "More" }).click();
      const body = await page.locator("body").innerText();
      checkCopy(id, body, ["Bonus", "Credit"]);
    },
  },
  {
    id: "feature-mute",
    vp: DESKTOP,
    run: async (page, id) => {
      const s = await toPlace(page, id, { pick: "first" });
      if (s.phase !== "placement") return;
      const mute = page.getByRole("button", { name: "Mute" });
      if (!(await mute.count())) flag(id, "Mute button missing.");
      else await mute.click();
      if (!(await page.getByRole("button", { name: "Unmute" }).count())) flag(id, "Mute did not flip.");
    },
  },
  {
    id: "feature-speed",
    vp: DESKTOP,
    run: async (page, id) => {
      const s = await toPlace(page, id, { pick: "first" });
      if (s.phase !== "placement") return;
      await qa(page, "placeBench");
      await qa(page, "startWave");
      const started = await page
        .waitForFunction(() => window.__gridironQA.snap().phase === "combat", { timeout: 8000 })
        .then(() => true)
        .catch(() => false);
      if (!started) {
        flag(id, "Combat never started for speed.");
        return;
      }
      const speed = page.getByRole("button", { name: /×$/ });
      if (!(await speed.count())) flag(id, "Speed button missing.");
      else {
        await speed.click();
        const after = await snap(page);
        if ((after.speed ?? 1) === 1) flag(id, "Speed did not change.");
      }
    },
  },
  {
    id: "feature-keep-flux",
    vp: DESKTOP,
    run: async (page, id) => {
      await boot(page);
      const keep = page.getByRole("button", { name: "Vault" });
      if (!(await keep.count())) flag(id, "Vault button missing.");
      const body = await page.locator("body").innerText();
      if (!/Vault/i.test(body)) flag(id, "Title never says Vault.");
      await keep.click();
      await page.waitForSelector("text=What you saved");
      checkCopy(id, await page.locator("body").innerText(), ["What you saved"]);
    },
  },
  {
    id: "feature-ghost",
    vp: DESKTOP,
    run: async (page, id) => {
      const s = await toPlace(page, id, { pick: "first" });
      if (s.phase !== "placement") return;
      await qa(page, "pickBench");
      const hold = await snap(page);
      if (!hold.selectedCard && (hold.placed ?? 0) < 1) flag(id, "No gun selected to show pad shade.");
      if ((hold.remainingPads ?? 1) < 1 && (hold.placed ?? 0) < 1) flag(id, "No pads left to plant.");
    },
  },
  {
    id: "feature-chips",
    vp: DESKTOP,
    run: async (page, id) => {
      await boot(page);
      await clickNewDraft(page);
      await skipRitual(page);
      const gun = await page.locator(".card-kind-gun").count();
      const craft = await page.locator(".card-kind-craft").count();
      if (gun + craft < 1) flag(id, "No Gun/Craft chip on the opening pack.");
    },
  },
  {
    id: "boot-title",
    vp: DESKTOP,
    run: async (page, id) => {
      await boot(page);
      const s = await snap(page);
      if (s.phase && s.phase !== "title") flag(id, `Boot opened on ${s.phase} instead of title.`);
      const story = page.getByRole("button", { name: "Arena", exact: true });
      const arcade = page.getByRole("button", { name: "Endless", exact: true });
      if (!(await story.count())) flag(id, "Arena is missing on boot.");
      if (await arcade.count()) flag(id, "Endless is still a title mode.");
      await assertTitleAlive(page, id);
    },
  },
  {
    id: "place-chrome",
    vp: PREVIEW,
    shot: "boys-place-chrome.png",
    run: async (page, id) => {
      const s = await toPlace(page, id, { pick: "first" });
      if (s.phase !== "placement") {
        flag(id, "Tall preview never reached place.", { phase: s.phase });
        return;
      }
      await qa(page, "placeBench");
      const planted = await snap(page);
      if (!planted.canStart) flag(id, "Guns down but Defend stayed dead.");
      await checkPlayChrome(page, id);
    },
  },
  {
    id: "path-tap-wave",
    vp: DESKTOP,
    shot: "boys-path-tap.png",
    run: async (page, id) => {
      const s = await toPlace(page, id, { pick: "first" });
      if (s.phase !== "placement") return;
      await qa(page, "placeBench");
      const planted = await snap(page);
      if ((planted.placed ?? 0) < 1) {
        flag(id, "No gun on a pad to tap the path.");
        return;
      }
      const tapped = await tapPath(page);
      if (!tapped) flag(id, "Could not tap the path.");
      else await expectLiveWave(page, id, "Tapping the path");
    },
  },
  {
    id: "path-tap-preview",
    vp: PREVIEW,
    shot: "boys-path-preview.png",
    run: async (page, id) => {
      const s = await toPlace(page, id, { pick: "first" });
      if (s.phase !== "placement") {
        flag(id, "Tall preview never reached place.", { phase: s.phase });
        return;
      }
      const v = await qa(page, "view");
      if (v.topStuck) flag(id, "Map is stuck to the top. Empty space under the path.", v);
      await qa(page, "placeBench");
      const tapped = await tapPath(page);
      if (!tapped) flag(id, "Could not tap the path.");
      else await expectLiveWave(page, id, "Tapping the path");
    },
  },
  {
    id: "mode-endless",
    vp: DESKTOP,
    shot: "boys-mode-endless.png",
    run: async (page, id) => {
      await boot(page);
      if (await page.getByRole("button", { name: "Endless", exact: true }).count()) {
        flag(id, "Endless is still a title button.");
      }
      const hint = await page.locator(".title-start-hint").innerText().catch(() => "");
      if (!/keep flying/i.test(hint)) flag(id, "Title never says keep flying after 12.");
      await clickStart(page, "story");
      const s = await snap(page);
      if (s.playMode === "arcade") flag(id, "Arena started as Endless.");
      if (s.phase !== "opening") flag(id, `Arena opened on ${s.phase} instead of opening.`);
    },
  },
  {
    id: "title-click",
    vp: DESKTOP,
    shot: "boys-title-click.png",
    run: async (page, id) => {
      const qaReady = await bootRaw(page);
      await page.waitForTimeout(250);
      const body = await page.locator("body").innerText().catch(() => "");
      if (!qaReady) {
        flag(id, /VECTOR/i.test(body) && !/Arena/i.test(body) ? "Only the word VECTOR. No Arena." : "Title never woke up.");
        return;
      }
      await page.waitForSelector("button:has-text('Arena')", { timeout: 8000 }).catch(() => {});
      await assertTitleAlive(page, id);
      const arena = page.getByRole("button", { name: "Arena", exact: true });
      if (!(await arena.count())) return;
      await arena.first().click();
      const bind = page.locator(".save-bind-card");
      if (await bind.count()) await bind.first().click();
      const skipGate = page.getByRole("button", { name: /Just play|No thanks/i });
      if (await skipGate.count()) await skipGate.click();
      const left = await page
        .waitForFunction(() => {
          const p = window.__gridironQA?.snap?.().phase;
          return p && p !== "title";
        }, { timeout: 8000 })
        .then(() => true)
        .catch(() => false);
      if (!left) flag(id, "Arena did nothing.");
    },
  },
  {
    id: "shop-unstick",
    vp: DESKTOP,
    shot: "boys-shop-unstick.png",
    run: async (page, id) => {
      const s = await toPlace(page, id, { pick: "first" });
      if (s.phase !== "placement") {
        flag(id, "Never reached place to test the round report.");
        return;
      }
      await qa(page, "shopStuck");
      const recovered = await page
        .waitForFunction(() => window.__gridironQA?.snap?.().grade, { timeout: 4000 })
        .then(() => true)
        .catch(() => false);
      const after = await snap(page);
      if (after.phase !== "shop") flag(id, `Round report test landed on ${after.phase}.`);
      if (!recovered || !after.grade) flag(id, "Round report was gone so there was nothing to tap.");
      await assertBoardHasNext(page, id);
      const next = page.getByRole("button", { name: "Next round" });
      if (!(await next.count())) flag(id, "Round report was gone so there was nothing to tap.");
      await qa(page, "shopGo");
      const gone = await snap(page);
      if (gone.phase === "shop") flag(id, "Next round did nothing.");
    },
  },
  {
    id: "left-gutter",
    vp: SHORT,
    shot: "boys-left-gutter.png",
    run: async (page, id) => {
      const s = await toPlace(page, id, { pick: "first" });
      if (s.phase !== "placement") {
        flag(id, "Short board never reached place.");
        return;
      }
      const v = await qa(page, "view");
      if (!v || v.phase === "missing-qa") {
        flag(id, "Scale probe missing.");
        return;
      }
      if (v.homeCut) flag(id, "Home is cut off.", v);
      if (v.spawnCut) flag(id, "Spawn is cut off.", v);
      if ((v.ox ?? 0) < -8) flag(id, "A bar sat on the left of the map.", v);
    },
  },
];

if (cases.length !== NEED_CASES) {
  flag("meta", `Play-test-bot has ${cases.length} cases, need ${NEED_CASES}.`);
}

const queue = [...cases];
const workers = Array.from({ length: 4 }, async () => {
  while (queue.length) {
    const c = queue.shift();
    if (!c) break;
    await withPage(c.vp, async (page) => {
      await c.run(page, c.id);
      if (c.shot) await page.screenshot({ path: `${dir}/${c.shot}` });
      results.push({ id: c.id, ok: !issues.some((x) => x.pattern === c.id) });
    });
  }
});
await Promise.all(workers);
await browser.close();

const out = { ok: issues.length === 0, issues, results };
console.log(JSON.stringify(out, null, 2));
if (issues.length) process.exit(1);
