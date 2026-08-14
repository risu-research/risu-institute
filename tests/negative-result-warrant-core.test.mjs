import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createInspectionReport,
  decodeBoundNegativeEvidence,
  inspectCapture,
  sha256Hex,
  stableJson,
  verifyIntendedPremise,
} from "../public/tools/negative-result-warrant/core.js";
import { recordedObservations } from "../public/tools/negative-result-warrant/recorded/observations.js";

const encoder = new TextEncoder();
const canonicalVectors = JSON.parse(await readFile(
  new URL("./fixtures/negative-result-warrant-canonical-vectors.json", import.meta.url),
  "utf8",
));
const provenance = JSON.parse(await readFile(
  new URL("../public/tools/negative-result-warrant/provenance.json", import.meta.url),
  "utf8",
));

function copy(value) {
  return structuredClone(value);
}

function exactIntended(result) {
  const proposition = result.receiverValidatedEvidence.proposition;
  return {
    applicationId: result.normalization.sourceInstance.applicationId,
    profileId: proposition.profile.id,
    profileVersion: proposition.profile.version,
    proposition: {
      sourceScopeIdentity: proposition.sourceScopeIdentity,
      matchPredicateIdentity: proposition.matchPredicateIdentity,
      authorityContextId: proposition.authorityContextId,
    },
  };
}

async function recordedVerification() {
  return inspectCapture(recordedObservations.verification.capture, {
    originalCapture: recordedObservations.ordinary.capture,
  });
}

test("vendored Q and Q-prime payload strings preserve all four frozen SHA-256 hashes", async () => {
  const actual = {
    ordinaryRequest: await sha256Hex(encoder.encode(recordedObservations.ordinary.capture.request.bodyText)),
    ordinaryResponse: await sha256Hex(encoder.encode(recordedObservations.ordinary.capture.response.bodyText)),
    verificationRequest: await sha256Hex(encoder.encode(recordedObservations.verification.capture.request.bodyText)),
    verificationResponse: await sha256Hex(encoder.encode(recordedObservations.verification.capture.response.bodyText)),
  };
  assert.deepEqual(actual, recordedObservations.expectedHashes);
  const fixtureModule = new Uint8Array(await readFile(
    new URL("../public/tools/negative-result-warrant/recorded/observations.js", import.meta.url),
  ));
  assert.equal(
    await sha256Hex(fixtureModule),
    provenance.recordedRun.copiedFixtureModule.sha256,
  );
  assert.equal(
    provenance.canonicalResearch.frozenCommit,
    canonicalVectors.sourceCommit,
  );
});

test("recorded ordinary observation Q is accepted but remains UNKNOWN and blocks receiver use", async () => {
  const result = await inspectCapture(recordedObservations.ordinary.capture);
  assert.equal(result.inputStatus, "ACCEPTED");
  assert.equal(result.verdict, "UNKNOWN");
  assert.equal(result.warrant, undefined);
  assert.equal(result.receiverValidatedEvidence, undefined);
  assert.deepEqual(result.reasonCodes, [
    "RANKING_INFO_SETTING_MISSING_OR_MALFORMED",
    "EFFECTIVE_INDEX_WITNESS_MISSING",
    "EFFECTIVE_INDEX_UNRESOLVED",
  ]);
});

test("recorded verification observation Q-prime produces the frozen warranted bindings", async () => {
  const result = await recordedVerification();
  assert.equal(result.verdict, "WARRANTED_ZERO");
  assert.equal(result.comparison.preservation, "PRESERVING");
  assert.equal(result.comparison.acquisition, "SAFE_STRENGTHENING_AVAILABLE");
  assert.equal(result.boundEvidence.mode, "PROPOSITION_PRESERVING_VERIFICATION");
  assert.equal(result.receiverValidatedEvidence?.sourceWarrant.verdict, "WARRANTED_ZERO");
  assert.equal(result.normalization.rawRequestBodyBinding.digest, recordedObservations.expectedHashes.verificationRequest);
  assert.equal(result.normalization.rawResponseBodyBinding.digest, recordedObservations.expectedHashes.verificationResponse);
  assert.equal(result.warrant.requestBinding.digest, "526a0793508f4905429088c9b0a4b20636974f11418ec9e25ec359c1c3d31122");
  assert.equal(result.warrant.observationBinding.response.digest, "c8ea6e1c9c232a4b92822fc089751f0cf51172767f840e19934e8d96f92eb077");
  assert.equal(result.warrant.proposition.matchPredicateIdentity, "sha256:1765789af78e64de8a62255220bbf0bb94b74a0a8a73fdc54ac07fde457a7ed0");
  assert.equal(result.realSourceEvidence.kind, canonicalVectors.realSourceEvidence.kind);
  assert.equal(result.realSourceEvidence.version, canonicalVectors.realSourceEvidence.version);
  assert.equal(result.realSourceEvidence.credentialBinding.byteLength, canonicalVectors.realSourceEvidence.credentialByteLength);
  assert.equal(
    await sha256Hex(encoder.encode(stableJson(result.realSourceEvidence))),
    canonicalVectors.realSourceEvidence.stableJsonSha256,
  );
});

