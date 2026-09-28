# FSE126 U052 closure result

Date: 2026-09-27
Status: **CLOSED — R2 (endpoint not green)**
Four-way profile: **none**. U052 does not enter the R4 profile denominator.

## Historical unit

Repository: `franck44/evm-dis`  
Frozen head: `ac962f72645d3d4a6c2d996b6ea19435ad630d2c` — `Add reverse transitions map and proofs.`  
Exact first parent: `c194f56d15152c3e09f3bd8fa9c73875e1854592`  
Changed file in the frozen commit: `src/dafny/utils/Automata.dfy` only  
Git diff size: 57 additions / 283 deletions.

U052 was labeled E0 before new verifier outcomes because the patch-only screen exposed changes to existing Automata behavior and contract clauses. The pre-replay U052 rule explicitly required source-context isolation before authorizing a four-way replay and required R3 rather than an arbitrary verifier FAIL if third-class logical/proof artifacts had to move.

## Frozen primary environment

- Dafny: `4.4.0+707b18acee078b3aa4d84c0590a980966bf22428`
- target: `src/dafny/utils/Automata.dfy`
- command: `dafny /dafnyVerify:1 /compile:0 /timeLimit:20 /vcsCores:12 src/dafny/utils/Automata.dfy`

The repository README at the frozen head identifies Dafny 4.4.0 as its verification release. The historical `build.gradle` verifies each `src/dafny/**/*.dfy` file independently using the same legacy verification/time/core flags. No later verifier was substituted into the primary disposition.

## Exact endpoint result

| exact revision | result | evidence |
|---|---|---|
| parent `c194f56...` | **PASS** | 26 verified / 0 errors |
| head `ac962f72...` | **RESOLUTION_NOT_GREEN** | Dafny return code 2; 13 resolution/type errors |

The exact head does not fail because of runner setup or a missing Dafny executable. Dafny 4.4.0 evaluates the exact source and reports unresolved references to:

- `AddKeyVal`
- `ReverseMapsIsCongruent`
- `ExtendByOneGoodIsGood`

plus dependent type/method-resolution errors. Because the frozen R2 gate asks whether both historical endpoints are green under the fixed environment, U052 is **R2**. A resolution/type error is not coded as a four-way semantic FAIL, but the exact endpoint is not green. No cross-pair is constructed or counted.

## Immediate-child diagnostic: why the head is transiently incomplete

After observing the exact-head resolution errors, a history diagnostic inspected the immediate child commit:

`ac0d71b96d32962d5b7f88ebd511d3d4851286f8` — `Add new function sand lemmas on maps with seq values.`

Git history establishes:

- `ac0d71...` has **exact U052 head `ac962f...` as its parent**;
- author/commit timestamps are 2024-01-04 08:36:53Z for U052 head and 08:37:19Z for the child, a 26-second interval;
- the child changes only `src/dafny/utils/MiscTypes.dfy`;
- `src/dafny/utils/Automata.dfy` in the child is byte-identical to the frozen U052 head, SHA-256 `524686e145c5c2354c0613947f1688340bc4c869c79f8b793bfa5d5693ae0f08`;
- the child adds all four expected helper declarations checked by the diagnostic: `AddKeyVal`, `ExtendByOneGoodIsGood`, `ReverseMapsIsCongruent`, and `IsReverseMap`.

Under the same Dafny 4.4.0 command, that immediate child verifies **20 verified / 0 errors**.

This diagnostic explains the frozen head's resolution failure without changing the primary unit. The child is a different Git revision and cannot be silently borrowed to convert U052 into a PASS endpoint or R4 observation. It is reported only as provenance explaining that the mechanical frame landed on the first half of a tightly split two-commit maintenance episode.

## Independent source-isolation result

The R2 result is not the only obstacle to a four-way replay. Before consulting verifier outcomes, the closure protocol also froze a strong source-isolation audit.

Two increasingly generous masks were applied to exact parent/head `Automata.dfy`:

1. remove complete `AddState`, `AddStates`, `AddEdge`, and `AddEdges` declarations;
2. additionally remove the complete `AddEdgeInTRandTrNatPreservesValid` declaration.

