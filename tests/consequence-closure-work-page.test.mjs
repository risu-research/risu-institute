import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const publicRoot = join(root, "public");
const readPublic = (path) => readFile(join(publicRoot, path), "utf8");

const overviewPath = "work/consequence-closure/index.html";
const overviewUrl = "https://risuinstitute.org/work/consequence-closure/";
const noteUrl = "/research/technical-notes/2026-03/";
const inspectorUrl = "/tools/consequence-closure/";
const repositoryUrl = "https://github.com/risu-research/consequence-closure";

test("Consequence Closure has a website-first conceptual overview", async () => {
  const work = await readPublic("work/index.html");
  const home = await readPublic("index.html");
  const page = await readPublic(overviewPath);

  assert.equal(work.split('href="/work/consequence-closure/"').length - 1, 2);
  assert.ok(work.includes('<h3><a href="/work/consequence-closure/">Consequence Closure</a></h3>'));
  assert.equal(home.split('href="/work/consequence-closure/"').length - 1, 1);

  for (const expected of [
    `<link rel="canonical" href="${overviewUrl}">`,
    "The question at the moment of action",
    "Closure means determinacy, not approval",
    "If two possible worlds disagree, keep both",
    "Turn the disagreement into semantic obligations",
    "Knowing what matters is different from knowing how to establish it",
    "A correct final decision can still hide a broken abstraction",
    "The Cedar official-runtime gate",
    "Then test the semantics at real effect cuts",
    "The assurance object stays challengeable",
    "Result",
    "Where the result stops",
    "Frozen record and source materials",
    "IMPOSSIBLE",
    "OPEN",
    "CLOSED(c)",
    "UNRESOLVABLE UNDER DECLARED EVIDENCE SURFACE",
    "materiality hypergraph",
    "inclusion-minimal",
    "Establishments",
    "Route",
    "P0 · status preservation",
    "P1 · obligation preservation",
    "P2 · route preservation",
    "cedar-policy-cli 4.12.0",
    "EXACT_P1_CONFIRMED_ON_FROZEN_BOUNDARY",
    "64 / 64",
    "183 / 183",
    "2,928 checks",
    "427 checked · 0 failed",
    "F_SEAL_WRITE",
    "RENAME_NOREPLACE_BIND",
    "1,024 well-formed declared gate states",
    "OAuthLib 3.3.1",
    "Keycloak 26.7.2",
    "semantic repair 0",
    "300 randomized models",
    "Consequence Closure v1.0.0",
    "Consequence Closure Core v0.1.0",
    "Consequence Closure Inspector v0.5.0",
    "10.5281/zenodo.22095709",
    "10.5281/zenodo.22095595",
    "a379d1dc05e0c7ee90f6370fba3a44fdfdff7dc89cff91d968f9b099d545b26c",
    "7de97e497b6703b74afaffcf99cb7532e29e6fe02446f9708b84dca05d875b3d",
    "66be1260b0c3917bcae1c9884d0e583ee9a193bca0561c45544803730c6adc0d",
    noteUrl,
    inspectorUrl,
    repositoryUrl,
  ]) assert.ok(page.includes(expected), expected);

  assert.match(page, /still-possible realization/iu);
  assert.match(page, /CLOSED\(c\)<\/span> does not mean safe, allowed, or desirable/iu);
  assert.match(page, /Inclusion-minimal does not mean unique or smallest by cardinality/iu);
  assert.match(page, /determinacy and hitting-set ingredients are established formal tools/iu);
  assert.match(page, /P2 was not tested/iu);
  assert.match(page, /does not establish general Cedar equivalence/iu);
  assert.match(page, /do not establish general carrier neutrality/iu);
  assert.match(page, /selected and sealed before the real run/iu);
  assert.match(page, /provider-specific semantic checker branches 0/iu);

  for (const label of [">Research</a>", ">Publications</a>", ">Tools</a>", ">About</a>"]) {
    assert.ok(page.includes(label), label);
  }

  assert.equal(page.includes("in plain language"), false);
  assert.doesNotMatch(page, /\binvolv(?:e|es|ed|ing|ement)\b/iu);
  assert.equal(page.includes("\u2014"), false, "Consequence Closure overview contains an em dash");
});

test("Consequence Closure overview is registered in the sitemap exactly once", async () => {
  const sitemap = await readPublic("sitemap.xml");
  assert.equal(sitemap.split(`<loc>${overviewUrl}</loc>`).length - 1, 1);
});
