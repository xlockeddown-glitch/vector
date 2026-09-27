import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const url = process.argv[2] || "http://127.0.0.1:8080/";
const dir = "/workspace/screenshots";
await mkdir(dir, { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(40000);
const logs = [];
page.on("pageerror", (e) => logs.push(`pageerror ${e}`));
page.on("console", (m) => {
  if (m.type() === "error") logs.push(m.text());
});

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForSelector("button:has-text('New draft')");
await page.waitForTimeout(400);
await page.screenshot({ path: `${dir}/lane-title.png` });

await page.getByRole("button", { name: "Briefing", exact: true }).click();
await page.waitForSelector("text=Two lanes");
await page.waitForTimeout(200);
await page.screenshot({ path: `${dir}/lane-help.png` });
await page.getByRole("button", { name: "Close", exact: true }).click();

await page.getByRole("button", { name: "New draft", exact: true }).click();

async function skipPack() {
  if (await page.locator(".orbit-stage").count()) {
    await page.locator(".orbit-stage").click({ force: true });
    await page.waitForTimeout(220);
  }
}

async function pickOrFit() {
  await page.waitForFunction(() => window.__gridironQA);
  const phase = await page.evaluate(() => window.__gridironQA.snap().phase);
  if (phase === "fit") {
    await page.evaluate(() => window.__gridironQA.fitFirst());
    await page.waitForTimeout(160);
    return;
  }
  await skipPack();
  await page.evaluate(() => window.__gridironQA.pickFirst());
  await page.waitForTimeout(180);
}

for (let i = 0; i < 22; i++) {
  const phase = await page.evaluate(() => window.__gridironQA?.snap?.().phase ?? "");
  if (phase === "placement") break;
  await pickOrFit();
}

await page.waitForFunction(() => window.__gridironQA.snap().phase === "placement");
await page.evaluate(() => window.__gridironQA.placeBench());
await page.waitForTimeout(500);
await page.screenshot({ path: `${dir}/lane-place.png` });

const body = await page.locator("body").innerText();
const snap = await page.evaluate(() => window.__gridironQA.snap());

await page.screenshot({ path: `${dir}/lane-hud.png` });

const out = {
  phase: snap.phase,
  paths: snap.paths,
  base: snap.base,
  swapTokens: snap.swapTokens,
  placed: snap.placed,
  twoLanesCopy: /two lanes/i.test(body) || /North/i.test(body),
  companionHp: /HP/i.test(body),
  swapsChip: /Swap/i.test(body),
  coreBottomRight: snap.base.x > 1100 && snap.base.y > 560,
  errors: logs,
};
console.log(JSON.stringify(out, null, 2));
await browser.close();
if (snap.paths !== 2 || !out.coreBottomRight || snap.swapTokens < 1 || logs.length) process.exit(1);
