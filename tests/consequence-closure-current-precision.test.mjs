import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFile(join(root, path), 'utf8');

test('current summary and record-integrity copy preserve exact meanings', async () => {
  const app = await read('public/tools/consequence-closure/current/app.js');
  assert.match(app, /closure\.status === 'IMPOSSIBLE' \? 0 : result\.analysis\.closure\.consequences\.length/u);
  assert.match(app, /matches its declared canonical record digest/u);
  assert.match(app, /It is not a file-byte hash, external-origin check, or semantic replay/u);
  assert.doesNotMatch(app, /byte-value self-consistent|own byte-value content/u);
});

test('comparison modes state what relation, if any, is being compared', async () => {
  const app = await read('public/tools/consequence-closure/current/app.js');
  for (const expected of [
    'Same loaded semantic profile and finite boundary. Only the current evidence assignment changes',
    'Recorded operating-system contrast.',
    'Recorded OAuth commissioning contrast.',
    'Independent analyses. No semantic identity, causation, or source-system transition is inferred',
    'Comparison qualification.',
  ]) assert.ok(app.includes(expected), expected);
  assert.doesNotMatch(app, /<span class=\\"mini-label\\">Transition ledger<\/span>/u);
});

test('reference cases, views, and recorded comparisons are deep-linkable', async () => {
  const app = await read('public/tools/consequence-closure/current/app.js');
  for (const expected of [
    "params.get('case')",
    "params.get('view')",
    "params.get('compare')",
    "loadSample(requestedCase, requestedView)",
    "url.searchParams.set('compare', pair)",
    "url.searchParams.set('view', 'compare')",
  ]) assert.ok(app.includes(expected), expected);
});

test('current provenance distinguishes frozen semantic identity from evolving presentation identity', async () => {
  const provenance = JSON.parse(await read('public/tools/consequence-closure/current/provenance.json'));
  assert.equal(provenance.surface_version, '2026-09-04.2');
  assert.equal(provenance.network_evaluation_endpoint, false);
  assert.equal(provenance.external_runtime_requests, false);
  assert.equal(provenance.new_semantic_claims, false);
  assert.equal(Object.hasOwn(provenance, 'current_surface_sha256'), false);
  assert.equal(Object.hasOwn(provenance, 'runtime_network_requests'), false);
  assert.match(provenance.current_surface_identity, /Git-tracked evolving presentation layer/u);
  assert.match(provenance.claim_boundary, /canonical record digest as a file-byte digest/u);
});

test('the permanent browser gate runs the frozen worker under strict CSP', async () => {
  const browser = await read('tests/consequence-closure-current.browser.mjs');
  for (const expected of [
    "connect-src 'none'",
    "worker-src 'self'",
    '?case=authority-open&view=challenge',
    '?compare=linux&view=compare',
    '?compare=oauth&view=compare',
    'Consequence Closure Chromium gate: PASS',
  ]) assert.ok(browser.includes(expected), expected);
});
