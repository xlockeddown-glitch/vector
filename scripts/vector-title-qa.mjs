import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const url = process.argv[2] || "http://127.0.0.1:8080/";
const dir = "/workspace/screenshots";
await mkdir(dir, { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const desktop = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await desktop.goto(url, { waitUntil: "networkidle" });
await desktop.waitForSelector("button:has-text('New draft')");
await desktop.waitForTimeout(400);
await desktop.screenshot({ path: `${dir}/vector-title.png` });

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(url, { waitUntil: "networkidle" });
await mobile.waitForSelector("button:has-text('New draft')");
await mobile.waitForTimeout(400);
await mobile.screenshot({ path: `${dir}/vector-title-mobile.png` });

await browser.close();
console.log("ok");
