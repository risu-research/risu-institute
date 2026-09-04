import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const publicRoot = join(root, 'public');
const read = (path) => readFile(join(publicRoot, path), 'utf8');

const frozenHashes = {
  'index.html': '3e2d7f4d6c9f631bc7b7c6a40c98b00635d82f7677f13c243e993f3ec35eef66',
  'styles.css': 'dd24b0f0cd84643a41c583c4348b22089de026b6bec7257740f014134eb7fe47',
  'engine.js': '6264d591f1a54ca320a5e3951fc2767b2b8a93dec8c60e3c60c51a698206a472',
  'samples.js': '141081b541847249d51266851e739513a821b55ad4fa7ee2efef151f40fb3b0d',
  'app.js': '7c0f42f3e7d777af7be904d4b3980237d83b43899fff01ba753b9f33d6f1506c',
};

test('current Consequence Closure surface preserves the DOI-backed frozen browser release', async () => {
  for (const [name, expected] of Object.entries(frozenHashes)) {
    const bytes = await readFile(join(publicRoot, 'tools/consequence-closure/inspector', name));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, name);
  }
  const provenance = JSON.parse(await read('tools/consequence-closure/current/provenance.json'));
  assert.deepEqual(provenance.frozen_browser_sha256, frozenHashes);
  assert.equal(provenance.semantic_engine.inspector, '0.5.0');
  assert.equal(provenance.semantic_engine.core, '0.1.0');
  assert.equal(provenance.new_semantic_claims, false);
});

test('current surface delegates exact semantics to the frozen engine in a Web Worker', async () => {
  const worker = await read('tools/consequence-closure/current/worker.js');
  const app = await read('tools/consequence-closure/current/app.js');
  const html = await read('tools/consequence-closure/current/index.html');

  assert.match(worker, /importScripts\('\/tools\/consequence-closure\/inspector\/engine\.js'\)/u);
  assert.doesNotMatch(worker, /samples\.js/u);
  assert.match(html, /\/tools\/consequence-closure\/inspector\/samples\.js/u);
  assert.match(app, /window\.CCISamples/u);
  assert.match(worker, /E\.analyze\(/u);
  assert.match(worker, /E\.synthesizeRoute\(/u);
  assert.match(worker, /E\.basisCertificateForWorlds\(/u);
  assert.match(worker, /E\.evaluationRecord\(/u);
  assert.match(worker, /outcomesByWorldId/u);
  assert.match(worker, /currentWitnessRecord/u);
});

test('current surface exposes challenge, comparison, exact-world pagination, and record-integrity modes', async () => {
  const app = await read('tools/consequence-closure/current/app.js');
  const html = await read('tools/consequence-closure/current/index.html');
  for (const expected of [
    'Decision', 'Challenge', 'Route', 'Boundary', 'Compare', 'Source',
    'Attack the assurance claim.',
    'Compare the consequence before and after the distinction changes.',
    'Display pagination does not change the exact analysis.',
    'UNRESOLVABLE UNDER DECLARED EVIDENCE SURFACE',
    'Model-relative only.',
    'Semantic replay requires the original source.',
  ]) assert.ok(`${html}\n${app}`.includes(expected), expected);
  assert.match(app, /Linux administrative → operative/u);
  assert.match(app, /OAuth live → split state/u);
  assert.match(app, /basis-family/u);
  assert.match(app, /removalWitnesses/u);
});

test('current browser runtime has no network, persistence, or inline-script escape hatch', async () => {
  const sources = await Promise.all(['app.js', 'worker.js'].map((name) => read(`tools/consequence-closure/current/${name}`)));
  const runtime = sources.join('\n');
  for (const forbidden of [
    /\bfetch\s*\(/u,
    /\bXMLHttpRequest\b/u,
    /\bWebSocket\b/u,
    /\bEventSource\b/u,
    /\bsendBeacon\b/u,
    /\blocalStorage\b/u,
    /\bsessionStorage\b/u,
    /\bindexedDB\b/u,
    /\bserviceWorker\b/u,
    /\beval\s*\(/u,
    /\bnew Function\b/u,
  ]) assert.doesNotMatch(runtime, forbidden);
  const html = await read('tools/consequence-closure/current/index.html');
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)/u);
  assert.doesNotMatch(html, /\sstyle="/u);
});

test('current route has a strict worker-capable no-connect security boundary', async () => {
  const headers = await read('_headers');
  const marker = '/tools/consequence-closure/current/*\n';
  const start = headers.indexOf(marker);
  assert.notEqual(start, -1);
  const bodyStart = start + marker.length;
  const next = headers.indexOf('\n/', bodyStart);
  const block = headers.slice(bodyStart, next === -1 ? headers.length : next);
  for (const directive of [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "connect-src 'none'",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    'X-Robots-Tag: noindex, nofollow',
    'Cache-Control: no-store',
  ]) assert.ok(block.includes(directive), directive);
  assert.doesNotMatch(block, /unsafe-inline|unsafe-eval/u);
});

test('research-software landing keeps the DOI record while making current launch immediate', async () => {
  const landing = await read('tools/consequence-closure/index.html');
  const tools = await read('tools/index.html');
  assert.match(landing, /class="cc-title-link" href="\/tools\/consequence-closure\/current\/"/u);
  assert.match(landing, /Open the current Inspector/u);
  assert.match(landing, /Frozen v0\.5\.0/u);
  assert.match(landing, /10\.5281\/zenodo\.22095709/u);
  assert.match(landing, /10\.5281\/zenodo\.22095595/u);
  assert.match(landing, /\?case=authority-open/u);
  assert.match(landing, /\?case=linux-admin/u);
  assert.match(landing, /\?case=oauth-stale/u);
  assert.match(tools, /href="\/tools\/consequence-closure\/current\/">Launch Inspector/u);
  assert.match(tools, /href="\/tools\/consequence-closure\/">About &amp; archive/u);
});

test('current public copy avoids mechanical phrasing', async () => {
  const source = (await Promise.all([
    read('tools/consequence-closure/index.html'),
    read('tools/consequence-closure/current/index.html'),
    read('tools/consequence-closure/current/app.js'),
  ])).join('\n');
  assert.doesNotMatch(source, /—/u);
  assert.doesNotMatch(source, /\binvolv(?:e|es|ed|ing|ement)\b/iu);
  assert.doesNotMatch(source, /in plain language/iu);
});
