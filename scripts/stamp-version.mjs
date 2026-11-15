#!/usr/bin/env node
// Bump the build version served by version.json and embedded in the page.
// Run this before every deploy: the client polls version.json and prompts
// open tabs to reload when the deployed build differs from the loaded one.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'js', 'data.js');
const VERSION_FILE = join(ROOT, 'version.json');

const version = new Date().toISOString();

const source = readFileSync(DATA, 'utf8');
const stamped = source.replace(
  /CC\.APP_VERSION = '[^']*';/,
  "CC.APP_VERSION = '" + version + "';"
);
if (stamped === source && !source.includes("CC.APP_VERSION = '" + version + "'")) {
  throw new Error('CC.APP_VERSION marker not found in js/data.js');
}
writeFileSync(DATA, stamped);

writeFileSync(
  VERSION_FILE,
  JSON.stringify({ version, builtAt: version }, null, 2) + '\n'
);

console.log('Build version: ' + version);
