import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const url = process.argv[2] || "http://127.0.0.1:8080/";
const dir = "/workspace/screenshots";
await mkdir(dir, { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(25000);
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForSelector("button:has-text('New draft')");
await page.screenshot({ path: `${dir}/feel-title.png` });
await page.getByRole("button", { name: "New draft", exact: true }).click();

await page.waitForTimeout(400);
if (await page.locator(".orbit-stage").count()) {
  await page.screenshot({ path: `${dir}/vector-pack.png` });
  await page.locator(".orbit-stage").click({ force: true });
}
await page.waitForSelector("text=Ability", { timeout: 8000 });
await page.screenshot({ path: `${dir}/vector-draft-map.png` });

await page.waitForFunction(() => window.__gridironQA);

await page.evaluate(() => window.__gridironQA.pickFirst());
await page.waitForTimeout(350);
if (await page.locator(".orbit-stage").count()) {
  await page.locator(".orbit-stage").click({ force: true });
  await page.waitForTimeout(200);
}
await page.waitForSelector("text=Weather", { timeout: 8000 });
await page.screenshot({ path: `${dir}/vector-draft-weather.png` });

for (let i = 0; i < 20; i++) {
  const snap = await page.evaluate(() => window.__gridironQA.snap());
  if (snap.phase === "placement" || snap.phase === "combat") break;
  if (await page.locator(".orbit-stage").count()) {
    await page.locator(".orbit-stage").click({ force: true });
    await page.waitForTimeout(160);
    continue;
  }
  if (snap.phase === "fit") {
    await page.evaluate(() => window.__gridironQA.fitFirst());
    await page.waitForTimeout(160);
    continue;
  }
  await page.evaluate(() => window.__gridironQA.pickFirst());
  await page.waitForTimeout(180);
}

await page.waitForTimeout(250);
await page.screenshot({ path: `${dir}/vector-place.png` });
await page.evaluate(() => window.__gridironQA.placeBench());
await page.waitForTimeout(200);
const defend = page.getByRole("button", { name: "Defend", exact: true });
if (await defend.count()) await defend.click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${dir}/vector-combat.png` });

await page.evaluate(() => window.__gridironQA.liveNow());
await page.waitForTimeout(250);
await page.screenshot({ path: `${dir}/vector-live.png` });
const liveText = await page.locator("body").innerText();
const snap = await page.evaluate(() => window.__gridironQA.snap());
console.log(JSON.stringify({
  snap,
  hasCredit: liveText.includes("Credit"),
  hasTeam: /Team/.test(liveText),
  hasSkip: liveText.includes("Skip"),
}, null, 2));

await browser.close();
