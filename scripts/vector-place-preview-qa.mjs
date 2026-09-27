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
const hold = await page.evaluate(() => window.__gridironQA.pickBench());
await page.waitForTimeout(200);
const canvas = page.locator("canvas");
const box = await canvas.boundingBox();
if (box) {
  await page.mouse.move(box.x + box.width * 0.42, box.y + box.height * 0.45);
  await page.waitForTimeout(120);
}
await page.screenshot({ path: `${dir}/place-preview.png` });
const body = await page.locator("body").innerText();
const out = {
  hold,
  hasShadeHint: /Shade on empty pads/i.test(body),
  swaps: /2 swaps/i.test(body) || /2 swap/i.test(body),
};
console.log(JSON.stringify(out, null, 2));
await browser.close();
if (!out.hasShadeHint) process.exit(1);
