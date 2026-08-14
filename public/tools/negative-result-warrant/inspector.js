import {
  createPortableEvidencePackage,
  createInspectionReport,
  decodePortableEvidence,
  hasAlgoliaRealSourceValidationMark,
  hasPortableEvidenceValidationMark,
  hasReceiverValidationMark,
  humanizeProposition,
  inspectCapture,
  verifyPortablePremise,
} from "./core.js";
import { recordedObservations } from "./recorded/observations.js";

const elements = {
  userMode: document.querySelector("#user-mode"),
  recordedMode: document.querySelector("#recorded-mode"),
  recordedControls: document.querySelector("#recorded-controls"),
  loadQ: document.querySelector("#load-q"),
  loadQPrime: document.querySelector("#load-q-prime"),
  captureModeChip: document.querySelector("#capture-mode-chip"),
  form: document.querySelector("#capture-form"),
  evaluateButton: document.querySelector("#evaluate-button"),
  resetButton: document.querySelector("#reset-button"),
  applicationId: document.querySelector("#application-id"),
  index: document.querySelector("#index"),
  fingerprint: document.querySelector("#credential-fingerprint"),
  observationId: document.querySelector("#observation-id"),
  requestUrl: document.querySelector("#request-url"),
  requestMethod: document.querySelector("#request-method"),
  applicationHeader: document.querySelector("#application-header"),
  requestCredentialFingerprint: document.querySelector("#request-credential-fingerprint"),
  requestCredentialByteLength: document.querySelector("#request-credential-byte-length"),
  requestBody: document.querySelector("#request-body"),
  responseStatus: document.querySelector("#response-status"),
  responseContentType: document.querySelector("#response-content-type"),
  responseFinalUrl: document.querySelector("#response-final-url"),
  responseBody: document.querySelector("#response-body"),
  verdictChip: document.querySelector("#verdict-chip"),
  verdictLive: document.querySelector("#verdict-live"),
  diagnostics: document.querySelector("#diagnostics"),
  diagnosticCount: document.querySelector("#diagnostic-count"),
  supportedProposition: document.querySelector("#supported-proposition"),
  portableJson: document.querySelector("#portable-json"),
  warrantJson: document.querySelector("#warrant-json"),
  copyPortable: document.querySelector("#copy-portable"),
  downloadPortable: document.querySelector("#download-portable"),
  copyWarrant: document.querySelector("#copy-warrant"),
  downloadWarrant: document.querySelector("#download-warrant"),
  downloadReport: document.querySelector("#download-report"),
  artifactStatus: document.querySelector("#artifact-status"),
  importForm: document.querySelector("#import-form"),
  importJson: document.querySelector("#import-json"),
  importApplication: document.querySelector("#import-application"),
  importFingerprint: document.querySelector("#import-fingerprint"),
  importByteLength: document.querySelector("#import-byte-length"),
  revalidatePackage: document.querySelector("#revalidate-package"),
  clearImport: document.querySelector("#clear-import"),
  packageResult: document.querySelector("#package-result"),
  premiseForm: document.querySelector("#premise-form"),
  premiseApplication: document.querySelector("#premise-application"),
  premiseProfile: document.querySelector("#premise-profile"),
  premiseScope: document.querySelector("#premise-scope"),
  premisePredicate: document.querySelector("#premise-predicate"),
  premiseAuthority: document.querySelector("#premise-authority"),
  verifyPremise: document.querySelector("#verify-premise"),
  premiseResult: document.querySelector("#premise-result"),
};

const captureFields = [
  elements.applicationId,
  elements.index,
  elements.fingerprint,
  elements.observationId,
  elements.requestUrl,
  elements.requestMethod,
  elements.applicationHeader,
  elements.requestCredentialFingerprint,
  elements.requestCredentialByteLength,
  elements.requestBody,
  elements.responseStatus,
  elements.responseContentType,
  elements.responseFinalUrl,
  elements.responseBody,
];

const premiseFields = [
  elements.premiseApplication,
  elements.premiseScope,
  elements.premisePredicate,
  elements.premiseAuthority,
];

let currentResult;
let currentCapture;
let currentPortablePackage;
let currentImportedEvidence;
let currentMode = "user";
let currentRecorded = "ordinary";