test("missing the required source-reported effective-index witness stays UNKNOWN", async () => {
  const capture = copy(recordedObservations.verification.capture);
  const response = JSON.parse(capture.response.bodyText);
  delete response.indexUsed;
  capture.response.bodyText = JSON.stringify(response);
  const result = await inspectCapture(capture);
  assert.equal(result.verdict, "UNKNOWN");
  assert.ok(result.reasonCodes.includes("EFFECTIVE_INDEX_WITNESS_MISSING"));
  assert.ok(result.reasonCodes.includes("EFFECTIVE_INDEX_UNRESOLVED"));
});

test("altered application ID, index, and URL relationships fail HTTP normalization", async () => {
  const changedApplication = copy(recordedObservations.verification.capture);
  changedApplication.applicationId = "other-app";
  const applicationResult = await inspectCapture(changedApplication);
  assert.equal(applicationResult.verdict, "INVALID");
  assert.ok(applicationResult.reasonCodes.includes("ALGOLIA_APPLICATION_HOST_MISMATCH"));

  const changedIndex = copy(recordedObservations.verification.capture);
  changedIndex.index = "other-index";
  const indexResult = await inspectCapture(changedIndex);
  assert.equal(indexResult.verdict, "INVALID");
  assert.ok(indexResult.reasonCodes.includes("REQUEST_URL_SCOPE_MISMATCH"));

  const queryString = copy(recordedObservations.verification.capture);
  queryString.request.url += "?debug=1";
  assert.equal((await inspectCapture(queryString)).verdict, "INVALID");
});

test("changing credential fingerprint changes authority context and blocks the prior premise", async () => {
  const original = await recordedVerification();
  const mismatchedCapture = copy(recordedObservations.verification.capture);
  mismatchedCapture.request.credentialFingerprint = "0".repeat(64);
  const mismatched = await inspectCapture(mismatchedCapture);
  assert.equal(mismatched.verdict, "INVALID");
  assert.ok(mismatched.reasonCodes.includes("CREDENTIAL_BINDING_MISMATCH"));

  const changedCapture = copy(recordedObservations.verification.capture);
  changedCapture.credentialFingerprint = "0".repeat(64);
  changedCapture.request.credentialFingerprint = "0".repeat(64);
  const changed = await inspectCapture(changedCapture);
  assert.equal(changed.verdict, "WARRANTED_ZERO");
  assert.notEqual(changed.warrant.proposition.authorityContextId, original.warrant.proposition.authorityContextId);
  const intended = exactIntended(original);
  intended.proposition.authorityContextId = changed.warrant.proposition.authorityContextId;
  const gate = verifyIntendedPremise(original, intended);
  assert.equal(gate.verdict, "BLOCK");
  assert.deepEqual(gate.differences.map((item) => item.field), ["authorityContextId"]);
});

test("raw request whitespace changes raw binding while canonical JSON binding remains stable", async () => {
  const left = await inspectCapture(recordedObservations.verification.capture);
  const changed = copy(recordedObservations.verification.capture);
  changed.request.bodyText = ` ${changed.request.bodyText}`;
  const right = await inspectCapture(changed);
  assert.equal(right.verdict, "WARRANTED_ZERO");
  assert.notEqual(left.normalization.rawRequestBodyBinding.digest, right.normalization.rawRequestBodyBinding.digest);
  assert.equal(left.normalization.normalizedRequestBinding.digest, right.normalization.normalizedRequestBinding.digest);
});

test("changed response bytes invalidate raw binding and semantic changes invalidate normalized binding", async () => {
  const original = await inspectCapture(recordedObservations.verification.capture);
  const whitespace = copy(recordedObservations.verification.capture);
  whitespace.response.bodyText = `${whitespace.response.bodyText} `;
  const whitespaceResult = await inspectCapture(whitespace);
  assert.notEqual(original.normalization.rawResponseBodyBinding.digest, whitespaceResult.normalization.rawResponseBodyBinding.digest);
  assert.equal(original.normalization.normalizedResponseBinding.digest, whitespaceResult.normalization.normalizedResponseBinding.digest);

  const changed = copy(recordedObservations.verification.capture);
  const body = JSON.parse(changed.response.bodyText);
  body.additionalProviderField = true;
  changed.response.bodyText = JSON.stringify(body);
  const changedResult = await inspectCapture(changed);
  assert.notEqual(original.normalization.rawResponseBodyBinding.digest, changedResult.normalization.rawResponseBodyBinding.digest);
  assert.notEqual(original.normalization.normalizedResponseBinding.digest, changedResult.normalization.normalizedResponseBinding.digest);
});

