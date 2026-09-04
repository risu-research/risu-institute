import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFile(join(root, path), "utf8");

function headerBlock(source, route) {
  const marker = `${route}\n`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${route} header block is missing`);
  const bodyStart = start + marker.length;
  const next = source.indexOf("\n/", bodyStart);
  return source.slice(bodyStart, next === -1 ? source.length : next);
}

test("current Agent Closure Inspector presents the BAC decision boundary before the corpus", async () => {
  const html = await read("public/tools/agent-closure-inspector/index.html");

  assert.match(html, /<title>Agent Closure Inspector \| RISU Institute<\/title>/u);
  assert.match(html, /<link rel="canonical" href="https:\/\/risuinstitute\.org\/tools\/agent-closure-inspector\/">/u);
  assert.match(html, /Stopping an autonomous agent from creating new work does not tell you whether the consequences it already created are finished\./u);
  for (const text of [
    "Block new authority",
    "Follow consequences",
    "Apply the right ending",
    "Confirm stability",
    "CLOSED",
    "INCOMPLETE",
    "UNKNOWN",
  ]) assert.ok(html.includes(text), text);
});

test("current Agent Closure Inspector foregrounds the four boundary contrasts", async () => {
  const html = await read("public/tools/agent-closure-inspector/index.html");
  for (const text of [
    "C7 · False Success",
    "Success is not the postcondition.",
    "C5 · Successor Transfer",
    "Survival is not necessarily failure.",
    "C6 · Missing Coverage",
    "Silence is not evidence of closure.",
    "C8 · Fixed-Point Wind-Down",
    "Clean once is not stable.",
  ]) assert.ok(html.includes(text), text);
});

test("current surface reuses the frozen runtime and preserves every DOM hook it requires", async () => {
  const html = await read("public/tools/agent-closure-inspector/index.html");
  const runtime = await read("public/tools/agent-closure/app.js");

  assert.match(html, /<base href="\/tools\/agent-closure\/">/u);
  assert.match(html, /<link rel="stylesheet" href="\/tools\/agent-closure\/style\.css">/u);
  assert.match(html, /<script type="module" src="\/tools\/agent-closure\/app\.js"><\/script>/u);

  const ids = [...runtime.matchAll(/document\.getElementById\(id\)/gu)];
  assert.ok(ids.length >= 1);
  const declared = runtime.match(/\[\n([\s\S]*?)\n  \]\.map\(\(id\)/u)?.[1] ?? "";
  const hooks = [...declared.matchAll(/"([^"]+)"/gu)].map((match) => match[1]);
  assert.ok(hooks.length >= 20);
  for (const id of hooks) {
    assert.match(html, new RegExp(`\\bid="${id}"`, "u"), id);
  }
});

test("current surface keeps public canonical inspection separate from local private evaluation", async () => {
  const html = await read("public/tools/agent-closure-inspector/index.html");
  assert.match(html, /Canonical cases are public\. Arbitrary evidence stays local\./u);
  assert.match(html, /literal <code>127\.0\.0\.1<\/code>/u);
  assert.match(html, /id="open-file"[^>]*disabled/u);
  assert.match(html, /id="file-input"/u);
  assert.match(html, /id="capability-note"/u);
});

test("current Agent Closure route has an explicit same-origin, no-exfiltration security boundary", async () => {
  const headers = await read("public/_headers");
  const block = headerBlock(headers, "/tools/agent-closure-inspector/*");

  for (const directive of [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self'",
    "font-src 'none'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "manifest-src 'none'",
  ]) assert.ok(block.includes(directive), directive);

  assert.doesNotMatch(block, /script-src[^\n;]*'unsafe-inline'/u);
  assert.match(block, /Referrer-Policy: no-referrer/u);
  assert.match(block, /Cross-Origin-Opener-Policy: same-origin/u);
  assert.match(block, /Cross-Origin-Resource-Policy: same-origin/u);
  assert.match(block, /Cache-Control: no-store/u);
});

test("current Agent Closure surface is indexed while the frozen publication stays archival", async () => {
  const redirects = await read("public/_redirects");
  const sitemap = await read("public/sitemap.xml");
  assert.doesNotMatch(redirects, /\/tools\/agent-closure/u);
  assert.equal(sitemap.split("https://risuinstitute.org/tools/agent-closure-inspector/").length - 1, 1);
  assert.equal(sitemap.split("https://risuinstitute.org/tools/agent-closure/").length - 1, 0);
});

test("current Agent Closure copy avoids mechanical public-facing phrasing", async () => {
  const html = await read("public/tools/agent-closure-inspector/index.html");
  assert.doesNotMatch(html, /—/u);
  assert.doesNotMatch(html, /\binvolv(?:e|es|ed|ing)\b/iu);
  assert.doesNotMatch(html, /in plain language/iu);
});