function captureFromForm() {
  return {
    applicationId: elements.applicationId.value,
    index: elements.index.value,
    credentialFingerprint: elements.fingerprint.value,
    observationId: elements.observationId.value,
    request: {
      method: elements.requestMethod.value,
      url: elements.requestUrl.value,
      applicationIdHeader: elements.applicationHeader.value,
      credentialFingerprint: elements.requestCredentialFingerprint.value,
      credentialByteLength: elements.requestCredentialByteLength.value === ""
        ? Number.NaN
        : Number(elements.requestCredentialByteLength.value),
      bodyText: elements.requestBody.value,
    },
    response: {
      status: elements.responseStatus.value === "" ? Number.NaN : Number(elements.responseStatus.value),
      contentType: elements.responseContentType.value,
      finalUrl: elements.responseFinalUrl.value,
      bodyText: elements.responseBody.value,
    },
  };
}

function fillCapture(capture) {
  elements.applicationId.value = capture.applicationId;
  elements.index.value = capture.index;
  elements.fingerprint.value = capture.credentialFingerprint;
  elements.observationId.value = capture.observationId;
  elements.requestUrl.value = capture.request.url;
  elements.requestMethod.value = capture.request.method;
  elements.applicationHeader.value = capture.request.applicationIdHeader;
  elements.requestCredentialFingerprint.value = capture.request.credentialFingerprint;
  elements.requestCredentialByteLength.value = String(capture.request.credentialByteLength);
  elements.requestBody.value = capture.request.bodyText;
  elements.responseStatus.value = String(capture.response.status);
  elements.responseContentType.value = capture.response.contentType;
  elements.responseFinalUrl.value = capture.response.finalUrl;
  elements.responseBody.value = capture.response.bodyText;
}

function setCaptureReadOnly(readOnly) {
  for (const field of captureFields) field.readOnly = readOnly;
}

function setMode(mode) {
  currentMode = mode;
  const recorded = mode === "recorded";
  document.body.classList.toggle("is-recorded-mode", recorded);
  elements.userMode.classList.toggle("is-active", !recorded);
  elements.userMode.setAttribute("aria-selected", String(!recorded));
  elements.recordedMode.classList.toggle("is-active", recorded);
  elements.recordedMode.setAttribute("aria-selected", String(recorded));
  elements.recordedControls.hidden = !recorded;
  elements.captureModeChip.textContent = recorded ? "Frozen recorded evidence" : "User evidence";
  setCaptureReadOnly(recorded);
  elements.evaluateButton.hidden = recorded;
  elements.resetButton.textContent = recorded ? "Clear and return to your evidence" : "Reset and clear evidence";
  if (recorded) {
    void loadRecorded(currentRecorded);
  } else {
    resetAll();
    elements.applicationId.focus();
  }
}

function resetPremise() {
  for (const field of premiseFields) {
    field.value = "";
    field.disabled = true;
  }
  elements.premiseProfile.disabled = true;
  elements.verifyPremise.disabled = true;
  elements.premiseResult.className = "premise-result is-empty";
  elements.premiseResult.replaceChildren();
  const strong = document.createElement("strong");
  strong.textContent = "PREMISE GATE NOT RUN";
  const span = document.createElement("span");
  span.textContent = "Import and revalidate a portable evidence package first.";
  elements.premiseResult.append(strong, span);
}

function renderPackageStatus(status, detail) {
  elements.packageResult.className = `package-result ${status === "VALID" ? "is-valid" : status === "BLOCK" ? "is-block" : "is-empty"}`;
  elements.packageResult.replaceChildren();
  const label = document.createElement("span");
  label.className = "result-label";
  label.textContent = "Package validation";
  const strong = document.createElement("strong");
  strong.textContent = status;
  const span = document.createElement("span");
  span.textContent = detail;
  elements.packageResult.append(label, strong, span);
}

function resetImportedEvidence({ clearJson = true } = {}) {
  currentImportedEvidence = undefined;
  if (clearJson) {
    elements.importJson.value = "";
    elements.importApplication.value = "";
    elements.importFingerprint.value = "";
    elements.importByteLength.value = "";
  }
  renderPackageStatus("NOT RUN", "Parse and receiver reconstruction have not run.");
  resetPremise();
}

