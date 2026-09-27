#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const url = process.argv[2] || "http://127.0.0.1:8080/";
const dir = "/workspace/screenshots";
await mkdir(dir, { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(25000);
const errors = [];
page.on("pageerror", (err) => errors.push(String(err)));

async function qa(fn, arg) {
  return page.evaluate(
    ({ fn, arg }) => {
      const api = window.__gridironQA;
      if (!api || typeof api[fn] !== "function") return { phase: "missing-qa", fn };
      return arg === undefined ? api[fn]() : api[fn](arg);
    },
    { fn, arg },
  );
}

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForFunction(() => window.__vectorRuntime && window.__gridironQA);
await page.evaluate(() => window.__vectorRuntime.dispatch({ type: "play", mode: "story", tutorial: false }));
await page.waitForFunction(() => window.__gridironQA.snap().phase === "opening" && window.__gridironQA.snap().draftCount >= 3);
await page.waitForTimeout(400);
const s0 = await qa("snap");
await page.screenshot({ path: `${dir}/paint-open-0.png` });
const wraps = page.locator(".arena-rail .hs-wrap");
const wrapCount = await wraps.count();
if (wrapCount > 0) await wraps.nth(0).screenshot({ path: `${dir}/card-face-left.png` });
if (wrapCount > 1) await wraps.nth(1).screenshot({ path: `${dir}/card-face-mid.png` });
if (wrapCount > 2) await wraps.nth(2).screenshot({ path: `${dir}/card-face-right.png` });
const ovalCount = await page.locator(".hs-oval").count();
const artFill = wrapCount
  ? await wraps.nth(0).evaluate((el) => {
      const face = el.querySelector(".hs-face");
      const art = el.querySelector(".hs-art");
      const img = el.querySelector("img.card-paint");
      if (!face || !art || !img) return { ok: false };
      const f = face.getBoundingClientRect();
      const a = art.getBoundingClientRect();
      const fillW = face.clientWidth;
      const fillH = face.clientHeight;
      const frameOk = a.width >= f.width * 0.88 && a.height >= f.height * 0.88 && a.width > 80;
      return {
        ok: frameOk,
        face: { w: Math.round(f.width), h: Math.round(f.height) },
        art: { w: Math.round(a.width), h: Math.round(a.height) },
        inner: { w: Math.round(fillW), h: Math.round(fillH) },
      };
    })
  : { ok: false };

for (let i = 0; i < 6; i++) {
  await qa("pickFirst");
  await page.waitForTimeout(280);
  await page.screenshot({ path: `${dir}/paint-open-${i + 1}.png` });
}

const placedPhase = await qa("snap");
await page.waitForFunction(() => {
  const p = window.__gridironQA.snap().phase;
  return p === "placement" || p === "combat";
}, { timeout: 8000 }).catch(() => {});
await qa("placeBench");
await page.evaluate(() => {
  const w = window.__vectorRuntime.world;
  w.points = Math.max(w.points || 0, 90);
  w.uiDirty = true;
});
await page.waitForTimeout(200);
const placed = await qa("snap");
await page.screenshot({ path: `${dir}/paint-place.png` });
await qa("startWave");
await page.waitForTimeout(800);
const combat = await qa("snap");
const packOverlay = await page.locator(".draft-rail").count();
await page.screenshot({ path: `${dir}/paint-combat.png` });

await page.evaluate(() => {
  const w = window.__vectorRuntime.world;
  const gun = w.roster.find((r) => r.card?.kind === "tower" && r.placedPad && r.placedPad !== "home");
  if (gun) {
    w.selectedCard = gun.uid;
    w.uiDirty = true;
  }
});
await page.waitForTimeout(350);
const treeCost = ((await page.locator(".tree-cost").first().textContent().catch(() => "")) || "").trim();
const nodeCost = ((await page.locator(".tree-node-cost").first().textContent().catch(() => "")) || "").trim();
const signalDock = await page.locator("[data-signal-slot]").count();
const signalFilled = await page.locator("[data-signal-slot='1']").count();
const dockBox = await page.locator(".signal-dock").first().boundingBox();
await page.screenshot({ path: `${dir}/paint-tree.png` });

const paints = await page.locator("img.card-paint").count();
const report = {
  open0: { phase: s0.phase, title: s0.draftTitle, kinds: s0.draftKinds, count: s0.draftCount },
  afterDraft: { phase: placedPhase.phase, signals: placedPhase.signals },
  placed: placed.placed,
  combat: { phase: combat.phase, paused: combat.paused, liveCount: combat.liveCount, packOverlay },
  treeCost,
  nodeCost,
  signalDock,
  signalFilled,
  dock: dockBox ? { w: Math.round(dockBox.width), h: Math.round(dockBox.height) } : null,
  paints,
  ovals: ovalCount,
  artFill,
  errors,
};
console.log(JSON.stringify(report, null, 2));
await browser.close();
if (errors.length) process.exit(1);
if (combat.phase === "draft" || combat.phase === "loot") {
  console.error("FIGHT PAUSED FOR A PACK");
  process.exit(1);
}
if (combat.phase === "combat" && packOverlay > 0) {
  console.error("FIGHT PAUSED FOR A PACK");
  process.exit(1);
}
if (signalDock < 2 || !dockBox || dockBox.height < 24 || dockBox.width < 80) {
  console.error("SIGNALS NOT VISIBLE");
  process.exit(1);
}
if (!treeCost.toLowerCase().includes("credit")) {
  console.error("TREE COST MISSING CREDIT");
  process.exit(1);
}
if (ovalCount > 0) {
  console.error("OVAL WINDOW STILL PRESENT");
  process.exit(1);
}
if (!artFill?.ok) {
  console.error("ART DOES NOT FILL FACE");
  process.exit(1);
}
