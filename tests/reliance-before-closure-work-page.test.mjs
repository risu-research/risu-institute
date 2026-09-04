import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const publicRoot = join(root, "public");
const readPublic = (path) => readFile(join(publicRoot, path), "utf8");

const overviewPath = "work/reliance-before-closure/index.html";
const overviewUrl = "https://risuinstitute.org/work/reliance-before-closure/";
const noteUrl = "/research/technical-notes/2026-02/";
const inspectorUrl = "/tools/reliance-inspector/";
const repositoryUrl = "https://github.com/risu-research/reliance-before-closure";

test("Reliance Before Closure has a website-first conceptual overview", async () => {
  const work = await readPublic("work/index.html");
  const page = await readPublic(overviewPath);

  assert.equal(work.split('href="/work/reliance-before-closure/"').length - 1, 2);
  assert.ok(work.includes('<h3><a href="/work/reliance-before-closure/">Reliance Before Closure</a></h3>'));

  for (const expected of [
    `<link rel="canonical" href="${overviewUrl}">`,
    "The gap before closure",
    "One claim, not the whole workflow",
    "Four obligations have to line up",
    "Evidence and assumptions stay different",
    "A current bound is not automatically a stable bound",
    "The stability margin",
    "The action is qualified separately",
    "The provider-blind relying function",
    "Matching numbers are not enough",
    "SUPPORTED is not permission and not a reservation",
    "The Kubernetes commissioning",
    "What the commissioning actually demonstrated",
    "Negative controls make the boundary clearer",
    "How this differs from waiting for closure",
    "How this differs from a safety filter",
    "The Inspector",
    "Three levels of reproducibility",
    "Result",
    "Where the profile stops",
    "Frozen record",
    "Research and source record",
    "THRESHOLD_SLACK_V0",
    "M = 1 POD_SLOT",
    "Cₐ = 1 POD_SLOT",
    "20.613487 seconds",
    "SUPPORTED iff Cₐ ≤ M",
    "SUPPORTED iff Cₐ &lt; M",
    "Mutable hard bound",
    "Trust-profile mismatch",
    "Replacement reserve",
    "Concurrent one-slot actions",
    "1fdcb8edb34b13cc263eca3b633de243a7c0a1bd4306ceba5259c30ce9aa567d",
    "10.5281/zenodo.22038494",
    "10.5281/zenodo.22037607",
    noteUrl,
    inspectorUrl,
    repositoryUrl,
  ]) assert.ok(page.includes(expected), expected);

  assert.match(page, /workflow completion from decision readiness/iu);
  assert.match(page, /Current enforcement answers what is true now/iu);
  assert.match(page, /arithmetic fits/iu);
  assert.match(page, /authoritative Kubernetes quota admitted one action and rejected the other/iu);
  assert.match(page, /not a production latency distribution/iu);
  assert.match(page, /not authorization, a reservation, a transaction/iu);

  for (const label of [">Research</a>", ">Publications</a>", ">Tools</a>", ">About</a>"]) {
    assert.ok(page.includes(label), label);
  }

  assert.doesNotMatch(page, /\binvolv(?:e|es|ed|ing|ement)\b/iu);
  assert.equal(page.includes("\u2014"), false, "Reliance Before Closure overview contains an em dash");
  assert.doesNotMatch(page, /speeds? Kubernetes up by 20\.6/iu);
  assert.doesNotMatch(page, /SUPPORTED (?:authorizes|reserves|guarantees)/iu);
});

test("Reliance Before Closure overview is registered in the sitemap exactly once", async () => {
  const sitemap = await readPublic("sitemap.xml");
  assert.equal(sitemap.split(`<loc>${overviewUrl}</loc>`).length - 1, 1);
});
