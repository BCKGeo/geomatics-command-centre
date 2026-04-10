#!/usr/bin/env node
/**
 * One-time conversion: src/data/municipalities.js -> public/municipalities.json
 *
 * Imports the JS module and writes its MUNICIPALITIES array as JSON.
 * Run this any time the source data changes (or delete the JS file entirely
 * and edit the JSON directly).
 *
 * Usage: node scripts/data-to-json.mjs
 */

import { writeFileSync } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const srcUrl = pathToFileURL(join(ROOT, "src/data/municipalities.js")).href;
const { MUNICIPALITIES } = await import(srcUrl);

const out = join(ROOT, "public/municipalities.json");
writeFileSync(out, JSON.stringify(MUNICIPALITIES));

const bytes = JSON.stringify(MUNICIPALITIES).length;
console.log(`Wrote ${MUNICIPALITIES.length} municipalities to ${out} (${(bytes / 1024).toFixed(0)} KB)`);
