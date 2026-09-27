# Verus V3 continuation under the frozen holdout rule

This record does not change eligibility, ordering, stopping, or claims. The first 60 same-hunk packets from each coarse chronological chunk did not trigger the preregistered stop. Therefore the frozen rule requires continuation in the same global order.

To avoid another long-job timeout, the remaining V3 history is partitioned by calendar year for computation only: 2026, 2025, 2024, 2023, 2022, 2021, and <=2020. Each year is scanned completely with the original Verus token regex and same-hunk rule. The resulting blind packets are ordered by commit date descending and SHA ascending across year boundaries. Candidate IDs from the earlier 60-cap packets are retained as audit aliases; the complete annual packets are the canonical continuation queue.

No provenance mapping, commit subject, or verifier outcome is used for blind adjudication. Mechanical exclusions already explicit in the freeze receipt (generated/vendor, tutorial/example-only, pure proof/ghost-only, syntax/import/proof-stabilization-only) may be applied programmatically to blind patches, but every excluded candidate remains in the ledger with its rule and every non-mechanical/ambiguous candidate is reviewed from patch text before any provenance is opened.
