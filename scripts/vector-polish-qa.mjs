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

await page.waitForTimeout(400);
if (await page.locator(".orbit-stage").count()) {
  await page.screenshot({ path: `${dir}/vector-pack.png` });
  await page.locator(".orbit-stage").click({ force: true });
}
await page.waitForSelector("text=Ability", { timeout: 8000 });
await page.screenshot({ path: `${dir}/vector-ability.png` });

const moreBtn = page.locator("button").filter({ hasText: /^More$/ });
const defendBtn = page.getByRole("button", { name: "Defend", exact: true });

for (let i = 0; i < 30; i++) {
  if (await defendBtn.count()) {
    console.log("found Defend");
    break;
  }
  if (await moreBtn.count()) {
    console.log("found HUD More");
    break;
  }
  if (await page.locator(".orbit-stage").count()) {
    await page.locator(".orbit-stage").click({ force: true });
    await page.waitForTimeout(180);
    continue;
  }
  const fit = page.getByRole("button", { name: /Fit to / });
  if (await fit.count()) {
    await fit.first().click();
    await page.waitForTimeout(250);
    continue;
  }
  const pick = page.locator(".glass-panel button.card-bevel").first();
  if (await pick.count()) {
    await pick.click();
    await page.waitForTimeout(250);
    continue;
  }
  await page.waitForTimeout(250);
}

await page.screenshot({ path: `${dir}/vector-hud.png` });
console.log("final:", (await page.locator("body").innerText()).slice(0, 280).replace(/\s+/g, " "));

if (await moreBtn.count()) {
  await moreBtn.click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${dir}/vector-more.png` });
}

if (await defendBtn.count()) {
  const canvas = page.locator("canvas");
  const box = await canvas.boundingBox();
  const dock = page.locator(".absolute.inset-x-0.bottom-0 button.card-bevel").first();
  if (await dock.count() && box) {
    await dock.click();
    await page.waitForTimeout(120);
    await page.mouse.click(box.x + 360, box.y + 236);
    await page.waitForTimeout(100);
  }
  await defendBtn.click();
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${dir}/vector-combat.png` });
}

await browser.close();
console.log("ok");
