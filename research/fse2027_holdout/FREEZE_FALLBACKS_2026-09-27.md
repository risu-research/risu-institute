# Cross-Ecosystem Holdout — Frozen Fallback Routes

Frozen while the primary default-branch history jobs are running and before V3/F1/F2/F3 candidate packets or outcomes are inspected.

These fallbacks are infrastructure routes only; none may use matrix outcome or semantic desirability to select candidates.

## Fallback A — chronological history chunking
If a full `git log -G` job times out or becomes operationally impractical, rerun the same frozen repository and token rule in non-overlapping committer-date chunks, newest to oldest. Concatenate candidates and restore the exact global order (date descending, SHA ascending) before blind adjudication. Chunk boundaries are computational only and do not change eligibility.

## Fallback B — merged-PR diff queue
If history traversal cannot be completed even with chunking, create a separately labeled sensitivity lane using merged pull requests from the same frozen repository, ordered by merge/update time descending. Inspect every changed source patch in that order for the same frozen contract tokens and same-hunk structural rule. Preserve every PR inspected. This lane does not replace or get pooled with the primary history lane.

## Fallback C — exact-commit targeted replay
Once a blind-eligible candidate is identified but its historical repository toolchain cannot be rebuilt, attempt replay in this fixed order:
1. exact historical commit with repository-pinned toolchain/dependencies;
2. exact historical source declaration transplanted into the nearest buildable historical tree from the same repository/tool version;
3. declaration-level extracted replay retaining exact old/new body and contract text plus all dependencies needed for the declaration;
4. if none succeeds, record `ELIGIBLE_INFRA_BLOCKED` and continue. Do not rewrite semantics to obtain a desired matrix.

## Fallback D — two verifier installation routes
For Verus: first use the repository's pinned submodule/release/toolchain if present; second use a source build at the matching Verus commit. For F*: first use the repository's pinned F* package/commit or Everest opam/nix metadata if present; second use a source build of the matching F* revision. Installation-route failures are infrastructure observations, not verifier FAIL cells.

All fallback artifacts must name the route used and retain failed attempts.
