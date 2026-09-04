import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const recordRoot = join(root, "records", "native-plus-v0.2");
const readRecord = (name) => readFile(join(recordRoot, name), "utf8");
const sha256 = (content) => createHash("sha256").update(content).digest("hex");

const executionCommit = "455184caf716751148b7c9c2a372b66084dcaa30";
const bindingDigest =
  "sha256:4923181ebacedabf186333b8e16d3f1152f1bc66ab9e16ed8330c8e7402a5c34";

const expectedGenericSurface = {
  contract_judgment_kinds: 0,
  evidence_atom_kinds: 0,
  generic_core: 0,
  proof_algebra_operations: 0,
  provider_io_verbs: 0,
};

test("Native++ v0.2 record is frozen and manifest-complete", async () => {
  const names = [
    "README.md",
    "RESEARCH_NOTE.md",
    "PRIMARY_RESULT.json",
    "PROVENANCE.md",
  ];
  const manifest = await readRecord("MANIFEST.sha256");

  for (const name of names) {
    const content = await readRecord(name);
    assert.ok(manifest.includes(`${sha256(content)}  ${name}`), name);
    assert.equal(content.includes("\u2014"), false, `${name} contains an em dash`);
  }

  const result = JSON.parse(await readRecord("PRIMARY_RESULT.json"));
  assert.equal(result.record, "RISU_NATIVE_PLUS_V0_2");
  assert.equal(result.status, "FROZEN");
  assert.equal(result.primary.run_id, 33809187591);
  assert.equal(result.primary.execution_commit, executionCommit);
  assert.equal(result.primary.result, "PASS");
  assert.equal(result.binding_digest, bindingDigest);
  assert.deepEqual(result.generic_surface_changes, expectedGenericSurface);
  assert.equal(result.negative_controls.one_byte_mutation_rejected, true);
  assert.equal(result.negative_controls.wrong_release_rejected, true);
});

test("Native++ keeps the narrow claim boundary", async () => {
  const overview = await readRecord("README.md");
  const note = await readRecord("RESEARCH_NOTE.md");
  const provenance = await readRecord("PROVENANCE.md");
  const result = JSON.parse(await readRecord("PRIMARY_RESULT.json"));

  assert.ok(overview.includes("PASS, narrow claim only"));
  assert.ok(overview.includes("not evidence that attestations solve consequence verification generally"));
  assert.ok(note.includes("does not answer the harder scaling question"));
  assert.ok(note.includes("does not establish cross-provider amortization"));
  assert.ok(result.not_established.includes("cross-provider semantic-labor amortization"));
  assert.ok(provenance.includes("These failures are not reclassified as successes"));
  assert.ok(!overview.includes("RISU Technical Note 2026-05"));
  assert.ok(!note.includes("RISU Technical Note 2026-05"));
});

test("Native++ provenance preserves exact archival identities", async () => {
  const provenance = await readRecord("PROVENANCE.md");
  for (const expected of [
    "a65d2e79590f99cff0efa83de283075f54c69135d00487caa5d1c305ee0aaa8b",
    "b3c2242bdfc11d9bdf653f1de2491297174e41da1d4f63b05d230e0a5e852f96",
    "5f25db28abce3693e76bf660594318669b06012744982870ca9964ea59ab319e",
    executionCommit,
    bindingDigest,
    "33805476200",
    "33806977992",
  ]) assert.ok(provenance.includes(expected), expected);
});

test("Native++ is not part of the deployed public asset tree", async () => {
  const siteReadme = await readFile(join(root, "README.md"), "utf8");
  assert.ok(siteReadme.includes("institutional experimental records under"));
  assert.ok(siteReadme.includes("`records/`"));
});
