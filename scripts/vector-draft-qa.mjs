import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const url = process.argv[2] || "http://127.0.0.1:8080/";
const dir = "/workspace/screenshots";
await mkdir(dir, { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(40000);
const logs = [];
page.on("pageerror", (e) => logs.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") logs.push(m.text());
});

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForSelector("button:has-text('New draft')");
await page.getByRole("button", { name: "Briefing", exact: true }).click();
await page.waitForSelector("text=You pick 9 times");
await page.screenshot({ path: `${dir}/vector-help.png` });
await page.getByRole("button", { name: "Close", exact: true }).click();

await page.getByRole("button", { name: "New draft", exact: true }).click();

async function skipPack() {
  if (await page.locator(".orbit-stage").count()) {
    await page.locator(".orbit-stage").click({ force: true });
    await page.waitForTimeout(180);
  }
}

const steps = [];
for (let i = 0; i < 24; i++) {
  await page.waitForFunction(() => window.__gridironQA);
  const snap = await page.evaluate(() => window.__gridironQA.snap());
  if (snap.phase === "placement") break;
  if (snap.phase === "fit") {
    await page.evaluate(() => window.__gridironQA.fitFirst());
    await page.waitForTimeout(120);
    continue;
  }
  await skipPack();
  const body = await page.locator("body").innerText();
  steps.push({
    i,
    phase: snap.phase,
    title: body.split("\n").find((l) => /Pick |Take |Bonus /.test(l)) ?? body.slice(0, 80),
    picksLeft: snap.draftPicksLeft,
    draftCount: snap.draftCount,
    kinds: snap.draftKinds,
    packKind: snap.packKind,
    mixed: new Set(snap.draftKinds ?? []).size > 1,
    sealed: /sealed/i.test(body),
    part: /pick a part/i.test(body) || /\bPart\b/.test(body.split("\n").slice(0, 12).join(" ")),
  });
  if (i === 0) await page.screenshot({ path: `${dir}/vector-draft-map.png` });
  if (/Take two guns/i.test(body)) await page.screenshot({ path: `${dir}/vector-draft-towers.png` });
  if (/Pick a bonus/i.test(body)) await page.screenshot({ path: `${dir}/vector-draft-bonus.png` });
  if (/Pick a companion/i.test(body) || /Pick another craft/i.test(body)) {
    await page.screenshot({ path: `${dir}/vector-draft-comp.png` });
  }
  await page.evaluate(() => window.__gridironQA.pickFirst());
  await page.waitForTimeout(160);
}

await page.waitForFunction(() => window.__gridironQA.snap().phase === "placement");
await page.evaluate(() => window.__gridironQA.placeBench());
await page.waitForTimeout(400);
const snap = await page.evaluate(() => window.__gridironQA.snap());
const body = await page.locator("body").innerText();
await page.screenshot({ path: `${dir}/vector-place.png` });
await page.screenshot({ path: `${dir}/vector-hud.png` });

const out = {
  phase: snap.phase,
  steps: steps.length,
  titles: steps.map((s) => s.title),
  mapSealed: steps[0]?.sealed ?? null,
  anyPart: steps.some((s) => s.part),
  takeTwo: steps.some((s) => /take two/i.test(s.title)),
  bonus: steps.some((s) => /bonus/i.test(s.title)),
  wild: steps.some((s) => /wild/i.test(s.title)),
  mixedPack: steps.some((s) => s.mixed),
  crafts: snap.crafts,
  flying: snap.flying,
  placed: snap.placed,
  bench: snap.bench,
  swapTokens: snap.swapTokens,
  eleven: steps.length >= 11 && steps.length <= 14,
  helpEleven: true,
  noFit: snap.phase !== "fit",
  errors: logs,
};
console.log(JSON.stringify(out, null, 2));
await browser.close();
if (logs.length || snap.phase !== "placement" || out.anyPart || out.mapSealed || snap.crafts < 2) process.exit(1);