function renderInitial() {
  elements.verdictChip.className = "verdict-chip is-empty";
  elements.verdictChip.textContent = "Not evaluated";
  elements.verdictLive.className = "verdict-summary";
  elements.verdictLive.replaceChildren();
  const display = document.createElement("p");
  display.className = "verdict-display";
  display.textContent = "Awaiting evidence";
  const detail = document.createElement("p");
  detail.textContent = "Supply an application-level Algolia capture, or load the frozen recorded experiment.";
  elements.verdictLive.append(display, detail);
  elements.diagnostics.replaceChildren();
  const empty = document.createElement("p");
  empty.className = "empty-state";
  empty.textContent = "Checks will appear here in the same fail-closed path used for the verdict.";
  elements.diagnostics.append(empty);
  elements.diagnosticCount.textContent = "0 checks";
  elements.supportedProposition.textContent = "No bounded negative proposition has been issued.";
  elements.portableJson.textContent = "No portable evidence issued.";
  elements.warrantJson.textContent = "No warrant issued.";
  elements.copyPortable.disabled = true;
  elements.downloadPortable.disabled = true;
  elements.copyWarrant.disabled = true;
  elements.downloadWarrant.disabled = true;
  elements.downloadReport.disabled = true;
  elements.artifactStatus.textContent = "";
  resetImportedEvidence();
}

function resetAll() {
  currentResult = undefined;
  currentCapture = undefined;
  currentPortablePackage = undefined;
  elements.form.reset();
  elements.requestMethod.value = "POST";
  setCaptureReadOnly(false);
  renderInitial();
}

function diagnosticSymbol(state) {
  if (state === "SATISFIED") return "✓";
  if (state === "BLOCKED") return "×";
  return "?";
}

function renderDiagnostics(diagnostics) {
  const groups = new Map();
  for (const diagnostic of diagnostics) {
    const category = diagnostic.category ?? "Profile";
    const items = groups.get(category) ?? [];
    items.push(diagnostic);
    groups.set(category, items);
  }
  elements.diagnostics.replaceChildren();
  for (const [category, items] of groups) {
    const section = document.createElement("section");
    section.className = "diagnostic-group";
    const heading = document.createElement("h4");
    heading.textContent = category;
    section.append(heading);
    for (const item of items) {
      const row = document.createElement("div");
      row.className = `diagnostic-row is-${item.state.toLowerCase()}`;
      const symbol = document.createElement("span");
      symbol.className = "diagnostic-symbol";
      symbol.setAttribute("aria-label", item.state);
      symbol.textContent = diagnosticSymbol(item.state);
      const copy = document.createElement("div");
      const label = document.createElement("strong");
      label.textContent = item.label ?? item.id;
      const detail = document.createElement("p");
      detail.textContent = item.detail ?? item.reasonCode;
      copy.append(label, detail);
      row.append(symbol, copy);
      section.append(row);
    }
    elements.diagnostics.append(section);
  }
  const failed = diagnostics.filter((item) => item.state !== "SATISFIED").length;
  elements.diagnosticCount.textContent = `${diagnostics.length} checks · ${failed} unresolved`;
}

function verdictCopy(result) {
  if (result.verdict === "INVALID") return {
    className: "is-invalid",
    chip: "Invalid input",
    display: "INPUT REJECTED",
    detail: "The supplied capture did not pass the canonical HTTP normalization boundary. Nothing was evaluated or warranted.",
  };
  if (result.verdict === "PRESENT") return {
    className: "is-present",
    chip: "Present",
    display: "PRESENT",
    detail: "The observation reports one or more matches. No negative premise is available.",
  };
  if (result.verdict === "UNKNOWN") {
    const recordedDetail = currentMode === "recorded" && currentRecorded === "ordinary"
      ? "Ordinary observation Q reports zero, but lacks the explicit effective-index witness required by this profile. The downstream premise remains blocked."
      : "The observation is accepted but does not satisfy every support obligation and clear every recognized defeater. The downstream premise remains blocked.";
    return {
      className: "is-unknown",
      chip: "Insufficient evidence",
      display: "UNKNOWN",
      detail: recordedDetail,
    };
  }
  const recordedDetail = currentMode === "recorded" && currentRecorded === "verification"
    ? "Separate verification observation Q′ supplies the source-reported scope witness and exactness metadata. Its exact proposition survives receiver validation."
    : "For the supplied capture and this experimental profile, every issuance obligation is satisfied and the exact bounded proposition survives local receiver validation.";
  return {
    className: "is-warranted",
    chip: "Bounded proposition supported",
    display: "WARRANTED_ZERO",
    detail: recordedDetail,
  };
}

