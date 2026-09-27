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
page.on("console", (m) => {
  if (m.type() === "error") logs.push(m.text());
});

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForSelector("button:has-text('New draft')");
await page.getByRole("button", { name: "New draft", exact: true }).click();
await page.waitForFunction(() => window.__gridironQA?.snap?.().phase === "opening");

if (await page.locator(".orbit-stage").count()) {
  await page.locator(".orbit-stage").click({ force: true });
  await page.waitForTimeout(200);
}

await page.waitForSelector("button.card-face");
await page.locator("button.card-face").nth(0).click();
await page.waitForTimeout(280);

if (await page.locator(".orbit-stage").count()) {
  await page.locator(".orbit-stage").click({ force: true });
  await page.waitForTimeout(200);
}

await page.waitForFunction(() => /Take two towers/i.test(document.body.innerText));
const twoSnap = await page.evaluate(() => window.__gridironQA.snap());
const idsBefore = await page.locator("button.card-face").evaluateAll((els) => els.map((e) => e.innerText.slice(0, 24)));

await page.locator("button.card-face").nth(0).click();
await page.waitForTimeout(120);
const midImmediate = await page.evaluate(() => ({
  picks: window.__gridironQA.snap().draftPicksLeft,
  count: window.__gridironQA.snap().draftCount,
  phase: window.__gridironQA.snap().phase,
}));
const dimmedMid = await page.locator(".card-dim").count();
const clickableMid = await page.locator("button.card-face").count();
await page.screenshot({ path: `${dir}/take-two-mid.png` });

await page.locator("button.card-face").nth(0).click();
await page.waitForTimeout(280);
const afterSecond = await page.evaluate(() => window.__gridironQA.snap());

const kitFail = await page.evaluate(() => window.__gridironQA.tryBadSkill());
const afterFail = await page.evaluate(() => window.__gridironQA.snap());
await page.screenshot({ path: `${dir}/draft-skill-fail.png` });

const out = {
  twoPicksLeft: twoSnap.draftPicksLeft,
  twoCount: twoSnap.draftCount,
  openingStepAtTwo: twoSnap.openingStep,
  idsBefore,
  midImmediate,
  dimmedMid,
  clickableMid,
  afterSecondPhase: afterSecond.phase,
  afterSecondTitle: afterSecond.draftTitle,
  afterSecondStep: afterSecond.openingStep,
  kitFail,
  afterFailCount: afterFail.draftCount,
  stuckOnTakeTwo: /Take two towers/i.test(await page.locator("body").innerText()) && afterSecond.draftPicksLeft === 1,
  logs,
};
console.log(JSON.stringify(out, null, 2));
if (
  out.stuckOnTakeTwo ||
  dimmedMid > 0 ||
  midImmediate.picks !== 1 ||
  afterSecond.openingStep !== 2 ||
  kitFail.picksUnchanged !== true ||
  kitFail.stillInPack !== true
) {
  process.exitCode = 1;
}
await browser.close();
