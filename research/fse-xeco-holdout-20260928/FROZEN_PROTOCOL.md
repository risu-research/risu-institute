# Cross-Ecosystem Holdout Protocol — Frozen Before Outcome Inspection

Freeze ID: `XH1-20260928`
Date: 2026-09-28
Primary ecosystems: Verus and F*/Pulse
Primary purpose: prospective external holdout for historical implementation–contract co-evolution

## 1. Scope and non-security boundary

This is a software-evolution and formal-verification study over public source-control history. It does **not** search for vulnerabilities, exploit software, probe networks, access credentials/secrets, or exercise production services. Discovery reads public Git history and source diffs only. Replay, if later reached, is limited to building/verifying historical open-source revisions in isolated CI.

Any pre-freeze exploratory output, if any exists, is quarantined and is not eligible for the primary holdout analysis. The primary holdout begins at the final freeze commit containing this protocol, the pinned repository manifest, the frozen scanner, the adjudication template, and the freeze receipt. No candidate/verifier outcome from the frozen scanner may be inspected before that commit exists.

## 2. Research question

Does the historical reconstruction method developed on Dafny transfer to independent verification ecosystems when the repository frame, discovery rule, semantic taxonomy, pairability rule, and replay ladder are fixed before holdout outcomes are observed?

This is a bounded purposive holdout, **not** a random ecosystem sample and **not** an ecosystem-wide prevalence study.

## 3. Frozen repository frame

The six repositories, default branches, and immutable head SHAs are fixed in `FROZEN_REPOSITORIES.csv`. The frame contains three Verus repositories and three F*/Pulse repositories. Repository membership will not change after candidate outcomes are observed.

History window: commits reachable from the pinned head with committer date on or after `2024-01-01T00:00:00Z`.

Per-repository cap: at most **40 unique mechanical units** after within-repository raw-patch deduplication. The cap is a balanced workload bound, not a population estimator. If a repository yields fewer than 40 unique units, all are retained.

## 4. Frozen mechanical discovery rule

For each pinned repository:

1. Enumerate commits from the pinned head using Git `--date-order` and the ecosystem-specific contract-token regex over the recursive source globs in the manifest.
2. Ignore root commits. For every other commit, compare the commit with its **first parent**. Merge commits are permitted; their first-parent diff is the frozen interpretation.
3. Build an exact source-only patch with `git diff --no-ext-diff --unified=3 <parent> <commit> -- <frozen pathspecs>`.
4. A changed line is `contract` when, after stripping the leading `+` or `-`, it contains a frozen contract token. Blank lines, comments, and delimiter-only lines are not substantive. Any other nonblank, noncomment, nondelimiter changed line is `other`.
5. A commit enters the mechanical queue only when at least one diff hunk contains both a changed `contract` line and a changed `other` line.
6. Hash the raw patch bytes with SHA-256. Deduplicate **within repository** by `(repo, patch_sha256)`, retaining the first occurrence in frozen Git traversal order as the canonical unit and recording later aliases.
7. Retain the first 40 unique units for that repository, or all if fewer exist.

The same-hunk screen is deliberately only a high-recall-ish discovery device. It is not itself a semantic co-evolution label.

### Frozen discovery lexemes

Verus (`*.rs`, recursively): `requires`, `ensures`, `invariant`, `decreases`, `recommends`.

F*/Pulse (`*.fst`, `*.fsti`, recursively): `requires`, `ensures`, `decreases`.

Tokens such as loop invariants, decreases clauses, proof assertions, or recommendations can trigger discovery but do **not** automatically count as a behavioral contract in semantic adjudication.

## 5. Blind packet and provenance separation

The scanner emits two logically separate views:

- `blind/`: patch packets with repository, commit SHA, date, subject, blob-index lines, and original file paths removed/obfuscated while preserving code text and file extensions;
- `provenance.csv` / `aliases.csv`: the exact mapping to repository, parent/head SHAs, dates, subjects, patch hashes, and alias commits.

Phase-A adjudication uses only the blind packet. Source provenance may be opened in Phase B only under the rules below. Verifier results are not generated or consulted during semantic adjudication.

## 6. Frozen semantic taxonomy

The unit of semantic adjudication is one within-repository unique raw patch.

A `behavioral contract` is an externally meaningful verification boundary for a callable/declaration or a uniquely paired interface/implementation target: e.g. preconditions, postconditions, return refinements, or interface specifications that constrain admitted inputs, promised outputs/effects, or caller-visible guarantees. Local assertions, proof-only lemmas, decreases clauses, loop invariants, solver attributes, and formatting do not qualify by themselves.

An `executable-behavior change` changes the extensional/result/effect behavior of executable or extracted code. Proof-only/ghost rewrites, assertions inserted only to guide verification, formatting, comments, generated text, and unchanged computations do not qualify by themselves.

Primary labels:

- **E0 — semantic co-evolution, mechanically pairable.** At least one existing historical target has both a semantic executable-behavior change and a semantic behavioral-contract change, and the complete unit admits a **unique, mechanical two-factor split** into historical implementation fragments `I0/I1` and contract fragments `C0/C1`. No invented adapter, new proof, semantic rewrite, or third-axis choice is required. The historical head target is reproduced by `I1+C1`; the historical old target is reproduced by `I0+C0`. E0 is replay-eligible subject to the replay ladder.
- **E1 — semantic co-evolution, not mechanically pairable.** Genuine executable behavior and behavioral contract co-evolve on an existing historical target, but a unique whole-unit two-factor split cannot be made mechanically without semantic choices, adapters, third-axis logical/proof edits, broad coupled rewrites, signature/type migration, or other inseparable changes. E1 is **not** given an invented four-way replay.
- **N0 — no qualifying executable–behavioral-contract co-evolution.** Examples include proof/specification-only maintenance, contract-only change, executable change without a corresponding behavioral-contract change on the same target, test/generated/formatting/tooling edits, or mechanically adjacent but semantically unrelated changes.
- **N1 — no historical old/new pair for the relevant functionality.** The unit is dominated by additions/deletions/bulk augmentation/renames or newly born executable declarations with contracts, so constructing an old side would fabricate a historical implementation–contract pair. N1 remains negative for the primary existing-target question.

