import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const workPath = join(root, "public", "work", "index.html");
const recordPath = join(root, "public", "work", "native-plus", "index.html");

const canonicalRecord =
  "https://github.com/risu-research/risu-institute/tree/main/records/native-plus-v0.2";
const bindingDigest =
  "sha256:4923181ebacedabf186333b8e16d3f1152f1bc66ab9e16ed8330c8e7402a5c34";

test("Native++ research card opens the dedicated website record first", async () => {
  const work = await readFile(workPath, "utf8");
  assert.ok(work.includes('<h3><a href="/work/native-plus/">Native++ v0.2</a></h3>'));
  assert.ok(work.includes('<a href="/work/native-plus/">Read the experimental record →</a>'));
  assert.ok(work.includes(canonicalRecord));
});

test("Native++ dedicated record exposes experiment, data, controls, limits, and provenance", async () => {
  const page = await readFile(recordPath, "utf8");

  for (const expected of [
    "Primary result: PASS, within a narrow scope.",
    "The idea in plain language",
    "What changed in the evidence path",
    "Experimental setup",
    "Two checks, not one",
    "A constraint set before the result",
    "Primary result",
    "Negative controls",
    "Supported conclusion:",
    "What the result does not mean",
    "Why the failed runs matter",
    "Frozen evidence anchors",
    "33809187591",
    "455184caf716751148b7c9c2a372b66084dcaa30",
    bindingDigest,
    "a65d2e79590f99cff0efa83de283075f54c69135d00487caa5d1c305ee0aaa8b",
    "b3c2242bdfc11d9bdf653f1de2491297174e41da1d4f63b05d230e0a5e852f96",
    "5f25db28abce3693e76bf660594318669b06012744982870ca9964ea59ab319e",
  ]) assert.ok(page.includes(expected), expected);

  assert.equal(page.includes("\u2014"), false, "Native++ public record contains an em dash");
  assert.ok(page.includes("cross-provider semantic-labor amortization"));
  assert.ok(page.includes("The earlier runs remain failures"));
});

test("Native++ dedicated record links to the deeper canonical artifacts", async () => {
  const page = await readFile(recordPath, "utf8");
  for (const path of [
    canonicalRecord,
    "https://github.com/risu-research/risu-institute/blob/main/records/native-plus-v0.2/RESEARCH_NOTE.md",
    "https://github.com/risu-research/risu-institute/blob/main/records/native-plus-v0.2/PRIMARY_RESULT.json",
    "https://github.com/risu-research/risu-institute/blob/main/records/native-plus-v0.2/PROVENANCE.md",
  ]) assert.ok(page.includes(path), path);
});
