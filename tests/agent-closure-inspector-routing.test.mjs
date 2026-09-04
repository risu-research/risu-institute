import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFile(join(root, path), "utf8");

test("Agent Closure keeps the frozen publication separate from the current hosted surface", async () => {
  const current = await read("public/tools/agent-closure-inspector/index.html");
  const frozen = await read("public/tools/agent-closure/index.html");
  const provenance = JSON.parse(await read("public/tools/agent-closure/provenance.json"));

  assert.match(current, /Hosted presentation over frozen Inspector v0\.1 and Phase-1 engine v0\.3/u);
  assert.match(frozen, /RISU · Agent Closure Inspector/u);
  assert.equal(provenance.source_tag, "inspector-v0.1-freeze");
  assert.equal(provenance.inspector_commit, "07325dd1304cc3fe1acd86ce50596161581a1cdb");
  assert.equal(provenance.engine_commit, "a46456f028cd3dd1d386111b1faab890a26ae5e9");
});