test("malformed JSON, non-200, wrong media type, and body scope overrides fail closed", async () => {
  const cases = [
    (capture) => { capture.request.bodyText = "{"; },
    (capture) => { capture.response.bodyText = "[1,2,3]"; },
    (capture) => { capture.response.status = 429; },
    (capture) => { capture.response.contentType = "text/plain"; },
    (capture) => {
      const body = JSON.parse(capture.request.bodyText);
      body.index = "bestbuy";
      capture.request.bodyText = JSON.stringify(body);
    },
  ];
  for (const mutate of cases) {
    const capture = copy(recordedObservations.verification.capture);
    mutate(capture);
    assert.equal((await inspectCapture(capture)).verdict, "INVALID");
  }
});

test("receiver decoding rejects malformed, extra, and internally mismatched evidence", async () => {
  const result = await recordedVerification();
  const transported = () => JSON.parse(JSON.stringify(result.boundEvidence));
  const extra = transported();
  extra.uiStatus = "pretty";
  assert.equal(decodeBoundNegativeEvidence(extra), undefined);

  const changedProposition = transported();
  changedProposition.proposition.sourceScopeIdentity += ":overbroad";
  assert.equal(decodeBoundNegativeEvidence(changedProposition), undefined);

  const changedResponse = transported();
  changedResponse.sourceWarrant.observationBinding.response.digest = "0".repeat(64);
  assert.equal(decodeBoundNegativeEvidence(changedResponse), undefined);
});

test("exact intended premise matches; index, source application, and overbroad scope block", async () => {
  const result = await recordedVerification();
  assert.equal(verifyIntendedPremise(result, exactIntended(result)).verdict, "MATCH");

  const changedSource = exactIntended(result);
  changedSource.applicationId = "other-application";
  assert.equal(verifyIntendedPremise(result, changedSource).verdict, "BLOCK");

  const changedIndex = exactIntended(result);
  changedIndex.proposition.sourceScopeIdentity = changedIndex.proposition.sourceScopeIdentity.replace("bestbuy", "other-index");
  assert.equal(verifyIntendedPremise(result, changedIndex).verdict, "BLOCK");

  const overbroad = exactIntended(result);
  overbroad.proposition.sourceScopeIdentity = "algolia:*:requested=*:effective=*";
  const blocked = verifyIntendedPremise(result, overbroad);
  assert.equal(blocked.verdict, "BLOCK");
  assert.ok(blocked.differences.some((item) => item.field === "sourceScopeIdentity"));
});

test("diagnostic states and reasons remain consistent with UNKNOWN and WARRANTED_ZERO", async () => {
  const ordinary = await inspectCapture(recordedObservations.ordinary.capture);
  const scopeWitness = ordinary.diagnostics.find((item) => item.id === "EFFECTIVE_INDEX_WITNESSED");
  assert.equal(scopeWitness.state, "UNKNOWN");
  assert.equal(scopeWitness.reasonCode, "EFFECTIVE_INDEX_WITNESS_MISSING");
  assert.ok(ordinary.diagnostics.some((item) => item.state !== "SATISFIED"));

  const verification = await recordedVerification();
  assert.ok(verification.diagnostics.every((item) => item.state === "SATISFIED"));
  assert.equal(verification.diagnostics.find((item) => item.id === "RECEIVER_VALIDATION").reasonCode, "RECEIVER_VALIDATION_SUCCEEDED");
});

test("inspection reports separate canonical artifacts from inspector metadata and omit raw bodies", async () => {
  const result = await recordedVerification();
  const report = createInspectionReport(result);
  assert.equal(report.canonicalWarrant.verdict, "WARRANTED_ZERO");
  assert.equal(report.canonicalBoundNegativeEvidence.kind, "BOUND_NEGATIVE_EVIDENCE");
  assert.equal(report.canonicalAlgoliaRealSourceNegativeEvidence.kind, "ALGOLIA_REAL_SOURCE_NEGATIVE_EVIDENCE");
  assert.equal(report.inspector.implementation, "browser-safe-consumer-port");
  const serialized = JSON.stringify(report);
  assert.ok(!serialized.includes(recordedObservations.verification.capture.request.bodyText));
  assert.ok(!serialized.includes(recordedObservations.verification.capture.response.bodyText));
});

