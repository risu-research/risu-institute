import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (p) => readFile(join(root, p), "utf8");
const detailPath = "/research/conference-papers/bibm-2026-p283/";

test("BIBM homepage venue and paper titles open the dedicated record", async () => {
  const html = await read("public/index.html");
  assert.match(html, /update-entry--secondary update-entry--bibm/);
  assert.ok(html.includes('<h3><a href="' + detailPath + '">IEEE International Conference on Bioinformatics and Biomedicine 2026</a></h3>'));
  assert.ok(html.includes('<p class="update-paper"><a href="' + detailPath + '">When Trial Data Portals Move: Cross-Sponsor Policy Mismatches</a></p>'));
});

test("BIBM record uses plain evidence table and editorial heading", async () => {
  const html = await read("public/research/conference-papers/bibm-2026-p283/index.html");
  const css = await read("public/assets/style.css");
  assert.ok(html.includes("Sponsor labels and matched policy text"));
  for (const match of ["27 of 27", "25 of 25", "21 of 21"]) assert.ok(html.includes(match));
  assert.doesNotMatch(html, /—|bibm-figure-tag|bibm-figure-kicker/u);
  assert.match(css, /\.bibm-record \.publication-title \{ max-width:1160px; font-size:clamp\(2\.05rem,3\.35vw,3\.35rem\)/);
  assert.doesNotMatch(css, /\.bibm-record \.bibm-figure-tag/u);
  assert.ok(html.includes("style.css?v=20261109-bibm-refined"));
  assert.ok((await read("public/index.html")).includes("style.css?v=20261109-bibm-refined"));
});
