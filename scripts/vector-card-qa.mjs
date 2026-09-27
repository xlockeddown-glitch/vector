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
  await page.waitForTimeout(180);
}

await skipPack();
await page.waitForSelector("text=Ability", { timeout: 8000 });
await page.screenshot({ path: `${dir}/vector-draft-map.png` });

await pick(); // weather
await skipPack();
await page.screenshot({ path: `${dir}/vector-draft-weather.png` });

await pick(); // companion
await pick(); // core
await skipPack();
await page.screenshot({ path: `${dir}/vector-draft-gun.png` });

await pick(); // tower one
await skipPack();
await page.screenshot({ path: `${dir}/vector-draft-tower.png` });

const text = (await page.locator("body").innerText()).slice(0, 400).replace(/\s+/g, " ");
console.log(JSON.stringify({ snap: await page.evaluate(() => window.__gridironQA.snap()), text }, null, 2));
await browser.close();
