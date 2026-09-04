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
const methodInferenceRepoUrl =
  "https://github.com/risu-research/http-mcp-method-inference-soundness-profile";
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

test("Reliance Before Closure deeper surfaces link to the substantive canonical repository", async () => {
  for (const page of [
    "work/reliance-before-closure/index.html",
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

test("Native++ opens a dedicated website record before the GitHub deep record", async () => {
  const work = await readPublic("work/index.html");
  const record = await readPublic("work/native-plus/index.html");

  assert.equal(work.split('href="/work/native-plus/"').length - 1, 2);
  assert.equal(work.split(nativePlusRecordUrl).length - 1, 1);
  assert.ok(!work.includes('id="native-plus-v0-2"'));

  for (const expected of [
    '<link rel="canonical" href="https://risuinstitute.org/work/native-plus/">',
    "The idea in plain language",
    "What changed in the evidence path",
    "Two checks, not one",
    "Primary result",
    "Negative controls",
    "What the result means",
    "What the result does not mean",
    "Why the failed runs matter",
    "Frozen evidence anchors",
    nativePlusRecordUrl,
    "33809187591",
    "455184caf716751148b7c9c2a372b66084dcaa30",
    "a65d2e79590f99cff0efa83de283075f54c69135d00487caa5d1c305ee0aaa8b",
    "b3c2242bdfc11d9bdf653f1de2491297174e41da1d4f63b05d230e0a5e852f96",
  ]) assert.ok(record.includes(expected), expected);

  assert.ok(record.includes("PASS, within a narrow scope"));
  assert.ok(record.includes("cross-provider semantic-labor amortization"));
  assert.ok(!record.includes("RISU Technical Note 2026-05"));
  assert.equal(record.includes("\u2014"), false, "Native++ public record contains an em dash");
});

test("HTTP to MCP method inference opens a dedicated explanatory profile page", async () => {
  const work = await readPublic("work/index.html");
  const profile = await readPublic("work/http-mcp-method-inference/index.html");

  assert.equal(work.split('href="/work/http-mcp-method-inference/"').length - 1, 2);
  for (const expected of [
    '<link rel="canonical" href="https://risuinstitute.org/work/http-mcp-method-inference/">',
    "The question",
    "What each method can support",
    "The soundness check",
    "The 40-state oracle",
    "The assumption behind the result",
    "Soundness and precision",
    "Comparison with reproduced defaults",
    "A second check against real operations",
    "Result",
    "Where the profile stops",
    "Frozen record and reproducibility",
    "Source record",
    "14",
    "26",
    "API7 documented defaults",
    "Infobip verified source defaults",
    "Azure App Service documented defaults",
    "DaniWeb",
    "Jumpseller",
    methodInferenceRepoUrl,
  ]) assert.ok(profile.includes(expected), expected);

  assert.ok(profile.includes("effect-faithful translation"));
  assert.ok(profile.includes("Runtime dependency count is zero"));
  assert.ok(profile.includes("not an official MCP"));
  assert.equal(profile.includes("in plain language"), false, "method-inference page should not reuse the plain-language heading template");
  assert.doesNotMatch(profile, /\binvolv(?:e|es|ed|ing|ement)\b/iu);
  assert.equal(profile.includes("\u2014"), false, "method-inference public page contains an em dash");
});

test("institutional navigation distinguishes research, publications, tools, and about", async () => {
  const pages = [
    "index.html",
    "work/index.html",
    "work/consequence-closure/index.html",
    "work/reliance-before-closure/index.html",
    "work/bounded-agent-closure/index.html",
    "work/native-plus/index.html",
    "work/closureprobe/index.html",
    "work/http-mcp-method-inference/index.html",
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
  assert.ok(page.includes("Local only · no file upload"));
  assert.ok(page.includes("The Workbench consumes RISU artifacts; it does not infer a new assurance claim from arbitrary JSON."));
  assert.ok(page.includes("Browser verified"));
  assert.ok(page.includes("Producer recorded"));
  assert.ok(page.includes('href="/tools/reliance-inspector/">Open Inspector'));
});

test("sitemap includes the current publication, instrument, and work surfaces", async () => {
  const sitemap = await readPublic("sitemap.xml");
  for (const url of [
    "https://risuinstitute.org/work/consequence-closure/",
    "https://risuinstitute.org/work/reliance-before-closure/",
    "https://risuinstitute.org/work/bounded-agent-closure/",
    "https://risuinstitute.org/work/native-plus/",
    "https://risuinstitute.org/work/closureprobe/",
    "https://risuinstitute.org/work/http-mcp-method-inference/",
    "https://risuinstitute.org/research/technical-notes/2026-03/",
    "https://risuinstitute.org/research/technical-notes/2026-02/",
    "https://risuinstitute.org/tools/",
    "https://risuinstitute.org/tools/consequence-closure/",
    "https://risuinstitute.org/tools/reliance-inspector/",
  ]) assert.equal(sitemap.split(`<loc>${url}</loc>`).length - 1, 1, url);
});