function populatePremise(portableEvidence) {
  const outer = portableEvidence?.canonical?.realSourceEvidence;
  const enabled = hasPortableEvidenceValidationMark(portableEvidence)
    && hasAlgoliaRealSourceValidationMark(outer)
    && hasReceiverValidationMark(outer?.boundEvidence);
  for (const field of premiseFields) field.disabled = !enabled;
  elements.premiseProfile.disabled = !enabled;
  elements.verifyPremise.disabled = !enabled;
  if (!enabled) {
    resetPremise();
    return;
  }
  const proposition = outer.boundEvidence.proposition;
  elements.premiseApplication.value = outer.sourceInstance.applicationId;
  elements.premiseProfile.value = `${proposition.profile.id}@${proposition.profile.version}`;
  elements.premiseScope.value = proposition.sourceScopeIdentity;
  elements.premisePredicate.value = proposition.matchPredicateIdentity;
  elements.premiseAuthority.value = proposition.authorityContextId;
  elements.premiseResult.className = "premise-result is-empty";
  elements.premiseResult.replaceChildren();
  const strong = document.createElement("strong");
  strong.textContent = "Ready for exact comparison.";
  const span = document.createElement("span");
  span.textContent = "The fields are prefilled from the receiver-validated evidence and remain editable.";
  elements.premiseResult.append(strong, span);
}

function renderResult(result) {
  currentResult = result;
  const copy = verdictCopy(result);
  elements.verdictChip.className = `verdict-chip ${copy.className}`;
  elements.verdictChip.textContent = copy.chip;
  elements.verdictLive.className = `verdict-summary ${copy.className}`;
  elements.verdictLive.replaceChildren();
  const display = document.createElement("p");
  display.className = "verdict-display";
  display.textContent = copy.display;
  const detail = document.createElement("p");
  detail.textContent = copy.detail;
  elements.verdictLive.append(display, detail);
  renderDiagnostics(result.diagnostics);
  elements.supportedProposition.textContent = humanizeProposition(result);
  currentPortablePackage = createPortableEvidencePackage(result, currentCapture, {
    captureProvenance: currentMode === "recorded" ? "vendored-recorded" : "user-supplied",
  });
  elements.portableJson.textContent = currentPortablePackage === undefined
    ? "No portable evidence issued.\n\nA package exists only for a warranted observation with canonical outer evidence."
    : JSON.stringify(currentPortablePackage, null, 2);
  elements.warrantJson.textContent = result.warrant === undefined
    ? "No warrant issued.\n\nThe inspection report remains available with fail-closed diagnostics."
    : JSON.stringify(result.warrant, null, 2);
  const warranted = currentPortablePackage !== undefined;
  elements.copyPortable.disabled = !warranted;
  elements.downloadPortable.disabled = !warranted;
  elements.copyWarrant.disabled = !warranted;
  elements.downloadWarrant.disabled = !warranted;
  elements.downloadReport.disabled = false;
  elements.artifactStatus.textContent = "";
  resetImportedEvidence();
  if (currentPortablePackage !== undefined) {
    elements.importJson.value = `${JSON.stringify(currentPortablePackage, null, 2)}\n`;
    elements.importApplication.value = currentCapture.applicationId;
    elements.importFingerprint.value = currentCapture.credentialFingerprint;
    elements.importByteLength.value = String(currentCapture.request.credentialByteLength);
    renderPackageStatus("NOT RUN", "A fresh serialized package is ready. Parse and revalidate it to unlock the premise gate.");
  }
}

