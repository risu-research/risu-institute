# Cross-Ecosystem Holdout — Frozen Execution Detail

This clarification is frozen before any holdout candidate diff is inspected.

1. History frame: commits reachable from each repository's frozen default branch at scan time. Merge commits are compared to their first parent. Root commits are recorded but cannot enter parent/head replay.
2. Discovery order: repository order from the primary freeze receipt; inside each repository, committer date descending and then SHA ascending.
3. A `git log -G<contract regex> -- <source suffixes>` pass identifies contract-diff commits. Each such commit is diffed against its first parent with unified context 3.
4. Same-hunk structural flag: at least one added/deleted contract-token line and at least one added/deleted nonblank, non-comment, non-delimiter line occur in the same diff hunk. This is a mechanical queue only.
5. Blind review packet: candidate patches are assigned opaque IDs before semantic adjudication. Repository, SHA, dates, subject, and verifier outcome are withheld from the adjudication text packet; only source-path and patch text are retained because declaration-level eligibility cannot be judged without them. Provenance mapping is kept separately.
6. To keep adjudication finite without outcome-based stopping, preserve at least the first 40 same-hunk structural candidates per repository in frozen order (or all if fewer). If the eligibility stop rule is not reached, continue with the next chunk(s) in the same order.
7. No candidate is promoted or discarded because of the expected or observed four-cell matrix shape.
