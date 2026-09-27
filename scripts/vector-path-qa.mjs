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

async function skipPack() {
  if (await page.locator(".orbit-stage").count()) {
    await page.locator(".orbit-stage").click({ force: true });
    await page.waitForTimeout(180);
  }
}

async function pickOrFit() {
  await page.waitForFunction(() => window.__gridironQA);
  const phase = await page.evaluate(() => window.__gridironQA.snap().phase);
  if (phase === "fit") {
    await page.evaluate(() => window.__gridironQA.fitFirst());
    await page.waitForTimeout(140);
    return;
  }
  await skipPack();
  await page.evaluate(() => window.__gridironQA.pickFirst());
  await page.waitForTimeout(160);
}

for (let i = 0; i < 24; i++) {
  const phase = await page.evaluate(() => window.__gridironQA?.snap?.().phase ?? "");
  if (phase === "placement") break;
  await pickOrFit();
}

await page.waitForFunction(() => window.__gridironQA.snap().phase === "placement");
await page.evaluate(() => window.__gridironQA.placeBench());
await page.waitForTimeout(400);
await page.screenshot({ path: `${dir}/path-place.png` });

await page.getByRole("button", { name: "Defend", exact: true }).click();
await page.waitForFunction(() => window.__gridironQA.snap().phase === "combat");
await page.evaluate(() => window.__gridironQA.speed3());
await page.waitForTimeout(2200);
await page.screenshot({ path: `${dir}/path-combat.png` });

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(url, { waitUntil: "networkidle" });
await mobile.waitForSelector("button:has-text('New draft')");
await mobile.getByRole("button", { name: "New draft", exact: true }).click();
for (let i = 0; i < 24; i++) {
  const phase = await mobile.evaluate(() => window.__gridironQA?.snap?.().phase ?? "");
  if (phase === "placement") break;
  if (await mobile.locator(".orbit-stage").count()) {
    await mobile.locator(".orbit-stage").click({ force: true });
    await mobile.waitForTimeout(160);
  }
  const phase2 = await mobile.evaluate(() => window.__gridironQA?.snap?.().phase ?? "");
  if (phase2 === "fit") {
    await mobile.evaluate(() => window.__gridironQA.fitFirst());
  } else {
    await mobile.evaluate(() => window.__gridironQA.pickFirst());
  }
  await mobile.waitForTimeout(140);
}
await mobile.waitForFunction(() => window.__gridironQA.snap().phase === "placement");
await mobile.evaluate(() => window.__gridironQA.placeBench());
await mobile.waitForTimeout(300);
await mobile.screenshot({ path: `${dir}/path-place-mobile.png` });

const snap = await page.evaluate(() => window.__gridironQA.snap());
const out = {
  phase: snap.phase,
  paths: snap.paths,
  base: snap.base,
  placed: snap.placed,
  coreBottomRight: snap.base.x > 1100 && snap.base.y > 560,
  errors: logs,
};
console.log(JSON.stringify(out, null, 2));
await browser.close();
if (snap.paths !== 2 || !out.coreBottomRight || logs.length) process.exit(1);
