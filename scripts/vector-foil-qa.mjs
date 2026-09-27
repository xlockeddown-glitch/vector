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

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForSelector("button:has-text('New draft')");
await page.screenshot({ path: `${dir}/title-auger-up.png` });
await page.getByRole("button", { name: "Briefing", exact: true }).click();
await page.waitForSelector("text=You pick 9 times");
const help = await page.locator("body").innerText();
await page.getByRole("button", { name: "Close", exact: true }).click();
await page.getByRole("button", { name: "New draft", exact: true }).click();
await page.waitForFunction(() => window.__gridironQA);

async function skipPack() {
  if (await page.locator(".orbit-stage").count()) {
    await page.locator(".orbit-stage").click({ force: true });
    await page.waitForTimeout(150);
  }
}

await skipPack();
await page.waitForTimeout(200);
const body1 = await page.locator("body").innerText();
await page.screenshot({ path: `${dir}/foil-backs.png` });
const foil = (await page.locator(".holo-q").count()) > 0;
if (await page.locator("button:has-text('Tap to flip')").count()) {
  await page.locator("button:has-text('Tap to flip')").first().click();
  await page.waitForTimeout(250);
}
await page.screenshot({ path: `${dir}/foil-peek.png` });

const titles = [];
for (let i = 0; i < 16; i++) {
  const snap = await page.evaluate(() => window.__gridironQA.snap());
  if (snap.phase === "placement") break;
  await skipPack();
  const text = await page.locator("body").innerText();
  titles.push(text.split("\n").find((l) => /Pick |Take |Wild /.test(l)) ?? "");
  await page.evaluate(() => window.__gridironQA.pickFirst());
  await page.waitForTimeout(120);
}

const out = {
  foil,
  nine: /You pick 9 times/.test(help),
  noMap: !titles.some((t) => /pick a map/i.test(t)),
  noWeather: !/Pick the weather/i.test(body1) && !titles.some((t) => /weather/i.test(t)),
  legendaryLine: /legendary/i.test(body1),
  titles,
  errors: logs,
};
console.log(JSON.stringify(out, null, 2));
await browser.close();
if (!foil || !out.nine || !out.noMap || logs.length) process.exit(1);
