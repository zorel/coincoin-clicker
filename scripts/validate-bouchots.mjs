#!/usr/bin/env node
// Validate the historical pyCoinCoin bouchot list and generate the RIP data.
// A server is considered dead when it produces no HTTP response (DNS error,
// refused connection, TLS failure or timeout). Any HTTP status counts as alive.
// A bouchot is only kept if its *_tribune.xml settings contain a real
// <Object name="backend" type="Option"> with a non-empty Param value.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const LIST_URL = 'http://chrisix.free.fr/pycoincoin/config/list.php';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONCURRENCY = 8;
const TIMEOUT_MS = 7000;

const stripTags = (value) => value
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

const decode = (buffer) => new TextDecoder('iso-8859-1').decode(buffer);

async function fetchList() {
  const response = await fetch(LIST_URL, {
    redirect: 'follow',
    headers: { 'user-agent': 'Mozilla/5.0 coincoin-clicker-bouchot-check' },
  });
  if (!response.ok) throw new Error(`list.php HTTP ${response.status}`);
  return decode(await response.arrayBuffer());
}

function parseList(html) {
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const entries = [];
  for (const row of rows) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => m[1]);
    if (cells.length < 4) continue;
    const bouchotLink = cells[0].match(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    const serverLink = cells[2].match(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!bouchotLink || !serverLink) continue;
    const modules = cells[3];
    if (!/tribune/i.test(stripTags(modules))) continue;
    const config = new URL(bouchotLink[1], LIST_URL).href;
    const slug = bouchotLink[1].replace(/^.*\//, '').replace(/\.xml$/i, '');
    entries.push({
      id: slug,
      name: stripTags(bouchotLink[2]),
      desc: stripTags(cells[1]),
      server: stripTags(serverLink[2]),
      url: serverLink[1],
      config,
      tribuneConfig: (modules.match(/href="([^"]*tribune[^"]*)"/i) || [])[1]
        ? new URL((modules.match(/href="([^"]*tribune[^"]*)"/i) || [])[1], config).href
        : null,
    });
  }
  return entries;
}

async function check(entry) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(entry.url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'Mozilla/5.0 coincoin-clicker-bouchot-check' },
    });
    return { ...entry, alive: true, status: response.status };
  } catch (error) {
    return { ...entry, alive: false, error: error.name + ': ' + error.message };
  } finally {
    clearTimeout(timer);
  }
}

async function checkBackend(entry) {
  if (!entry.tribuneConfig) return { hasBackend: false, backendError: 'no tribune config' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(entry.tribuneConfig, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'Mozilla/5.0 coincoin-clicker-bouchot-check' },
    });
    if (!response.ok) {
      return { hasBackend: false, backendError: `tribune config HTTP ${response.status}` };
    }
    const xml = decode(await response.arrayBuffer());
    const object = xml.match(
      /<Object\b(?=[^>]*\bname="backend")(?=[^>]*\btype="Option")[^>]*>([\s\S]*?)<\/Object>/i
    );
    if (!object) return { hasBackend: false, backendError: 'backend Option missing' };
    const value = object[1].match(/<Param\b(?=[^>]*\bname="value")[^>]*>([\s\S]*?)<\/Param>/i);
    if (!value) return { hasBackend: false, backendError: 'backend value missing' };
    const backend = value[1].trim().replace(/^['"]|['"]$/g, '').trim();
    if (!backend) return { hasBackend: false, backend: '', backendError: 'backend value empty' };
    return { hasBackend: true, backend };
  } catch (error) {
    return { hasBackend: false, backendError: error.name + ': ' + error.message };
  } finally {
    clearTimeout(timer);
  }
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

const html = await fetchList();
const entries = parseList(html);
if (!entries.length) throw new Error('Aucun bouchot avec tribune trouvé dans list.php');

const results = await mapLimit(entries, CONCURRENCY, async (entry, index) => {
  const [server, settings] = await Promise.all([check(entry), checkBackend(entry)]);
  const result = { ...server, ...settings };
  console.log(
    String(index + 1).padStart(2, '0') + '/' + entries.length,
    result.alive ? 'UP  ' : 'DOWN',
    result.hasBackend ? 'TRIBUNE' : 'NO-BACKEND',
    result.id,
    result.alive ? 'HTTP ' + result.status : result.error,
    result.backend || result.backendError
  );
  return result;
});

const dead = results
  .filter((entry) => !entry.alive && entry.hasBackend)
  .map(({ id, name, desc, server, url, config, tribuneConfig, backend, error }) => ({
    id, name, desc, server, url, config, tribuneConfig, backend,
    error: error || 'no response',
  }));

const payload = `/* Generated by scripts/validate-bouchots.mjs on ${new Date().toISOString()}.
   Bouchots with a tribune whose server produced no HTTP response. */
window.DEAD_BOUCHOTS = ${JSON.stringify(dead, null, 1)};
window.DEAD_BOUCHOTS_VALIDATED_AT = ${JSON.stringify(new Date().toISOString())};
`;
writeFileSync(join(ROOT, 'js', 'dead-bouchots.js'), payload);
console.log(`\n${entries.length} bouchots avec tribune, ${dead.length} sans réponse.`);
console.log('Écrit: js/dead-bouchots.js');
