import assert from "node:assert/strict";
import test from "node:test";
import {
  createPortableEvidencePackage,
  decodePortableEvidence,
  hasAlgoliaRealSourceValidationMark,
  hasPortableEvidenceValidationMark,
  hasReceiverValidationMark,
  inspectCapture,
  sha256Hex,
  stableJson,
  verifyPortablePremise,
} from "../public/tools/negative-result-warrant/core.js";
import { recordedObservations } from "../public/tools/negative-result-warrant/recorded/observations.js";

const encoder = new TextEncoder();

function copy(value) {
  return structuredClone(value);
}

function expectedContext(capture = recordedObservations.verification.capture) {
  return {
    applicationId: capture.applicationId,
    credentialFingerprint: capture.credentialFingerprint,
    credentialByteLength: capture.request.credentialByteLength,
  };
}

async function verificationResult() {
  return inspectCapture(recordedObservations.verification.capture, {
    originalCapture: recordedObservations.ordinary.capture,
  });
}

async function portablePackage() {
  const result = await verificationResult();
  return createPortableEvidencePackage(result, recordedObservations.verification.capture, {
    captureProvenance: "vendored-recorded",
  });
}

function exactIntended(portable) {
  const outer = portable.canonical.realSourceEvidence;
  const proposition = outer.boundEvidence.proposition;
  return {
    applicationId: outer.sourceInstance.applicationId,
    profileId: proposition.profile.id,
    profileVersion: proposition.profile.version,
    proposition: {
      sourceScopeIdentity: proposition.sourceScopeIdentity,
      matchPredicateIdentity: proposition.matchPredicateIdentity,
      authorityContextId: proposition.authorityContextId,
    },
  };
}

async function rejectedAfter(mutate, context = expectedContext()) {
  const packageValue = copy(await portablePackage());
  mutate(packageValue);
  assert.equal(await decodePortableEvidence(packageValue, context), undefined);
}

test("Q cannot yield a warranted portable evidence package", async () => {
  const result = await inspectCapture(recordedObservations.ordinary.capture);
  assert.equal(result.verdict, "UNKNOWN");
  assert.equal(createPortableEvidencePackage(result, recordedObservations.ordinary.capture), undefined);
});

test("Q-prime yields an Inspector portable package containing canonical real-source evidence", async () => {
  const packageValue = await portablePackage();
  assert.equal(packageValue.kind, "RISU_NRW_INSPECTOR_PORTABLE_EVIDENCE");
  assert.equal(packageValue.version, "0.1.0");
  assert.equal(packageValue.canonical.realSourceEvidence.kind, "ALGOLIA_REAL_SOURCE_NEGATIVE_EVIDENCE");
  assert.equal(packageValue.canonical.realSourceEvidence.version, "0.3.0");
});

test("Q-prime export to stringify to parse to decode to exact premise passes", async () => {
  const exported = await portablePackage();
  const parsed = JSON.parse(JSON.stringify(exported));
  const decoded = await decodePortableEvidence(parsed, expectedContext());
  assert.ok(decoded);
  assert.equal(verifyPortablePremise(decoded, exactIntended(decoded)).gate, "PASS");
  const reparsed = JSON.parse(JSON.stringify(decoded));
  assert.equal(hasPortableEvidenceValidationMark(reparsed), false);
  assert.ok(await decodePortableEvidence(reparsed, expectedContext()));
});

test("parsed JSON has no inner, outer, or portable receiver-validation mark", async () => {
  const parsed = JSON.parse(JSON.stringify(await portablePackage()));
  assert.equal(hasPortableEvidenceValidationMark(parsed), false);
  assert.equal(hasAlgoliaRealSourceValidationMark(parsed.canonical.realSourceEvidence), false);
  assert.equal(hasReceiverValidationMark(parsed.canonical.realSourceEvidence.boundEvidence), false);
  assert.equal(verifyPortablePremise(parsed, exactIntended(parsed)).gate, "BLOCK");
});

test("serialized validated true cannot mint receiver authority", async () => {
  await rejectedAfter((packageValue) => { packageValue.validated = true; });
  const packageValue = await portablePackage();
  packageValue.canonical.realSourceEvidence.boundEvidence.validated = true;
  assert.equal(await decodePortableEvidence(packageValue, expectedContext()), undefined);
});

test("mutating canonical warrant content rejects the package", async () => {
  await rejectedAfter((packageValue) => {
    packageValue.canonical.realSourceEvidence.boundEvidence.sourceWarrant.proposition.matchPredicateIdentity = `sha256:${"0".repeat(64)}`;
  });
});

test("mutating bound evidence rejects the package", async () => {
  await rejectedAfter((packageValue) => {
    packageValue.canonical.realSourceEvidence.boundEvidence.proposition.sourceScopeIdentity += ":swapped";
  });
});

test("mutating the raw request-body binding rejects the package", async () => {
  await rejectedAfter((packageValue) => {
    packageValue.canonical.realSourceEvidence.verificationCapture.rawRequestBodyBinding.digest = "0".repeat(64);
  });
});

test("mutating the raw response-body binding rejects the package", async () => {
  await rejectedAfter((packageValue) => {
    packageValue.canonical.realSourceEvidence.verificationCapture.rawResponseBodyBinding.digest = "0".repeat(64);
  });
});