Even after the expanded mask, the remaining source is **not** identical, either byte-for-byte or after comment/whitespace normalization. Semantically material third-class changes remain, including:

- `IsValid` changes so reverse-map validity becomes part of the main automaton invariant;
- old `IsReversemapValid` is deleted and new `IsReverseMapValid` is introduced;
- `PredNat` and `revTransitionsIsBounded` are added;
- the old local `AddKeyVal` and proof helpers (`foo303`, `foo`, `foo404`) are removed/replaced;
- old reverse-map auxiliary predicates are deleted.

The machine certificate therefore records `r3_source_isolation_failure = true`.

This does **not** change the primary disposition from R2: the frozen attrition gate stops first because the exact head is not green. It does establish a useful robustness fact. Even if one performed a non-primary episode-bundling sensitivity analysis and supplied the immediate child's helper library so that the head source verified, U052 would still not automatically become a valid two-factor R4 replay: choosing old/new logical definitions and proof infrastructure is an additional semantic dimension explicitly forbidden by the predeclared U052 isolation rule.

## Outcome discipline and v1 correction

The first closure harness labeled the head generically `INFRA` because it saw a nonzero Dafny exit without the usual final verifier summary. Its preserved raw log showed 13 Dafny resolution/type errors, so a pre-finalization erratum refined the classifier before U052 was closed:

- `PASS`: normal summary, zero errors;
- `VERIFY_FAIL`: normal summary with verification errors;
- `RESOLUTION_NOT_GREEN` / `PARSE_NOT_GREEN`: Dafny successfully evaluates the exact source but it is not a green verification endpoint;
- `INFRA`: clone/tool/runtime failure prevents Dafny from evaluating the source.

The v2 rerun reproduces the parent log hash from v1 exactly and reproduces the head log hash from v1 exactly while classifying the same observed source result as endpoint-not-green. No source, revision, Dafny version, verification flag, semantic label, or replay boundary changed between v1 and v2.

## Artifact integrity

Primary closure run: `36361325535`  
Workflow head: `5f09e334711dc28df64c76ae60f9a008fb71940f`  
Artifact ID: `10945519200`  
Artifact name: `fse126-U052-v2-closure-dafny-4.4.0`  
Artifact ZIP SHA-256: `3e73ffe4776df8c21104509491f519c9f11665e9c2ef7850e765063c8c5ed313`

The downloaded artifact contains 21 hashed scientific files plus the hash manifest. An independent post-download audit recomputed every entry in `MANIFEST_SHA256.csv`: **21/21 match, 0 mismatches**. It also rechecked the primary disposition, exact endpoint statuses, immediate-child PASS result, the four helper additions, byte identity of head/child `Automata.dfy`, and the independent source-isolation certificate.

Key source hashes:

- parent `Automata.dfy`: `87c75e28694d24c565204cd517854c70b0b6d275c690c274da17883a6338de16`
- head `Automata.dfy`: `524686e145c5c2354c0613947f1688340bc4c869c79f8b793bfa5d5693ae0f08`
- immediate-child `Automata.dfy`: same `524686e145c5c2354c0613947f1688340bc4c869c79f8b793bfa5d5693ae0f08`
- exact parent→head diff: `24205e0e9183aadac07af0a111d090b6fda8c1cb7b6f2b1f0663927170453cad`
- head→immediate-child helper diff: `bbc7b466e104059290499a21d08acb241b7db321e6799ffc1e1191c4937c9c50`

## Population interpretation

U052 remains an **E0-as-screened** semantic unit in the frozen 100-unit census. It contributes:

- one E0 reconstruction attempt;
- one **R2 endpoint-not-green attrition**;
- **zero R4 four-way profiles**.

The unit is not recoded E1/N0/N1 after seeing source or verifier outcomes. Its failure to reach R4 is itself part of the planned attrition result: a broad same-hunk mechanical screen can surface real executable–contract co-evolution whose exact commit boundary is either transiently incomplete, semantically multi-dimensional, or both.
