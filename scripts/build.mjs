#!/usr/bin/env node
// Stages a per-browser build under build/<browser>/.
// Usage:
//   node scripts/build.mjs <chrome|firefox>
// Honours env var:
//   BACKEND_URL — if set, replaces the localhost default in both the
//   manifest's host_permissions and the compiled dist/src/config.js.

import { rm, mkdir, readFile, writeFile, cp } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const browser = process.argv[2];
if (!browser || !["chrome", "firefox"].includes(browser)) {
  console.error("Usage: node scripts/build.mjs <chrome|firefox>");
  process.exit(1);
}

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const PLACEHOLDER = "__BACKEND_URL_HOST__";

const stage = join("build", browser);

console.log(`[build:${browser}] BACKEND_URL=${BACKEND_URL}`);

await rm(stage, { recursive: true, force: true });
await mkdir(stage, { recursive: true });

// 1. Stage manifest with placeholder substitution.
const manifestRaw = await readFile(`manifest.${browser}.json`, "utf8");
const manifest = JSON.parse(manifestRaw);
manifest.host_permissions = (manifest.host_permissions || []).map((h) =>
  h === PLACEHOLDER ? `${BACKEND_URL}/*` : h,
);
await writeFile(join(stage, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

// 2. Compile TypeScript directly into the stage dir.
const tscOutDir = join(stage, "dist");
const tsc = spawnSync("npx", ["tsc", "--outDir", tscOutDir], {
  stdio: "inherit",
  shell: true,
});
if (tsc.status !== 0) {
  console.error(`[build:${browser}] tsc failed`);
  process.exit(tsc.status ?? 1);
}

// 3. Rewrite BACKEND_URL in the compiled config module if it's not localhost.
//    (The source default is http://localhost:8000; production builds replace it.)
const configPath = join(tscOutDir, "src", "config.js");
const configJs = await readFile(configPath, "utf8");
const updatedConfigJs = configJs.replace(
  /export const BACKEND_URL = "[^"]+";/,
  `export const BACKEND_URL = "${BACKEND_URL}";`,
);
await writeFile(configPath, updatedConfigJs);

// 4. Copy static assets.
await cp("popup.html", join(stage, "popup.html"));
await cp("style.css", join(stage, "style.css"));
await cp("icons", join(stage, "icons"), { recursive: true });

console.log(`[build:${browser}] staged at ${stage}`);
