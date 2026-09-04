import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const publicRoot = join(root, "public");
const readPublic = (path) => readFile(join(publicRoot, path), "utf8");

const releaseUrl = "https://github.com/risu-research/closureprobe/releases/tag/v0.1.0-rc3";

test("ClosureProbe has a website-first research record with the frozen rc3 anchors", async () => {
  const work = await readPublic("work/index.html");
  const page = await readPublic("work/closureprobe/index.html");

  assert.ok(work.includes('<h3><a href="/work/closureprobe/">ClosureProbe</a></h3>'));
  assert.equal(work.split('href="/work/closureprobe/"').length - 1, 2);
  assert.equal(work.split(releaseUrl).length - 1, 1);

  for (const expected of [
    '<link rel="canonical" href="https://risuinstitute.org/work/closureprobe/">',
    "The problem",
    "What ClosureProbe follows",
    "The protocol can succeed while the evidence gets weaker",
    "A negative needs more than zero",
    "Why the last empty page is not enough",
    "The receiver does not trust the trace at face value",
    "Four bindings keep the claim from drifting",
    "What it can localize",
    "Producer-specific semantics",
    "How this differs from Negative Result Warrant",
    "Frozen adversarial record",
    "What rc3 hardened",
    "Result",
    "Where the system stops",
    "Frozen release record",
    "50 passed · 0 failed",
    "37",
    "13",
    "33",
    "Official MCP 2.0.0 client/server packages over stdio",
    "12fae2c0cb0909a43f487323fb00e7372b1f3377",
    "e0e8a2e0f2958accf090d595e233189a7def1906a29477019966c0a3e256a44a",
    "a6d0acdae171a1eee4d83f0be417431178507fbecc99a4fd2f94656f329b0e97",
    "unanchored_root_evidence",
    "unsupported_upgrade",
    "Google Drive files.list",
    "DynamoDB Query",
    "Elasticsearch search",
    "GraphQL Relay",
    "Microsoft Graph delta",
  ]) assert.ok(page.includes(expected), expected);

  assert.match(page, /does not decide whether nothing exists in the world/iu);
  assert.match(page, /first observed boundary/iu);
  assert.match(page, /terminal string into an auditable evidence path/iu);
  assert.match(page, /protocol completion, HTTP success, page length/iu);
  assert.doesNotMatch(page, /\binvolv(?:e|es|ed|ing|ement)\b/iu);
  assert.equal(page.includes("\u2014"), false, "ClosureProbe page contains an em dash");
});

test("ClosureProbe is registered in the public sitemap", async () => {
  const sitemap = await readPublic("sitemap.xml");
  const url = "https://risuinstitute.org/work/closureprobe/";
  assert.equal(sitemap.split(`<loc>${url}</loc>`).length - 1, 1);
});
