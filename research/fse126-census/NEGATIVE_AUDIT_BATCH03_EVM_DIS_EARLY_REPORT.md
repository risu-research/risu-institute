# FSE126 negative sensitivity audit — Batch 03 result

Date: 2026-09-28
Repository: `franck44/evm-dis`
Frozen units: U045, U046, U047, U049, U050, U051
Status: **BATCH CLOSED — 6/6 audited**

Results: U045 **CONFIRM_N1**; U046 **CONFIRM_N0**; U047 **CONFIRM_N0**; U049 **CONFIRM_N0**; U050 **CONFIRM_N0**; U051 **CONFIRM_N1**. Batch totals: **CONFIRM 6, TENSION 0, ERROR 0**.

The critical distinctions are structural rather than keyword-based. U045 and U051 add new declarations whose contracts and bodies appear together for the first time; there is no historical old declaration to cross, so they remain N1. U046 and U050 are proof-maintenance episodes: U046 replaces an inline validity assertion with a ghost lemma call while preserving the returned automaton construction, and U050 only adds a lemma. U047 genuinely changes CLI/output behavior, but its `requires` hits are local lambda proof obligations rather than a co-evolving behavioral contract for the driver behavior. U049 removes redundant stack-effect helpers/proofs while the existing `BuildSeg` precondition is unchanged; the contract hits belong to deleted proof lemmas.

U051 is also the immediate-child helper commit previously encountered during the U052 replay audit. That relationship does not change its N1 classification: U051 is an addition of helper declarations, not an old/new body-contract repair pair.

No primary label or denominator changes.
