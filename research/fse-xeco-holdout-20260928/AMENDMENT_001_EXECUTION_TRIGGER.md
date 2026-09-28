# XH1 Amendment 001 — Execution Trigger Only

Freeze ID: `XH1-20260928`
Amendment date: 2026-09-28
Applies to branch: `research/fse-xeco-holdout-freeze-20260928`
Original seal commit: `3b5827242eab51a41326b33dca048128749189eb`
Original frozen scanner blob: `f5b233e573bf3f760dfeee50cb103231d063460a`

## Defect / execution constraint

The sealed scanner is intentionally `workflow_dispatch`-only and remains immutable. In the current authenticated execution environment, the available GitHub connector exposes workflow inspection and artifact retrieval but no workflow-dispatch action. Browser automation was not available for execution. No XH1 candidate queue, blind packet, semantic label, build result, verifier result, or replay outcome has been generated or inspected.

## Amendment

Add a **push-triggered execution wrapper** on this research branch. The wrapper is not a new scanner and must not reimplement candidate logic. Instead it:

1. checks out the exact original seal commit `3b5827242eab51a41326b33dca048128749189eb`;
2. verifies that the sealed workflow file still hashes to Git blob `f5b233e573bf3f760dfeee50cb103231d063460a`;
3. reads each repository/environment row from the sealed `FROZEN_REPOSITORIES.csv`;
4. programmatically extracts the exact shell `run:` bodies named `Clone exact frozen public repository` and `Build frozen outcome-blind mechanical queue` from the sealed workflow file;
5. executes those exact frozen shell bodies without editing their scanner logic;
6. uploads one artifact per frozen holdout ID (`xh1-V1`, `xh1-V2`, `xh1-V3`, `xh1-F1`, `xh1-F2`, `xh1-F3`).

The wrapper is triggered only when `research/fse-xeco-holdout-20260928/RUN_SENTINEL` changes on the research branch. It does not modify `main`, does not alter any target repository, and does not execute a verifier.

## Primary-analysis status

This is a purely infrastructural pre-outcome amendment under Section 11 of `FROZEN_PROTOCOL.md`. The repository frame, pinned heads, history window, token lexemes, same-hunk discovery rule, patch-byte deduplication, 40-unit cap, blind-packet transformation, E0/E1/N0/N1 taxonomy, pairability rule, negative-audit rule, R0–R4 ladder, causal-cell ordering, and analysis plan are unchanged.

Because no XH1 outcome existed before this amendment, packets produced by this wrapper remain primary XH1 holdout data, provided the wrapper's sealed-workflow blob check passes.