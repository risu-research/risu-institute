import { EVIDENCE, SCENARIOS, canonicalJson, clone, sha256Hex } from "./core.js";
import { buildEvidenceCertificate } from "./producer.js";
import { verifyEvidenceCertificate } from "./verifier.js";

const el = id => document.getElementById(id);
let currentKey = "supported";
let currentCertificate = null;
let currentVerification = null;
let boundText = "";

function scenarioPresentation(key, certificate) {
  const d = certificate.payload.decision;
  if (d.verdict === "VERIFIED") {
    return {
      state: "verified",
      title: "Current claim is supported.",
      summary: "The exact-count claim matches the retained in-scope evidence.",
      human: "No mandatory intervention is required for this bounded demonstration."
    };
  }
  if (d.reason === "UNIVERSAL_CLAIM_CONFLICT") {
    return {
      state: "review",
      title: "The stronger revision conflicts with retained evidence.",
      summary: "The citation set is unchanged, but one in-scope study does not support the universal wording.",
      human: "Narrow the quantifier or justify a different evidence set."
    };
  }
  return {
    state: "blocked",
    title: "The evidence set does not cover the revised scope.",
    summary: "The claim moved to a horizon absent from the retained evidence, so the workflow cannot finalize it.",
    human: "Retrieve evidence for the new horizon or narrow the manuscript claim."
  };
}

function quantifierText(q) {
  return q.kind === "all" ? `all ${q.total}` : `exactly ${q.supports} of ${q.total}`;
}

function relationLabel(relation) {
  return {
    SUPPORTS: "SUPPORTS",
    REPRESENTED_NULL: "REPRESENTED NULL",
    CONTRADICTS: "CONTRADICTS",
    OUT_OF_SCOPE: "OUT OF SCOPE"
  }[relation] || relation;
}

