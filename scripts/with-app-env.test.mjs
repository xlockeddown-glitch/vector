import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";
import { loadEnv } from "vite";
import {
  APP_ENV_REL_PATH,
  mergeAppEnv,
  parseAppEnv,
  projectRoot,
  readAppEnv,
  resolveSpawn,
} from "./with-app-env.mjs";

const execFileAsync = promisify(execFile);
const cleanEnv = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => key.toUpperCase() !== "VITE_AUTH_ENABLED"),
);
const PRINT_FLAG = "process.stdout.write(String(process.env.VITE_AUTH_ENABLED));";

function makeWorkspace(t, appEnvJson) {
  const root = mkdtempSync(join(tmpdir(), "app-env-"));
  t.after(() => rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }));
  mkdirSync(join(root, "scripts"));
  copyFileSync(
    join(projectRoot(), "scripts/with-app-env.mjs"),
    join(root, "scripts/with-app-env.mjs"),
  );
  if (appEnvJson !== undefined) {
    mkdirSync(join(root, ".grok"), { recursive: true });
    writeFileSync(join(root, APP_ENV_REL_PATH), appEnvJson);
  }
  return root;
}

test("keeps VITE_-prefixed string entries", () => {
  assert.deepEqual(parseAppEnv('{"VITE_AUTH_ENABLED":"false"}'), {
    VITE_AUTH_ENABLED: "false",
  });
});

test("drops non-VITE keys, non-string values and malformed documents", () => {
  assert.deepEqual(parseAppEnv('{"DATABASE_URL":"postgres://x","VITE_N":1,"VITE_OK":"y"}'), {
    VITE_OK: "y",
  });
  assert.deepEqual(parseAppEnv("not json"), {});
  assert.deepEqual(parseAppEnv('["VITE_AUTH_ENABLED"]'), {});
  assert.deepEqual(parseAppEnv("null"), {});
});

test("a missing app-env.json is a clean no-op", (t) => {
  assert.deepEqual(readAppEnv(makeWorkspace(t)), {});
});

test("reads the app env from a workspace", (t) => {
  const root = makeWorkspace(t, '{"VITE_AUTH_ENABLED":"false"}');
  assert.deepEqual(readAppEnv(root), { VITE_AUTH_ENABLED: "false" });
});

test("an explicit process-env override wins over the file", () => {
  const merged = mergeAppEnv(
    { VITE_AUTH_ENABLED: "false" },
    { VITE_AUTH_ENABLED: "true", PATH: "/usr/bin" },
  );
  assert.equal(merged.VITE_AUTH_ENABLED, "true");
  assert.equal(merged.PATH, "/usr/bin");
});

test("vite loadEnv resolves the wrapped value", (t) => {
  // What `import.meta.env.VITE_AUTH_ENABLED` becomes: loadEnv prefix-matches
  // process.env, so the wrapper's merge has to land before Vite starts.
  const root = makeWorkspace(t, '{"VITE_AUTH_ENABLED":"false"}');
  const previous = process.env.VITE_AUTH_ENABLED;
  try {
    process.env = mergeAppEnv(readAppEnv(root), { ...cleanEnv });
    assert.equal(loadEnv("production", root, "VITE_").VITE_AUTH_ENABLED, "false");
  } finally {
    if (previous === undefined) delete process.env.VITE_AUTH_ENABLED;
    else process.env.VITE_AUTH_ENABLED = previous;
  }
});

test("the wrapped command runs with the app env applied", async (t) => {
  const { stdout } = await execFileAsync(
    process.execPath,
    [
      join(makeWorkspace(t, '{"VITE_AUTH_ENABLED":"false"}'), "scripts/with-app-env.mjs"),
      process.execPath,
      "-e",
      PRINT_FLAG,
    ],
    { env: { ...cleanEnv } },
  );
  assert.equal(stdout, "false");
});