test("browser port agrees with canonical executable golden vectors at the frozen commit", async () => {
  assert.equal(canonicalVectors.sourceCommit, "d3f9840d1e0794c675bd6e948cdbb0dcd315cd65");
  const ordinary = await inspectCapture(recordedObservations.ordinary.capture);
  assert.deepEqual({
    normalization: ordinary.inputStatus === "ACCEPTED" ? "ACCEPT" : "REJECT",
    verdict: ordinary.verdict,
    reasonCodes: ordinary.reasonCodes,
  }, canonicalVectors.ordinary);

  const verification = await recordedVerification();
  assert.deepEqual({
    normalization: verification.inputStatus === "ACCEPTED" ? "ACCEPT" : "REJECT",
    verdict: verification.verdict,
    requestBinding: verification.warrant.requestBinding.digest,
    responseBinding: verification.warrant.observationBinding.response.digest,
    matchPredicateIdentity: verification.warrant.proposition.matchPredicateIdentity,
  }, canonicalVectors.verification);

  const missingCapture = copy(recordedObservations.verification.capture);
  const missingBody = JSON.parse(missingCapture.response.bodyText);
  delete missingBody.indexUsed;
  missingCapture.response.bodyText = JSON.stringify(missingBody);
  const missing = await inspectCapture(missingCapture);
  assert.deepEqual({
    normalization: missing.inputStatus === "ACCEPTED" ? "ACCEPT" : "REJECT",
    verdict: missing.verdict,
    reasonCodes: missing.reasonCodes,
  }, canonicalVectors.missingEffectiveIndexWitness);

  const changedApp = copy(recordedObservations.verification.capture);
  changedApp.applicationId = "other-app";
  assert.equal((await inspectCapture(changedApp)).verdict === "INVALID" ? "REJECT" : "ACCEPT", canonicalVectors.alteredApplicationId);
  const changedIndex = copy(recordedObservations.verification.capture);
  changedIndex.index = "other-index";
  assert.equal((await inspectCapture(changedIndex)).verdict === "INVALID" ? "REJECT" : "ACCEPT", canonicalVectors.alteredIndex);
  const changedAuthority = copy(recordedObservations.verification.capture);
  changedAuthority.request.credentialFingerprint = "0".repeat(64);
  assert.equal((await inspectCapture(changedAuthority)).verdict === "INVALID" ? "REJECT" : "ACCEPT", canonicalVectors.alteredAuthorityBinding);

  const whitespaceCapture = copy(recordedObservations.verification.capture);
  whitespaceCapture.request.bodyText = ` ${whitespaceCapture.request.bodyText}`;
  const whitespace = await inspectCapture(whitespaceCapture);
  assert.deepEqual({
    normalization: whitespace.inputStatus === "ACCEPTED" ? "ACCEPT" : "REJECT",
    verdict: whitespace.verdict,
    rawBindingChanged: whitespace.normalization.rawRequestBodyBinding.digest !== verification.normalization.rawRequestBodyBinding.digest,
    normalizedBindingSame: whitespace.normalization.normalizedRequestBinding.digest === verification.normalization.normalizedRequestBinding.digest,
  }, canonicalVectors.alteredRequestWhitespace);

  const responseCapture = copy(recordedObservations.verification.capture);
  const responseBody = JSON.parse(responseCapture.response.bodyText);
  responseBody.additionalProviderField = true;
  responseCapture.response.bodyText = JSON.stringify(responseBody);
  const responseChanged = await inspectCapture(responseCapture);
  assert.deepEqual({
    normalization: responseChanged.inputStatus === "ACCEPTED" ? "ACCEPT" : "REJECT",
    rawBindingChanged: responseChanged.normalization.rawResponseBodyBinding.digest !== verification.normalization.rawResponseBodyBinding.digest,
    normalizedBindingChanged: responseChanged.normalization.normalizedResponseBinding.digest !== verification.normalization.normalizedResponseBinding.digest,
  }, canonicalVectors.alteredResponseBytes);

  const malformedCapture = copy(recordedObservations.verification.capture);
  malformedCapture.response.bodyText = "{";
  assert.equal((await inspectCapture(malformedCapture)).verdict === "INVALID" ? "REJECT" : "ACCEPT", canonicalVectors.malformedEvidenceEnvelope);

  const mismatch = JSON.parse(JSON.stringify(verification.boundEvidence));
  mismatch.proposition.sourceScopeIdentity += ":overbroad";
  assert.equal(decodeBoundNegativeEvidence(mismatch) === undefined ? "REJECT" : "ACCEPT", canonicalVectors.propositionMismatchAtReceiver);
  assert.equal(verifyIntendedPremise(verification, exactIntended(verification)).gate, canonicalVectors.exactIntendedPremise);
  const overbroad = exactIntended(verification);
  overbroad.proposition.sourceScopeIdentity = "algolia:*:requested=*:effective=*";
  assert.equal(verifyIntendedPremise(verification, overbroad).gate, canonicalVectors.overbroadIntendedPremise);
});
