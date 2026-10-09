import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import pack from "../public/game/pack/pack.json" with { type: "json" };

function pngSize(file) {
  const buf = readFileSync(file);
  assert.equal(buf.readUInt32BE(0), 0x89504e47);
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

test("the pack lists every piece and the files match the canvas", () => {
  const ids = Object.keys(pack.items);
  for (const need of ["pad", "pad-hot", "exit", "lance", "halo", "crater", "rail", "beacon", "grunt", "swift", "plate", "swarm", "auger", "boost", "shrike"]) {
    assert.ok(ids.includes(need), need);
  }
  for (const [id, item] of Object.entries(pack.items)) {
    const size = pngSize(new URL(`../public/game/pack/${item.src}`, import.meta.url));
    assert.deepEqual(size, { w: item.w, h: item.h }, id);
  }
  assert.equal(pack.scale, 0.5);
});
