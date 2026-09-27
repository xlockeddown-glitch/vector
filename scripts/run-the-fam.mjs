#!/usr/bin/env node
import { spawn } from "node:child_process";
import { recordSuite, tallyView } from "./fam-tally.mjs";

function run(label, file) {
  return new Promise((resolve) => {
    const child = spawn("npx", ["tsx", file], {
      cwd: "/workspace",
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, VECTOR_SKIP_GIRLS: label === "the boys" ? "1" : process.env.VECTOR_SKIP_GIRLS },
    });
    let out = "";
    child.stdout.on("data", (d) => {
      out += d;
    });
    child.stderr.on("data", (d) => {
      out += d;
    });
    child.on("close", (code) => {
      let parsed = null;
      try {
        const start = out.indexOf("{");
        parsed = JSON.parse(out.slice(start));
      } catch {
        parsed = { raw: out.slice(-1500) };
      }
      resolve({ label, code, parsed });
    });
  });
}

const boys = await run("the boys", "scripts/run-the-boys.mjs");
if (boys.code !== 0) {
  console.log(JSON.stringify({ ok: false, stopped: "the boys", boys: boys.parsed }, null, 2));
  process.exit(1);
}

const girls = await run("the girls", "scripts/run-the-girls.mjs");
const issues = [...(boys.parsed.issues ?? []), ...(girls.parsed.issues ?? [])];
const pass = [...(boys.parsed.pass ?? []), ...(girls.parsed.pass ?? [])];
const tally = tallyView(await recordSuite("fam", { pass, issues }, { bots: false }));
const report = {
  ok: girls.code === 0,
  fam: "boys then girls",
  tally,
  boys: { pass: boys.parsed.pass, issues: boys.parsed.issues ?? [], tally: boys.parsed.tally },
  girls: girls.parsed,
};
console.log(JSON.stringify(report, null, 2));
if (girls.code !== 0) process.exit(1);
