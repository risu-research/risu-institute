import { canonicalJson, semanticScopeMatch, sha256Hex } from "./core.js";

export async function buildEvidenceCertificate({ claimId, version, text, semantics, evidence }) {
  const sourceRecords = [];
  let supports = 0;
  let nulls = 0;
  let negatives = 0;
  let inScope = 0;

  for (const source of evidence) {
    const scopeMatch = semanticScopeMatch(source, semantics);
    let relation = "OUT_OF_SCOPE";
    if (scopeMatch) {
      inScope += 1;
      if (source.direction === "positive") {
        supports += 1;
        relation = "SUPPORTS";
      } else if (source.direction === "negative") {
        negatives += 1;
        relation = "CONTRADICTS";
      } else {
        nulls += 1;
        relation = "REPRESENTED_NULL";
      }
    }

    sourceRecords.push({
      id: source.id,
      relation,
      excerpt_sha256: await sha256Hex(source.excerpt),
      scope: {
        population: source.population,
        horizon: source.horizon,
        outcome: source.outcome
      }
    });
  }

  const expectedTotal = semantics.quantifier.total;
  const coveragePass = inScope === expectedTotal;
  let quantifierPass = false;
  if (coveragePass && semantics.quantifier.kind === "exact-count") {
    quantifierPass = supports === semantics.quantifier.supports;
  } else if (coveragePass && semantics.quantifier.kind === "all") {
    quantifierPass = supports === expectedTotal;
  }

  let verdict = "REVIEW_REQUIRED";
  let workflowAction = "HUMAN_REVIEW";
  let reason = "QUANTIFIER_MISMATCH";

  if (!coveragePass) {
    verdict = "BLOCKED";
    workflowAction = "BLOCK_FINALIZATION";
    reason = "SCOPE_COVERAGE_GAP";
  } else if (quantifierPass) {
    verdict = "VERIFIED";
    workflowAction = "RETAIN_CLAIM";
    reason = "CLAIM_SUPPORTED";
  } else if (semantics.quantifier.kind === "all" && (nulls + negatives) > 0) {
    reason = "UNIVERSAL_CLAIM_CONFLICT";
  }

  const evidenceIdentity = sourceRecords.map(r => ({
    id: r.id,
    excerpt_sha256: r.excerpt_sha256,
    scope: r.scope
  }));

  const payload = {
    schema: "evw-evidence-certificate/0.2",
    producer: "evw-browser-producer/0.2",
    claim: {
      id: claimId,
      version,
      text_sha256: await sha256Hex(text),
      semantics,
      semantics_sha256: await sha256Hex(semantics)
    },
    evidence: {
      source_count: evidence.length,
      set_sha256: await sha256Hex(evidenceIdentity),
      sources: sourceRecords
    },
    analysis: {
      in_scope: inScope,
      supports,
      nulls,
      negatives,
      coverage_pass: coveragePass,
      quantifier_pass: quantifierPass
    },
    decision: {
      verdict,
      workflow_action: workflowAction,
      reason
    }
  };

  return {
    payload,
    certificate_sha256: await sha256Hex(canonicalJson(payload))
  };
}
