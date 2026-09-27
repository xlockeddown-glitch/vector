import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:8080/";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(25000);
await page.goto(url, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "New draft", exact: true }).click();
await page.waitForFunction(() => window.__gridironQA);
if (await page.locator(".orbit-stage").count()) {
  await page.locator(".orbit-stage").click({ force: true });
  await page.waitForTimeout(250);
}
await page.evaluate(() => window.__gridironQA.pickFirst());
await page.waitForTimeout(400);
if (await page.locator(".orbit-stage").count()) {
  await page.locator(".orbit-stage").click({ force: true });
  await page.waitForTimeout(250);
}
await page.waitForSelector("text=Pick a companion");
await page.waitForTimeout(300);
await page.screenshot({ path: "/workspace/screenshots/lane-weather.png" });
await browser.close();
console.log("ok");
