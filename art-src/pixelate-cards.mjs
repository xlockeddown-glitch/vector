// Pixelates the card paintings in art-src/cards into public/game/cards.
// Run: npm i --no-save sharp && node art-src/pixelate-cards.mjs art-src/cards public/game/cards 84 32
// Then bump the ?v= in src/game/data/card-art.ts so browsers reload the art.
import sharp from "sharp";
import { readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";
const [src, out, gw = "150", colors = "40"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
for (const f of readdirSync(src).filter((f) => /\.(jpe?g|png)$/i.test(f))) {
  const meta = await sharp(join(src, f)).metadata();
  const w = Number(gw), h = Math.round((meta.height / meta.width) * w);
  const small = await sharp(join(src, f)).resize(w, h, { kernel: "lanczos3" }).png({ palette: true, colors: Number(colors), dither: 0.2 }).toBuffer();
  await sharp(small).resize(w * 4, h * 4, { kernel: "nearest" }).jpeg({ quality: 88 }).toFile(join(out, f));
}
console.log("done");
