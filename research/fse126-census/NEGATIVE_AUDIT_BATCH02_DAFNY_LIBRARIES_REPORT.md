# FSE126 negative sensitivity audit — Batch 02 result

Date: 2026-09-28
Repository: `dafny-lang/libraries`
Frozen units: U043, U044
Status: **BATCH CLOSED — 2/2 audited**

Both units are **CONFIRM_N1**.

Each exact patch adds `FNeed<E>` as a completely new function declaration, including both its `requires !condition ==> error.requires()` clause and its implementation `if condition then Pass else Fail(error())`. The parent has no `FNeed` declaration. Therefore there is no historical old implementation and old contract whose fragments could form an old/new pair. Constructing a four-way body/contract matrix would require inventing a counterfactual pre-existing `FNeed`, exactly what N1 forbids.

U043 and U044 are closely related versions of the same addition. U044 includes explanatory comments; the frozen census deduplicates only exact within-repository patch bytes, so their patch SHA-256 values differ and both remain separate semantic units. The sensitivity audit records that relationship but does not post-hoc collapse the denominator.

Batch totals: **CONFIRM 2, TENSION 0, ERROR 0**.

No primary label or denominator changes.
