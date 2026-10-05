import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = p => readFile(new URL(`../${p}`, import.meta.url), "utf8");

test("evidence-verified writing demo exposes the manuscript continuity workflow and explicit boundary", async () => {
  const h = await read("public/tools/evidence-verified-writing/index.html");
  for (const phrase of [
    "Evidence-Verified Research Writing",
    "A manuscript claim can change while its citations stay in place.",
    "Supported wording",
    "Stronger revision",
    "Unsupported horizon",
    "No live search, no model inference",
    "Export audit receipt",
    "The product question comes first."
  ]) assert.ok(h.includes(phrase), phrase);
});

test("demo logic fails closed for strengthened, unsupported, and unrecognized edits", async () => {
  const j = await read("public/tools/evidence-verified-writing/demo.js");
  for (const phrase of [
    "REVIEW REQUIRED",
    "BLOCK FINALIZATION",
    "STALE → RECHECKED",
    "The prototype refuses to guess.",
    "consistently",
    "long-term",
    "two of three"
  ]) assert.ok(j.includes(phrase), phrase);
});

test("tools index links to the evidence-verified writing prototype", async () => {
  const h = await read("public/tools/index.html");
  assert.ok(h.includes('href="/tools/evidence-verified-writing/"'));
  assert.ok(h.includes("Evidence-Verified Research Writing"));
});