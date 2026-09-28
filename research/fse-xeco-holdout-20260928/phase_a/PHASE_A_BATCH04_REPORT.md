# XH1 Phase-A Blind Adjudication — Batch 04

Freeze ID: `XH1-20260928`  
Batch rule: frozen deterministic order  
Batch members: `V3-C040` + `F1-C001..F1-C019`  
Candidates: **20**

## Outcome discipline

This adjudication used only the frozen `blind/<candidate>.patch` packets recovered from the byte-preserved XH1 scanner artifacts. No `provenance.csv`, `aliases.csv`, raw unblinded patch, commit SHA/date/subject, original path mapping, parent/head source context, build output, verifier result, or replay outcome was opened or executed.

The scanner intentionally preserves source text while obfuscating original paths and provenance. Source/module identifiers inside the code can sometimes reveal an ecosystem or project family, so this is best described as **outcome-blind and source-context-blind**, not identity-anonymous in the human-subject sense. No provenance mapping was used in any label.

## Provisional Phase-A result

- N0: **10**
- N1: **2**
- E1: **8**
- E0: **0**
- AMBIGUOUS: **0**

These are provisional blind labels only. Under the frozen protocol, all **10** provisional E1/N1 units require exact parent/head source-context adjudication in Phase B before any verifier/build result may be observed.

## Deep findings

### 1. A dense cluster of genuine but inseparable allocation/API co-evolution survives blindly

Eight units are provisionally E1.

`F1-C014` is the cleanest semantic example: an existing `malloc_` API changes from returning a nullable pointer to writing through an output pointer and returning an explicit error code. Its postcondition is rewritten to distinguish `Success`, `InvalidAlgorithm`, and `OutOfMemory`, and the implementation adds exactly those branches. This is direct behavior–contract co-evolution, but the signature/return convention itself changes, so it is not mechanically pairable.

`F1-C015` and `F1-C017` generalize the same phenomenon across allocator families: ordinary allocation becomes fallible/null-aware allocation, and existing contracts are weakened/branched to make allocation failure explicit. Both are broad multi-declaration migrations and therefore E1, not E0.

`F1-C018` and `F1-C019` similarly change existing HMAC `reset`/`malloc` functionality into explicit checked APIs with new error/availability semantics and corresponding contracts. Their signatures and helper plumbing change together with behavior, preventing a unique two-factor split.

`F1-C011` and `F1-C012` are state-model migrations. Existing runtime HMAC state/index representations and init/finish logic change together with invariants, footprints, and callable state contracts. `F1-C012` is especially strong: initialization changes from a one-state model to a two-state model that precomputes the second hash state, while the interface changes from a single state representation to `two_state`/`two_repr`.

`F1-C008` changes an existing `digest` wrapper to a heap-allocation path whose new interface explicitly admits `OutOfMemory`; the same unit adds the new heap helper and other guard changes. It is therefore provisionally E1 rather than a manufactured E0.

### 2. New contracted helpers remain N1 rather than being promoted

`F1-C009` introduces new contracted Blake2 `copy` helpers and rewires existing dispatch code to them. `F1-C010` introduces new contracted SHA3 helper wrappers and redirects existing calls. In both cases, the relevant contract-bearing declaration is born in the unit and has no historical old side. They are provisional N1 even though they contain executable code and strong contracts.

### 3. Proof/specification maintenance remains distinguishable from executable co-evolution

`F1-C001..C007`, `F1-C013`, and `F1-C016` are proof/specification/interface maintenance: lemma additions/deletions, moving lemma signatures into `.fsti`, arithmetic proof strengthening, or pure specification-model changes. They are provisional N0.

`V3-C040` is also N0 despite substantial executable compiler changes because every visible `ensures false` belongs to newly added regression-test programs, not to a behavioral contract on the changed compiler routines.

## Why there is no E0 in this batch

Several E1 units contain striking behavior/contract changes, but each also contains signature/type migration, newly added helper state, broad coupled representation changes, or multiple interacting declarations. The frozen E0 rule requires a **unique mechanical** `I0/I1 × C0/C1` split without authored adaptation or third-axis choices. Blind inspection provides no such certificate for any Batch-04 unit. Promoting one now would violate the conservative pairability rule.

## Integrity

Every row in the ledger records the SHA-256 and byte length of the exact blind packet used. All 20 rows explicitly record:

- `provenance_opened=0`
- `verifier_executed=0`

The Batch-04 ledger must be committed before Phase B is opened for any of these units.
