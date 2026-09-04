import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const publicRoot = join(root, "public");
const readPublic = (path) => readFile(join(publicRoot, path), "utf8");

const overviewPath = "work/bounded-agent-closure/index.html";
const overviewUrl = "https://risuinstitute.org/work/bounded-agent-closure/";
const noteUrl = "/research/technical-notes/2026-01/";
const inspectorUrl = "/tools/agent-closure/";
const repositoryUrl = "https://github.com/risu-research/bounded-agent-closure";

test("Bounded Agent Closure has a website-first conceptual overview", async () => {
  const work = await readPublic("work/index.html");
  const page = await readPublic(overviewPath);

  assert.equal(work.split('href="/work/bounded-agent-closure/"').length - 1, 2);
  assert.ok(work.includes('<h3><a href="/work/bounded-agent-closure/">Bounded Agent Closure</a></h3>'));

  for (const expected of [
    `<link rel="canonical" href="${overviewUrl}">`,
    "The gap after shutdown",
    "Closure belongs to the retiring principal",
    "The consequence cone",
    "Five dispositions, not one cleanup rule",
    "Two opposite errors",
    "Silence is not closure",
    "Fresh evidence matters",
    "One clean scan is not enough",
    "What a scan must establish",
    "Four evidence domains",
    "Verdicts are deliberately different",
    "The eight boundary cases",
    "Where BAC sits",
    "The Inspector",
    "Result",
    "Where the verifier stops",
    "Frozen record",
    "Research and source record",
    "RISU_AGENT_CLOSURE_V0",
    "CLOSED within RISU_AGENT_CLOSURE_V0 and the declared source contracts.",
    "C2 Transitive Zombie",
    "C5 Successor Transfer",
    "C6 Missing Coverage",
    "C7 False Success",
    "C8 Fixed-Point Wind-Down",
    "MONOTONIC_BARRIER",
    "BOUNDED_LAG",
    "UNBOUNDED",
    "75 tests · 75 passed · 0 failed on Node.js 22",
    "a46456f028cd3dd1d386111b1faab890a26ae5e9",
    "07325dd1304cc3fe1acd86ce50596161581a1cdb",
    "10.5281/zenodo.22005109",
    "10.5281/zenodo.22005419",
    noteUrl,
    inspectorUrl,
    repositoryUrl,
  ]) assert.ok(page.includes(expected), expected);

  assert.match(page, /Disabling an autonomous agent stops future authority/iu);
  assert.match(page, /action report is metadata/iu);
  assert.match(page, /object may remain active/iu);
  assert.match(page, /missing evidence is uncertainty/iu);
  assert.match(page, /final two qualifying scans/iu);
  assert.match(page, /No live-runtime adapter is part of the frozen v0\.3 line/iu);

  for (const label of [">Research</a>", ">Publications</a>", ">Tools</a>", ">About</a>"]) {
    assert.ok(page.includes(label), label);
  }

  assert.doesNotMatch(page, /\binvolv(?:e|es|ed|ing|ement)\b/iu);
  assert.equal(page.includes("\u2014"), false, "Bounded Agent Closure overview contains an em dash");
});

test("Bounded Agent Closure overview is registered in the sitemap exactly once", async () => {
  const sitemap = await readPublic("sitemap.xml");
  assert.equal(sitemap.split(`<loc>${overviewUrl}</loc>`).length - 1, 1);
});
