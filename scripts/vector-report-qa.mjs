import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const url = process.argv[2] || "http://127.0.0.1:8080/";
const dir = "/workspace/screenshots";
await mkdir(dir, { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(25000);

await page.goto(url, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "New draft", exact: true }).click();
await page.waitForFunction(() => window.__gridironQA?.snap?.().phase === "opening");

for (let i = 0; i < 14; i++) {
  const s = await page.evaluate(() => window.__gridironQA.snap());
  if (s.phase === "placement") break;
  if (await page.locator(".orbit-stage").count()) {
    await page.locator(".orbit-stage").click({ force: true });
    await page.waitForTimeout(80);
  }
  if (s.phase === "fit") await page.evaluate(() => window.__gridironQA.fitFirst());
  else await page.evaluate(() => window.__gridironQA.pickFirst());
  await page.waitForTimeout(70);
}

await page.waitForFunction(() => window.__gridironQA.snap().phase === "placement");
await page.evaluate(() => window.__gridironQA.placeBench());
await page.evaluate(() => window.__gridironQA.startWave());
await page.evaluate(() => window.__gridironQA.speed3());
await page.waitForFunction(() => window.__gridironQA.snap().phase === "combat");
await page.waitForTimeout(1800);

for (let i = 0; i < 6; i++) {
  const s = await page.evaluate(() => window.__gridironQA.snap());
  if (s.phase === "shop") break;
  await page.evaluate(() => window.__gridironQA.wipeWave());
  await page.waitForTimeout(500);
}

await page.waitForFunction(() => window.__gridironQA.snap().phase === "shop", { timeout: 12000 });
await page.waitForTimeout(250);
await page.screenshot({ path: `${dir}/round-report.png` });
const body = await page.locator("body").innerText();
const out = {
  phase: await page.evaluate(() => window.__gridironQA.snap().phase),
  crafts: await page.evaluate(() => window.__gridironQA.snap().crafts),
  hasCrafts: /Crafts this round/i.test(body),
  hasStar: /Star of the round/i.test(body),
  hasLeaks: /\bLeaks\b/.test(body),
  hasMapChip: /Map /.test(body.split("Round report")[1]?.slice(0, 400) ?? ""),
  hasCharms: /Charms:/.test(body),
  snippet: body.split("\n").filter((l) => /Round report|Stopped|Got through|Star|Crafts this|Nobody|Held|got through|Tune a gun/.test(l)).slice(0, 16),
};
console.log(JSON.stringify(out, null, 2));
await browser.close();
if (!out.hasCrafts || out.hasLeaks) process.exit(1);