async function evaluate(capture, options = {}) {
  currentCapture = capture;
  elements.evaluateButton.disabled = true;
  elements.evaluateButton.textContent = "Evaluating locally…";
  try {
    const result = await inspectCapture(capture, options);
    renderResult(result);
  } catch {
    renderResult({
      inputStatus: "INVALID",
      verdict: "INVALID",
      reasonCodes: ["LOCAL_EVALUATOR_FAILURE"],
      diagnostics: [{
        id: "LOCAL_EVALUATOR",
        category: "Local evaluator",
        label: "Evaluation completed",
        state: "BLOCKED",
        reasonCode: "LOCAL_EVALUATOR_FAILURE",
        detail: "The browser could not complete the local evaluation. No warrant was issued.",
      }],
    });
  } finally {
    elements.evaluateButton.disabled = currentMode === "recorded";
    elements.evaluateButton.textContent = "Evaluate supplied capture";
  }
}

async function loadRecorded(which) {
  currentRecorded = which;
  const entry = recordedObservations[which];
  elements.loadQ.classList.toggle("is-active", which === "ordinary");
  elements.loadQ.setAttribute("aria-pressed", String(which === "ordinary"));
  elements.loadQPrime.classList.toggle("is-active", which === "verification");
  elements.loadQPrime.setAttribute("aria-pressed", String(which === "verification"));
  fillCapture(entry.capture);
  const options = which === "verification"
    ? { originalCapture: recordedObservations.ordinary.capture }
    : {};
  await evaluate(entry.capture, options);
}

async function copyText(text) {
  if (navigator.clipboard?.writeText !== undefined) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.className = "visually-hidden";
  document.body.append(helper);
  helper.select();
  const copied = document.execCommand("copy");
  helper.remove();
  if (!copied) throw new Error("Clipboard unavailable");
}

function safeFilename(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/gu, "-").replace(/^-+|-+$/gu, "").slice(0, 80) || "inspection";
}

function downloadJson(filename, value) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  void evaluate(captureFromForm());
});

elements.userMode.addEventListener("click", () => setMode("user"));
elements.recordedMode.addEventListener("click", () => setMode("recorded"));
elements.loadQ.addEventListener("click", () => { void loadRecorded("ordinary"); });
elements.loadQPrime.addEventListener("click", () => { void loadRecorded("verification"); });
elements.resetButton.addEventListener("click", () => {
  if (currentMode === "recorded") {
    setMode("user");
  } else {
    resetAll();
    elements.applicationId.focus();
  }
});

elements.copyPortable.addEventListener("click", async () => {
  if (currentPortablePackage === undefined) return;
  try {
    await copyText(`${JSON.stringify(currentPortablePackage, null, 2)}\n`);
    elements.artifactStatus.textContent = "Portable evidence copied. Serialized JSON carries no receiver-validation mark.";
  } catch {
    elements.artifactStatus.textContent = "Clipboard access failed. Select the portable JSON above and copy it manually.";
  }
});

elements.downloadPortable.addEventListener("click", () => {
  if (currentPortablePackage === undefined) return;
  try {
    const observation = currentResult?.warrant?.observationBinding?.observationId ?? "evidence";
    downloadJson(`negative-result-portable-evidence-${safeFilename(observation)}.json`, currentPortablePackage);
    elements.artifactStatus.textContent = "Portable evidence download prepared locally.";
  } catch {
    elements.artifactStatus.textContent = "The browser could not prepare the portable evidence download.";
  }
});

elements.copyWarrant.addEventListener("click", async () => {
  if (currentResult?.warrant === undefined) return;
  try {
    await copyText(JSON.stringify(currentResult.warrant, null, 2));
    elements.artifactStatus.textContent = "Canonical warrant JSON copied.";
  } catch {
    elements.artifactStatus.textContent = "Clipboard access failed. Select the JSON above and copy it manually.";
  }
});

elements.downloadWarrant.addEventListener("click", () => {
  if (currentResult?.warrant === undefined) return;
  try {
    const id = safeFilename(currentResult.warrant.observationBinding.observationId);
    downloadJson(`negative-result-warrant-${id}.json`, currentResult.warrant);
    elements.artifactStatus.textContent = "Canonical warrant download prepared locally.";
  } catch {
    elements.artifactStatus.textContent = "The browser could not prepare the download.";
  }
});

