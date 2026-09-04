import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const workPath = join(root, "public", "work", "index.html");

const canonicalRecord =
  "https://github.com/risu-research/risu-institute/tree/main/records/native-plus-v0.2";
const bindingDigest =
  "sha256:4923181ebacedabf186333b8e16d3f1152f1bc66ab9e16ed8330c8e7402a5c34";

function nativeSection(work) {
  const start = work.indexOf('<section class="thread-section" id="native-plus-v0-2">');
  const end = work.indexOf('<section class="thread-section" id="semantic-preservation">');
  assert.ok(start >= 0, "Native++ section missing");
  assert.ok(end > start, "Native++ section boundary missing");
  return work.slice(start, end);
}

test("Native++ research card opens the website-native record first", async () => {
  const work = await readFile(workPath, "utf8");
  assert.ok(work.includes('<h3><a href="#native-plus-v0-2">Native++ v0.2</a></h3>'));
  assert.ok(work.includes('<a href="#native-plus-v0-2">Read the full experimental record →</a>'));
  assert.equal(work.split(canonicalRecord).length - 1, 2);
});

test("Native++ website record exposes experiment, data, controls, limits, and provenance", async () => {
  const work = await readFile(workPath, "utf8");
  const section = nativeSection(work);

  for (const expected of [
    "Primary result: PASS, narrow claim only.",
    "At a glance",
    "Experimental boundary",
    "Admission discipline",
    "Precommitted generic constraint",
    "Primary data",
    "Negative controls",
    "Supported conclusion",
    "What this does not establish",
    "Why the failed runs remain in the record",
    "Frozen evidence anchors",
    "33809187591",
    "455184caf716751148b7c9c2a372b66084dcaa30",
    bindingDigest,
    "a65d2e79590f99cff0efa83de283075f54c69135d00487caa5d1c305ee0aaa8b",
    "b3c2242bdfc11d9bdf653f1de2491297174e41da1d4f63b05d230e0a5e852f96",
    "5f25db28abce3693e76bf660594318669b06012744982870ca9964ea59ab319e",
  ]) assert.ok(section.includes(expected), expected);

  assert.equal(section.includes("\u2014"), false, "Native++ public record contains an em dash");
  assert.ok(section.includes("cross-provider semantic-labor amortization"));
  assert.ok(section.includes("The failures are retained as failures."));
});

test("Native++ website record links to the deeper canonical artifacts", async () => {
  const work = await readFile(workPath, "utf8");
  const section = nativeSection(work);
  for (const path of [
    canonicalRecord,
    "https://github.com/risu-research/risu-institute/blob/main/records/native-plus-v0.2/RESEARCH_NOTE.md",
    "https://github.com/risu-research/risu-institute/blob/main/records/native-plus-v0.2/PRIMARY_RESULT.json",
    "https://github.com/risu-research/risu-institute/blob/main/records/native-plus-v0.2/PROVENANCE.md",
  ]) assert.ok(section.includes(path), path);
});
