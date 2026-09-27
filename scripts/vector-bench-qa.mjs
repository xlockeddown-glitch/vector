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

await page.goto(url, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "New draft", exact: true }).click();
await page.waitForFunction(() => window.__gridironQA?.snap?.().phase === "opening");

for (let i = 0; i < 12; i++) {
  const snap = await page.evaluate(() => window.__gridironQA.snap());
  if (snap.phase === "placement") break;
  if (await page.locator(".orbit-stage").count()) {
    await page.locator(".orbit-stage").click({ force: true });
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.__gridironQA.pickFirst());
  await page.waitForTimeout(80);
}

await page.waitForFunction(() => window.__gridironQA.snap().phase === "placement");
await page.waitForTimeout(200);

const layout = await page.evaluate(() => {
  const canvas = document.querySelector("canvas");
  const dock = document.querySelector(".bench-dock");
  const cr = canvas.getBoundingClientRect();
  const dr = dock ? dock.getBoundingClientRect() : null;
  const hide = document.body.innerText.includes("Hide bench");
  const show = document.body.innerText.includes("Show bench");
  return {
    canvasBottom: Math.round(cr.bottom),
    canvasHeight: Math.round(cr.height),
    dockTop: dr ? Math.round(dr.top) : null,
    dockHeight: dr ? Math.round(dr.height) : null,
    overlap: dr ? Math.round(cr.bottom - dr.top) : null,
    show,
    hide,
    phase: window.__gridironQA.snap().phase,
  };
});
await page.screenshot({ path: `${dir}/bench-peek.png` });

await page.getByRole("button", { name: "Show bench" }).click();
await page.waitForTimeout(200);
const openLayout = await page.evaluate(() => {
  const canvas = document.querySelector("canvas");
  const dock = document.querySelector(".bench-dock");
  const cr = canvas.getBoundingClientRect();
  const dr = dock.getBoundingClientRect();
  return {
    canvasBottom: Math.round(cr.bottom),
    canvasHeight: Math.round(cr.height),
    dockTop: Math.round(dr.top),
    dockHeight: Math.round(dr.height),
    overlap: Math.round(cr.bottom - dr.top),
  };
});
await page.screenshot({ path: `${dir}/bench-open.png` });

const out = { layout, openLayout, logs };
console.log(JSON.stringify(out, null, 2));
const peekOverlap = Math.abs(layout.overlap ?? 99);
const openOverlap = Math.abs(openLayout.overlap);
if (!layout.show || peekOverlap > 6 || openOverlap > 8 || openLayout.canvasHeight >= layout.canvasHeight) {
  process.exitCode = 1;
}
await browser.close();
