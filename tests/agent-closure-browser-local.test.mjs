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
  const source = await read("public/tools/agent-closure-inspector/evaluator-sw.js");
  const listeners = new Map();
  const self = {
    location: { origin: "https://risuinstitute.org" },
    clients: { claim: async () => undefined },
    skipWaiting: async () => undefined,
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
  };
  const context = {
    self,
    URL,
    Request,
    Response,
    Headers,
    TextEncoder,
    TextDecoder,
    Uint8Array,
    ArrayBuffer,
    structuredClone,
    console,
  };
  vm.runInNewContext(source, context, {
    filename: "agent-closure-evaluator-sw.js",
  });
  assert.equal(typeof listeners.get("fetch"), "function");
  return { source, fetchHandler: listeners.get("fetch") };
}

async function dispatch(fetchHandler, request) {
  let responsePromise = null;
  fetchHandler({
    request,
    respondWith(value) {
      responsePromise = Promise.resolve(value);
    },
  });
  if (!responsePromise) return null;
  return responsePromise;
}

test("browser-local evaluator is pinned to the frozen engine and its published bytes", async () => {
  const provenance = JSON.parse(
    await read("public/tools/agent-closure-inspector/evaluator-provenance.json"),
  );
  const worker = await read("public/tools/agent-closure-inspector/evaluator-sw.js");
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
  assert.match(worker, /Frozen BAC engine a46456f028cd3dd1d386111b1faab890a26ae5e9/u);
  assert.match(worker, /Inspector presentation 07325dd1304cc3fe1acd86ce50596161581a1cdb/u);
});

test("browser-local evaluator exactly replays all eight frozen boundary evaluations", async () => {
  const { fetchHandler } = await loadWorker();

  for (const file of caseFiles) {
    const artifact = JSON.parse(
      await read(`public/tools/agent-closure/cases/${file}`),
    );
    const request = new Request("https://risuinstitute.org/api/evaluate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(artifact.bundle),
    });
    const response = await dispatch(fetchHandler, request);
    assert.ok(response, `${file} was not intercepted`);
    assert.equal(response.status, 200, file);
    const result = await response.json();

    assert.deepEqual(result.evaluation, artifact.evaluation, `${file} evaluation`);
    const expectedPresentation = structuredClone(artifact.presentation);
    expectedPresentation.metadata = null;
    assert.deepEqual(
      result.presentation,
      expectedPresentation,
      `${file} presentation`,
    );
  }
});

test("browser-local evaluator fails closed on malformed, oversized, and wrong-media evidence", async () => {
  const { fetchHandler } = await loadWorker();

  const malformed = await dispatch(
    fetchHandler,
    new Request("https://risuinstitute.org/api/evaluate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    }),
  );
  assert.equal(malformed.status, 400);
  assert.equal((await malformed.json()).presentation.errors[0].code, "MALFORMED_JSON");

  const oversized = await dispatch(
    fetchHandler,
    new Request("https://risuinstitute.org/api/evaluate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: `"${"x".repeat(1024 * 1024)}"`,
    }),
  );
  assert.equal(oversized.status, 413);
  assert.equal(
    (await oversized.json()).presentation.errors[0].code,
    "REQUEST_BODY_TOO_LARGE",
  );

  const wrongMedia = await dispatch(
    fetchHandler,
    new Request("https://risuinstitute.org/api/evaluate", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "{}",
    }),
  );
  assert.equal(wrongMedia.status, 415);
});

test("browser-local evaluator only intercepts the exact same-origin evaluation request", async () => {
  const { source, fetchHandler } = await loadWorker();

  for (const url of [
    "https://risuinstitute.org/tools/agent-closure-inspector/",
    "https://risuinstitute.org/api/capabilities",
    "https://example.com/api/evaluate",
  ]) {
    const response = await dispatch(fetchHandler, new Request(url));
    assert.equal(response, null, url);
  }

  for (const forbidden of [
    /\bXMLHttpRequest\b/u,
    /\bWebSocket\b/u,
    /\bEventSource\b/u,
    /\bsendBeacon\b/u,
    /\blocalStorage\b/u,
    /\bsessionStorage\b/u,
    /\bindexedDB\b/u,
    /\bcaches\./u,
  ]) assert.doesNotMatch(source, forbidden);
});
