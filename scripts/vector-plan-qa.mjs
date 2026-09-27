import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const url = process.argv[2] || "http://127.0.0.1:8080/";
const dir = "/workspace/screenshots";
await mkdir(dir, { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(25000);
const logs = [];
page.on("pageerror", (e) => logs.push(`pageerror ${e}`));
page.on("console", (m) => {
  if (m.type() === "error") logs.push(m.text());
});

await page.goto(url, { waitUntil: "networkidle" });
await page.evaluate(() => {
  for (const k of Object.keys(localStorage)) {
    if (/vector|gridiron|tip/i.test(k)) localStorage.removeItem(k);
  }
});
await page.reload({ waitUntil: "networkidle" });
await page.waitForSelector("button:has-text('Arena')");
await page.screenshot({ path: `${dir}/plan-title.png` });

await page.getByRole("button", { name: "Briefing", exact: true }).click();
await page.waitForSelector("text=Hold the lane");
await page.screenshot({ path: `${dir}/plan-brief.png` });
await page.locator(".brief-nav-go").click();
await page.waitForSelector("text=Draft once");
await page.screenshot({ path: `${dir}/plan-brief-draft.png` });
await page.getByRole("button", { name: "Close", exact: true }).click();

await page.getByRole("button", { name: "Arena", exact: true }).click();
await page.waitForSelector(".card-hs");

const steps = [];
for (let i = 0; i < 8; i++) {
  await page.waitForFunction(() => window.__gridironQA);
  const snap = await page.evaluate(() => window.__gridironQA.snap());
  if (snap.phase === "placement" || snap.phase === "combat") break;
  await page.waitForSelector(".card-hs");
  const names = await page.locator(".card-hs .font-display").allTextContents();
  const kinds = await page.locator(".card-hs .card-typeline").allTextContents();
  const title = (await page.locator("h2").first().textContent()) ?? "";
  const hud = await page.locator(".play-top").innerText();
  steps.push({
    i,
    phase: snap.phase,
    title: title.trim(),
    kinds: snap.draftKinds,
    names: names.map((n) => n.trim()),
    typeLines: kinds.map((k) => k.trim()),
    hud: hud.replace(/\s+/g, " ").trim(),
    openingStep: snap.openingStep,
    ritual: (await page.locator(".orbit-stage").count()) > 0,
    cardCount: await page.locator(".card-hs").count(),
  });
  await page.screenshot({ path: `${dir}/plan-pick-${i + 1}.png` });
  await page.evaluate(() => window.__gridironQA.pickFirst());
  await page.waitForTimeout(220);
}

await page.waitForFunction(() => {
  const p = window.__gridironQA?.snap()?.phase;
  return p === "placement" || p === "combat";
});
const placed = await page.evaluate(() => window.__gridironQA.snap());
await page.waitForTimeout(400);
await page.screenshot({ path: `${dir}/plan-plant.png` });

const out = {
  logs,
  steps,
  plant: {
    phase: placed.phase,
    lives: placed.lives,
    wave: placed.wave,
    bench: placed.bench,
    placed: placed.placed,
    playMode: placed.playMode,
  },
  titles: steps.map((s) => s.title),
  kinds: steps.map((s) => s.kinds),
  ritualAny: steps.some((s) => s.ritual),
  cardCounts: steps.map((s) => s.cardCount),
};
console.log(JSON.stringify(out, null, 2));
await writeFile(`${dir}/plan-qa.json`, JSON.stringify(out, null, 2));
await browser.close();
