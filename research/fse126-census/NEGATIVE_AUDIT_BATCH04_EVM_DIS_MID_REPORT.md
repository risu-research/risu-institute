# FSE126 negative sensitivity audit — Batch 04 result

Date: 2026-09-28  
Repository: `franck44/evm-dis`  
Frozen units: U054, U055, U057, U058, U059, U061  
Status: **BATCH CLOSED — 6/6 audited**

## Result

Batch totals: **CONFIRM 5, TENSION 0, ERROR 1**.

| Unit | Frozen | Audit | Corrected | Core finding |
|---|---:|---:|---:|---|
| U054 | N0 | CONFIRM_N0 | N0 | DFS proof refactor; new contracts are on `PathHelperLemma`, while DFS's own contract is unchanged |
| U055 | N0 | CONFIRM_N0 | N0 | new monotonicity lemma only; existing computation/contract pair unchanged |
| U057 | N1 | CONFIRM_N1 | N1 | `SeqToSet` body + postconditions are born together; no old declaration exists |
| U058 | N1 | CONFIRM_N1 | N1 | new fixpoint subsystem is introduced as new declarations; existing `ToHTML` preconditions do not co-evolve |
| U059 | N0 | CONFIRM_N0 | N0 | real CLI/visualization behavior change, but token hits are callback-lambda `requires`, not behavioral contracts of the changed routines |
| U061 | N0 | **ERROR** | **N1** | five new helper declarations with preconditions and bodies are added despite commit subject `Formatting.`; parent has none |

## Provenance gate

All six audit patches were recovered from the original R03 archive, decompressed byte-for-byte, and hashed independently. **6/6 SHA-256 values exactly equal the recovered pre-replay semantic-label snapshot.** Thus this batch is adjudicating the frozen units, not a newly reconstructed approximation.

## Unit findings

### U054 — CONFIRM_N0

The patch is a proof-oriented DFS refactor. It introduces `PathHelperLemma`, temporary names (`j`, `p'`), lemma calls and an assertion needed to discharge path-shape obligations. The changed DFS retains the same `requires`, `ensures`, and `decreases` clauses. Every newly added contract clause is attached to the new lemma. Therefore the patch contains executable-looking body movement, but not a co-evolving behavioral contract for DFS. N0 remains the correct negative class.

A source-context wrinkle is preserved rather than hidden: this historical commit changes several uses from `LastOnPath` to `lastOnPath` while the declaration in that exact commit is still `LastOnPath`; later history normalizes the lowercase spelling. Whether this transient revision verified is irrelevant to the negative semantic-class audit: it does not create a code–behavioral-contract pair.

### U055 — CONFIRM_N0

The pre-existing `FastWeakestPreOperands` body and its function-level `requires`/`ensures` are unchanged apart from comments/whitespace. The semantic addition is `WeakestPreMonotonic`, a proof lemma whose pre/postconditions state monotonicity and whose body reveals/calls existing proof machinery. This is proof maintenance, not executable–behavioral-contract co-evolution.

### U057 — CONFIRM_N1

The parent has no `SeqToSet`. The patch adds the whole declaration at once: recursive implementation plus two postconditions. There is no historical old body or old contract to swap against the new pair. Any four-way construction would have to invent a predecessor declaration, which is prohibited by N1.

### U058 — CONFIRM_N1

This commit introduces a coherent new CFG weakest-precondition analysis: `Fix`, `UpdateValues`, `MaxNat`, `MaxNatSeq`, `ComputeWPreOperands`, and `HasNoErrorState`, with their pre/postconditions and implementations appearing together. It also extends existing `ToHTML` with an optional `minStackSizeForState` and forwards that value to rendering helpers. Crucially, `ToHTML`'s existing preconditions remain unchanged. The contract-rich lines belong overwhelmingly to the newly born analysis declarations. There is therefore no historical old/new implementation-contract pair for the added subsystem; N1 is correct.

### U059 — CONFIRM_N0

This is the strongest adversarial N0 in the batch because it genuinely changes executable behavior: it consolidates CFG construction, computes/prints the WPre fixpoint result, threads per-node values into DOT/HTML rendering, and modifies the rendering interface. But the source-context audit separates *behavior* from *contract*. No function-level `requires` or `ensures` of `Main`, `DOTSeg`, or `DOTSegTable` co-evolves with that behavior. The changed contract-token lines are callback-lambda `requires` clauses used to make indexing legal; most are moved or re-instantiated when duplicated branches are consolidated. Added `assert`s likewise serve verification and do not constitute an external behavioral contract. Hence it is correctly N0, not a missed E0/E1.

### U061 — ERROR: N0 → N1

The frozen N0 reason inherited the commit subject `Formatting.`, but exact source context disproves that description. The patch adds five declarations inside `EVMObject`:

- `StackEffect(i)`
- `CapEffect(i)`
- `WpOp(i)`
- `IsJump(i)`
- `WpCap(i)`

Each is absent from the parent, each has `requires i < |xs|`, and each has a semantic body delegating to the indexed segment. The file itself distinguishes ghost declarations (`ghost predicate IsValid`) from these newly added ordinary functions/predicate, so treating them as formatting/proof-only is untenable. Nevertheless, this is **not E0/E1**: because the declarations are new, there is no historical old body/contract pair. Under the frozen taxonomy the correct class is **N1, new-declaration/non-pairable transition**.

Per the predeclared audit rule, the frozen primary label file remains immutable. This report and ledger record the explicit adjudication correction. Replay eligibility remains zero.

## Effect on census composition

The correction changes only the partition *within the negative classes*:

- frozen: E0=3, E1=9, N0=37, N1=51;
- audited-corrected overlay after Batch 04: **E0=3, E1=9, N0=36, N1=52**.

Therefore the number of candidate executable–contract co-evolution units (E0+E1 = 12), the three E0 replay denominator, and all completed replay outcomes are unchanged. Future population synthesis should report the frozen composition and the audited-corrected overlay transparently rather than silently replacing history.

## Cumulative negative-audit status

After Batches 01–04: **18/31 audited = 17 CONFIRM, 0 TENSION, 1 ERROR**. Thirteen frozen suspicious-negative units remain.
