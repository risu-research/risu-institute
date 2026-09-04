import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const publicRoot = join(root, "public");
const readPublic = (path) => readFile(join(publicRoot, path), "utf8");

const noteTitle =
  "Reliance Before Closure: Evidence-Qualified Stability for Machine Decisions Under Unresolved Effects";
const noteDoi = "10.5281/zenodo.22038494";
const softwareDoi = "10.5281/zenodo.22037607";
const repositoryUrl = "https://github.com/risu-research/reliance-before-closure";
const nativePlusRecordUrl =
  "https://github.com/risu-research/risu-institute/tree/main/records/native-plus-v0.2";
const pdfPath =
  "research/technical-notes/2026-02/RISU_Technical_Note_2026-02_Reliance_Before_Closure.pdf";

test("2026-02 publication page exposes the published scholarly record", async () => {
  const page = await readPublic("research/technical-notes/2026-02/index.html");
  for (const expected of [
    noteTitle,
    noteDoi,
    softwareDoi,
    repositoryUrl,
    'citation_publication_date" content="2026/08/21',
    'citation_technical_report_number" content="RISU Technical Note 2026-02',
    'https://risuinstitute.org/research/technical-notes/2026-02/',
    `/${pdfPath}`,
    'Creative Commons Attribution 4.0 International',
  ]) assert.ok(page.includes(expected), expected);
  assert.match(page, /"@type": "ScholarlyArticle"/u);
  assert.doesNotMatch(page, /peer[- ]reviewed/iu);
});


test("Reliance Before Closure surfaces link to the substantive canonical repository", async () => {
  for (const page of [
    "work/index.html",
    "research/technical-notes/2026-02/index.html",
    "tools/reliance-inspector/index.html",
  ]) {
    const html = await readPublic(page);
    assert.ok(html.includes(repositoryUrl), `${page}: ${repositoryUrl}`);
  }
});

test("the institutional 2026-02 PDF is the selected published file", async () => {
  const bytes = await readFile(join(publicRoot, pdfPath));
  assert.equal(createHash("md5").update(bytes).digest("hex"), "3c3e185e253e3d228ce779e8e995ec6e");
  assert.ok(bytes.length < 5 * 1024 * 1024);
});

test("the research program is ordered by current threads and latest work", async () => {
  const work = await readPublic("work/index.html");
  const positions = [
    "Consequence Closure",
    "Reliance Before Closure",
    "Bounded Agent Closure",
    "Native++ v0.2",
    "ClosureProbe",
    "Negative Result Warrant",
    "OpenAPI→MCP Problem-Semantics Preservation Profile",
    "HTTP→MCP Method-Inference Soundness Profile",
    "Appeal",
  ].map((title) => work.indexOf(title));
  assert.ok(positions.every((position) => position >= 0));
  for (let i = 1; i < positions.length; i += 1) assert.ok(positions[i - 1] < positions[i]);
  for (const thread of [
    "Reliance, finality, and consequence closure.",
    "Evidence qualification and transport.",
    "Semantic identity and preservation.",
  ]) assert.ok(work.includes(thread));
});

test("Native++ is exposed as a website-native frozen record, not a numbered publication", async () => {
  const work = await readPublic("work/index.html");
  assert.equal(work.split(nativePlusRecordUrl).length - 1, 2);
  assert.ok(work.includes('<h3><a href="#native-plus-v0-2">Native++ v0.2</a></h3>'));
  assert.ok(work.includes('<a href="#native-plus-v0-2">Read the full experimental record →</a>'));
  assert.ok(work.includes('<section class="thread-section" id="native-plus-v0-2">'));
  assert.ok(work.includes("Evidence qualification · frozen experimental record"));
  assert.ok(work.includes("not evidence of cross-provider semantic-labor amortization"));
  assert.ok(!work.includes("RISU Technical Note 2026-05"));
});

test("institutional navigation distinguishes research, publications, tools, and about", async () => {
  const pages = [
    "index.html",
    "work/index.html",
    "research/index.html",
    "research/technical-notes/index.html",
    "research/technical-notes/2026-03/index.html",
    "research/technical-notes/2026-02/index.html",
    "research/technical-notes/2026-01/index.html",
    "tools/index.html",
    "tools/consequence-closure/index.html",
    "tools/reliance-inspector/index.html",
    "about/index.html",
    "rels/appeal.html",
    "work/appeal-interoperability/index.html",
    "work/problem-semantics/index.html",
  ];
  for (const page of pages) {
    const html = await readPublic(page);
    for (const label of [">Research</a>", ">Publications</a>", ">Tools</a>", ">About</a>"]) {
      assert.ok(html.includes(label), `${page}: ${label}`);
    }
  }
});

test("tools index preserves the declared instrument boundaries", async () => {
  const page = await readPublic("tools/index.html");
  for (const title of ["Consequence Closure Inspector", "Reliance Inspector", "Agent Closure Inspector", "Negative Result Warrant Inspector"]) {
    assert.ok(page.includes(title), title);
  }
  assert.ok(page.toLowerCase().includes("local-first"));
  assert.ok(page.includes("limited to canonical evidence"));
  assert.ok(page.includes("Receiver validation is performed locally"));
  assert.ok(page.includes(repositoryUrl));
});

test("sitemap includes the current publication and instrument surfaces", async () => {
  const sitemap = await readPublic("sitemap.xml");
  for (const url of [
    "https://risuinstitute.org/research/technical-notes/2026-03/",
    "https://risuinstitute.org/research/technical-notes/2026-02/",
    "https://risuinstitute.org/tools/",
    "https://risuinstitute.org/tools/consequence-closure/",
    "https://risuinstitute.org/tools/reliance-inspector/",
  ]) assert.equal(sitemap.split(`<loc>${url}</loc>`).length - 1, 1, url);
});
