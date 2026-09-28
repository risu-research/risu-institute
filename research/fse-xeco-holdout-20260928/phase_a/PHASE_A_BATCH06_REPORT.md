# XH1 Phase-A Blind Adjudication — Batch 06

Freeze ID: `XH1-20260928`  
Batch rule: frozen deterministic order  
Batch members: `F1-C040` + `F2-C001` + `F3-C001..F3-C018`  
Candidates: **20**

## Outcome discipline

This adjudication used only the exact frozen blind packets named above, recovered from the byte-preserved XH1 scanner artifacts. No `provenance.csv`, `aliases.csv`, raw unblinded patch, commit SHA/date/subject, original path mapping, parent/head source context, build output, verifier result, or replay outcome was opened or executed.

The packets preserve code text while obfuscating original paths and provenance. Source/module identifiers may expose ecosystem/project-family structure, so this remains **outcome-blind and source-context-blind**, not identity-anonymous.

Every ledger row records the SHA-256 and byte length of the exact blind packet used and sets `provenance_opened=0` and `verifier_executed=0`.

## Provisional Phase-A result

- N0: **19**
- N1: **0**
- E1: **1**
- E0: **0**
- AMBIGUOUS: **0**

Only **one** unit (`F3-C014`) requires Phase-B source-context adjudication from this batch under the frozen rule. No verifier/build result may be observed before its final semantic label is fixed.

## Deep findings

### 1. The F1 tail remains proof/equivalence maintenance, not a new semantic pair

`F1-C040` changes SHA3 verification structure: existing runtime-facing hash/update functions receive erased lemma calls/assertions, equivalence lemmas are added, and a vector interface declaration is reorganized. The visible changes strengthen or rearrange proof obligations without changing extensional runtime behavior together with a behavioral contract on the same existing target. It is therefore **N0**.

### 2. The entire F2 stratum is a namespace/package migration

`F2-C001` is unusually large (281 changed file-pairs in the blind patch), but the dominant operation is systematic qualification into the `MiTLS.*` namespace plus associated parser/generated-file housekeeping. Module names and references change broadly while the underlying computations and logical promises are not shown changing together on one target. Size is not evidence of semantic co-evolution; under the frozen taxonomy this is **N0**.

### 3. Most early F3 hits demonstrate why same-hunk contract tokens are overinclusive

`F3-C001..C010` repeatedly combine a real compiler/extraction/SMT/typechecker change with newly added regression programs containing `requires`, `ensures`, refinements, or Lemmas. Those contracts govern the tests, not the changed compiler routines. Examples include computation-type equality, uvar scoping, Custard arity analysis, local-let-rec SMT capture, destructuring optimization, and binder-attribute substitution. The large `C008/C009` insertion/deletion pair is even more mechanical: its triggering lexemes occur in comments or compiler handling of source constructs rather than as a behavioral contract on the changed extraction implementation. All are **N0**.

This is a direct cross-ecosystem analogue of the earlier Verus compiler-test negatives: **mechanical adjacency between implementation edits and contract syntax is not semantic co-evolution**.

### 4. Mathematical proof work is kept separate from executable behavior

`F3-C011` replaces an assumed irrationality Lemma with a constructive proof, so it is proof-only **N0**.

`F3-C012` is large and contract-rich, but its new `FStar.Math.Pow` interface explicitly describes `pow` as an **erased operation for specifications and proofs**. The module is mathematical specification/proof infrastructure rather than qualifying executable or extracted behavior. It therefore remains **N0**, not N1 merely because many new declarations are born.

### 5. One genuine core F* interface/behavior co-evolution survives: F3-C014

`F3-C014` is qualitatively different. An **existing** Reflection boundary changes on both sides:

- caller-visible `comp_view` moves away from special `C_Total/C_GTotal/C_Lemma/C_Eff` constructors toward a field-preserving computation view with explicit flags/decreases representation;
- existing `inspect_comp`/`pack_comp` logic changes to preserve and reconstruct that representation;
- equality, embeddings, stubs, tactics, and reflection clients migrate with it.

The executable behavior of the existing reflection API and its interface specification therefore genuinely co-evolve. But the change spans **57 files** and couples data types, flags, embeddings, pack/inspect semantics, and clients. There is no unique mechanical `I0/I1 × C0/C1` split without choosing adapters or a third representation axis. Under the frozen rule this is provisional **E1**, not E0.

This is important because it shows that the F* holdout is not merely producing test-token false positives: a genuine existing-target semantic co-evolution appears in core reflection infrastructure, yet pairability still fails for a principled structural reason.

### 6. The remaining F3 units are compiler/tooling changes with contract-bearing regressions

`F3-C013` adds an F# backend/tooling path; `C015` adds Pulse comment emission; `C016` fixes qualified-precondition recognition; `C017` fixes postcondition-domain handling; and `C018` fixes generated-versus-user squash-binder handling. In each case the visible `requires`/`ensures` are in tests or source-language constructs that exercise the compiler change, not a behavioral-contract change governing the changed compiler helper itself. They remain **N0**.

### 7. Batch 06 sharpens, rather than weakens, the holdout story

Batch 06 has a very different composition from the HACL* batches. HACL* produced dense runtime/library E1s; early F* history here is dominated by compiler/regression/proof/tooling candidates. The frozen screen correctly retains both kinds, while semantic adjudication separates them without looking at provenance or verifier outcomes.

The one surviving F* E1 (`C014`) is also structurally informative: its failure to be E0 is not because the semantic signal is weak, but because the behavior/interface migration is **too coupled** for a unique two-factor historical replay. That is exactly the distinction the holdout was designed to test.

## Integrity

- Exact batch: `F1-C040` + `F2-C001` + `F3-C001..F3-C018`
- Exact candidates: **20**
- `provenance_opened=0` for all rows
- `verifier_executed=0` for all rows
- Source-context Phase B: **not opened**
- Build/verifier/replay: **not executed**

The Batch-06 ledger and report must be committed before any Phase-B source context for `F3-C014` is opened.
