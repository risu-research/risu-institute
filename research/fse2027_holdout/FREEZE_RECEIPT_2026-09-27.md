# FSE 2027 Cross-Ecosystem Holdout — Freeze Receipt

Frozen before inspecting candidate histories/diffs or verifier outcomes for this holdout.
Date: 2026-09-27 UTC.

## Separation rule
This holdout is a separate evidence stratum from the completed Dafny denominator, Dafny historical cases, blinded Dafny challenges, and Dafny version-sensitivity work. No Dafny candidate/result may be used to choose, exclude, reorder, or reinterpret a Verus/F* holdout candidate. Verus and F* are also reported as separate strata; they are not pooled into a prevalence estimate.

## Fixed repository frame and order
### Verus stratum
V1. verus-lang/verified-memory-allocator
V2. verus-lang/verified-ironkv
V3. verus-lang/verus

### F* stratum
F1. hacl-star/hacl-star
F2. project-everest/mitls-fstar
F3. FStarLang/FStar

These repositories were selected from repository-level metadata/canonical ecosystem status only, before reading candidate diffs or outcomes. The frame is a purposive cross-ecosystem holdout, not a representative population sample.

## Frozen discovery tokens
Verus source suffix: `.rs`.
Contract-side token regex: `\b(requires|ensures|invariant|decreases|recommends)\b`.

F* source suffixes: `.fst`, `.fsti`.
Contract-side token regex: `\b(requires|ensures|decreases)\b`.

For both strata, a discovery hit is a commit that changes at least one matching contract-token line. A structural candidate additionally changes at least one nonblank, non-comment, non-delimiter line in the same diff hunk. This is only a discovery diagnostic, never a semantic label.

## Frozen primary eligibility rule
A candidate is ELIGIBLE only if blind source review establishes all of the following without using verifier outcome:
1. one historical commit has a preserved parent and child revision;
2. within one source declaration (function/method or directly corresponding implementation unit), an executable implementation body changes;
3. the semantic contract/specification governing that same implementation unit changes in the same commit;
4. both dimensions are mechanically separable into old/new variants without inventing new semantics;
5. the source is not generated/vendor code, tutorial-only/example-only material, or a pure proof/ghost-only change;
6. the change is not only formatting, renaming, syntax migration, import churn, or verifier-proof stabilization with no executable semantic delta.

If (2)-(4) are plausible but not cleanly separable, classify ELIGIBLE_CONFOUNDED rather than forcing a 2x2 replay.

## Frozen adjudication order and stop rule
Within each repository, candidates are considered by commit date descending, then commit SHA lexicographically. Repositories are considered in the fixed order above.

For each ecosystem stratum, continue blind adjudication until either:
- two ELIGIBLE candidates have been identified and taken to replay, or
- ten ELIGIBLE / ELIGIBLE_CONFOUNDED candidates have been encountered, or
- the frozen repository frame is exhausted.

Infrastructure or dependency failure is recorded as ELIGIBLE_INFRA_BLOCKED and does not erase the candidate. Continue under the same stop rule. Matrix outcome is never a stopping criterion.

## Frozen replay rule
For every ELIGIBLE candidate selected by the rule above:
- preserve exact parent/head SHAs and hashes of historical source inputs;
- use one pinned verifier/toolchain version and identical flags for all four cells;
- B0S0 = old body + old contract/spec;
- B1S0 = new body + old contract/spec;
- B0S1 = old body + new contract/spec;
- B1S1 = new body + new contract/spec;
- historical endpoints must remain literal historical states where technically possible; cross-combinations are explicitly counterfactual isolation states;
- if unrelated commit changes prevent literal whole-tree endpoints, use one fixed historical tree as the background and exchange only the frozen declaration-level body/contract slices, documenting that design;
- preserve PASS, FAIL, timeout, parser error, dependency error, and verifier crash exactly as observed.

No matrix shape is required. P/P/F/P, P/F/F/P, F/F/F/P, all-P, all-F, or infrastructure failure are all retained.

## Claim boundary fixed before outcomes
The holdout tests whether the code-contract pairing phenomenon and the four-way causal replay method transport outside Dafny. It does NOT estimate prevalence, ecosystem frequency, bug rate, or representativeness. A zero-eligible or zero-replay result is still a valid holdout result and must be reported.
