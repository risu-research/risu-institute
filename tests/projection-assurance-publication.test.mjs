import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const publicRoot = join(root, "public");
const readPublic = (path) => readFile(join(publicRoot, path), "utf8");
const title = "Projection Assurance: Consequence-Relevant Semantics Across Agent-Facing Interfaces";
const noteDoi = "10.5281/zenodo.22149639";
const softwareDoi = "10.5281/zenodo.22149593";
const capsuleDoi = "10.5281/zenodo.22149517";
const pdfPath = "research/technical-notes/2026-04/RISU_Technical_Note_2026-04_Projection_Assurance.pdf";

test("2026-04 publication page exposes the final scholarly and artifact records", async () => {
  const page = await readPublic("research/technical-notes/2026-04/index.html");
  for (const expected of [
    title,
    noteDoi,
    softwareDoi,
    capsuleDoi,
    'citation_publication_date" content="2026/08/28',
    'citation_technical_report_number" content="RISU Technical Note 2026-04',
    'https://risuinstitute.org/research/technical-notes/2026-04/',
    `/${pdfPath}`,
    'Creative Commons Attribution 4.0 International',
    'frozen v0.2.0 Evaluation Capsule',
    'current separately archived implementation',
  ]) assert.ok(page.includes(expected), expected);
  assert.match(page, /"@type": "ScholarlyArticle"/u);
  assert.doesNotMatch(page, /peer[- ]reviewed/iu);
});

test("the institutional 2026-04 PDF is byte-identical to the published Zenodo file", async () => {
  const bytes = await readFile(join(publicRoot, pdfPath));
  assert.equal(createHash("md5").update(bytes).digest("hex"), "ba6a55121e74d7b44969c10600b5fc92");
  assert.ok(bytes.length < 5 * 1024 * 1024);
});

test("Projection Assurance is surfaced across the current institutional publication paths", async () => {
  for (const path of ["index.html", "work/index.html", "research/index.html", "research/technical-notes/index.html"]) {
    const html = await readPublic(path);
    assert.ok(html.includes("2026-04") || html.includes("Projection Assurance"), path);
  }
  const home = await readPublic("index.html");
  assert.ok(home.includes("Projection Assurance"));
  assert.ok(home.includes(softwareDoi));
  assert.ok(home.includes(capsuleDoi));
});

test("sitemap contains the 2026-04 publication exactly once", async () => {
  const sitemap = await readPublic("sitemap.xml");
  const url = "https://risuinstitute.org/research/technical-notes/2026-04/";
  assert.equal(sitemap.split(`<loc>${url}</loc>`).length - 1, 1);
});