test("the wrapped command sees an explicit override, not the file value", async (t) => {
  const { stdout } = await execFileAsync(
    process.execPath,
    [
      join(makeWorkspace(t, '{"VITE_AUTH_ENABLED":"false"}'), "scripts/with-app-env.mjs"),
      process.execPath,
      "-e",
      PRINT_FLAG,
    ],
    { env: { ...cleanEnv, VITE_AUTH_ENABLED: "true" } },
  );
  assert.equal(stdout, "true");
});

test("the wrapped command receives true from the app-env file", async (t) => {
  const { stdout } = await execFileAsync(
    process.execPath,
    [
      join(makeWorkspace(t, '{"VITE_AUTH_ENABLED":"true"}'), "scripts/with-app-env.mjs"),
      process.execPath,
      "-e",
      PRINT_FLAG,
    ],
    { env: { ...cleanEnv } },
  );
  assert.equal(stdout, "true");
});

test("the wrapped command leaves auth undefined when the app-env file is absent", async (t) => {
  const { stdout } = await execFileAsync(
    process.execPath,
    [
      join(makeWorkspace(t), "scripts/with-app-env.mjs"),
      process.execPath,
      "-e",
      PRINT_FLAG,
    ],
    { env: { ...cleanEnv } },
  );
  assert.equal(stdout, "undefined");
});

test("the wrapped command honors a false env override over a true app-env file", async (t) => {
  const { stdout } = await execFileAsync(
    process.execPath,
    [
      join(makeWorkspace(t, '{"VITE_AUTH_ENABLED":"true"}'), "scripts/with-app-env.mjs"),
      process.execPath,
      "-e",
      PRINT_FLAG,
    ],
    { env: { ...cleanEnv, VITE_AUTH_ENABLED: "false" } },
  );
  assert.equal(stdout, "false");
});

test("the wrapper propagates the command's exit code", async (t) => {
  await assert.rejects(
    execFileAsync(process.execPath, [
      join(makeWorkspace(t, '{"VITE_AUTH_ENABLED":"false"}'), "scripts/with-app-env.mjs"),
      process.execPath,
      "-e",
      "process.exit(3)",
    ]),
    (err) => err.code === 3,
  );
});

test("a signal-killed command is never reported as success", async (t) => {
  // The wrapper's own SIGTERM handler must not swallow the re-raised signal:
  // a cancelled build reporting exit 0 is a silently passing gate.
  await assert.rejects(
    execFileAsync(process.execPath, [
      join(makeWorkspace(t, '{"VITE_AUTH_ENABLED":"false"}'), "scripts/with-app-env.mjs"),
      process.execPath,
      "-e",
      "process.kill(process.pid, 'SIGTERM');setTimeout(() => {}, 1000);",
    ]),
    (err) => err.signal === "SIGTERM" || err.code !== 0,
  );
});

test("the CLI still runs when invoked through a symlinked path", async (t) => {
  // node realpaths import.meta.url but not process.argv[1], so a raw comparison
  // turns the wrapper into a no-op that exits 0 without starting anything.
  const root = makeWorkspace(t, '{"VITE_AUTH_ENABLED":"false"}');
  const linkRoot = mkdtempSync(join(tmpdir(), "app-env-link-"));
  t.after(() => rmSync(linkRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }));
  const link = join(linkRoot, "scripts");
  symlinkSync(join(root, "scripts"), link, process.platform === "win32" ? "junction" : "dir");
  const { stdout } = await execFileAsync(
    process.execPath,
    [join(link, "with-app-env.mjs"), process.execPath, "-e", PRINT_FLAG],
    { env: { ...cleanEnv } },
  );
  assert.equal(stdout, "false");
});

for (const [platform, command, expected] of [
  [
    "win32",
    "vite",
    { file: "node", args: [join("workspace", "node_modules/vite/bin/vite.js"), "build", "a b"] },
  ],
  ["win32", "other", { file: "other", args: ["build", "a b"] }],
  ["linux", "vite", { file: "vite", args: ["build", "a b"] }],
]) {
  test(`resolveSpawn preserves command boundaries for ${platform} ${command}`, () => {
    assert.deepEqual(
      resolveSpawn(command, ["build", "a b"], {
        platform,
        root: "workspace",
        execPath: "node",
      }),
      expected,
    );
  });
}
