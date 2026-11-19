import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  MAX_CARD_BYTES,
  computeBrandWarnings,
  siteDeclaresOgTypeGame,
} from "./brand-check.mjs";

const GAME_SITE = JSON.stringify({ title: "Wild Race", type: "x:game", card: "custom" });
const UTILITY_SITE = JSON.stringify({ title: "Invoice" });
const UTILITY_CUSTOM_SITE = JSON.stringify({ title: "Invoice", card: "custom" });

function makeWorkspace(t, {
  siteJson,
  cardFile,
  narrowFile,
  cardBytes = 200 * 1024,
  narrowBytes = 200 * 1024,
} = {}) {
  const root = mkdtempSync(join(tmpdir(), "brand-check-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "public"), { recursive: true });
  mkdirSync(join(root, "src/lib/og"), { recursive: true });
  if (siteJson !== undefined) {
    writeFileSync(join(root, "src/lib/og/site.json"), siteJson);
  }
  if (cardFile !== undefined) {
    writeFileSync(join(root, "public", cardFile), Buffer.alloc(cardBytes, 7));
  }
  if (narrowFile !== undefined) {
    writeFileSync(join(root, "public", narrowFile), Buffer.alloc(narrowBytes, 7));
  }
  return root;
}

test("non-canvas app with no custom card gets a soft BRAND NOTE (utility exception)", (t) => {
  const root = makeWorkspace(t, { siteJson: UTILITY_SITE });
  const warnings = computeBrandWarnings({ hasCanvas: false, workspaceRoot: root });
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /^BRAND NOTE:/);
  assert.match(warnings[0], /plain utilit/);
  assert.doesNotMatch(warnings[0], /^BRAND WARNING:/);
});

test("non-canvas app with a compliant card is silent", (t) => {
  const root = makeWorkspace(t, { siteJson: UTILITY_CUSTOM_SITE, cardFile: "og.jpg" });
  assert.deepEqual(computeBrandWarnings({ hasCanvas: false, workspaceRoot: root }), []);
});

test("card file without site.json card=custom warns", (t) => {
  const root = makeWorkspace(t, { siteJson: UTILITY_SITE, cardFile: "og.jpg" });
  const warnings = computeBrandWarnings({ hasCanvas: false, workspaceRoot: root });
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /"card": "custom"/);
});

test("card file with missing site.json warns for card=custom", (t) => {
  const root = makeWorkspace(t, { cardFile: "og.jpg" });
  const warnings = computeBrandWarnings({ hasCanvas: false, workspaceRoot: root });
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /"card": "custom"/);
});

test("card file with invalid site.json warns for card=custom", (t) => {
  const root = makeWorkspace(t, { siteJson: "{not-json", cardFile: "og.jpg" });
  const warnings = computeBrandWarnings({ hasCanvas: false, workspaceRoot: root });
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /"card": "custom"/);
});

test("oversized card warns for non-canvas apps too", (t) => {
  const root = makeWorkspace(t, {
    siteJson: UTILITY_CUSTOM_SITE,
    cardFile: "og.jpg",
    cardBytes: MAX_CARD_BYTES + 1,
  });
  const warnings = computeBrandWarnings({ hasCanvas: false, workspaceRoot: root });
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /over 600 KB/);
});

test("canvas app with no card warns 'missing' and missing og:type", (t) => {
  const root = makeWorkspace(t, { siteJson: UTILITY_SITE });
  const warnings = computeBrandWarnings({ hasCanvas: true, workspaceRoot: root });
  assert.equal(warnings.length, 2);
  assert.match(warnings[0], /og\.jpg.*is missing/s);
  assert.match(warnings[0], /not done/);
  assert.match(warnings[1], /site\.json/);
  assert.match(warnings[1], /og:type|x:game/);
});

test("canvas card without type still warns for og:type", (t) => {
  const root = makeWorkspace(t, { siteJson: UTILITY_CUSTOM_SITE, cardFile: "og.jpg" });
  const warnings = computeBrandWarnings({ hasCanvas: true, workspaceRoot: root });
  assert.match(warnings.join("\n"), /x:game/);
  assert.match(warnings.join("\n"), /x-banner\.jpg/);
});

test("oversized card warns on the scraper budget (jpg and legacy png)", (t) => {
  for (const cardFile of ["og.jpg", "og.png"]) {
    const root = makeWorkspace(t, {
      siteJson: GAME_SITE,
      cardFile,
      cardBytes: MAX_CARD_BYTES + 1,
      narrowFile: "x-banner.jpg",
    });
    const warnings = computeBrandWarnings({ hasCanvas: true, workspaceRoot: root });
    assert.match(warnings[0], /over 600 KB/);
  }
});

test("compliant game (custom card + site.json type + x-banner) is silent", (t) => {
  const root = makeWorkspace(t, {
    siteJson: GAME_SITE,
    cardFile: "og.jpg",
    narrowFile: "x-banner.jpg",
  });
  assert.deepEqual(computeBrandWarnings({ hasCanvas: true, workspaceRoot: root }), []);
});

test("__root.tsx og:type no longer satisfies the canvas gate", (t) => {
  const root = makeWorkspace(t, {
    siteJson: UTILITY_CUSTOM_SITE,
    cardFile: "og.jpg",
    narrowFile: "x-banner.jpg",
  });
  mkdirSync(join(root, "src/routes"), { recursive: true });
  writeFileSync(
    join(root, "src/routes/__root.tsx"),
    '{ property: "og:type", content: "x:game" }',
  );
  const warnings = computeBrandWarnings({ hasCanvas: true, workspaceRoot: root });
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /x:game/);
});

test("oversized x-banner warns on the same scraper budget as og.jpg", (t) => {
  const root = makeWorkspace(t, {
    siteJson: GAME_SITE,
    cardFile: "og.jpg",
    narrowFile: "x-banner.jpg",
    narrowBytes: MAX_CARD_BYTES + 1,
  });
  const warnings = computeBrandWarnings({ hasCanvas: true, workspaceRoot: root });
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /x-banner\.jpg is over 600 KB/);
});

test("legacy png + site.json type still needs the X feed card", (t) => {
  const root = makeWorkspace(t, {
    siteJson: GAME_SITE,
    cardFile: "og.png",
  });
  const warnings = computeBrandWarnings({ hasCanvas: true, workspaceRoot: root });
  assert.match(warnings.join("\n"), /x-banner\.jpg/);
});

test("siteDeclaresOgTypeGame reads the site contract", () => {
  assert.equal(siteDeclaresOgTypeGame({ type: "x:game" }), true);
  assert.equal(siteDeclaresOgTypeGame({ type: "website" }), false);
  assert.equal(siteDeclaresOgTypeGame({}), false);
});
