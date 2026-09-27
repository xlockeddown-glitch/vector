import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const url = process.argv[2] || "http://127.0.0.1:8080/";
const dir = "/workspace/screenshots";
await mkdir(dir, { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(25000);
const logs = [];
page.on("pageerror", (e) => logs.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") logs.push(m.text());
});

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForSelector("button:has-text('New draft')");
await page.waitForTimeout(500);
await page.screenshot({ path: `${dir}/flux-title.png` });

await page.getByRole("button", { name: "Hangar", exact: true }).click();
await page.waitForSelector("text=Persistent upgrades");
await page.waitForTimeout(200);
await page.screenshot({ path: `${dir}/flux-hangar.png` });
await page.getByRole("button", { name: "Close", exact: true }).click();

await page.getByRole("button", { name: "New draft", exact: true }).click();

async function skipPack() {
  if (await page.locator(".orbit-stage").count()) {
    await page.locator(".orbit-stage").click({ force: true });
    await page.waitForTimeout(280);
  }
}

async function pick() {
  await skipPack();
  await page.waitForFunction(() => window.__gridironQA);
  await page.evaluate(() => window.__gridironQA.pickFirst());
  await page.waitForTimeout(220);
}

await pick(); // map
await pick(); // weather
await skipPack();
await page.waitForSelector("text=Pick a companion");
await page.waitForTimeout(250);
await page.screenshot({ path: `${dir}/flux-companion.png` });

const companionText = await page.locator("body").innerText();
const hasShrike = companionText.includes("Shrike");
const hasBoost = companionText.includes("Boost");
const hasPower = companionText.includes("Power");
const hasWeaken = companionText.includes("Weaken") || companionText.includes("Slow");

await pick(); // companion
await pick(); // core
await skipPack();
await page.waitForTimeout(250);
await page.screenshot({ path: `${dir}/flux-towers.png` });
const towerText = await page.locator("body").innerText();

await page.waitForFunction(() => window.__gridironQA);
const fluxBefore = await page.evaluate(() => window.__gridironQA.fluxDump());

const out = {
  hasShrike,
  hasBoost,
  hasPower,
  hasWeaken,
  towerHasPower: towerText.includes("Power"),
  towerHasSlow: /Slow|Weaken|Splash|Chain/.test(towerText),
  flux: fluxBefore.flux,
  errors: logs,
};
console.log(JSON.stringify(out, null, 2));
await browser.close();
if (!hasShrike || !hasBoost || !hasPower || logs.length) process.exit(1);
