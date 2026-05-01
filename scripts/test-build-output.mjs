#!/usr/bin/env node
// Asserts that build/<browser>/ contains a well-formed staged extension.
// Usage:
//   node scripts/test-build-output.mjs <browser> [--prod-host <host>]
// Exits 0 on success, 1 on failure.

import { readFile, access } from "node:fs/promises";
import { join } from "node:path";

const browser = process.argv[2];
if (!browser || !["chrome", "firefox"].includes(browser)) {
  console.error("Usage: node scripts/test-build-output.mjs <chrome|firefox> [--prod-host <host>]");
  process.exit(1);
}
const prodHostFlagIdx = process.argv.indexOf("--prod-host");
const expectedHost = prodHostFlagIdx > -1 ? process.argv[prodHostFlagIdx + 1] : "http://localhost:8000";

const root = join("build", browser);
const required = [
  "manifest.json",
  "popup.html",
  "style.css",
  "dist/background.js",
  "dist/content.js",
  "dist/popup.js",
  "dist/src/config.js",
  "icons/icon-16.png",
  "icons/icon-48.png",
  "icons/icon-128.png",
];

const failures = [];

for (const rel of required) {
  try {
    await access(join(root, rel));
  } catch {
    failures.push(`missing: ${rel}`);
  }
}

const manifestRaw = await readFile(join(root, "manifest.json"), "utf8").catch(() => null);
if (!manifestRaw) {
  failures.push("missing: manifest.json");
} else {
  let m;
  try { m = JSON.parse(manifestRaw); } catch (e) { failures.push(`manifest.json: invalid JSON (${e.message})`); }
  if (m) {
    if (m.manifest_version !== 3) failures.push(`manifest.json: expected manifest_version 3`);
    if (JSON.stringify(m.host_permissions || []).includes("__BACKEND_URL_HOST__")) {
      failures.push("manifest.json: __BACKEND_URL_HOST__ placeholder was not substituted");
    }
    const expectedHostEntry = `${expectedHost}/*`;
    if (!(m.host_permissions || []).includes(expectedHostEntry)) {
      failures.push(`manifest.json: host_permissions missing ${expectedHostEntry}`);
    }
    if (browser === "chrome" && !m.background?.service_worker) {
      failures.push("manifest.json: chrome build must use background.service_worker");
    }
    if (browser === "chrome" && m.background?.scripts) {
      failures.push("manifest.json: chrome build must NOT include background.scripts");
    }
    if (browser === "firefox" && !m.background?.scripts) {
      failures.push("manifest.json: firefox build must use background.scripts");
    }
    if (browser === "firefox" && !m.browser_specific_settings?.gecko?.id) {
      failures.push("manifest.json: firefox build must include gecko.id");
    }
  }
}

const configJs = await readFile(join(root, "dist/src/config.js"), "utf8").catch(() => null);
if (!configJs) {
  failures.push("missing: dist/src/config.js");
} else if (!configJs.includes(expectedHost)) {
  failures.push(`dist/src/config.js: BACKEND_URL was not set to ${expectedHost}`);
}

for (const f of ["dist/background.js", "dist/popup.js"]) {
  const js = await readFile(join(root, f), "utf8").catch(() => null);
  if (!js) {
    failures.push(`missing: ${f}`);
    continue;
  }
  if (/^import\s/m.test(js)) {
    failures.push(`${f}: still contains an ESM import statement (must be inlined to run as classic script)`);
  }
  if (!js.includes(`const BACKEND_URL = "${expectedHost}";`)) {
    failures.push(`${f}: does not contain inlined const BACKEND_URL = "${expectedHost}";`);
  }
}

if (failures.length) {
  console.error(`FAIL (${browser}):\n  ` + failures.join("\n  "));
  process.exit(1);
}
console.log(`PASS: build/${browser} is well-formed (BACKEND_URL=${expectedHost}).`);