elements.downloadReport.addEventListener("click", () => {
  if (currentResult === undefined) return;
  try {
    const report = createInspectionReport(currentResult);
    const observation = currentResult.warrant?.observationBinding?.observationId ?? "nonwarranted";
    downloadJson(`negative-result-inspection-${safeFilename(observation)}.json`, report);
    elements.artifactStatus.textContent = "Inspection report prepared without raw request or response text.";
  } catch {
    elements.artifactStatus.textContent = "The browser could not prepare the inspection report.";
  }
});

elements.importForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  currentImportedEvidence = undefined;
  resetPremise();
  elements.revalidatePackage.disabled = true;
  elements.revalidatePackage.textContent = "Revalidating locally…";
  try {
    const parsed = JSON.parse(elements.importJson.value);
    const parsedOuter = parsed?.canonical?.realSourceEvidence;
    const parsedInner = parsedOuter?.boundEvidence;
    const privilegeAbsent = !hasPortableEvidenceValidationMark(parsed)
      && !hasAlgoliaRealSourceValidationMark(parsedOuter)
      && !hasReceiverValidationMark(parsedInner);
    if (!privilegeAbsent) throw new Error("Serialized input unexpectedly retained validation identity");
    const decoded = await decodePortableEvidence(parsed, {
      applicationId: elements.importApplication.value,
      credentialFingerprint: elements.importFingerprint.value,
      credentialByteLength: elements.importByteLength.value === ""
        ? Number.NaN
        : Number(elements.importByteLength.value),
    });
    if (decoded === undefined) {
      renderPackageStatus("BLOCK", "Schema, version, receiver context, canonical structure, or one of the reproduced bindings failed closed.");
      return;
    }
    currentImportedEvidence = decoded;
    renderPackageStatus("VALID", "Parsed JSON had no validation privilege. A new receiver-validated root was reconstructed and all transported bindings were reproduced.");
    populatePremise(decoded);
  } catch {
    renderPackageStatus("BLOCK", "The pasted value is not valid JSON or could not pass fail-closed receiver reconstruction.");
  } finally {
    elements.revalidatePackage.disabled = false;
    elements.revalidatePackage.textContent = "Parse and revalidate";
  }
});

elements.clearImport.addEventListener("click", () => {
  resetImportedEvidence();
  elements.importJson.focus();
});

for (const field of [
  elements.importJson,
  elements.importApplication,
  elements.importFingerprint,
  elements.importByteLength,
]) field.addEventListener("input", () => {
  if (currentImportedEvidence === undefined) return;
  currentImportedEvidence = undefined;
  renderPackageStatus("NOT RUN", "Imported JSON or receiver context changed. Revalidation is required again.");
  resetPremise();
});

elements.premiseForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!hasPortableEvidenceValidationMark(currentImportedEvidence)) return;
  const comparison = verifyPortablePremise(currentImportedEvidence, {
    applicationId: elements.premiseApplication.value,
    profileId: "algolia-search",
    profileVersion: "0.2.1",
    proposition: {
      sourceScopeIdentity: elements.premiseScope.value,
      matchPredicateIdentity: elements.premisePredicate.value,
      authorityContextId: elements.premiseAuthority.value,
    },
  });
  elements.premiseResult.className = `premise-result ${comparison.verdict === "MATCH" ? "is-match" : "is-block"}`;
  elements.premiseResult.replaceChildren();
  const strong = document.createElement("strong");
  strong.textContent = comparison.verdict;
  const span = document.createElement("span");
  span.textContent = comparison.verdict === "MATCH"
    ? "This intended premise is supported by the receiver-validated warrant."
    : "The intended premise differs from or exceeds the warranted proposition.";
  elements.premiseResult.append(strong, span);
  if (comparison.differences.length > 0) {
    const list = document.createElement("ul");
    list.className = "premise-differences";
    for (const difference of comparison.differences) {
      const item = document.createElement("li");
      item.textContent = `${difference.field}: expected ${String(difference.expected)}, received ${String(difference.received)}`;
      list.append(item);
    }
    elements.premiseResult.append(list);
  }
});

renderInitial();
