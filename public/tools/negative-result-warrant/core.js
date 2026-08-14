/**
 * Browser-safe port of the Algolia path frozen in negative-result-warrant.
 *
 * Canonical source commit:
 * d3f9840d1e0794c675bd6e948cdbb0dcd315cd65
 *
 * This file is a consumer port, not the canonical semantic-definition surface.
 * It intentionally uses Web Crypto and otherwise preserves the frozen profile's
 * request normalization, proposition construction, evaluator, composition,
 * receiver-validation, and exact-match gate behavior.
 */

export const CORE_VERSION = "0.2.0";
export const WARRANT_VERSION = "0.2.1";
export const BOUND_EVIDENCE_VERSION = "0.2.2";
export const BOUND_EVIDENCE_KIND = "BOUND_NEGATIVE_EVIDENCE";
export const PROFILE_ID = "algolia-search";
export const NORMALIZER_VERSION = "0.3.0";
export const ALGOLIA_REAL_SOURCE_KIND = "ALGOLIA_REAL_SOURCE_NEGATIVE_EVIDENCE";
export const ALGOLIA_REAL_SOURCE_VERSION = "0.3.0";
export const PORTABLE_EVIDENCE_KIND = "RISU_NRW_INSPECTOR_PORTABLE_EVIDENCE";
export const PORTABLE_EVIDENCE_VERSION = "0.1.0";
export const CANONICAL_COMMIT = "d3f9840d1e0794c675bd6e948cdbb0dcd315cd65";

const encoder = new TextEncoder();
const receiverValidatedRoots = new WeakSet();
const algoliaRealSourceValidatedRoots = new WeakSet();
const portableEvidenceValidatedRoots = new WeakSet();
const HEX_64 = /^[0-9a-f]{64}$/u;

const PROFILE_OBLIGATIONS = {
  PROFILE_EXPLICIT: ["SUPPORT", new Set(["SUPPORTED_PROFILE_SELECTED_EXPLICITLY"])],
  REQUEST_BOUND: ["SUPPORT", new Set(["EXACT_PROFILE_INPUT_REQUEST_BYTES_BOUND"])],
  RESPONSE_BOUND: ["SUPPORT", new Set(["EXACT_PROFILE_INPUT_RESPONSE_BYTES_BOUND"])],
  OBSERVATION_BOUND: ["SUPPORT", new Set(["OBSERVATION_IDENTIFIER_BOUND"])],
  VISIBILITY_CONTEXT_BOUND: ["SUPPORT", new Set(["SOURCE_EFFECTIVE_AUTHORITY_CONTEXT_BOUND"])],
  RANKING_INFO_REQUESTED: ["SUPPORT", new Set(["REQUIRED_VALUE_CONFIRMED"])],
  AB_TEST_PARTICIPATION_DISABLED: ["SUPPORT", new Set(["REQUIRED_VALUE_CONFIRMED"])],
  REQUEST_TARGET_CONSISTENT: ["SUPPORT", new Set(["REQUEST_PATH_TARGETS_DECLARED_INDEX"])],
  EFFECTIVE_INDEX_WITNESSED: ["SUPPORT", new Set(["SOURCE_REPORTED_EFFECTIVE_INDEX"])],
  SOURCE_SCOPE_RESOLVED: ["SUPPORT", new Set(["EFFECTIVE_INDEX_RESOLVED"])],
  ZERO_CARDINALITY: ["SUPPORT", new Set(["ZERO_COUNT_OBSERVED"])],
  EXACT_CARDINALITY: ["SUPPORT", new Set(["REQUIRED_VALUE_CONFIRMED"])],
  RULE_MATCHING_COMPLETE: ["DEFEATER", new Set([
    "NO_RULE_MATCH_INCOMPLETENESS_REPORTED",
    "RULE_MATCHING_REPORTED_EXHAUSTIVE",
  ])],
  PROPOSITION_DERIVED: ["SUPPORT", new Set(["ZERO_PROPOSITION_DERIVED"])],
};

const DIAGNOSTIC_COPY = {
  PROFILE_EXPLICIT: ["Observation", "Supported profile selected explicitly"],
  REQUEST_BOUND: ["Binding", "Exact normalized request bytes bound"],
  RESPONSE_BOUND: ["Binding", "Exact normalized response bytes bound"],
  OBSERVATION_BOUND: ["Observation", "Observation identifier bound"],
  VISIBILITY_CONTEXT_BOUND: ["Authority context", "Credential-defined view bound"],
  RANKING_INFO_REQUESTED: ["Scope", "Effective-scope metadata requested"],
  AB_TEST_PARTICIPATION_DISABLED: ["Query", "A/B participation disabled"],
  REQUEST_TARGET_CONSISTENT: ["Scope", "Request path targets declared index"],
  EFFECTIVE_INDEX_WITNESSED: ["Scope", "Source-reported effective index present"],
  SOURCE_SCOPE_RESOLVED: ["Scope", "Bounded source scope resolved"],
  ZERO_CARDINALITY: ["Observation", "Zero-result condition"],
  EXACT_CARDINALITY: ["Completeness", "Exact hit-count metadata"],
  RULE_MATCHING_COMPLETE: ["Completeness", "No reported rule-match incompleteness"],
  PROPOSITION_DERIVED: ["Proposition", "Exact zero proposition derived"],
};

const REASON_COPY = {
  PROFILE_NOT_SELECTED: "The Algolia profile was not selected.",
  PROFILE_UNSUPPORTED: "The supplied profile is not supported by this instrument.",
  PROFILE_INPUT_REQUEST_BYTES_MISSING: "Normalized request bytes are unavailable.",
  PROFILE_INPUT_RESPONSE_BYTES_MISSING: "Normalized response bytes are unavailable.",
  OBSERVATION_IDENTIFIER_MISSING: "Add a non-empty observation identifier.",
  AUTHORITY_CONTEXT_MISSING_OR_MALFORMED: "Add a valid credential fingerprint authority context.",
  RANKING_INFO_SETTING_MISSING_OR_MALFORMED: "The request does not explicitly set getRankingInfo to true.",
  EFFECTIVE_SCOPE_METADATA_NOT_REQUESTED: "The request explicitly declines the effective-scope metadata required by this profile.",
  AB_TEST_CAN_TRANSFORM_EFFECTIVE_QUERY: "enableABTest must be false under this profile.",
  AB_TEST_SETTING_MISSING_OR_MALFORMED: "The request must explicitly set enableABTest to false.",
  REQUEST_PATH_INDEX_MISMATCH: "The URL path and declared index differ.",
  EFFECTIVE_INDEX_WITNESS_MISSING: "The response has no source-reported indexUsed witness.",
  EFFECTIVE_INDEX_UNRESOLVED: "The effective index cannot be resolved from supplied evidence.",
  NONZERO_COUNT_OBSERVED: "The response reports one or more matches.",
  NB_HITS_MISSING_OR_MALFORMED: "The response nbHits field is missing or malformed.",
  APPROXIMATE_CARDINALITY: "The response reports a non-exact hit count.",
  EXACTNESS_MISSING_OR_MALFORMED: "The response must report exhaustive.nbHits as true.",
  RULE_MATCH_EXHAUSTIVITY_UNAVAILABLE: "Rule-match exhaustivity cannot be evaluated.",
  RULE_MATCHING_INCOMPLETE_DUE_TO_TIMEOUT: "The provider reports incomplete rule matching.",
  RULE_MATCH_EXHAUSTIVITY_MALFORMED: "The rule-match exhaustivity field is malformed.",
  ZERO_PROPOSITION_DERIVATION_FAILED: "The exact bounded proposition could not be derived.",
};

function record(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value
    : undefined;
}

function exactKeys(value, required, optional = []) {
  const allowed = new Set([...required, ...optional]);
  return required.every((key) => Object.hasOwn(value, key))
    && Object.keys(value).every((key) => allowed.has(key));
}

function nonEmptyString(value) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function nonNegativeInteger(value) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : undefined;
}

