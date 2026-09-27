# FSE 2027 Cross-Ecosystem Holdout — Live Recovery Checkpoint

This file exists so the experiment can be resumed even if the chat/session disappears. It is a recovery record, not an amendment to the frozen protocol.

## Governing preregistration
- Path: `research/fse2027_cross_ecosystem_holdout/PREREG_2026-09-27.md`
- Freeze commit: `28587f3c05deb73819416074897fb85024688615`
- The preregistration remains controlling. Later workflow implementation choices may not change selection, eligibility, stopping, or interpretation rules.

## Current phase
DISCOVERY. No counterfactual hybrid has been executed in Verus or F* as of this checkpoint. No verifier outcome has been used to select a holdout candidate.

## Fixed strata
- V: `verus-lang/verus`
- F: `FStarLang/FStar`
- Known pre-holdout Verus PR #1823 is contamination-excluded from selection.

## Discovery attempts preserved
A. Full/default-branch partial-clone implementation
- Workflow: `.github/workflows/fse-xeco-discovery.yml`
- Creation commit: `13c1516e84e613db7654a1902a8ed51fc4524807`
- Run: `36287989954`
- Status at checkpoint: in progress.

B. Shallow-since partial-blob implementation
- Workflow: `.github/workflows/fse-xeco-discovery-fast.yml`
- Trigger commit: `f80a110723e7b5f6914764c8829445da2df10579`
- Run: `36288078411`
- Status at checkpoint: Verus and F* matrix jobs in progress.

C. Shallow-since local-blob implementation
- Workflow: `.github/workflows/fse-xeco-discovery-localblobs.yml`
- Creation commit: `82f78e46feac5f9150e19499eb4e9eb32571feb6`
- Run observed queued: `36288347740`.

D. One-pass patch-stream implementation
- Workflow: `.github/workflows/fse-xeco-discovery-stream.yml`
- Creation commit: `0a062bcb124d4be36d024d2a7bed7fd351b027c3`
- At checkpoint it had not yet produced a dedicated workflow run; retain as a fallback implementation, do not infer scientific failure.

## Source-only manual observations made after freeze
These are not selections and no hybrid outcomes were obtained.

Verus:
- PR #2760: adds a `requires` to the `bool::then` assumed specification; inspected production patch has no corresponding executable-body change -> likely exclusion under frozen contract-only rule.
- PR #2746: adds initialization requires/ensures to `from_ptr_swap`, but the function is `external_body` and has no changed executable body -> likely exclusion.
- PR #2751: executable/cfg macro gating changes but no corresponding contract change in inspected patch -> likely exclusion.
- PR #1823 remains contamination-known and excluded regardless of merits.

F*:
- PR #4437 is a source-only lead for Tier D if and only if Tiers A–C are empty under the frozen scan. It changes the pure `delete_avl` specification function's branch polarity and the Pulse `delete_avl` executable implementation in lockstep. Its existing `ensures is_tree y (T.delete_avl ...)` contract is unchanged. Do not promote it before tier adjudication.
- PRs #4420/#4433/#4492/#4512 are primarily language/checker changes or tests, not yet adjudicated as holdout application-level body/contract candidates.

## Next mandatory steps
1. Obtain at least one completed discovery artifact for each stratum and preserve it byte-for-byte.
2. Cross-check discovery implementations when more than one completes; method differences must be documented, not silently merged.
3. Apply the frozen A→B→C→D eligibility ladder without replay.
4. Create and commit an `ADJUDICATION_FREEZE` recording the first nonempty tier, all eligible candidates in deterministic order, the mandatory candidate, exact mechanical hybrid recipe, and toolchain plan.
5. Only then execute Verus/F* replay.
6. Preserve infrastructure failures separately and use the frozen fallback/stopping rules.
7. Interpretation occurs only after replay artifacts are frozen.
