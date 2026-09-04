import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const publicRoot = join(root, "public");
const readPublic = (path) => readFile(join(publicRoot, path), "utf8");

const overviewPath = "work/projection-assurance/index.html";
const overviewUrl = "https://risuinstitute.org/work/projection-assurance/";

test("Projection Assurance has a website-first conceptual overview", async () => {
  const page = await readPublic(overviewPath);
  const work = await readPublic("work/index.html");
  const home = await readPublic("index.html");

  assert.ok(work.includes('<h3><a href="/work/projection-assurance/">Projection Assurance</a></h3>'));
  assert.ok(home.includes('href="/work/projection-assurance/"'));

  for (const expected of [
    `<link rel="canonical" href="${overviewUrl}">`,
    "Surface fidelity is not consequence fidelity",
    "What has to survive",
    "Correspondence",
    "Discrimination",
    "Operative Placement",
    "Exact Realization",
    "Coverage",
    "C1 / D1 / O0",
    "If-None-Match: *",
    "prospectively frozen PayPal holdout",
    "frozen v0.2.0 Evaluation Capsule",
    "Consequence-Preserving Projections v0.7.0",
    "GitHub guarded merge",
    "Azure DevOps Wiki edit",
    "GitHub file update transition",
    "REPAIR_CONSISTENT_HISTORICAL_TRANSITION",
    "MECHANISM_MISALIGNMENT",
    ".risu.json",
    "source_semantic_digest",
    "Scope of the result",
    "10.5281/zenodo.22149639",
    "10.5281/zenodo.22149517",
    "10.5281/zenodo.22149593",
    "bc3c0be440b1b729d3131a630491cce62f1f885fb305aa46a4483fee0adad72f",
    "/tools/#workbench",
    "https://github.com/risu-research/risu-verify",
  ]) assert.ok(page.includes(expected), expected);

  assert.match(page, /Visible information can become decorative/iu);
  assert.match(page, /source control does not need to survive as the same knob/iu);
  assert.match(page, /same byte-identical source consequence contract/iu);
  assert.match(page, /does not establish general agent safety/iu);
  assert.match(page, /Coverage is not inferred from preservation of one slice/iu);

  assert.equal(page.includes("in plain language"), false);
  assert.doesNotMatch(page, /\binvolv(?:e|es|ed|ing|ement)\b/iu);
  assert.equal(page.includes("\u2014"), false, "Projection Assurance overview contains an em dash");
  assert.doesNotMatch(page, /(?:proves?|establishes?) (?:universal|general) (?:agent|MCP|projection|interface)/iu);
});

test("Projection Assurance overview is registered in the sitemap exactly once", async () => {
  const sitemap = await readPublic("sitemap.xml");
  assert.equal(sitemap.split(`<loc>${overviewUrl}</loc>`).length - 1, 1);
});
