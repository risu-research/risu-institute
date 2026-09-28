# XH1 Phase-A Blind Adjudication — Batch 05

Freeze ID: `XH1-20260928`  
Batch rule: frozen deterministic order  
Batch members: `F1-C020..F1-C039`  
Candidates: **20**

## Outcome discipline

This adjudication used only the frozen `blind/F1-C020.patch` through `blind/F1-C039.patch` packets recovered from the byte-preserved XH1 F1 scanner artifact. No `provenance.csv`, `aliases.csv`, raw unblinded patch, commit SHA/date/subject, original path mapping, parent/head source context, build output, verifier result, or replay outcome was opened or executed.

The blind packets preserve source text while obfuscating original paths and provenance. Module/source identifiers inside the code can reveal project-family structure, so the proper description remains **outcome-blind and source-context-blind**, not identity-anonymous.

Every ledger row records the SHA-256 and byte length of the exact blind packet used and explicitly sets `provenance_opened=0` and `verifier_executed=0`.

## Provisional Phase-A result

- N0: **11**
- N1: **6**
- E1: **3**
- E0: **0**
- AMBIGUOUS: **0**

These are provisional blind labels only. Under the frozen protocol, all **9** provisional E1/N1 units require exact parent/head source-context adjudication in Phase B before any verifier/build result may be observed.

## Deep findings

### 1. Three existing-function co-evolution units survive, but none is mechanically pairable

`F1-C023` is a coupled HMAC state/semantics migration. The runtime key state moves from a buffer plus a pointer-held length to a buffer plus a value length, changing allocation, free, copy, footprint, and invariant logic. In the same unit, existing key wrapping is explicitly generalized to tolerate a null/zero-length key and its contract is rewritten accordingly. This is genuine existing behavior-contract co-evolution, but state representation, signature, helper, and proof changes are inseparable, so the frozen rule gives **E1**, not E0.

`F1-C027` is broader: the existing Agile.Hash layer is transformed from thin EverCrypt delegation into an explicit implementation-indexed runtime state and allocation API. Platform-dependent vector availability, state constructors, malloc/alloca behavior, initialization/update/finish/free/copy operations, invariants, and contracts move together. It is strong semantic co-evolution, but exactly the kind of broad migration that cannot be reduced to one unique `I0/I1 × C0/C1` swap without authored choices.

`F1-C035` is the cleanest API-level example in this batch. Four existing Blake2 streaming `digest` wrappers change from only writing the digest to also returning the selected `digest_length`; each receives an explicit contract guaranteeing that return value while preserving the digest effect. The behavior-contract link is direct, but the callable return signature itself changes across four modules, so this is **E1** rather than a manufactured E0.

### 2. Six units expose development staging rather than historical pairs

`F1-C021`, `C022`, `C024`, `C025`, `C026`, and `C028` are **N1** for the same conservative reason: the contract-bearing helper, implementation, or abstraction layer is born in the unit. Several are scientifically important—e.g. a contracted combined HMAC buffer helper, a real finish replacing an admitted callback, a new initialization implementation, and the initial contract-bearing Agile.Hash layer—but assigning an old contract/body would fabricate a historical side.

This cluster is methodologically useful: source history often stages verified functionality by introducing a contracted declaration and then wiring existing callers to it. A same-hunk screen can correctly find these commits while they still fail the counterfactual-pairability question.

### 3. The remaining eleven units are structurally explainable N0s

`F1-C020` adds SIMD-availability guards to an existing one-shot hash path, but the qualifying contract text is either moved unchanged (`index_of_state`) or belongs to newly added thin wrappers; the changed existing hash operation does not show a co-changing behavioral contract.

`F1-C029` and `C030` are pure incremental-HMAC specification/lemma work. `C031` and `C032` are Vale proof/ghost/range or attribute-representation changes. `C033` is a proof-supported semantics-preserving expression simplification. `C034` exposes a SHA3 interface contract without a corresponding body-behavior transition. `C036` and `C037` restructure SHA3 internal dispatch/types while preserving the same semantic relations. `C038` is module consolidation/call-site migration, and `C039` is proof/contract exposure maintenance.

### 4. Why Batch 05 still has no E0

The strongest three semantic units all fail the frozen E0 criterion for a principled reason: `C023` couples state representation with zero-length semantics and helper changes; `C027` is a system-wide state/API migration; `C035` changes the public return signature across a family of modules. None admits a unique mechanical implementation/contract two-factor split without deciding how to adapt types, signatures, or helper state. Promoting any of them would change the experiment after seeing the candidate.

### 5. Batch 05 strengthens the pairability-bottleneck interpretation

The consecutive F1 history now contains both dense semantic co-evolution and many staged/new-declaration or representation-only changes. This supports a sharper methodological distinction: **finding real verified behavior-contract evolution is not the same as obtaining a mechanically identifiable historical counterfactual pair**. It also gives concrete motivation for declaration-aligned screening and, later, a development-episode analysis without using those later ideas to relabel this frozen batch.

## Integrity

- Exact batch: `F1-C020..F1-C039`
- Exact candidates: **20**
- `provenance_opened=0` for all rows
- `verifier_executed=0` for all rows
- Source-context Phase B: **not opened**
- Build/verifier/replay: **not executed**

The Batch-05 ledger and report must be committed before any Phase-B source context for these units is opened.
