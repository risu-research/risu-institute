import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFile(join(root, path), "utf8");
const pagePath = "/research/conference-papers/siai-2026-110/";
const title = "Corrective Action in Medicaid Appeals: Legal Authority and Source Retrieval";
const doi = "https://doi.org/10.5281/zenodo.24235732";

test("SIAI paper has a research page linked from the home and publications index", async () => {
  const home = await read("public/index.html");
  const index = await read("public/research/index.html");
  const page = await read("public/research/conference-papers/siai-2026-110/index.html");
  const sitemap = await read("public/sitemap.xml");
  for (const t of [home,index,page]) {
    assert.ok(t.includes(title));
    assert.ok(t.includes(doi));
  }
  assert.ok(home.includes('<h3><a href="' + pagePath + '">International Conference on the Social Impact of AI 2026</a></h3>'));
  assert.ok(home.includes('<p class="update-paper"><a href="' + pagePath + '">' + title + '</a></p>'));
  assert.ok(home.includes("Presented · Full paper"));
  assert.ok(index.includes("Conference papers"));
  assert.ok(index.includes('href="' + pagePath + '"'));
  assert.ok(index.includes("Springer Nature proceedings forthcoming"));
  assert.ok(page.includes('rel="canonical" href="https://risuinstitute.org' + pagePath + '"'));
  assert.ok(sitemap.includes("https://risuinstitute.org" + pagePath));
});

test("SIAI writing focuses on the legal-source trail and gives the later archive its own scope", async () => {
  const page = await read("public/research/conference-papers/siai-2026-110/index.html");
  for (const term of [
    "The 2024 audit and its governing contract",
    "120 calendar days after the plan's appeal-resolution notice",
    "Table 1.",
    "Oral appeals",
    "State fair hearing",
    "Continued benefits",
    "8 of 8",
    "7 of 8",
    "3 of 7",
    "Retrieval results across two Nevada audits",
    "Additional contract and handbook evidence",
    "Amendments 1–13",
    "“After we receive your appeal in writing.”",
    "Springer Nature proceedings",
    "Research archive",
  ]) assert.ok(page.includes(term),term);
  assert.ok(page.includes("2026-11-14"));
  assert.ok(page.includes("siai2026-medicaid-source-routing"));
  assert.ok(page.includes("POST_AUDIT_HANDBOOK_REVIEW.md"));
  assert.ok(page.includes('href="https://www.siai.co/program"'));
  assert.doesNotMatch(page, /\bonline\b/iu);
  assert.doesNotMatch(page, /<strong>(?:8 of 8|7 of 8|3 of 7)<\/strong>/iu);
  assert.ok(page.includes("2024_AUTHORITY_CROSSWALK.md"));
  assert.doesNotMatch(page, /(?:Moon Hwan Lee|Moon Lee|examine|reinforce|taken together|\bdoes not\b|\bis not\b)/iu);
  assert.ok(!page.includes("—"));
  assert.ok(!page.includes(", allowing"));
});

test("SIAI and Yale public article metadata represent the institutional record", async () => {
  const yale = await read("public/research/presentations/yale-global-justice-2026/index.html");
  const siai = await read("public/research/conference-papers/siai-2026-110/index.html");
  for(const html of [yale,siai]) {
    assert.doesNotMatch(html, /Moon Hwan Lee|Moon Lee/iu);
    assert.match(html, /"publisher":\{"@type":"Organization","name":"RISU Institute"\}/u);
  }
  assert.ok(yale.includes("19 / 195"));
});

test("SIAI record uses the Yale restrained paper layout and keeps mobile tables readable", async () => {
  const css = await read("public/assets/style.css");
  const html = await read("public/research/conference-papers/siai-2026-110/index.html");
  assert.ok(html.includes('class="siai-record"'));
  assert.ok(html.includes('class="siai-paper-table"'));
  assert.ok(html.includes("style.css?v=20261114-siai-record"));
  assert.ok(css.includes(".siai-record .publication-title"));
  assert.ok(css.includes(".siai-record .siai-paper-table"));
  assert.ok(css.includes(".siai-record .siai-table-scroll { width: 100%; overflow-x: auto; }"));
  assert.ok(css.includes(".siai-record .publication-meta { grid-template-columns: 1fr;"));
});
