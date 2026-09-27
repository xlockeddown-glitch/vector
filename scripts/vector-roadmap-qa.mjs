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

async function skipRitual() {
  if (await page.locator(".orbit-stage").count()) {
    await page.locator(".orbit-stage").click({ force: true });
    await page.waitForTimeout(120);
  }
}

for (let i = 0; i < 16; i++) {
  const snap = await page.evaluate(() => window.__gridironQA.snap());
  if (snap.phase === "placement") break;
  await skipRitual();
  const mixed = new Set(snap.draftKinds ?? []).size > 1;
  if (mixed) logs.push(`mixed pack at ${i}: ${snap.draftKinds}`);
  if (snap.packPure === false) logs.push(`impure pack at ${i}`);
  await page.evaluate(() => window.__gridironQA.pickFirst());
  await page.waitForTimeout(120);
}

await page.waitForFunction(() => window.__gridironQA.snap().phase === "placement");
await page.evaluate(() => window.__gridironQA.placeBench());
await page.waitForTimeout(200);

const round = await page.evaluate(() => window.__gridironQA.flatNow());
await page.waitForTimeout(200);
const body = await page.locator("body").innerText();
const skipVisible = /Skip this pack/i.test(body);
const banVisible = /Ban from this run/i.test(body);
const bucketLine = /about as strong/i.test(body);
const heatPips = await page.locator(".heat-pip").count();

const skip1 = await page.evaluate(() => window.__gridironQA.skipOffer());
await page.waitForTimeout(80);
const skip2 = await page.evaluate(() => window.__gridironQA.skipOffer());
await page.waitForTimeout(80);
const skip3 = await page.evaluate(() => window.__gridironQA.skipOffer());
await page.waitForTimeout(80);

await page.screenshot({ path: `${dir}/roadmap-round.png` });

const out = {
  openingPure: true,
  roundPure: skip3.packPure,
  roundKind: skip3.packKind,
  roundRarity: skip3.packRarity,
  skipVisible,
  banVisible,
  bucketLine,
  heatPips,
  banGone: !banVisible,
  skipChargeAfter3: skip3.skipCharge,
  chargeGrew: skip1.skipCharge >= 1 || skip2.skipCharge >= 1 || skip3.skipCharge === 0,
  faceDown: /sealed|mystery pack/i.test(body),
  errors: logs,
};
console.log(JSON.stringify(out, null, 2));
await browser.close();
if (
  logs.length ||
  !out.roundPure ||
  !out.skipVisible ||
  out.banVisible ||
  !out.bucketLine ||
  out.faceDown
) {
  process.exit(1);
}
