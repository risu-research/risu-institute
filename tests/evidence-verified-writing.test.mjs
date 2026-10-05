import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { EVIDENCE, SCENARIOS, canonicalJson, clone, sha256Hex } from "../public/tools/evidence-verified-writing/core.js";
import { buildEvidenceCertificate } from "../public/tools/evidence-verified-writing/producer.js";
import { verifyEvidenceCertificate } from "../public/tools/evidence-verified-writing/verifier.js";

const read = p => readFile(new URL(`../${p}`, import.meta.url), "utf8");

async function issue(key) {
  const s = SCENARIOS[key];
  const certificate = await buildEvidenceCertificate({
    claimId: "claim-4.2",
    version: s.version,
    text: s.text,
    semantics: s.semantics,
    evidence: EVIDENCE
  });
  const verification = await verifyEvidenceCertificate({
    certificate,
    claimId: "claim-4.2",
    version: s.version,
    text: s.text,
    semantics: s.semantics,
    evidence: EVIDENCE
  });
  return { s, certificate, verification };
}

test("proof-carrying writing surface exposes certificate, independent checker, and mutation gate", async () => {
  const h = await read("public/tools/evidence-verified-writing/index.html");
  for (const phrase of [
    "Evidence-Verified Research Writing",
    "Proof-carrying record",
    "Claim contract",
    "Evidence ledger",
    "Recheck current wording",
    "Independent checker",
    "Adversarial mutations must fail closed",
    "Illustrative evidence"
  ]) assert.ok(h.includes(phrase), phrase);
  assert.match(h, /id="verdict-status"[^>]+aria-live="polite"/u);
  assert.match(h, /id="independent-panel"[^>]+aria-live="polite"/u);
});

test("supported exact-count claim produces a valid independently checked certificate", async () => {
  const { certificate, verification } = await issue("supported");
  assert.equal(certificate.payload.decision.verdict, "VERIFIED");
  assert.equal(certificate.payload.analysis.supports, 2);
  assert.equal(certificate.payload.analysis.nulls, 1);
  assert.equal(certificate.payload.analysis.in_scope, 3);
  assert.equal(verification.accepted, true);
  assert.ok(verification.checks.every(x => x.pass));
});

test("universal revision is validly certified as review-required, not falsely promoted", async () => {
  const { certificate, verification } = await issue("overstated");
  assert.equal(certificate.payload.decision.verdict, "REVIEW_REQUIRED");
  assert.equal(certificate.payload.decision.reason, "UNIVERSAL_CLAIM_CONFLICT");
  assert.equal(verification.accepted, true);
  assert.equal(verification.recomputed.verdict, "REVIEW_REQUIRED");
});

test("unsupported horizon is validly certified as blocked for scope gap", async () => {
  const { certificate, verification } = await issue("unsupported");
  assert.equal(certificate.payload.decision.verdict, "BLOCKED");
  assert.equal(certificate.payload.decision.reason, "SCOPE_COVERAGE_GAP");
  assert.equal(certificate.payload.analysis.in_scope, 0);
  assert.equal(verification.accepted, true);
});

test("independent checker rejects a rehashed verdict flip", async () => {
  const { s, certificate } = await issue("supported");
  const payload = clone(certificate.payload);
  payload.decision = {
    verdict: "BLOCKED",
    workflow_action: "BLOCK_FINALIZATION",
    reason: "SCOPE_COVERAGE_GAP"
  };
  const forged = {
    payload,
    certificate_sha256: await sha256Hex(canonicalJson(payload))
  };
  const verification = await verifyEvidenceCertificate({
    certificate: forged,
    claimId: "claim-4.2",
    version: s.version,
    text: s.text,
    semantics: s.semantics,
    evidence: EVIDENCE
  });
  assert.equal(verification.accepted, false);
  assert.ok(verification.checks.some(x => x.name === "Independent semantic decision" && !x.pass));
});

test("independent checker rejects post-certificate claim and evidence mutations", async () => {
  const { s, certificate } = await issue("supported");

  const changedText = await verifyEvidenceCertificate({
    certificate,
    claimId: "claim-4.2",
    version: s.version,
    text: s.text + " Changed after certification.",
    semantics: s.semantics,
    evidence: EVIDENCE
  });
  assert.equal(changedText.accepted, false);
  assert.ok(changedText.checks.some(x => x.name === "Exact manuscript wording" && !x.pass));

  const changedEvidence = clone(EVIDENCE);
  changedEvidence[0].excerpt += " Altered.";
  const changedSpan = await verifyEvidenceCertificate({
    certificate,
    claimId: "claim-4.2",
    version: s.version,
    text: s.text,
    semantics: s.semantics,
    evidence: changedEvidence
  });
  assert.equal(changedSpan.accepted, false);
  assert.ok(changedSpan.checks.some(x => x.name === "Per-source evidence bindings" && !x.pass));

  const omission = await verifyEvidenceCertificate({
    certificate,
    claimId: "claim-4.2",
    version: s.version,
    text: s.text,
    semantics: s.semantics,
    evidence: EVIDENCE.slice(0,2)
  });
  assert.equal(omission.accepted, false);
  assert.ok(omission.checks.some(x => !x.pass));
});

test("tools index links to the evidence-verified writing prototype", async () => {
  const h = await read("public/tools/index.html");
  assert.ok(h.includes('href="/tools/evidence-verified-writing/"'));
  assert.ok(h.includes("Evidence-Verified Research Writing"));
});
