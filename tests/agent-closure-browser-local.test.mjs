import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFile(join(root, path), "utf8");
const caseFiles = [
  "c1-direct-zombie.json",
  "c2-transitive-zombie.json",
  "c3-pending-commitment.json",
  "c4-retained-evidence.json",
  "c5-successor-transfer.json",
  "c6-missing-coverage.json",
  "c7-false-success.json",
  "c8-fixed-point-winddown.json",
];

async function loadWorker() {
  const source = await read("public/tools/agent-closure-inspector/evaluator-worker.js");
  const listeners = new Map();
  const outbound = [];
  const self = {
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    postMessage(message) {
      outbound.push(JSON.parse(JSON.stringify(message)));
    },
  };
  vm.runInNewContext(
    source,
    {
      self,
      TextEncoder,
      TextDecoder,
      Uint8Array,
      ArrayBuffer,
      structuredClone,
      console,
    },
    { filename: "agent-closure-evaluator-worker.js" },
  );
  assert.equal(typeof listeners.get("message"), "function");
  assert.deepEqual(outbound.shift(), { type: "ready" });
  return { source, messageHandler: listeners.get("message"), outbound };
}

function evaluate(messageHandler, outbound, request, id = "test") {
  messageHandler({ data: { type: "evaluate", id, request } });
  const response = outbound.shift();
  assert.equal(response?.type, "result");
  assert.equal(response?.id, id);
  return response;
}

test("browser-local evaluator is pinned to the frozen engine and its published bytes", async () => {
  const provenance = JSON.parse(
    await read("public/tools/agent-closure-inspector/evaluator-provenance.json"),
  );
  const worker = await read("public/tools/agent-closure-inspector/evaluator-worker.js");
  const digest = createHash("sha256").update(worker).digest("hex");

  assert.equal(
    provenance.engine_commit,
    "a46456f028cd3dd1d386111b1faab890a26ae5e9",
  );
  assert.equal(
    provenance.inspector_commit,
    "07325dd1304cc3fe1acd86ce50596161581a1cdb",
  );
  assert.equal(provenance.worker_sha256, digest);
  assert.equal(provenance.upload_limit_bytes, 1024 * 1024);
  assert.equal(provenance.persistence, "none");
  assert.equal(provenance.network_evaluation_endpoint, false);
  assert.equal(provenance.schema_validator_mode, "Ajv standalone precompiled at build time");
  assert.equal(provenance.dynamic_code_generation, false);
  assert.match(provenance.equivalence_basis, /eight frozen canonical cases/u);
  assert.match(worker, /Frozen BAC engine a46456f028cd3dd1d386111b1faab890a26ae5e9/u);
  assert.match(worker, /Inspector presentation 07325dd1304cc3fe1acd86ce50596161581a1cdb/u);
  assert.match(worker, /schema validator precompiled at build time/u);
  assert.doesNotMatch(worker, /\bnew\s+Function\b/u);
  assert.doesNotMatch(worker, /\beval\s*\(/u);
});

test("browser-local evaluator exactly replays all eight frozen boundary evaluations", async () => {
  const { messageHandler, outbound } = await loadWorker();

  for (const file of caseFiles) {
    const artifact = JSON.parse(
      await read(`public/tools/agent-closure/cases/${file}`),
    );
    const response = evaluate(
      messageHandler,
      outbound,
      {
        method: "POST",
        contentType: "application/json",
        raw: JSON.stringify(artifact.bundle),
      },
      file,
    );
    assert.equal(response.status, 200, file);
    assert.deepEqual(response.body.evaluation, artifact.evaluation, `${file} evaluation`);

    const expectedPresentation = structuredClone(artifact.presentation);
    expectedPresentation.metadata = null;
    assert.deepEqual(
      response.body.presentation,
      expectedPresentation,
      `${file} presentation`,
    );
  }
});

test("browser-local evaluator fails closed on malformed, oversized, and wrong-media evidence", async () => {
  const { messageHandler, outbound } = await loadWorker();

  const malformed = evaluate(messageHandler, outbound, {
    method: "POST",
    contentType: "application/json",
    raw: "{",
  });
  assert.equal(malformed.status, 400);
  assert.equal(malformed.body.presentation.errors[0].code, "MALFORMED_JSON");

  const oversized = evaluate(messageHandler, outbound, {
    method: "POST",
    contentType: "application/json",
    raw: `"${"x".repeat(1024 * 1024)}"`,
  });
  assert.equal(oversized.status, 413);
  assert.equal(
    oversized.body.presentation.errors[0].code,
    "REQUEST_BODY_TOO_LARGE",
  );

  const wrongMedia = evaluate(messageHandler, outbound, {
    method: "POST",
    contentType: "text/plain",
    raw: "{}",
  });
  assert.equal(wrongMedia.status, 415);
});

test("browser-local adapter has no network, persistence, or dynamic-code capability", async () => {
  const worker = await read("public/tools/agent-closure-inspector/evaluator-worker.js");
  const bootstrap = await read("public/tools/agent-closure-inspector/browser-local.js");

  assert.match(bootstrap, /const nativeFetch = window\.fetch\.bind\(window\);/u);
  assert.match(bootstrap, /url\.pathname === "\/api\/evaluate"/u);
  assert.match(bootstrap, /return nativeFetch\(input, init\);/u);
  assert.match(bootstrap, /worker\.postMessage\(\{ type: "evaluate", id, request \}\);/u);
  assert.doesNotMatch(bootstrap, /serviceWorker/u);

  for (const source of [worker, bootstrap]) {
    for (const forbidden of [
      /\bXMLHttpRequest\b/u,
      /\bWebSocket\b/u,
      /\bEventSource\b/u,
      /\bsendBeacon\b/u,
      /\blocalStorage\b/u,
      /\bsessionStorage\b/u,
      /\bindexedDB\b/u,
      /\bcaches\./u,
      /\bnew\s+Function\b/u,
      /\beval\s*\(/u,
    ]) assert.doesNotMatch(source, forbidden);
  }
  assert.doesNotMatch(worker, /\bfetch\s*\(/u);
});