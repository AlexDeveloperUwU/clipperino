#!/usr/bin/env node
/**
 * Version bumper for Clipperino.
 *
 * Bumps the shared version used by the app (js/state.js -> APP_VERSION) and the
 * service worker cache (sw.js -> CACHE_NAME = "cache-vX.Y"), keeping them in sync.
 *
 * Usage:
 *   node utils/bump.js minor   # 1.8 -> 1.9
 *   node utils/bump.js major   # 1.8 -> 2.0  (minor resets to 0)
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const STATE_FILE = path.join(ROOT, "js", "state.js");
const SW_FILE = path.join(ROOT, "sw.js");

const VERSION_RE = /(APP_VERSION\s*=\s*")(\d+)\.(\d+)(")/;
const CACHE_RE = /(CACHE_NAME\s*=\s*"cache-v)(\d+)\.(\d+)(")/;

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function read(file) {
  if (!fs.existsSync(file)) fail(`File not found: ${file}`);
  return fs.readFileSync(file, "utf8");
}

const type = (process.argv[2] || "").toLowerCase();
if (type !== "major" && type !== "minor") {
  fail(
    'Expected a "major" or "minor" argument.\nUsage: node utils/bump.js <major|minor>',
  );
}

const stateSrc = read(STATE_FILE);
const match = stateSrc.match(VERSION_RE);
if (!match) fail(`Could not find APP_VERSION in ${STATE_FILE}`);

let major = parseInt(match[2], 10);
let minor = parseInt(match[3], 10);
const oldVersion = `${major}.${minor}`;

if (type === "major") {
  major += 1;
  minor = 0;
} else {
  minor += 1;
}

const newVersion = `${major}.${minor}`;

// js/state.js
const newStateSrc = stateSrc.replace(VERSION_RE, `$1${newVersion}$4`);
fs.writeFileSync(STATE_FILE, newStateSrc);

// sw.js
const swSrc = read(SW_FILE);
if (!CACHE_RE.test(swSrc)) fail(`Could not find CACHE_NAME in ${SW_FILE}`);
const newSwSrc = swSrc.replace(CACHE_RE, `$1${newVersion}$4`);
fs.writeFileSync(SW_FILE, newSwSrc);

console.log(`Bumped ${type}: ${oldVersion} -> ${newVersion}`);
console.log(
  `  ${path.relative(ROOT, STATE_FILE)}  APP_VERSION = "${newVersion}"`,
);
console.log(
  `  ${path.relative(ROOT, SW_FILE)}  CACHE_NAME = "cache-v${newVersion}"`,
);
