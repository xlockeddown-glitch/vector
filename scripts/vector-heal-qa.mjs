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
await page.getByRole("button", { name: "New draft", exact: true }).click();

async function skipPack() {
  if (await page.locator(".orbit-stage").count()) {
    await page.locator(".orbit-stage").click({ force: true });
    await page.waitForTimeout(180);
  }
}

for (let i = 0; i < 22; i++) {
  const phase = await page.evaluate(() => window.__gridironQA?.snap?.().phase ?? "");
  if (phase === "placement") break;
  await skipPack();
  await page.evaluate(() => window.__gridironQA.pickFirst());
  await page.waitForTimeout(80);
}

await page.waitForFunction(() => window.__gridironQA.snap().phase === "placement");
await page.evaluate(() => window.__gridironQA.placeBench());
await page.waitForTimeout(200);
await page.getByRole("button", { name: "Defend", exact: true }).click();
await page.waitForFunction(() => window.__gridironQA.snap().phase === "combat");
await page.waitForTimeout(400);

const before = await page.evaluate(() => window.__gridironQA.hurtCraft());
await page.waitForTimeout(1600);
const after = await page.evaluate(() => window.__gridironQA.snap());
await page.screenshot({ path: `${dir}/heal-bay.png` });

await page.evaluate(() => window.__gridironQA.critCraft());
await page.waitForTimeout(900);
const crit = await page.evaluate(() => window.__gridironQA.snap());
await page.screenshot({ path: `${dir}/heal-crit.png` });

const body = await page.locator("body").innerText();
const out = {
  beforeHome: before.home,
  afterHome: after.home,
  afterFlying: after.flying,
  critHome: crit.home,
  critFlag: crit.crit,
  bayCopy: /bay/i.test(body),
  plusCopy: /\+\d/.test(body),
  errors: logs,
};
console.log(JSON.stringify(out, null, 2));
await browser.close();
if (logs.length || after.home < 1) process.exit(1);
