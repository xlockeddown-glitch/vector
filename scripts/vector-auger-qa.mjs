import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const url = process.argv[2] || "http://127.0.0.1:8080/";
const dir = "/workspace/screenshots";
await mkdir(dir, { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(45000);
const logs = [];
page.on("pageerror", (e) => logs.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") logs.push(m.text());
});

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForSelector("button:has-text('New draft')");
await page.waitForTimeout(500);
await page.screenshot({ path: `${dir}/auger-title.png` });

const titleHas = await page.locator(".bore-craft").count();
const titleSvg = await page.locator(".bore-craft svg").count();

await page.getByRole("button", { name: "New draft", exact: true }).click();

async function skipPack() {
  if (await page.locator(".orbit-stage").count()) {
    await page.locator(".orbit-stage").click({ force: true });
    await page.waitForTimeout(180);
  }
}

for (let i = 0; i < 22; i++) {
  const snap = await page.evaluate(() => window.__gridironQA?.snap?.() ?? {});
  if (snap.phase === "placement") break;
  await skipPack();
  const names = await page.evaluate(() => (window.__gridironQA.snap ? window.__gridironQA : null));
  const pack = await page.evaluate(() => {
    const qa = window.__gridironQA;
    if (!qa?.pickId) return qa.pickFirst();
    const hit = qa.pickId("comp-auger");
    if (hit.picked) return hit;
    return qa.pickFirst();
  });
  if (pack?.picked === "Auger") {
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${dir}/auger-draft.png` });
  }
  await page.waitForTimeout(70);
}

await page.waitForFunction(() => window.__gridironQA.snap().phase === "placement");
await page.evaluate(() => window.__gridironQA.placeBench());
await page.waitForTimeout(200);
await page.screenshot({ path: `${dir}/auger-place.png` });
await page.getByRole("button", { name: "Defend", exact: true }).click();
await page.waitForFunction(() => window.__gridironQA.snap().phase === "combat");
await page.evaluate(() => window.__gridironQA.speed3());
await page.waitForFunction(() => (window.__gridironQA.snap().bores ?? 0) > 0, null, { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(400);
await page.evaluate(() => window.__gridironQA.plungeNow?.());
await page.waitForTimeout(700);
const combat = await page.evaluate(() => window.__gridironQA.snap());
await page.screenshot({ path: `${dir}/auger-combat.png` });

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(url, { waitUntil: "networkidle" });
await mobile.waitForSelector("button:has-text('New draft')");
await mobile.waitForTimeout(400);
await mobile.screenshot({ path: `${dir}/auger-title-mobile.png` });

const out = {
  titleHas,
  titleSvg,
  crafts: combat.crafts,
  flying: combat.flying,
  bores: combat.bores,
  phase: combat.phase,
  errors: logs,
};
console.log(JSON.stringify(out, null, 2));
await browser.close();
if (logs.length || titleHas < 1 || titleSvg < 1) process.exit(1);
if ((combat.bores ?? 0) < 1) process.exit(1);
