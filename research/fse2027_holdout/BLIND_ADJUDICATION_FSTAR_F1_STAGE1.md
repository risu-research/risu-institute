# Blind adjudication — F* F1 Stage 1

This record was written from the frozen blind packets only, before opening F1 provenance (repository commit/date/subject mapping) and before any verifier replay. The repository identity is fixed by the preregistration (F1), but commit identity, date, subject, and verifier outcome were not used. Source paths and patch text remained visible as specified in the freeze receipt.

Global frozen order is all 2025 same-hunk candidates first, followed by 2024. The 2026 chunk contained zero candidates. Adjudication stops at the tenth `ELIGIBLE`/`ELIGIBLE_CONFOUNDED` candidate, exactly as preregistered. No clean `ELIGIBLE` candidate was found before that stop; ten candidates are `ELIGIBLE_CONFOUNDED` because executable and contract evolution are both plausibly present but the dimensions are not mechanically separable without crossing changed signatures, state representations, or multi-unit architectural changes.

| Global order | Blind ID | Label | Blind reason |
|---:|---|---|---|
| 1 | F1-y2025-C001 | EXCLUDE_PROOF_ONLY | Adds a leakage-analysis lemma; proof artifact only, no executable implementation repair. |
| 2 | F1-y2025-C002 | EXCLUDE_PROOF_INTERFACE_REFACTOR | Moves Poly1305 lemma declarations from implementation files into `.fsti`; proof-interface reorganization. |
| 3 | F1-y2025-C003 | EXCLUDE_PROOF_INTERFACE_REFACTOR | Large Poly1305 lemma/interface extraction; proof/specification organization, not an executable repair. |
| 4 | F1-y2025-C004 | EXCLUDE_PROOF_ONLY | Removes/adjusts a proof lemma; no executable semantic body change. |
| 5 | F1-y2025-C005 | EXCLUDE_PROOF_ONLY | Changes proof lemmas in specification/lemma code only. |
| 6 | F1-y2025-C006 | EXCLUDE_PROOF_ONLY | Adds a helper lemma; no executable implementation dimension. |
| 7 | F1-y2025-C007 | EXCLUDE_PROOF_ONLY | Adds a Vale proof helper; no qualifying executable body. |
| 8 | F1-y2025-C008 | EXCLUDE_NEW_DECLARATION | Introduces new digest/copy-facing functionality and contracts; no preserved old corresponding declaration to cross. |
| 9 | F1-y2025-C009 | EXCLUDE_NEW_DECLARATION | Adds new copy operations/contracts across Blake modules; no old body+contract pair for the new declaration. |
| 10 | F1-y2025-C010 | EXCLUDE_NEW_DECLARATION_REFACTOR | Introduces explicit helper operations such as `init_`/`squeeze`; old corresponding contracted declaration is absent. |
| 11 | F1-y2025-C011 | **ELIGIBLE_CONFOUNDED #1** | Existing HMAC/streaming implementation wiring and governing state/contracts co-evolve, but representation/type changes span multiple units; a body-only or contract-only hybrid would require inventing adapters. |
| 12 | F1-y2025-C012 | **ELIGIBLE_CONFOUNDED #2** | Existing HMAC state construction/initialization and heap contracts co-evolve with state-representation changes; dimensions are semantically coupled but not mechanically separable. |
| 13 | F1-y2025-C013 | EXCLUDE_PROOF_SPEC | Specification/lemma-only HMAC change. |
| 14 | F1-y2025-C014 | **ELIGIBLE_CONFOUNDED #3** | Existing HMAC `malloc_` changes executable behavior to explicit `InvalidAlgorithm`/`OutOfMemory`/`Success` outcomes while its contract changes accordingly, but the function signature/result protocol changes too; old/new body-contract crossing is not type-correct without invented semantics. |
| 15 | F1-y2025-C015 | **ELIGIBLE_CONFOUNDED #4** | Fallible allocation is propagated through existing streaming/hash implementations and contracts, but return types/state representations and multiple allocation units change together; no clean declaration-level 2×2. |
| 16 | F1-y2025-C016 | EXCLUDE_PROOF_SPEC | HMAC specification/lemma rewrite only. |
| 17 | F1-y2025-C017 | EXCLUDE_PROOF_SPEC | Reverse/rework of the HMAC specification/lemma state; no executable production body dimension. |
| 18 | F1-y2024-C001 | **ELIGIBLE_CONFOUNDED #5** | Existing streaming allocation/update paths gain null/fallible-allocation behavior while heap/postcondition assumptions are adjusted, but the change is spread across the functor and concrete instantiations and cannot be crossed declaration-by-declaration without reconstructing interfaces. |
| 19 | F1-y2024-C002 | **ELIGIBLE_CONFOUNDED #6** | Existing HMAC `reset` changes from a delegated operation to an explicit key/state wrapper with a new result contract; signature/argument protocol changes prevent a mechanical old-body/new-contract crossing. |
| 20 | F1-y2024-C003 | **ELIGIBLE_CONFOUNDED #7** | Existing HMAC allocation evolves from a functor alias into an explicit allocation interface/body with null-sensitive postconditions; the signature/interface change prevents clean four-way crossing. |
| 21 | F1-y2024-C004 | EXCLUDE_ARCHITECTURAL_REFACTOR | Moves/rebinds HMAC/Agile-Hash state machinery and helper contracts across modules; no single preserved declaration supplies both separable dimensions. |
| 22 | F1-y2024-C005 | EXCLUDE_NEW_DECLARATION | Adds a combined allocation/hash helper with a new contract; no old corresponding declaration. |
| 23 | F1-y2024-C006 | EXCLUDE_NEW_DECLARATION_REFACTOR | Introduces/extracts an explicit `finish` implementation and interface into Definitions; old same-declaration body+contract pair is not preserved. |
| 24 | F1-y2024-C007 | **ELIGIBLE_CONFOUNDED #8** | Existing HMAC runtime-key state changes from pointer-backed length/state to a different representation while allocation/free behavior and contracts change together; representation change prevents type-correct cross-combinations. |
| 25 | F1-y2024-C008 | EXCLUDE_NEW_DECLARATION | Adds new Agile-hash/helper declarations and contracts rather than modifying a preserved same declaration pair. |
| 26 | F1-y2024-C009 | EXCLUDE_MODULE_EXTRACTION | Moves existing HMAC state/init machinery into a new Definitions module; primarily architectural extraction, not mechanically isolated semantic body-vs-contract evolution. |
| 27 | F1-y2024-C010 | EXCLUDE_PROOF_FRAME_ADAPTATION | Contract/frame helper additions accompany functor proof/frame adjustments; no qualifying same-declaration executable repair. |
| 28 | F1-y2024-C011 | EXCLUDE_NEW_MODULE_REFACTOR | Introduces a large Agile Hash implementation module mirroring/replacing provider functionality; no preserved same-declaration old pair. |
| 29 | F1-y2024-C012 | EXCLUDE_NEW_MODULE_REFACTOR | Initial/new Agile Hash module plus provider representation refactor; no old corresponding declaration inside the new module. |
| 30 | F1-y2024-C013 | EXCLUDE_PROOF_SPEC | HMAC incremental specification/lemma changes only. |
| 31 | F1-y2024-C014 | EXCLUDE_PROOF_SPEC | HMAC incremental specification/lemma changes only. |
| 32 | F1-y2024-C015 | EXCLUDE_TOOLING_SYNTAX | Vale/tooling contract-syntax/range-annotation migration rather than executable semantic repair. |
| 33 | F1-y2024-C016 | EXCLUDE_TOOLING_SYNTAX | Vale/tooling contract-syntax/range-annotation migration rather than executable semantic repair. |
| 34 | F1-y2024-C017 | EXCLUDE_PROOF_ONLY | Adds a proof lemma; no executable implementation dimension. |
| 35 | F1-y2024-C018 | EXCLUDE_NEW_DECLARATION | Adds a new SHA3 absorb helper and contract; no old corresponding declaration. |
| 36 | F1-y2024-C019 | **ELIGIBLE_CONFOUNDED #9** | Existing Blake streaming `digest` changes from a delegated/implicit form to an explicit operation with a new return-value contract; the callable signature/result behavior changes, so clean old/new contract-body crossing is not mechanical. |
| 37 | F1-y2024-C020 | **ELIGIBLE_CONFOUNDED #10 — STOP** | Existing SHA3 vector absorb pipeline and contracts are reparameterized around an `absorb_inner` implementation function; executable architecture and function types/contracts change together, so a 2×2 would require invented adapters. |

## Frozen stop result

F1 reaches the preregistered stop at global candidate 37: `0 ELIGIBLE`, `10 ELIGIBLE_CONFOUNDED`. Therefore no F1 four-cell verifier replay is permitted by the primary rule. F2/F3 are not semantically adjudicated in the primary F* stratum after this stop, even if discovery jobs/artifacts already exist; doing so would be outcome-independent but would violate the frozen stopping rule.

This is not evidence that F* lacks code-contract co-evolution. It is evidence that, under the frozen mechanical-separability requirement, the first ten substantively plausible F* co-evolution episodes encountered in the F1 queue are architecturally/type coupled rather than clean four-way replay candidates.