export function stableJson(value) {
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const object = record(value);
  if (object !== undefined) {
    return `{${Object.keys(object).sort().map(
      (key) => `${JSON.stringify(key)}:${stableJson(object[key])}`,
    ).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function canonicalJsonBytes(value) {
  return encoder.encode(stableJson(value));
}

export async function sha256Hex(bytes) {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function bindBytes(bytes, representation) {
  return {
    algorithm: "SHA-256",
    representation,
    digest: await sha256Hex(bytes),
    byteLength: bytes.byteLength,
  };
}

function normalizationCheck(id, label, state, reasonCode, detail) {
  return { id, category: "HTTP normalization", label, state, reasonCode, detail };
}

function decodedIndex(url) {
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length !== 4 || segments[0] !== "1" || segments[1] !== "indexes" || segments[3] !== "query") {
    return undefined;
  }
  try {
    const value = decodeURIComponent(segments[2]);
    return value.length === 0 ? undefined : value;
  } catch {
    return undefined;
  }
}

function parseJsonObject(text) {
  try {
    return record(JSON.parse(text));
  } catch {
    return undefined;
  }
}

/**
 * Fail-closed application-level HTTP normalization matching phase3/src/normalizer.ts.
 * Exact pasted strings are encoded directly and are never parsed/reserialized for raw bindings.
 */
export async function normalizeAlgoliaCapture(value) {
  const input = record(value);
  const checks = [];
  if (input === undefined) {
    return {
      ok: false,
      checks: [normalizationCheck("INPUT_SHAPE", "Capture envelope", "BLOCKED", "CAPTURE_NOT_AN_OBJECT", "Supply a structured capture object.")],
    };
  }

  const applicationId = nonEmptyString(input.applicationId);
  const index = nonEmptyString(input.index);
  const credentialFingerprint = nonEmptyString(input.credentialFingerprint);
  const observationId = typeof input.observationId === "string" ? input.observationId : "";
  const request = record(input.request);
  const response = record(input.response);
  const contextValid = applicationId !== undefined && index !== undefined;
  checks.push(normalizationCheck(
    "CONTEXT_PRESENT",
    "Application and index context",
    contextValid ? "SATISFIED" : "BLOCKED",
    contextValid ? "EXPECTED_CONTEXT_PRESENT" : "EXPECTED_CONTEXT_MISSING",
    contextValid ? "Expected application and index are explicit." : "Application ID and index are required.",
  ));
  const fingerprintValid = credentialFingerprint !== undefined && HEX_64.test(credentialFingerprint);
  checks.push(normalizationCheck(
    "AUTHORITY_FINGERPRINT",
    "Credential fingerprint",
    fingerprintValid ? "SATISFIED" : "BLOCKED",
    fingerprintValid ? "SHA256_CREDENTIAL_FINGERPRINT_PRESENT" : "CREDENTIAL_FINGERPRINT_MALFORMED",
    fingerprintValid ? "A lowercase SHA-256 fingerprint binds the credential-defined view." : "Use exactly 64 lowercase hexadecimal characters.",
  ));

  let url;
  try {
    url = new URL(request?.url);
  } catch {
    url = undefined;
  }
  const requestUrlValid = url !== undefined;
  checks.push(normalizationCheck(
    "REQUEST_URL_PARSE",
    "Request URL parses",
    requestUrlValid ? "SATISFIED" : "BLOCKED",
    requestUrlValid ? "REQUEST_URL_PARSED" : "REQUEST_URL_MALFORMED",
    requestUrlValid ? "The supplied request URL is syntactically valid." : "Supply the exact absolute request URL.",
  ));

  const protocolValid = url?.protocol === "https:";
  checks.push(normalizationCheck(
    "REQUEST_HTTPS",
    "HTTPS provider boundary",
    protocolValid ? "SATISFIED" : "BLOCKED",
    protocolValid ? "HTTPS_REQUEST_CONFIRMED" : "HTTPS_REQUEST_REQUIRED",
    protocolValid ? "The capture identifies an HTTPS request." : "The canonical normalizer accepts only HTTPS captures.",
  ));
  const hostValid = applicationId !== undefined
    && url?.hostname.toLowerCase() === `${applicationId.toLowerCase()}-dsn.algolia.net`;
  checks.push(normalizationCheck(
    "REQUEST_HOST",
    "Application host matches",
    hostValid ? "SATISFIED" : "BLOCKED",
    hostValid ? "ALGOLIA_APPLICATION_HOST_MATCHES" : "ALGOLIA_APPLICATION_HOST_MISMATCH",
    hostValid ? "The URL host is bound to the supplied application ID." : "Expected {applicationId}-dsn.algolia.net.",
  ));
  const methodValid = request?.method === "POST";
  checks.push(normalizationCheck(
    "REQUEST_METHOD",
    "Single-index POST form",
    methodValid ? "SATISFIED" : "BLOCKED",
    methodValid ? "POST_METHOD_CONFIRMED" : "POST_METHOD_REQUIRED",
    methodValid ? "The request method is POST." : "The canonical path accepts POST exactly.",
  ));
  const pathIndex = url === undefined ? undefined : decodedIndex(url);
  const pathValid = index !== undefined && pathIndex === index && url?.search === "";
  checks.push(normalizationCheck(
    "REQUEST_PATH",
    "URL path targets declared index",
    pathValid ? "SATISFIED" : "BLOCKED",
    pathValid ? "REQUEST_PATH_TARGETS_DECLARED_INDEX" : "REQUEST_URL_SCOPE_MISMATCH",
    pathValid ? "The URL contains the exact single-index query path and no query string." : "Expected /1/indexes/{index}/query with no URL query string.",
  ));
  const appHeaderValid = applicationId !== undefined && request?.applicationIdHeader === applicationId;
  checks.push(normalizationCheck(
    "APPLICATION_HEADER",
    "Application ID header matches",
    appHeaderValid ? "SATISFIED" : "BLOCKED",
    appHeaderValid ? "APPLICATION_ID_HEADER_MATCHES" : "APPLICATION_ID_HEADER_MISMATCH",
    appHeaderValid ? "The captured x-algolia-application-id equals the expected application." : "Supply the exact x-algolia-application-id header value.",
  ));
  const capturedCredentialFingerprint = nonEmptyString(request?.credentialFingerprint);
  const capturedCredentialByteLength = nonNegativeInteger(request?.credentialByteLength);
  const credentialBindingValid = capturedCredentialFingerprint !== undefined
    && HEX_64.test(capturedCredentialFingerprint)
    && capturedCredentialFingerprint === credentialFingerprint
    && capturedCredentialByteLength !== undefined;
  checks.push(normalizationCheck(
    "CREDENTIAL_BINDING",
    "Captured credential binding matches authority context",
    credentialBindingValid ? "SATISFIED" : "BLOCKED",
    credentialBindingValid ? "CREDENTIAL_BINDING_MATCHES" : "CREDENTIAL_BINDING_MISMATCH",
    credentialBindingValid
      ? "The captured credential fingerprint and UTF-8 byte length form a complete canonical credential binding."
      : "Supply the capture's credential fingerprint and exact credential UTF-8 byte length; the fingerprint must equal the expected authority context.",
  ));

  const requestBodyText = typeof request?.bodyText === "string" ? request.bodyText : undefined;
  const requestBody = requestBodyText === undefined ? undefined : parseJsonObject(requestBodyText);
  checks.push(normalizationCheck(
    "REQUEST_JSON",
    "Request body is a JSON object",
    requestBody !== undefined ? "SATISFIED" : "BLOCKED",
    requestBody !== undefined ? "REQUEST_JSON_OBJECT_PARSED" : "REQUEST_BODY_INVALID_JSON_OBJECT",
    requestBody !== undefined ? "Exact text was parsed once without changing the raw bytes." : "The request body must be valid JSON with an object at its root.",
  ));
  const noBodyScopeOverride = requestBody !== undefined
    && !Object.hasOwn(requestBody, "path")
    && !Object.hasOwn(requestBody, "index");
  checks.push(normalizationCheck(
    "REQUEST_SCOPE_SOURCE",
    "Path and index come from URL",
    noBodyScopeOverride ? "SATISFIED" : "BLOCKED",
    noBodyScopeOverride ? "NO_BODY_SCOPE_OVERRIDE" : "BODY_SCOPE_OVERRIDE_REJECTED",
    noBodyScopeOverride ? "The body does not override URL-derived scope." : "Remove body properties named path or index; they fail closed.",
  ));

  const statusValid = response?.status === 200;
  checks.push(normalizationCheck(
    "RESPONSE_STATUS",
    "HTTP success status",
    statusValid ? "SATISFIED" : "BLOCKED",
    statusValid ? "HTTP_200_CONFIRMED" : "HTTP_200_REQUIRED",
    statusValid ? "The response status is exactly 200." : "The canonical normalizer requires status 200.",
  ));
  const contentTypeValid = typeof response?.contentType === "string"
    && response.contentType.toLowerCase().startsWith("application/json");
  checks.push(normalizationCheck(
    "RESPONSE_CONTENT_TYPE",
    "JSON response media type",
    contentTypeValid ? "SATISFIED" : "BLOCKED",
    contentTypeValid ? "JSON_CONTENT_TYPE_CONFIRMED" : "JSON_CONTENT_TYPE_REQUIRED",
    contentTypeValid ? "The response media type begins with application/json." : "Supply a provider-compatible application/json content type.",
  ));
  const responseBodyText = typeof response?.bodyText === "string" ? response.bodyText : undefined;
  const responseBody = responseBodyText === undefined ? undefined : parseJsonObject(responseBodyText);
  checks.push(normalizationCheck(
    "RESPONSE_JSON",
    "Response body is a JSON object",
    responseBody !== undefined ? "SATISFIED" : "BLOCKED",
    responseBody !== undefined ? "RESPONSE_JSON_OBJECT_PARSED" : "RESPONSE_BODY_INVALID_JSON_OBJECT",
    responseBody !== undefined ? "The complete parsed response will be retained without projection." : "The response body must be valid JSON with an object at its root.",
  ));

  if (checks.some((check) => check.state !== "SATISFIED")) return { ok: false, checks };

  const rawRequestBytes = encoder.encode(requestBodyText);
  const rawResponseBytes = encoder.encode(responseBodyText);
  const normalizedRequest = {
    path: url.pathname,
    index,
    ...requestBody,
  };
  for (const [key, item] of Object.entries(requestBody)) {
    if (!Object.hasOwn(normalizedRequest, key) || stableJson(normalizedRequest[key]) !== stableJson(item)) {
      checks.push(normalizationCheck(
        "REQUEST_LOSSLESS",
        "Request properties preserved",
        "BLOCKED",
        "REQUEST_NORMALIZATION_NOT_LOSSLESS",
        `Request property ${key} was not preserved exactly.`,
      ));
      return { ok: false, checks };
    }
  }
  const normalizedRequestBytes = canonicalJsonBytes(normalizedRequest);
  const normalizedResponseBytes = canonicalJsonBytes(responseBody);
  const [rawRequestBinding, rawResponseBinding, requestBinding, responseBinding] = await Promise.all([
    bindBytes(rawRequestBytes, "exact-http-body-bytes"),
    bindBytes(rawResponseBytes, "exact-http-body-bytes"),
    bindBytes(normalizedRequestBytes, "exact-profile-input-bytes"),
    bindBytes(normalizedResponseBytes, "exact-profile-input-bytes"),
  ]);
  const authorityContextId = `algolia-search-key-sha256:${credentialFingerprint}`;

  return {
    ok: true,
    checks,
    normalizedRequest,
    normalizedResponse: responseBody,
    normalizedRequestBytes,
    normalizedResponseBytes,
    observation: {
      profile: PROFILE_ID,
      observationId,
      requestBytes: normalizedRequestBytes,
      responseBytes: normalizedResponseBytes,
      authorityContext: { kind: "opaque-non-secret", id: authorityContextId },
    },
    receipt: {
      version: NORMALIZER_VERSION,
      sourceInstance: {
        provider: "algolia",
        applicationId,
        sourceInstanceId: `algolia-app:${applicationId}`,
      },
      authorityContextId,
      observationId,
      request: {
        method: "POST",
        url: request.url,
        origin: url.origin,
        pathname: url.pathname,
        queryString: url.search,
        applicationIdHeader: request.applicationIdHeader,
        bodyBinding: rawRequestBinding,
        credentialBinding: {
          algorithm: "SHA-256",
          representation: "exact-credential-bytes-sha256-fingerprint",
          digest: capturedCredentialFingerprint,
          byteLength: capturedCredentialByteLength,
        },
      },
      response: {
        status: 200,
        finalUrl: typeof response.finalUrl === "string" ? response.finalUrl : "",
        contentType: response.contentType,
        bodyBinding: rawResponseBinding,
      },
      normalized: {
        adapterVersion: NORMALIZER_VERSION,
        profile: PROFILE_ID,
        requestBinding,
        responseBinding,
      },
    },
  };
}

function obligation(id, state, reasonCode, kind = "SUPPORT") {
  return { id, kind, state, reasonCode };
}

function exactBoolean(id, value, required, blockedCode, unknownCode) {
  if (value === required) return obligation(id, "SATISFIED", "REQUIRED_VALUE_CONFIRMED");
  if (typeof value === "boolean") return obligation(id, "BLOCKED", blockedCode);
  return obligation(id, "UNKNOWN", unknownCode);
}

function pathTargetsIndex(path, index) {
  if (typeof path !== "string" || typeof index !== "string" || !path.startsWith("/")) return false;
  try {
    const url = new URL(path, "https://profile-input.invalid");
    return url.hash === "" && url.search === "" && decodedIndex(url) === index;
  } catch {
    return false;
  }
}

function sourceScopeIdentity(scope) {
  if (scope?.provider !== "algolia"
    || scope.entitySet !== "index-records"
    || !pathTargetsIndex(scope.endpoint, scope.requestedIndex)
    || nonEmptyString(scope.effectiveIndex) === undefined) return undefined;
  return `algolia:${scope.endpoint}:requested=${scope.requestedIndex}:effective=${scope.effectiveIndex}`;
}

async function deriveZeroProposition(requestValue, authorityContextId, scopeValue) {
  const request = record(requestValue);
  if (request === undefined
    || nonEmptyString(request.path) === undefined
    || nonEmptyString(request.index) === undefined
    || !pathTargetsIndex(request.path, request.index)
    || nonEmptyString(authorityContextId) === undefined) return undefined;
  const matchPredicate = { ...request };
  delete matchPredicate.getRankingInfo;
  const scope = scopeValue ?? {
    provider: "algolia",
    endpoint: request.path,
    entitySet: "index-records",
    requestedIndex: request.index,
    effectiveIndex: request.index,
  };
  if (scope.endpoint !== request.path || scope.requestedIndex !== request.index) return undefined;
  const identity = sourceScopeIdentity(scope);
  if (identity === undefined) return undefined;
  return {
    profile: { id: PROFILE_ID, version: WARRANT_VERSION },
    sourceScopeIdentity: identity,
    matchPredicateIdentity: `sha256:${await sha256Hex(encoder.encode(stableJson(matchPredicate)))}`,
    authorityContextId,
  };
}

/** Evaluate already-normalized bytes using the frozen Algolia obligation set. */
export async function evaluateNormalizedObservation(normalized) {
  const { observation, normalizedRequest: request, normalizedResponse: response, receipt } = normalized;
  const authorityValid = observation.authorityContext?.kind === "opaque-non-secret"
    && nonEmptyString(observation.authorityContext.id) !== undefined;
  const base = [
    obligation("PROFILE_EXPLICIT", "SATISFIED", "SUPPORTED_PROFILE_SELECTED_EXPLICITLY"),
    obligation("REQUEST_BOUND", "SATISFIED", "EXACT_PROFILE_INPUT_REQUEST_BYTES_BOUND"),
    obligation("RESPONSE_BOUND", "SATISFIED", "EXACT_PROFILE_INPUT_RESPONSE_BYTES_BOUND"),
    obligation(
      "OBSERVATION_BOUND",
      nonEmptyString(observation.observationId) === undefined ? "UNKNOWN" : "SATISFIED",
      nonEmptyString(observation.observationId) === undefined ? "OBSERVATION_IDENTIFIER_MISSING" : "OBSERVATION_IDENTIFIER_BOUND",
    ),
    obligation(
      "VISIBILITY_CONTEXT_BOUND",
      authorityValid ? "SATISFIED" : "UNKNOWN",
      authorityValid ? "SOURCE_EFFECTIVE_AUTHORITY_CONTEXT_BOUND" : "AUTHORITY_CONTEXT_MISSING_OR_MALFORMED",
    ),
  ];

  const requestedIndex = nonEmptyString(request?.index);
  const endpoint = nonEmptyString(request?.path);
  const pathConsistent = pathTargetsIndex(endpoint, requestedIndex);
  const effectiveIndex = nonEmptyString(response?.indexUsed);
  const effectiveIndexWitnessed = effectiveIndex !== undefined;
  const scopeResolved = requestedIndex !== undefined && endpoint !== undefined && pathConsistent && effectiveIndexWitnessed;
  const scope = scopeResolved ? {
    provider: "algolia",
    endpoint,
    entitySet: "index-records",
    requestedIndex,
    effectiveIndex,
    queryBinding: receipt.normalized.requestBinding,
    visibility: {
      kind: "source-effective-view-only",
      authorityContextId: observation.authorityContext.id,
    },
  } : undefined;
  const nbHits = response?.nbHits;
  const exhaustive = record(response?.exhaustive);
  const zeroState = nbHits === 0
    ? obligation("ZERO_CARDINALITY", "SATISFIED", "ZERO_COUNT_OBSERVED")
    : nonNegativeInteger(nbHits) !== undefined && nbHits > 0
      ? obligation("ZERO_CARDINALITY", "BLOCKED", "NONZERO_COUNT_OBSERVED")
      : obligation("ZERO_CARDINALITY", "UNKNOWN", "NB_HITS_MISSING_OR_MALFORMED");

  const obligations = [
    ...base,
    exactBoolean(
      "RANKING_INFO_REQUESTED",
      request?.getRankingInfo,
      true,
      "EFFECTIVE_SCOPE_METADATA_NOT_REQUESTED",
      "RANKING_INFO_SETTING_MISSING_OR_MALFORMED",
    ),
    exactBoolean(
      "AB_TEST_PARTICIPATION_DISABLED",
      request?.enableABTest,
      false,
      "AB_TEST_CAN_TRANSFORM_EFFECTIVE_QUERY",
      "AB_TEST_SETTING_MISSING_OR_MALFORMED",
    ),
    obligation(
      "REQUEST_TARGET_CONSISTENT",
      request === undefined || requestedIndex === undefined || endpoint === undefined
        ? "UNKNOWN"
        : pathConsistent ? "SATISFIED" : "BLOCKED",
      pathConsistent ? "REQUEST_PATH_TARGETS_DECLARED_INDEX" : "REQUEST_PATH_INDEX_MISMATCH",
    ),
    obligation(
      "EFFECTIVE_INDEX_WITNESSED",
      effectiveIndexWitnessed ? "SATISFIED" : "UNKNOWN",
      effectiveIndexWitnessed ? "SOURCE_REPORTED_EFFECTIVE_INDEX" : "EFFECTIVE_INDEX_WITNESS_MISSING",
    ),
    obligation(
      "SOURCE_SCOPE_RESOLVED",
      scopeResolved ? "SATISFIED" : "UNKNOWN",
      scopeResolved ? "EFFECTIVE_INDEX_RESOLVED" : "EFFECTIVE_INDEX_UNRESOLVED",
    ),
    zeroState,
    exactBoolean(
      "EXACT_CARDINALITY",
      exhaustive?.nbHits,
      true,
      "APPROXIMATE_CARDINALITY",
      "EXACTNESS_MISSING_OR_MALFORMED",
    ),
    response === undefined || exhaustive === undefined
      ? obligation("RULE_MATCHING_COMPLETE", "UNKNOWN", "RULE_MATCH_EXHAUSTIVITY_UNAVAILABLE", "DEFEATER")
      : !Object.hasOwn(exhaustive, "rulesMatch")
        ? obligation("RULE_MATCHING_COMPLETE", "SATISFIED", "NO_RULE_MATCH_INCOMPLETENESS_REPORTED", "DEFEATER")
        : exhaustive.rulesMatch === true
          ? obligation("RULE_MATCHING_COMPLETE", "SATISFIED", "RULE_MATCHING_REPORTED_EXHAUSTIVE", "DEFEATER")
          : exhaustive.rulesMatch === false
            ? obligation("RULE_MATCHING_COMPLETE", "BLOCKED", "RULE_MATCHING_INCOMPLETE_DUE_TO_TIMEOUT", "DEFEATER")
            : obligation("RULE_MATCHING_COMPLETE", "UNKNOWN", "RULE_MATCH_EXHAUSTIVITY_MALFORMED", "DEFEATER"),
  ];

  const proposition = await deriveZeroProposition(
    request,
    observation.authorityContext.id,
    scope,
  );
  obligations.push(obligation(
    "PROPOSITION_DERIVED",
    proposition === undefined ? "UNKNOWN" : "SATISFIED",
    proposition === undefined ? "ZERO_PROPOSITION_DERIVATION_FAILED" : "ZERO_PROPOSITION_DERIVED",
  ));
  const presence = nonNegativeInteger(nbHits) === undefined
    ? { id: "MATCH_PRESENT", state: "UNKNOWN", reasonCode: "MATCH_CARDINALITY_MISSING_OR_MALFORMED" }
    : nbHits > 0
      ? { id: "MATCH_PRESENT", state: "SATISFIED", reasonCode: "MATCH_OBSERVED" }
      : { id: "MATCH_PRESENT", state: "BLOCKED", reasonCode: "ZERO_OBSERVED" };

  if (presence.state === "SATISFIED") {
    return {
      version: WARRANT_VERSION,
      verdict: "PRESENT",
      profile: { id: PROFILE_ID, version: WARRANT_VERSION },
      witnessClass: "cardinality-exactness",
      obligations,
      evidenceFacts: [presence],
      reasonCodes: [presence.reasonCode],
    };
  }
  const failed = obligations.filter((item) => item.state !== "SATISFIED");
  if (failed.length > 0 || scope === undefined || proposition === undefined || nonEmptyString(observation.observationId) === undefined) {
    return {
      version: WARRANT_VERSION,
      verdict: "UNKNOWN",
      profile: { id: PROFILE_ID, version: WARRANT_VERSION },
      witnessClass: "cardinality-exactness",
      obligations,
      evidenceFacts: [presence],
      reasonCodes: [...new Set(failed.map((item) => item.reasonCode))],
    };
  }
  const warrant = {
    version: WARRANT_VERSION,
    verdict: "WARRANTED_ZERO",
    profile: { id: PROFILE_ID, version: WARRANT_VERSION },
    requestBinding: receipt.normalized.requestBinding,
    observationBinding: {
      observationId: observation.observationId,
      response: receipt.normalized.responseBinding,
    },
    scope,
    proposition,
    obligations,
    reasonCodes: ["SOURCE_OBSERVATION_WARRANTS_ZERO"],
  };
  return {
    version: WARRANT_VERSION,
    verdict: "WARRANTED_ZERO",
    profile: { id: PROFILE_ID, version: WARRANT_VERSION },
    witnessClass: "cardinality-exactness",
    obligations,
    evidenceFacts: [presence],
    reasonCodes: [...warrant.reasonCodes],
    warrant,
  };
}

export function sameZeroProposition(left, right) {
  return stableJson(left) === stableJson(right);
}

function sameBinding(left, right) {
  return left.algorithm === right.algorithm
    && left.representation === right.representation
    && left.digest === right.digest
    && left.byteLength === right.byteLength;
}

function digestBinding(value, representation) {
  const input = record(value);
  if (input === undefined
    || !exactKeys(input, ["algorithm", "representation", "digest", "byteLength"])
    || input.algorithm !== "SHA-256"
    || input.representation !== representation
    || typeof input.digest !== "string"
    || !HEX_64.test(input.digest)
    || nonNegativeInteger(input.byteLength) === undefined) return undefined;
  return {
    algorithm: "SHA-256",
    representation,
    digest: input.digest,
    byteLength: input.byteLength,
  };
}

function validBinding(value) {
  return digestBinding(value, "exact-profile-input-bytes") !== undefined;
}

function validProposition(value) {
  const input = record(value);
  const profile = record(input?.profile);
  return input !== undefined
    && exactKeys(input, ["profile", "sourceScopeIdentity", "matchPredicateIdentity", "authorityContextId"])
    && profile !== undefined
    && exactKeys(profile, ["id", "version"])
    && profile.id === PROFILE_ID
    && profile.version === WARRANT_VERSION
    && nonEmptyString(input.sourceScopeIdentity) !== undefined
    && typeof input.matchPredicateIdentity === "string"
    && /^sha256:[0-9a-f]{64}$/u.test(input.matchPredicateIdentity)
    && nonEmptyString(input.authorityContextId) !== undefined;
}

function validScope(value) {
  const input = record(value);
  const visibility = record(input?.visibility);
  return input !== undefined
    && exactKeys(input, ["provider", "endpoint", "entitySet", "queryBinding", "visibility", "requestedIndex", "effectiveIndex"])
    && input.provider === "algolia"
    && input.entitySet === "index-records"
    && nonEmptyString(input.endpoint) !== undefined
    && nonEmptyString(input.requestedIndex) !== undefined
    && nonEmptyString(input.effectiveIndex) !== undefined
    && validBinding(input.queryBinding)
    && visibility !== undefined
    && exactKeys(visibility, ["kind", "authorityContextId"])
    && visibility.kind === "source-effective-view-only"
    && nonEmptyString(visibility.authorityContextId) !== undefined;
}

function validObligations(value) {
  if (!Array.isArray(value) || value.length !== Object.keys(PROFILE_OBLIGATIONS).length) return false;
  const seen = new Set();
  for (const item of value) {
    const input = record(item);
    if (input === undefined
      || !exactKeys(input, ["id", "kind", "state", "reasonCode"])
      || !Object.hasOwn(PROFILE_OBLIGATIONS, input.id)
      || seen.has(input.id)) return false;
    const [kind, reasons] = PROFILE_OBLIGATIONS[input.id];
    if (input.kind !== kind || input.state !== "SATISFIED" || !reasons.has(input.reasonCode)) return false;
    seen.add(input.id);
  }
  return seen.size === Object.keys(PROFILE_OBLIGATIONS).length;
}

function validWarrant(value) {
  const input = record(value);
  const profile = record(input?.profile);
  const observation = record(input?.observationBinding);
  if (input === undefined
    || !exactKeys(input, [
      "version", "verdict", "profile", "requestBinding", "observationBinding",
      "scope", "proposition", "obligations", "reasonCodes",
    ])
    || input.version !== WARRANT_VERSION
    || input.verdict !== "WARRANTED_ZERO"
    || profile === undefined
    || !exactKeys(profile, ["id", "version"])
    || profile.id !== PROFILE_ID
    || profile.version !== WARRANT_VERSION
    || !validBinding(input.requestBinding)
    || observation === undefined
    || !exactKeys(observation, ["observationId", "response"])
    || nonEmptyString(observation.observationId) === undefined
    || !validBinding(observation.response)
    || !validScope(input.scope)
    || !validProposition(input.proposition)
    || !validObligations(input.obligations)
    || !Array.isArray(input.reasonCodes)
    || input.reasonCodes.length !== 1
    || input.reasonCodes[0] !== "SOURCE_OBSERVATION_WARRANTS_ZERO") return false;
  return true;
}

function deepFreeze(value) {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

/** Exact decoder for the Algolia subset of frozen receiver.ts. */
export function decodeBoundNegativeEvidence(value) {
  try {
    const input = record(value);
    if (input === undefined || !exactKeys(input, [
      "kind", "version", "proposition", "sourceWarrant", "verificationObservation",
      "mode", "preservationReasonCodes",
    ]) || input.kind !== BOUND_EVIDENCE_KIND
      || input.version !== BOUND_EVIDENCE_VERSION
      || !["DIRECT", "PROPOSITION_PRESERVING_VERIFICATION"].includes(input.mode)) return undefined;
    const proposition = input.proposition;
    const warrant = input.sourceWarrant;
    const observation = record(input.verificationObservation);
    if (!validProposition(proposition)
      || !validWarrant(warrant)
      || observation === undefined
      || !exactKeys(observation, ["profile", "observationId", "requestBinding", "responseBinding", "authorityContextId"])
      || observation.profile !== PROFILE_ID
      || nonEmptyString(observation.observationId) === undefined
      || !validBinding(observation.requestBinding)
      || !validBinding(observation.responseBinding)
      || nonEmptyString(observation.authorityContextId) === undefined) return undefined;
    const reasons = input.preservationReasonCodes;
    const reasonsValid = Array.isArray(reasons) && reasons.length === 1 && (
      (input.mode === "DIRECT" && reasons[0] === "REQUEST_UNCHANGED")
      || (input.mode === "PROPOSITION_PRESERVING_VERIFICATION"
        && reasons[0] === "ALGOLIA_RANKING_INFO_METADATA_ENABLED")
    );
    const scopeIdentity = sourceScopeIdentity(warrant.scope);
    if (!reasonsValid
      || scopeIdentity !== warrant.proposition.sourceScopeIdentity
      || !sameZeroProposition(proposition, warrant.proposition)
      || proposition.authorityContextId !== observation.authorityContextId
      || proposition.authorityContextId !== warrant.scope.visibility.authorityContextId
      || observation.observationId !== warrant.observationBinding.observationId
      || !sameBinding(observation.requestBinding, warrant.requestBinding)
      || !sameBinding(observation.requestBinding, warrant.scope.queryBinding)
      || !sameBinding(observation.responseBinding, warrant.observationBinding.response)) return undefined;
    const reconstructed = deepFreeze(JSON.parse(JSON.stringify(input)));
    receiverValidatedRoots.add(reconstructed);
    return reconstructed;
  } catch {
    return undefined;
  }
}

export function hasReceiverValidationMark(value) {
  return typeof value === "object" && value !== null && receiverValidatedRoots.has(value);
}

export function createAlgoliaRealSourceEvidence(receipt, boundEvidence) {
  if (!hasReceiverValidationMark(boundEvidence)) return undefined;
  return {
    kind: ALGOLIA_REAL_SOURCE_KIND,
    version: ALGOLIA_REAL_SOURCE_VERSION,
    sourceInstance: receipt.sourceInstance,
    authorityContextId: receipt.authorityContextId,
    credentialBinding: receipt.request.credentialBinding,
    verificationCapture: {
      adapterVersion: NORMALIZER_VERSION,
      rawRequestBodyBinding: receipt.request.bodyBinding,
      rawResponseBodyBinding: receipt.response.bodyBinding,
      normalizedRequestBinding: receipt.normalized.requestBinding,
      normalizedResponseBinding: receipt.normalized.responseBinding,
    },
    boundEvidence: JSON.parse(JSON.stringify(boundEvidence)),
  };
}

/** Exact browser port of phase3/src/real-source-evidence.ts. */
export function decodeAlgoliaRealSourceEvidence(value, expected) {
  try {
    const input = record(value);
    if (input === undefined || !exactKeys(input, [
      "kind", "version", "sourceInstance", "authorityContextId", "credentialBinding",
      "verificationCapture", "boundEvidence",
    ]) || input.kind !== ALGOLIA_REAL_SOURCE_KIND
      || input.version !== ALGOLIA_REAL_SOURCE_VERSION) return undefined;
    const source = record(input.sourceInstance);
    const authorityContextId = nonEmptyString(input.authorityContextId);
    const credential = digestBinding(
      input.credentialBinding,
      "exact-credential-bytes-sha256-fingerprint",
    );
    const capture = record(input.verificationCapture);
    if (source === undefined
      || !exactKeys(source, ["provider", "applicationId", "sourceInstanceId"])
      || source.provider !== "algolia"
      || source.applicationId !== expected?.applicationId
      || source.sourceInstanceId !== `algolia-app:${expected?.applicationId}`
      || authorityContextId !== `algolia-search-key-sha256:${expected?.credentialFingerprint}`
      || credential === undefined
      || credential.digest !== expected?.credentialFingerprint
      || capture === undefined
      || !exactKeys(capture, [
        "adapterVersion", "rawRequestBodyBinding", "rawResponseBodyBinding",
        "normalizedRequestBinding", "normalizedResponseBinding",
      ])
      || capture.adapterVersion !== NORMALIZER_VERSION) return undefined;
    const rawRequest = digestBinding(capture.rawRequestBodyBinding, "exact-http-body-bytes");
    const rawResponse = digestBinding(capture.rawResponseBodyBinding, "exact-http-body-bytes");
    const normalizedRequest = digestBinding(capture.normalizedRequestBinding, "exact-profile-input-bytes");
    const normalizedResponse = digestBinding(capture.normalizedResponseBinding, "exact-profile-input-bytes");
    const nested = decodeBoundNegativeEvidence(input.boundEvidence);
    if (rawRequest === undefined || rawResponse === undefined
      || normalizedRequest === undefined || normalizedResponse === undefined
      || nested === undefined
      || nested.sourceWarrant.profile.id !== PROFILE_ID
      || nested.sourceWarrant.scope.provider !== "algolia"
      || nested.proposition.authorityContextId !== authorityContextId
      || !sameBinding(normalizedRequest, nested.sourceWarrant.requestBinding)
      || !sameBinding(normalizedResponse, nested.sourceWarrant.observationBinding.response)) return undefined;
    const reconstructed = {
      kind: ALGOLIA_REAL_SOURCE_KIND,
      version: ALGOLIA_REAL_SOURCE_VERSION,
      sourceInstance: {
        provider: "algolia",
        applicationId: expected.applicationId,
        sourceInstanceId: `algolia-app:${expected.applicationId}`,
      },
      authorityContextId,
      credentialBinding: credential,
      verificationCapture: {
        adapterVersion: NORMALIZER_VERSION,
        rawRequestBodyBinding: rawRequest,
        rawResponseBodyBinding: rawResponse,
        normalizedRequestBinding: normalizedRequest,
        normalizedResponseBinding: normalizedResponse,
      },
      boundEvidence: nested,
    };
    const frozen = deepFreeze(reconstructed);
    algoliaRealSourceValidatedRoots.add(frozen);
    return frozen;
  } catch {
    return undefined;
  }
}

export function hasAlgoliaRealSourceValidationMark(value) {
  return typeof value === "object" && value !== null && algoliaRealSourceValidatedRoots.has(value);
}

function createBoundEvidence(warrant, mode, reasonCode) {
  return {
    kind: BOUND_EVIDENCE_KIND,
    version: BOUND_EVIDENCE_VERSION,
    proposition: warrant.proposition,
    sourceWarrant: warrant,
    verificationObservation: {
      profile: PROFILE_ID,
      observationId: warrant.observationBinding.observationId,
      requestBinding: warrant.requestBinding,
      responseBinding: warrant.observationBinding.response,
      authorityContextId: warrant.proposition.authorityContextId,
    },
    mode,
    preservationReasonCodes: [reasonCode],
  };
}

async function compareRecordedPair(original, verification) {
  const originalProposition = await deriveZeroProposition(
    original.normalizedRequest,
    original.observation.authorityContext.id,
  );
  const verificationProposition = await deriveZeroProposition(
    verification.normalizedRequest,
    verification.observation.authorityContext.id,
    {
      provider: "algolia",
      endpoint: verification.normalizedRequest.path,
      entitySet: "index-records",
      requestedIndex: verification.normalizedRequest.index,
      effectiveIndex: verification.normalizedResponse.indexUsed,
    },
  );
  const originalRequest = original.normalizedRequest;
  const verificationRequest = verification.normalizedRequest;
  const originalComparable = { ...originalRequest };
  const verificationComparable = { ...verificationRequest };
  delete originalComparable.getRankingInfo;
  delete verificationComparable.getRankingInfo;
  const preserving = originalProposition !== undefined
    && verificationProposition !== undefined
    && sameZeroProposition(originalProposition, verificationProposition)
    && stableJson(originalComparable) === stableJson(verificationComparable)
    && (originalRequest.getRankingInfo === undefined || typeof originalRequest.getRankingInfo === "boolean")
    && verificationRequest.getRankingInfo === true;
  return {
    preservation: preserving ? "PRESERVING" : "NOT_PRESERVING",
    acquisition: preserving ? "SAFE_STRENGTHENING_AVAILABLE" : "PROPOSITION_CHANGING_ONLY",
    changeKind: preserving ? "EVIDENCE_ONLY_STRENGTHENING" : "PROPOSITION_CHANGING",
    reasonCodes: [preserving ? "ALGOLIA_RANKING_INFO_METADATA_ENABLED" : "ALGOLIA_MATCH_PREDICATE_CHANGED"],
    originalProposition,
    verificationProposition,
  };
}

function diagnosticFromObligation(item) {
  const [category, label] = DIAGNOSTIC_COPY[item.id] ?? ["Profile", item.id];
  return {
    ...item,
    category,
    label,
    detail: item.state === "SATISFIED"
      ? item.reasonCode.replaceAll("_", " ").toLowerCase()
      : REASON_COPY[item.reasonCode] ?? item.reasonCode.replaceAll("_", " ").toLowerCase(),
  };
}

function receiverDiagnostic(state, reasonCode, detail) {
  return {
    id: "RECEIVER_VALIDATION",
    kind: "SUPPORT",
    category: "Receiver",
    label: "Bound evidence reconstructed and validated",
    state,
    reasonCode,
    detail,
  };
}

/** Full public entry point used by the UI and parity tests. */
export async function inspectCapture(capture, options = {}) {
  const normalized = await normalizeAlgoliaCapture(capture);
  if (!normalized.ok) {
    return {
      inspector: { id: "risu-negative-result-warrant-inspector", version: CORE_VERSION },
      inputStatus: "INVALID",
      verdict: "INVALID",
      diagnostics: normalized.checks,
      reasonCodes: normalized.checks.filter((item) => item.state !== "SATISFIED").map((item) => item.reasonCode),
    };
  }
  const evaluation = await evaluateNormalizedObservation(normalized);
  let comparison;
  let boundEvidence;
  let receiverValidatedEvidence;
  let realSourceEvidence;
  let receiverValidatedRealSourceEvidence;
  if (evaluation.verdict === "WARRANTED_ZERO") {
    let mode = "DIRECT";
    let reason = "REQUEST_UNCHANGED";
    if (options.originalCapture !== undefined) {
      const original = await normalizeAlgoliaCapture(options.originalCapture);
      if (original.ok) comparison = await compareRecordedPair(original, normalized);
      if (comparison?.preservation === "PRESERVING"
        && comparison.acquisition === "SAFE_STRENGTHENING_AVAILABLE") {
        mode = "PROPOSITION_PRESERVING_VERIFICATION";
        reason = "ALGOLIA_RANKING_INFO_METADATA_ENABLED";
      }
    }
    boundEvidence = createBoundEvidence(evaluation.warrant, mode, reason);
    receiverValidatedEvidence = decodeBoundNegativeEvidence(boundEvidence);
    if (receiverValidatedEvidence !== undefined) {
      realSourceEvidence = createAlgoliaRealSourceEvidence(normalized.receipt, receiverValidatedEvidence);
      receiverValidatedRealSourceEvidence = decodeAlgoliaRealSourceEvidence(realSourceEvidence, {
        applicationId: normalized.receipt.sourceInstance.applicationId,
        credentialFingerprint: normalized.receipt.request.credentialBinding.digest,
      });
    }
  }
  const receiverState = evaluation.verdict !== "WARRANTED_ZERO"
    ? receiverDiagnostic("UNKNOWN", "NO_WARRANT_TO_RECEIVE", "Receiver validation is not reached without a warranted observation.")
    : receiverValidatedEvidence === undefined || receiverValidatedRealSourceEvidence === undefined
      ? receiverDiagnostic("BLOCKED", "RECEIVER_VALIDATION_FAILED", "The bound evidence failed exact reconstruction and validation.")
      : receiverDiagnostic("SATISFIED", "RECEIVER_VALIDATION_SUCCEEDED", "Canonical bound and Algolia real-source evidence were reconstructed, checked, frozen, and locally marked as validated.");
  const diagnostics = [
    ...normalized.checks,
    ...evaluation.obligations.map(diagnosticFromObligation),
    receiverState,
  ];
  return {
    inspector: { id: "risu-negative-result-warrant-inspector", version: CORE_VERSION },
    inputStatus: "ACCEPTED",
    verdict: evaluation.verdict,
    diagnostics,
    reasonCodes: evaluation.reasonCodes,
    evaluation,
    normalization: {
      sourceInstance: normalized.receipt.sourceInstance,
      authorityContextId: normalized.receipt.authorityContextId,
      credentialBinding: normalized.receipt.request.credentialBinding,
      rawRequestBodyBinding: normalized.receipt.request.bodyBinding,
      rawResponseBodyBinding: normalized.receipt.response.bodyBinding,
      normalizedRequestBinding: normalized.receipt.normalized.requestBinding,
      normalizedResponseBinding: normalized.receipt.normalized.responseBinding,
    },
    normalizedRequest: normalized.normalizedRequest,
    normalizedResponse: normalized.normalizedResponse,
    comparison,
    warrant: evaluation.warrant,
    boundEvidence,
    receiverValidatedEvidence,
    realSourceEvidence,
    receiverValidatedRealSourceEvidence,
  };
}

function portableCaptureFrom(capture) {
  return {
    applicationId: capture.applicationId,
    index: capture.index,
    credentialFingerprint: capture.credentialFingerprint,
    observationId: capture.observationId,
    request: {
      method: capture.request.method,
      url: capture.request.url,
      applicationIdHeader: capture.request.applicationIdHeader,
      credentialFingerprint: capture.request.credentialFingerprint,
      credentialByteLength: capture.request.credentialByteLength,
      bodyText: capture.request.bodyText,
    },
    response: {
      status: capture.response.status,
      contentType: capture.response.contentType,
      bodyText: capture.response.bodyText,
    },
  };
}

function decodePortableCapture(value) {
  const input = record(value);
  const request = record(input?.request);
  const response = record(input?.response);
  if (input === undefined
    || !exactKeys(input, [
      "applicationId", "index", "credentialFingerprint", "observationId", "request", "response",
    ])
    || request === undefined
    || !exactKeys(request, [
      "method", "url", "applicationIdHeader", "credentialFingerprint", "credentialByteLength", "bodyText",
    ])
    || response === undefined
    || !exactKeys(response, ["status", "contentType", "bodyText"])
    || typeof input.applicationId !== "string"
    || typeof input.index !== "string"
    || typeof input.credentialFingerprint !== "string"
    || typeof input.observationId !== "string"
    || typeof request.method !== "string"
    || typeof request.url !== "string"
    || typeof request.applicationIdHeader !== "string"
    || typeof request.credentialFingerprint !== "string"
    || nonNegativeInteger(request.credentialByteLength) === undefined
    || typeof request.bodyText !== "string"
    || typeof response.status !== "number"
    || typeof response.contentType !== "string"
    || typeof response.bodyText !== "string") return undefined;
  return portableCaptureFrom({
    applicationId: input.applicationId,
    index: input.index,
    credentialFingerprint: input.credentialFingerprint,
    observationId: input.observationId,
    request,
    response,
  });
}

function decodeExpectedPortableContext(value) {
  const input = record(value);
  if (input === undefined
    || !exactKeys(input, ["applicationId", "credentialFingerprint", "credentialByteLength"])
    || nonEmptyString(input.applicationId) === undefined
    || typeof input.credentialFingerprint !== "string"
    || !HEX_64.test(input.credentialFingerprint)
    || nonNegativeInteger(input.credentialByteLength) === undefined) return undefined;
  return {
    applicationId: input.applicationId,
    credentialFingerprint: input.credentialFingerprint,
    credentialByteLength: input.credentialByteLength,
  };
}

function validPortableInspectorMetadata(value) {
  const input = record(value);
  return input !== undefined
    && exactKeys(input, [
      "id", "version", "canonicalSourceCommit", "profile", "captureProvenance", "originAuthentication",
    ])
    && input.id === "risu-negative-result-warrant-inspector"
    && input.version === CORE_VERSION
    && input.canonicalSourceCommit === CANONICAL_COMMIT
    && input.profile === `${PROFILE_ID}@${WARRANT_VERSION}`
    && ["user-supplied", "vendored-recorded"].includes(input.captureProvenance)
    && input.originAuthentication === "not-established";
}

export function createPortableEvidencePackage(result, capture, options = {}) {
  if (!hasAlgoliaRealSourceValidationMark(result?.receiverValidatedRealSourceEvidence)
    || result?.realSourceEvidence === undefined) return undefined;
  const provenance = options.captureProvenance ?? "user-supplied";
  if (!["user-supplied", "vendored-recorded"].includes(provenance)) return undefined;
  return {
    kind: PORTABLE_EVIDENCE_KIND,
    version: PORTABLE_EVIDENCE_VERSION,
    canonical: {
      realSourceEvidence: JSON.parse(JSON.stringify(result.realSourceEvidence)),
    },
    transport: {
      capture: portableCaptureFrom(capture),
    },
    inspector: {
      id: "risu-negative-result-warrant-inspector",
      version: CORE_VERSION,
      canonicalSourceCommit: CANONICAL_COMMIT,
      profile: `${PROFILE_ID}@${WARRANT_VERSION}`,
      captureProvenance: provenance,
      originAuthentication: "not-established",
    },
  };
}

/**
 * Parses no bytes and trusts no serialized validation marker. It reconstructs a
 * new canonical outer-evidence root only after the supplied capture is
 * normalized and every transported binding is reproduced.
 */
export async function decodePortableEvidence(value, expectedContext) {
  try {
    const input = record(value);
    const canonical = record(input?.canonical);
    const transport = record(input?.transport);
    const expected = decodeExpectedPortableContext(expectedContext);
    if (input === undefined
      || !exactKeys(input, ["kind", "version", "canonical", "transport", "inspector"])
      || input.kind !== PORTABLE_EVIDENCE_KIND
      || input.version !== PORTABLE_EVIDENCE_VERSION
      || canonical === undefined
      || !exactKeys(canonical, ["realSourceEvidence"])
      || transport === undefined
      || !exactKeys(transport, ["capture"])
      || !validPortableInspectorMetadata(input.inspector)
      || expected === undefined) return undefined;
    const capture = decodePortableCapture(transport.capture);
    if (capture === undefined
      || capture.applicationId !== expected.applicationId
      || capture.credentialFingerprint !== expected.credentialFingerprint
      || capture.request.credentialFingerprint !== expected.credentialFingerprint
      || capture.request.credentialByteLength !== expected.credentialByteLength) return undefined;
    const normalized = await normalizeAlgoliaCapture(capture);
    if (!normalized.ok) return undefined;
    const outer = decodeAlgoliaRealSourceEvidence(canonical.realSourceEvidence, expected);
    if (outer === undefined
      || outer.credentialBinding.byteLength !== expected.credentialByteLength
      || !sameBinding(outer.credentialBinding, normalized.receipt.request.credentialBinding)) return undefined;
    const evaluation = await evaluateNormalizedObservation(normalized);
    if (evaluation.verdict !== "WARRANTED_ZERO"
      || evaluation.warrant === undefined
      || stableJson(evaluation.warrant) !== stableJson(outer.boundEvidence.sourceWarrant)) return undefined;
    const reproducedOuter = createAlgoliaRealSourceEvidence(normalized.receipt, outer.boundEvidence);
    if (reproducedOuter === undefined
      || stableJson(reproducedOuter) !== stableJson(canonical.realSourceEvidence)) return undefined;
    const reconstructed = deepFreeze({
      kind: PORTABLE_EVIDENCE_KIND,
      version: PORTABLE_EVIDENCE_VERSION,
      canonical: { realSourceEvidence: outer },
      transport: { capture },
      inspector: { ...input.inspector },
    });
    portableEvidenceValidatedRoots.add(reconstructed);
    return reconstructed;
  } catch {
    return undefined;
  }
}

export function hasPortableEvidenceValidationMark(value) {
  return typeof value === "object" && value !== null && portableEvidenceValidatedRoots.has(value);
}

export function checkNegativePremise(requiredProposition, evidence) {
  return evidence !== undefined
    && receiverValidatedRoots.has(evidence)
    && sameZeroProposition(requiredProposition, evidence.proposition)
    ? "PASS"
    : "BLOCK";
}

export function verifyPortablePremise(portableEvidence, intended) {
  const outer = portableEvidence?.canonical?.realSourceEvidence;
  const evidence = outer?.boundEvidence;
  const proposition = record(intended?.proposition);
  const required = proposition === undefined ? undefined : {
    profile: { id: intended.profileId, version: intended.profileVersion },
    sourceScopeIdentity: proposition.sourceScopeIdentity,
    matchPredicateIdentity: proposition.matchPredicateIdentity,
    authorityContextId: proposition.authorityContextId,
  };
  const expectedSourceInstanceId = outer?.sourceInstance?.sourceInstanceId;
  const suppliedSourceInstanceId = nonEmptyString(intended?.applicationId) === undefined
    ? undefined
    : `algolia-app:${intended.applicationId}`;
  const differences = [];
  if (!hasPortableEvidenceValidationMark(portableEvidence)
    || !hasAlgoliaRealSourceValidationMark(outer)
    || !hasReceiverValidationMark(evidence)) differences.push({
    field: "receiverValidation",
    expected: "receiver-reconstructed",
    received: "unvalidated",
  });
  if (suppliedSourceInstanceId !== expectedSourceInstanceId) differences.push({
    field: "sourceInstanceId",
    expected: expectedSourceInstanceId,
    received: suppliedSourceInstanceId,
  });
  const expected = evidence?.proposition;
  for (const field of ["profile", "sourceScopeIdentity", "matchPredicateIdentity", "authorityContextId"]) {
    const expectedValue = field === "profile" ? stableJson(expected?.profile) : expected?.[field];
    const receivedValue = field === "profile" ? stableJson(required?.profile) : required?.[field];
    if (expectedValue !== receivedValue) differences.push({ field, expected: expectedValue, received: receivedValue });
  }
  const gate = differences.length === 0 && required !== undefined
    ? checkNegativePremise(required, evidence)
    : "BLOCK";
  return {
    verdict: gate === "PASS" ? "MATCH" : "BLOCK",
    gate,
    differences,
    requiredProposition: required,
  };
}

export function verifyIntendedPremise(result, intended) {
  const evidence = result?.receiverValidatedEvidence;
  const proposition = record(intended?.proposition);
  const required = proposition === undefined ? undefined : {
    profile: { id: intended.profileId, version: intended.profileVersion },
    sourceScopeIdentity: proposition.sourceScopeIdentity,
    matchPredicateIdentity: proposition.matchPredicateIdentity,
    authorityContextId: proposition.authorityContextId,
  };
  const expectedSourceInstanceId = result?.normalization?.sourceInstance?.sourceInstanceId;
  const suppliedSourceInstanceId = nonEmptyString(intended?.applicationId) === undefined
    ? undefined
    : `algolia-app:${intended.applicationId}`;
  const differences = [];
  if (suppliedSourceInstanceId !== expectedSourceInstanceId) differences.push({
    field: "sourceInstanceId",
    expected: expectedSourceInstanceId,
    received: suppliedSourceInstanceId,
  });
  const expected = evidence?.proposition;
  for (const field of ["profile", "sourceScopeIdentity", "matchPredicateIdentity", "authorityContextId"]) {
    const expectedValue = field === "profile" ? stableJson(expected?.profile) : expected?.[field];
    const receivedValue = field === "profile" ? stableJson(required?.profile) : required?.[field];
    if (expectedValue !== receivedValue) differences.push({ field, expected: expectedValue, received: receivedValue });
  }
  const gate = differences.length === 0 && required !== undefined
    ? checkNegativePremise(required, evidence)
    : "BLOCK";
  return {
    verdict: gate === "PASS" ? "MATCH" : "BLOCK",
    gate,
    differences,
    requiredProposition: required,
  };
}

export function humanizeProposition(result) {
  const warrant = result?.warrant;
  if (warrant === undefined) return "No bounded negative proposition was issued.";
  const scope = warrant.scope;
  return `For the supplied capture, under ${warrant.profile.id} ${warrant.profile.version}, the provider-reported observation warrants zero matches in ${scope.entitySet} at ${scope.endpoint}, requested index ${scope.requestedIndex}, source-reported effective index ${scope.effectiveIndex}, matching predicate ${warrant.proposition.matchPredicateIdentity}, and authority context ${warrant.proposition.authorityContextId}.`;
}

export function createInspectionReport(result) {
  return {
    kind: "NEGATIVE_RESULT_WARRANT_INSPECTION",
    version: CORE_VERSION,
    inspector: {
      id: "risu-negative-result-warrant-inspector",
      implementation: "browser-safe-consumer-port",
      canonicalRepository: "https://github.com/risu-research/negative-result-warrant",
      canonicalCommit: CANONICAL_COMMIT,
      profile: `${PROFILE_ID}@${WARRANT_VERSION}`,
    },
    result: {
      inputStatus: result.inputStatus,
      verdict: result.verdict,
      reasonCodes: result.reasonCodes,
      diagnostics: result.diagnostics,
    },
    sourceContext: result.normalization === undefined ? undefined : {
      sourceInstance: result.normalization.sourceInstance,
      authorityContextId: result.normalization.authorityContextId,
      credentialBinding: result.normalization.credentialBinding,
      captureBindings: {
        rawRequestBody: result.normalization.rawRequestBodyBinding,
        rawResponseBody: result.normalization.rawResponseBodyBinding,
        normalizedRequest: result.normalization.normalizedRequestBinding,
        normalizedResponse: result.normalization.normalizedResponseBinding,
      },
    },
    canonicalWarrant: result.warrant,
    canonicalBoundNegativeEvidence: result.boundEvidence,
    canonicalAlgoliaRealSourceNegativeEvidence: result.realSourceEvidence,
    artifactHierarchy: {
      canonicalWarrant: "canonical NegativeResultWarrant 0.2.1",
      canonicalBoundNegativeEvidence: "canonical BoundNegativeEvidence 0.2.2",
      canonicalAlgoliaRealSourceNegativeEvidence: "canonical AlgoliaRealSourceNegativeEvidence 0.3.0",
      portableEnvelope: `Inspector-specific ${PORTABLE_EVIDENCE_KIND} ${PORTABLE_EVIDENCE_VERSION}`,
    },
    boundaries: [
      "Evaluation is conditioned on the supplied capture.",
      "Structural validation and SHA-256 binding do not authenticate provider origin.",
      "Receiver validation is not serialized authority; imported evidence must be reconstructed and validated again.",
      "No world-level nonexistence, persistence, authorization, or downstream safety is established.",
    ],
  };
}
