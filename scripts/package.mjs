#!/usr/bin/env node
// Zips a staged build/<browser>/ into releases/einfachlesen-<browser>-v<version>.zip.
// Usage:
//   node scripts/package.mjs <chrome|firefox>
// Assumes scripts/build.mjs has already produced the stage directory.

import { mkdir, readFile, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const browser = process.argv[2];
if (!browser || !["chrome", "firefox"].includes(browser)) {
  console.error("Usage: node scripts/package.mjs <chrome|firefox>");
  process.exit(1);
}

const stage = join("build", browser);
try {
  await access(join(stage, "manifest.json"));
} catch {
  console.error(`No staged build at ${stage}/. Run scripts/build.mjs first.`);
  process.exit(1);
}

const manifest = JSON.parse(await readFile(join(stage, "manifest.json"), "utf8"));
const version = manifest.version;
if (!version) {
  console.error("Staged manifest is missing 'version'.");
  process.exit(1);
}

await mkdir("releases", { recursive: true });
const out = resolve("releases", `einfachlesen-${browser}-v${version}.zip`);

// Run zip from inside the stage dir so paths inside the zip are relative.
const zip = spawnSync("zip", ["-r", out, "."], {
  cwd: stage,
  stdio: "inherit",
});
if (zip.status !== 0) {
  console.error(`zip failed`);
  process.exit(zip.status ?? 1);
}
console.log(`packaged: ${out}`);
