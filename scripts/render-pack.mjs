import { writeFileSync } from "node:fs";
import { chromium } from "playwright";
import pack from "../public/game/pack/pack.json" with { type: "json" };

const SIZE = {
  pad: [168, 96],
  "pad-hot": [168, 96],
  exit: [168, 96],
  lance: [240, 320],
  halo: [240, 320],
  crater: [240, 320],
  rail: [240, 320],
  beacon: [240, 320],
  grunt: [160, 120],
  swift: [160, 120],
  plate: [160, 120],
  swarm: [160, 120],
  auger: [220, 150],
  boost: [220, 150],
  shrike: [220, 150],
};

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto("about:blank");
await page.addScriptTag({ path: "scripts/pack-paint.js" });

for (const [kind, [w, h]] of Object.entries(SIZE)) {
  const data = await page.evaluate(
    ({ kind, w, h }) => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      globalThis.paintPack(ctx, kind);
      return canvas.toDataURL("image/png").split(",")[1];
    },
    { kind, w, h },
  );
  const file = `public/game/pack/${pack.items[kind].src}`;
  writeFileSync(file, Buffer.from(data, "base64"));
  console.log(kind, file);
}
await browser.close();