Boundary rule learned from the prior Dafny audit and fixed here before holdout outcomes: an existing declaration that truly changes both behavior and behavioral contract cannot be N1 merely because the same patch also contains additions. It is E1 if the overall patch is not uniquely pairable, or E0 if it is.

## 7. Two-phase adjudication and negative audit

### Phase A — blind patch pass

For every retained unit, record a provisional label, target declaration(s) if inferable, and one-sentence reason using only the blind packet. No verifier/build execution is permitted.

### Phase B — source-context pass

Source provenance is unblinded for every provisional `E0`, `E1`, `N1`, or `AMBIGUOUS` unit. Inspect exact parent/head source as needed to confirm that the target existed on both sides, that executable behavior truly changes, and that the contract change governs the same target. Finalize the primary semantic label **before** any verifier outcome is observed.

For provisional `N0`, a deterministic negative-audit subset is fixed after Phase A but before source-context outcomes: within each ecosystem, order N0 units by SHA-256 of `XH1-20260928|candidate_id|patch_sha256` and source-audit the first `min(20, N0_count)` units. Corrections are recorded transparently; the original Phase-A ledger remains immutable.

## 8. Pairability certificate for E0

Every final E0 must carry a machine-readable certificate naming:

- exact parent and head;
- target file(s) and declaration(s);
- old/new implementation anchors;
- old/new contract anchors;
- deterministic extraction/replacement rule;
- proof that `I0+C0` equals the historical old target fragment(s);
- proof that `I1+C1` equals the historical head target fragment(s);
- statement that `I1+C0` and `I0+C1` require no authored semantic adaptation.

If uniqueness or mechanical separability is uncertain, classify E1 rather than manufacturing a replay.

## 9. Frozen replay ladder

All final E0 units are attempted; none may be promoted or skipped because of expected outcome.

- **R0 — SOURCE_BLOCKED.** Exact required historical source/provenance cannot be recovered well enough to attempt a faithful build/verification. This should be rare for Git-hosted units, but it remains an explicit attrition state.
- **R1 — ENVIRONMENT_BLOCKED.** Exact source is recovered, but a bounded, documented reconstruction cannot provide a defensible historical/revision-local verifier or build environment. Infrastructure failure is recorded as attrition, not converted into FAIL.
- **R2 — ENDPOINT_NOT_GREEN.** Under the predeclared environment rule, at least one exact historical endpoint does not verify/build green. No four-way profile is counted.
- **R3 — ISOLATION_NOT_CLEAN.** Exact endpoints are green, but the E0 pairability certificate cannot be realized in one fixed causal context without third-axis edits, or exact fragment isolation fails. No four-way profile is counted.
- **R4 — FOUR_WAY_EXECUTED.** Exact endpoints are green, the two-factor isolation is mechanically realized, and all four causal cells execute under one fixed context.

### Environment and causal-cell rule

1. Verify/build exact historical parent `H0` and head `H1` using revision-local documented tooling when available. Tool versions, commands, checksums, and failures are preserved.
2. The primary causal context is the **historical head tree**. Do not switch context after seeing cell outcomes.
3. Construct only the frozen target fragments in that head context:
   - `C00 = I0 + C0` (old implementation, old contract),
   - `C10 = I1 + C0` (new implementation, old contract),
   - `C01 = I0 + C1` (old implementation, new contract),
   - `C11 = I1 + C1` (new implementation, new contract).
4. `C11` must reproduce the historical head target fragment exactly. `C00` is a controlled fixed-context reconstruction using exact historical old target fragments; it is not misrepresented as the entire old repository tree.
5. No manually authored adapter/proof/helper may be inserted into a primary cell. If one is needed, stop at R3.
6. Report profiles in the fixed order `C00/C10/C01/C11`, e.g. `P/P/F/P`.

## 10. Primary analyses fixed before outcomes

Report, without inferential overreach:

1. mechanical units retained per repository and ecosystem;
2. Phase-A and final semantic-label counts (`E0/E1/N0/N1`) and transparent audit corrections;
3. E0 attrition through R0–R4;
4. every R4 four-way profile in fixed cell order;
5. repository/ecosystem concentration and dependence visibly, without treating commit aliases or same-repository units as independent votes;
6. a qualitative comparison of whether the Dafny-developed reconstruction method transfers cleanly, transfers with pairability/environment attrition, or fails to transfer.

Forbidden primary claims unless separately justified by a later design: ecosystem prevalence, representative sampling, probability of incompatibility, false-negative rate from the deterministic N0 audit, or universal cross-tool generality.

## 11. Amendment policy

After the freeze commit, protocol changes are not allowed merely because outcomes are inconvenient.

A purely infrastructural defect discovered before viewing affected semantic/verifier outcomes may be repaired only by a new amendment commit that states: defect, affected strata, old rule, new rule, and whether any affected outcome had been observed. If an outcome was already observed, the original result remains primary and the amendment is sensitivity-only unless the original protocol is impossible to execute at all. In that fatal case, create a new protocol version and rerun the entire affected stratum from scratch; do not silently overwrite XH1.

## 12. Stop rule

The holdout is complete when every retained unit has a final semantic label, every final E0 has been attempted through the replay ladder, and every stop stage has an auditable reason. Null results and infrastructure attrition remain part of the evidence.