async function renderEvidence(certificate) {
  const grid = el("evidence-grid");
  grid.innerHTML = "";
  for (const src of EVIDENCE) {
    const recorded = certificate.payload.evidence.sources.find(x => x.id === src.id);
    const relationClass = recorded.relation === "SUPPORTS" ? "supports" :
      recorded.relation === "OUT_OF_SCOPE" ? "out" : "warn";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><span class="source-id">SOURCE ${src.id}</span><span class="source-title">${src.title}</span></td>
      <td><span class="source-excerpt">“${src.excerpt}”</span></td>
      <td><span class="source-scope"><span>${src.population}</span><span>${src.horizon}</span><span>${src.outcome}</span></span></td>
      <td><span class="evw-relation ${relationClass}">${relationLabel(recorded.relation)}</span></td>
      <td><span class="evw-binding-hash">${recorded.excerpt_sha256.slice(0,16)}…</span></td>`;
    grid.appendChild(row);
  }
}

function renderVerifier(verification) {
  el("independent-panel").dataset.state = verification.accepted ? "pass" : "fail";
  el("independent-status").textContent = verification.accepted ? "PASS" : "REJECT";
  el("independent-summary").textContent = verification.accepted
    ? "Certificate bytes, evidence bindings and semantic decision independently reproduced."
    : "One or more independent checks failed. The certificate is not accepted.";
  el("verifier-checks").innerHTML = verification.checks.map(c =>
    `<div class="evw-proof-check"><span>${c.name}</span><b class="${c.pass ? "pass" : "fail"}">${c.pass ? "PASS" : "FAIL"}</b><small>${c.detail}</small></div>`
  ).join("");
}

function renderTrace(key) {
  const rows = {
    supported: [
      ["v1","Bound","Exact wording and structured claim contract are bound to A, B and C."],
      ["Producer","Issued","The producer records scope, counts, verdict and content digests."],
      ["Checker","Accepted","A separate implementation recomputes the decision from supplied evidence."]
    ],
    overstated: [
      ["v1","Previously supportable","The earlier exact-count claim matched two positive results."],
      ["v2","Quantifier strengthened","The sentence now claims all three studies support improvement."],
      ["Checker","Review","One in-scope null result prevents the universal claim from passing."]
    ],
    unsupported: [
      ["v1","Previously supportable","The earlier contract covered short-term outcomes."],
      ["v3","Scope moved","The revised contract asks about long-term outcomes."],
      ["Checker","Block","No retained source is in scope for that horizon."]
    ]
  }[key];
  el("revision-trace").innerHTML = rows.map(([step,status,desc]) =>
    `<div class="evw-history-step"><span>${step}</span><strong>${status}</strong><p>${desc}</p></div>`
  ).join("");
}

async function issueScenario(key) {
  currentKey = key;
  const s = SCENARIOS[key];
  document.querySelectorAll(".evw-scenario").forEach(btn => btn.classList.toggle("active", btn.dataset.scenario === key));
  el("claim-text").value = s.text;
  el("claim-version").textContent = s.version;
  el("bound-version").textContent = s.version;
  el("binding-state").textContent = "CURRENT";
  boundText = s.text;

  el("contract-population").textContent = s.semantics.population;
  el("contract-outcome").textContent = s.semantics.outcome;
  el("contract-horizon").textContent = s.semantics.horizon;
  el("contract-quantifier").textContent = quantifierText(s.semantics.quantifier);
  el("contract-mode").textContent = s.semantics.quantifier.kind === "all" ? "UNIVERSAL" : "EXACT COUNT";

  currentCertificate = await buildEvidenceCertificate({
    claimId: "claim-4.2",
    version: s.version,
    text: s.text,
    semantics: s.semantics,
    evidence: EVIDENCE
  });

  currentVerification = await verifyEvidenceCertificate({
    certificate: currentCertificate,
    claimId: "claim-4.2",
    version: s.version,
    text: s.text,
    semantics: s.semantics,
    evidence: EVIDENCE
  });

  const p = scenarioPresentation(key, currentCertificate);
  el("verdict-status").dataset.state = p.state;
  el("verdict-label").textContent = currentCertificate.payload.decision.verdict;
  el("verdict-title").textContent = p.title;
  el("verdict-summary").textContent = p.summary;
  el("workflow-action").textContent = currentCertificate.payload.decision.workflow_action;
  el("human-action").textContent = p.human;

  el("certificate-hash").textContent = currentCertificate.certificate_sha256.slice(0,20) + "…";
  el("claim-hash").textContent = currentCertificate.payload.claim.text_sha256.slice(0,20) + "…";
  el("evidence-hash").textContent = currentCertificate.payload.evidence.set_sha256.slice(0,20) + "…";
  el("certificate-json").textContent = JSON.stringify(currentCertificate,null,2);

  renderVerifier(currentVerification);
  renderTrace(key);
  await renderEvidence(currentCertificate);
  el("mutation-results").innerHTML = '<tr><td colspan="4" class="evw-empty-row">Run the integrity test against the loaded certificate.</td></tr>';
}

async function recheckCurrent() {
  const s = SCENARIOS[currentKey];
  const text = el("claim-text").value.trim();
  const verification = await verifyEvidenceCertificate({
    certificate: currentCertificate,
    claimId: "claim-4.2",
    version: s.version,
    text,
    semantics: s.semantics,
    evidence: EVIDENCE
  });
  el("binding-state").textContent = text === boundText ? "CURRENT" : "STALE";
  renderVerifier(verification);
}

async function reseal(payload) {
  return {
    payload,
    certificate_sha256: await sha256Hex(canonicalJson(payload))
  };
}

async function runMutations() {
  const s = SCENARIOS[currentKey];
  const attacks = [];

  const verdictFlipPayload = clone(currentCertificate.payload);
  verdictFlipPayload.decision = {
    verdict: "VERIFIED",
    workflow_action: "RETAIN_CLAIM",
    reason: "CLAIM_SUPPORTED"
  };
  if (currentCertificate.payload.decision.verdict === "VERIFIED") {
    verdictFlipPayload.decision = {
      verdict: "BLOCKED",
      workflow_action: "BLOCK_FINALIZATION",
      reason: "SCOPE_COVERAGE_GAP"
    };
  }
  const verdictFlip = await reseal(verdictFlipPayload);
  attacks.push({
    name: "Rehashed verdict flip",
    detail: "Decision fields changed and outer hash recomputed.",
    certificate: verdictFlip,
    text: s.text,
    semantics: s.semantics,
    evidence: EVIDENCE
  });

  attacks.push({
    name: "Post-certificate claim edit",
    detail: "Manuscript wording changed after certification.",
    certificate: currentCertificate,
    text: s.text + " This sentence was changed after certification.",
    semantics: s.semantics,
    evidence: EVIDENCE
  });

  const changedEvidence = clone(EVIDENCE);
  changedEvidence[0].excerpt += " Altered after binding.";
  attacks.push({
    name: "Evidence-span mutation",
    detail: "One retained excerpt changed after its digest was bound.",
    certificate: currentCertificate,
    text: s.text,
    semantics: s.semantics,
    evidence: changedEvidence
  });

  attacks.push({
    name: "Evidence omission",
    detail: "One cited source is removed from the supplied evidence set.",
    certificate: currentCertificate,
    text: s.text,
    semantics: s.semantics,
    evidence: EVIDENCE.slice(0,2)
  });

  const results = [];
  for (const attack of attacks) {
    const v = await verifyEvidenceCertificate({
      certificate: attack.certificate,
      claimId: "claim-4.2",
      version: s.version,
      text: attack.text,
      semantics: attack.semantics,
      evidence: attack.evidence
    });
    results.push({...attack, verification:v});
  }

  el("mutation-results").innerHTML = results.map(r => {
    const rejected = !r.verification.accepted;
    const failed = r.verification.checks.filter(c => !c.pass).map(c => c.name).join(", ");
    return `<tr><td><strong>${r.name}</strong></td><td>${r.detail}</td><td><span class="evw-mutation-result ${rejected ? "pass" : "fail"}">${rejected ? "REJECTED" : "ESCAPED"}</span></td><td>${rejected ? failed : "No independent check rejected it."}</td></tr>`;
  }).join("");
}

async function exportRecord() {
  const s = SCENARIOS[currentKey];
  const record = {
    schema: "evw-proof-carrying-record/0.2",
    prototype_boundary: "Illustrative evidence; deterministic claim contracts; separate producer and independent browser checker; no live search or model inference.",
    claim_text: el("claim-text").value.trim(),
    claim_semantics: s.semantics,
    evidence: EVIDENCE,
    certificate: currentCertificate,
    independent_verification: currentVerification
  };
  const blob = new Blob([JSON.stringify(record,null,2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "evidence-verified-writing-proof-record.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
}

document.querySelectorAll(".evw-scenario").forEach(btn => btn.addEventListener("click", () => issueScenario(btn.dataset.scenario)));
el("claim-text").addEventListener("input", () => {
  if (el("claim-text").value.trim() !== boundText) el("binding-state").textContent = "STALE";
});
el("verify-claim").addEventListener("click", recheckCurrent);
el("run-mutations").addEventListener("click", runMutations);
el("download-receipt").addEventListener("click", exportRecord);

issueScenario("supported");