test("swapping transported request or response bodies across observations rejects", async () => {
  await rejectedAfter((packageValue) => {
    packageValue.transport.capture.request.bodyText = recordedObservations.ordinary.capture.request.bodyText;
  });
  await rejectedAfter((packageValue) => {
    packageValue.transport.capture.response.bodyText = recordedObservations.ordinary.capture.response.bodyText;
  });
});

test("mutating the normalized request binding rejects the package", async () => {
  await rejectedAfter((packageValue) => {
    packageValue.canonical.realSourceEvidence.verificationCapture.normalizedRequestBinding.digest = "0".repeat(64);
  });
});

test("mutating the normalized response binding rejects the package", async () => {
  await rejectedAfter((packageValue) => {
    packageValue.canonical.realSourceEvidence.verificationCapture.normalizedResponseBinding.digest = "0".repeat(64);
  });
});

test("mutating the application ID rejects the package", async () => {
  await rejectedAfter((packageValue) => {
    packageValue.canonical.realSourceEvidence.sourceInstance.applicationId = "other-app";
  });
});

test("mutating the source-instance ID rejects the package", async () => {
  await rejectedAfter((packageValue) => {
    packageValue.canonical.realSourceEvidence.sourceInstance.sourceInstanceId = "algolia-app:other-app";
  });
});

test("mutating authority context rejects the package", async () => {
  await rejectedAfter((packageValue) => {
    packageValue.canonical.realSourceEvidence.authorityContextId = `algolia-search-key-sha256:${"0".repeat(64)}`;
  });
});

test("mutating credential digest rejects the package", async () => {
  await rejectedAfter((packageValue) => {
    packageValue.canonical.realSourceEvidence.credentialBinding.digest = "0".repeat(64);
  });
});

test("mutating credential byteLength rejects against receiver context", async () => {
  await rejectedAfter((packageValue) => {
    packageValue.canonical.realSourceEvidence.credentialBinding.byteLength += 1;
  });
});

test("receiver-supplied source and credential context cannot diverge", async () => {
  const packageValue = await portablePackage();
  assert.equal(await decodePortableEvidence(packageValue, {
    ...expectedContext(),
    applicationId: "other-app",
  }), undefined);
  assert.equal(await decodePortableEvidence(packageValue, {
    ...expectedContext(),
    credentialFingerprint: "0".repeat(64),
  }), undefined);
  assert.equal(await decodePortableEvidence(packageValue, {
    ...expectedContext(),
    credentialByteLength: 31,
  }), undefined);
});

test("an unknown portable package version fails closed", async () => {
  await rejectedAfter((packageValue) => { packageValue.version = "0.2.0"; });
});

test("malformed JSON and malformed package values fail closed", async () => {
  assert.throws(() => JSON.parse("{"));
  assert.equal(await decodePortableEvidence([], expectedContext()), undefined);
  assert.equal(await decodePortableEvidence(null, expectedContext()), undefined);
});

test("a missing required package field fails closed", async () => {
  await rejectedAfter((packageValue) => { delete packageValue.transport; });
});

test("an extra forbidden canonical field fails exact-key decoding", async () => {
  await rejectedAfter((packageValue) => {
    packageValue.canonical.realSourceEvidence.uiStatus = "looks-valid";
  });
});

test("valid imported evidence with a mismatching proposition blocks", async () => {
  const parsed = JSON.parse(JSON.stringify(await portablePackage()));
  const decoded = await decodePortableEvidence(parsed, expectedContext());
  const intended = exactIntended(decoded);
  intended.proposition.sourceScopeIdentity = "algolia:*:requested=*:effective=*";
  assert.equal(verifyPortablePremise(decoded, intended).gate, "BLOCK");
});

test("valid imported evidence with the exact proposition passes", async () => {
  const parsed = JSON.parse(JSON.stringify(await portablePackage()));
  const decoded = await decodePortableEvidence(parsed, expectedContext());
  assert.equal(verifyPortablePremise(decoded, exactIntended(decoded)).gate, "PASS");
});

test("copy and download JSON round-trips preserve all semantically required values", async () => {
  const packageValue = await portablePackage();
  const serialized = `${JSON.stringify(packageValue, null, 2)}\n`;
  const parsed = JSON.parse(serialized);
  assert.deepEqual(parsed, packageValue);
  assert.equal(parsed.transport.capture.request.bodyText, recordedObservations.verification.capture.request.bodyText);
  assert.equal(parsed.transport.capture.response.bodyText, recordedObservations.verification.capture.response.bodyText);
  assert.equal(
    await sha256Hex(encoder.encode(stableJson(parsed.canonical.realSourceEvidence))),
    "e271c51a7cb4c29e82b15f93f1dd5cf306a215785969c7d7934bea8f10b96241",
  );
});

test("Inspector metadata cannot override canonical evidence", async () => {
  await rejectedAfter((packageValue) => {
    packageValue.inspector.sourceInstance = {
      applicationId: "other-app",
      sourceInstanceId: "algolia-app:other-app",
    };
  });
});

test("the portable package contains no raw API credential or credential header", async () => {
  const serialized = JSON.stringify(await portablePackage());
  assert.ok(!serialized.includes("x-algolia-api-key"));
  assert.ok(!serialized.includes('"credential":"'));
  assert.ok(!serialized.includes('"apiKey":"'));
  assert.deepEqual(
    Object.keys((await portablePackage()).transport.capture.request).sort(),
    ["applicationIdHeader", "bodyText", "credentialByteLength", "credentialFingerprint", "method", "url"],
  );
});
