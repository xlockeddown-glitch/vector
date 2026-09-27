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
await page.getByRole("button", { name: "New draft", exact: true }).click();
await page.waitForFunction(() => window.__gridironQA);

async function skipPack() {
  if (await page.locator(".orbit-stage").count()) {
    await page.locator(".orbit-stage").click({ force: true });
    await page.waitForTimeout(120);
  }
}

async function pick() {
  await skipPack();
  await page.evaluate(() => window.__gridironQA.pickFirst());
  await page.waitForTimeout(140);
}

const first = await page.evaluate(() => window.__gridironQA.snap());
const mapRitual = (await page.locator(".orbit-stage").count()) > 0;
await page.screenshot({ path: `${dir}/pack-map.png` });
await pick();
await pick();

await page.waitForSelector(".reveal-slab", { timeout: 8000 });
await page.waitForTimeout(220);
const sawRitual = (await page.locator(".reveal-slab").count()) > 0;
const sawBar = (await page.locator(".reveal-bar").count()) > 0;
const pixelN = await page.locator(".reveal-pixel").count();
await page.screenshot({ path: `${dir}/pack-ritual.png` });
await page.waitForTimeout(1100);
await page.screenshot({ path: `${dir}/pack-open.png` });

await skipPack();
const body = await page.locator("body").innerText();
const names = await page.evaluate(() => {
  const qa = window.__gridironQA;
  return {
    title: qa.snap().phase,
    picks: qa.snap().draftPicksLeft,
    count: qa.snap().draftCount,
  };
});
await page.screenshot({ path: `${dir}/pack-companion.png` });

for (let i = 0; i < 16; i++) {
  const snap = await page.evaluate(() => window.__gridironQA.snap());
  if (snap.phase === "placement") break;
  await skipPack();
  await page.waitForTimeout(120);
  const text = await page.locator("body").innerText();
  if (/Take two guns/i.test(text)) {
    await page.screenshot({ path: `${dir}/pack-guns.png` });
  }
  await page.evaluate(() => window.__gridironQA.pickFirst());
  await page.waitForTimeout(140);
}

const out = {
  mapRitual,
  sawRitual,
  sawBar,
  pixelN,
  firstPhase: first.phase,
  companionCopy: /Boost|Shrike|Auger/i.test(body),
  mixedHint: /Legendary|Rare|Uncommon|Epic|Common/i.test(body),
  errors: logs,
};
console.log(JSON.stringify(out, null, 2));
await browser.close();
if (!sawRitual || pixelN < 20 || logs.length) process.exit(1);
