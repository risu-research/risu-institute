import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const publicRoot = join(root, "public");
const readPublic = (path) => readFile(join(publicRoot, path), "utf8");

test("Negative Result Warrant has a website-first research overview", async () => {
  const page = await readPublic("work/negative-result-warrant/index.html");
  const work = await readPublic("work/index.html");

  assert.ok(work.includes('<h3><a href="/work/negative-result-warrant/">Negative Result Warrant</a></h3>'));
  for (const expected of [
    'https://risuinstitute.org/work/negative-result-warrant/',
    "Zero is an observation. Reliance is another step.",
    "The seam the profile makes explicit",
    "The recorded Q and Q′ contrast",
    "WARRANTED_ZERO",
    "ZeroProposition",
    "Serialization does not carry validation authority",
    "The agent-runtime witness removes the model from the gate",
    "10 of 10 real-boundary adversarial controls blocked",
    "How NRW differs from ClosureProbe",
    "/tools/negative-result-warrant/",
    "io.github.risu-research/negative-result-warrant",
  ]) assert.ok(page.includes(expected), expected);

  assert.equal(page.includes("\u2014"), false, "NRW overview contains an em dash");
  assert.doesNotMatch(page, /\binvolv(?:e|es|ed|ing|ement)\b/iu);
  assert.doesNotMatch(page, /proof of (?:world-level )?absence|certified absence|truth certificate/iu);
});

test("NRW Inspector uses the current RISU shell without changing its frozen evaluator files", async () => {
  const html = await readPublic("tools/negative-result-warrant/index.html");
  const refreshCss = await readPublic("tools/negative-result-warrant/inspector-refresh.css");
  const refreshJs = await readPublic("tools/negative-result-warrant/inspector-refresh.js");
  const core = await readPublic("tools/negative-result-warrant/core.js");
  const inspector = await readPublic("tools/negative-result-warrant/inspector.js");

  for (const expected of [
    '/assets/style.css?v=20260829-v3',
    '/tools/negative-result-warrant/inspector-refresh.css?v=20260904-v1',
    'id="recorded-quickstart"',
    "From observation to premise",
    "Recorded Q / Q′ experiment",
    "Frozen Phase 3 evidence",
    "/work/negative-result-warrant/",
    '/tools/negative-result-warrant/inspector-refresh.js',
  ]) assert.ok(html.includes(expected), expected);

  for (const expected of ["--tool-accent: #0b5f49", ".inspector-hero-grid", ".inspector-map", ".workspace-intro"]) {
    assert.ok(refreshCss.includes(expected), expected);
  }
  assert.ok(refreshJs.includes('recordedMode?.click()'));
  assert.equal(refreshJs.includes('loadOrdinary?.click()'), false);
  for (const forbidden of [/\bfetch\s*\(/u, /\bXMLHttpRequest\b/u, /\bWebSocket\b/u, /\blocalStorage\b/u]) {
    assert.doesNotMatch(refreshJs, forbidden);
  }

  assert.ok(core.includes("WARRANTED_ZERO"));
  assert.ok(inspector.includes("inspectCapture"));
  assert.equal(html.includes("\u2014"), false, "NRW Inspector contains an em dash");
});

test("Negative Result Warrant overview is registered in the sitemap exactly once", async () => {
  const sitemap = await readPublic("sitemap.xml");
  const url = "https://risuinstitute.org/work/negative-result-warrant/";
  assert.equal(sitemap.split(`<loc>${url}</loc>`).length - 1, 1);
});
