import { canonicalJson, semanticScopeMatch, sha256Hex } from "./core.js";

function verifierDecision(semantics, counts) {
  const q = semantics.quantifier;
  if (counts.inScope !== q.total) {
    return { verdict: "BLOCKED", action: "BLOCK_FINALIZATION", reason: "SCOPE_COVERAGE_GAP" };
  }

  if (q.kind === "exact-count") {
    if (counts.supports === q.supports) {
      return { verdict: "VERIFIED", action: "RETAIN_CLAIM", reason: "CLAIM_SUPPORTED" };
    }
    return { verdict: "REVIEW_REQUIRED", action: "HUMAN_REVIEW", reason: "QUANTIFIER_MISMATCH" };
  }

  if (q.kind === "all") {
    if (counts.supports === q.total) {
      return { verdict: "VERIFIED", action: "RETAIN_CLAIM", reason: "CLAIM_SUPPORTED" };
    }
    if ((counts.nulls + counts.negatives) > 0) {
      return { verdict: "REVIEW_REQUIRED", action: "HUMAN_REVIEW", reason: "UNIVERSAL_CLAIM_CONFLICT" };
    }
  }

  return { verdict: "REVIEW_REQUIRED", action: "HUMAN_REVIEW", reason: "UNRECOGNIZED_CLAIM_CONTRACT" };
}

export async function verifyEvidenceCertificate({ certificate, claimId, version, text, semantics, evidence }) {
  const checks = [];
  const add = (name, pass, detail) => checks.push({ name, pass, detail });

  const certificateDigest = await sha256Hex(canonicalJson(certificate.payload));
  add("Certificate payload digest", certificateDigest === certificate.certificate_sha256, certificateDigest);

  add("Claim identity", certificate.payload.claim.id === claimId, certificate.payload.claim.id);
  add("Claim version", certificate.payload.claim.version === version, certificate.payload.claim.version);

  const textDigest = await sha256Hex(text);
  add("Exact manuscript wording", certificate.payload.claim.text_sha256 === textDigest, textDigest);

  const semanticsDigest = await sha256Hex(semantics);
  add("Structured claim semantics", certificate.payload.claim.semantics_sha256 === semanticsDigest, semanticsDigest);

  const evidenceIdentity = [];
  let inScope = 0;
  let supports = 0;
  let nulls = 0;
  let negatives = 0;
  let sourceHashesPass = certificate.payload.evidence.sources.length === evidence.length;

  for (const source of evidence) {
    const digest = await sha256Hex(source.excerpt);
    evidenceIdentity.push({
      id: source.id,
      excerpt_sha256: digest,
      scope: {
        population: source.population,
        horizon: source.horizon,
        outcome: source.outcome
      }
    });

    const recorded = certificate.payload.evidence.sources.find(x => x.id === source.id);
    if (!recorded || recorded.excerpt_sha256 !== digest) sourceHashesPass = false;

    if (semanticScopeMatch(source, semantics)) {
      inScope += 1;
      if (source.direction === "positive") supports += 1;
      else if (source.direction === "negative") negatives += 1;
      else nulls += 1;
    }
  }

  add("Per-source evidence bindings", sourceHashesPass, sourceHashesPass ? "all source hashes match" : "source hash or membership mismatch");

  const evidenceSetDigest = await sha256Hex(evidenceIdentity);
  add("Evidence-set identity", certificate.payload.evidence.set_sha256 === evidenceSetDigest, evidenceSetDigest);

  const recomputed = verifierDecision(semantics, { inScope, supports, nulls, negatives });
  const decisionMatches =
    certificate.payload.decision.verdict === recomputed.verdict &&
    certificate.payload.decision.workflow_action === recomputed.action &&
    certificate.payload.decision.reason === recomputed.reason;

  add("Independent semantic decision", decisionMatches, `${recomputed.verdict} · ${recomputed.reason}`);

  const countsMatch =
    certificate.payload.analysis.in_scope === inScope &&
    certificate.payload.analysis.supports === supports &&
    certificate.payload.analysis.nulls === nulls &&
    certificate.payload.analysis.negatives === negatives;
  add("Independent evidence counts", countsMatch, `scope=${inScope}, support=${supports}, null=${nulls}, negative=${negatives}`);

  return {
    accepted: checks.every(c => c.pass),
    verifier: "evw-independent-browser-checker/0.2",
    checks,
    recomputed
  };
}
