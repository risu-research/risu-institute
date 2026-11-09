import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (p) => readFile(join(root, p), "utf8");
const detailPath = "/research/conference-papers/bibm-2026-p283/";

test("BIBM venue and paper titles link from the homepage without decorative underlines", async () => {
  const html = await read("public/index.html");
  const css = await read("public/assets/style.css");
  assert.ok(html.includes("update-entry--secondary update-entry--bibm"));
  assert.ok(html.includes('<h3><a href="' + detailPath + '">IEEE International Conference on Bioinformatics and Biomedicine 2026</a></h3>'));
  assert.ok(html.includes('<p class="update-paper"><a href="' + detailPath + '">When Trial Data Portals Move: Cross-Sponsor Policy Mismatches</a></p>'));
  assert.ok(css.includes(".update-entry .update-main h3 a:hover"));
  assert.ok(css.includes("color: var(--accent); text-decoration: none;"));
});

test("BIBM record retains evidence but uses a modest title and paper-style table", async () => {
  const html = await read("public/research/conference-papers/bibm-2026-p283/index.html");
  const css = await read("public/assets/style.css");
  assert.ok(html.includes("Table 1.</span> Policy text on archived sponsor pages"));
  for (const match of ["27/27", "25/25", "21/21", "Boehringer Ingelheim", "Sanofi", "UCB"]) assert.ok(html.includes(match), match);
  assert.ok(html.includes("six selected other-sponsor controls"));
  assert.ok(!html.includes(", allowing"));
  assert.ok(!html.includes("—"));
  assert.ok(!html.includes("bibm-figure-tag"));
  assert.ok(css.includes("font-size: clamp(1.9rem, 2.85vw, 2.65rem)"));
  assert.ok(css.includes("border-collapse: collapse"));
  assert.ok(css.includes("font: 400 .92rem/1.43 Georgia"));
  assert.ok(!css.includes(".bibm-record .bibm-figure-tag"));
  assert.ok(html.includes("style.css?v=20261109-bibm-paper-v2"));
  assert.ok((await read("public/index.html")).includes('href="/assets/style.css?v='));
});
