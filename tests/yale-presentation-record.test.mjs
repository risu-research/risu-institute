import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFile(join(root, path), "utf8");
const yale = "/research/presentations/yale-global-justice-2026/";

test("Yale 2026 presentation record is reachable from both title links and the publications index", async () => {
  const home = await read("public/index.html");
  const index = await read("public/research/index.html");
  assert.ok(home.includes('<h3><a href="' + yale + '">Yale Global Justice Conference 2026</a></h3>'));
  assert.ok(home.includes('<p class="update-paper"><a href="' + yale + '">Global Access, Unequal Control: The Locality Tax in Managed AI</a></p>'));
  assert.ok(home.includes("7 November · Online"));
  assert.ok(home.includes("Presented"));
  assert.ok(index.includes("Conference presentations"));
  assert.ok(index.includes('href="' + yale + '"'));
  assert.ok(index.includes("Presented online"));
});

test("Yale evidence retains dates and boundaries and keeps the proposed disclosure work separate", async () => {
  const page = await read("public/research/presentations/yale-global-justice-2026/index.html");
  const css = await read("public/assets/style.css");
  for (const phrase of [
    "19 / 195", "42 / 195", "25 low-income", "16 of 64 high-income",
    "812 public catalogue entries", "29 documented country", "45 pairs",
    "34 routes", "Locality Disclosure Matrix", "seven facts",
    "The original 5 October country survey", "31 October procurement follow-up",
    "conference paper or journal article is not asserted"
  ]) assert.ok(page.includes(phrase), phrase);
  assert.ok(page.includes("Official conference program"));
  assert.ok(page.includes("Presentation"));
  assert.ok(page.includes("Presented · Conference talk"));
  assert.ok(!page.includes(", allowing"));
  assert.ok(!page.includes("—"));
  assert.ok(!page.includes("peer-reviewed paper"));
  assert.ok(css.includes(".yale-record .publication-title"));
  assert.ok(css.includes("--canvas: #ffffff"));
  assert.ok(page.includes("style.css?v=20261109-yale-record-v1"));
});
