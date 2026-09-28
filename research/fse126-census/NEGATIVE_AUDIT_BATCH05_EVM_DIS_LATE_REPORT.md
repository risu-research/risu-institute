# FSE126 negative sensitivity audit — Batch 05 result

Date: 2026-09-28  
Repository: `franck44/evm-dis`  
Frozen units: U067, U069, U072, U078, U079, U080  
Status: **BATCH CLOSED — 6/6 audited**

## Result

Batch totals: **CONFIRM 6, TENSION 0, ERROR 0**.

| Unit | Frozen | Audit | Corrected | Core finding |
|---|---:|---:|---:|---|
| U067 | N1 | CONFIRM_N1 | N1 | `StackToCond` and its helper are born in this commit with their contracts; no old declaration exists |
| U069 | N1 | CONFIRM_N1 | N1 | `StackToHTML` and helper are new declarations; parent has neither |
| U072 | N0 | CONFIRM_N0 | N0 | existing generator methods change output behavior without changing their own contracts; many contract-looking hits are strings emitted into generated Dafny |
| U078 | N0 | CONFIRM_N0 | N0 | proof-object generator output changes, but its own method contract is stable; a newly contracted refinement generator has no predecessor |
| U079 | N0 | CONFIRM_N0 | N0 | an existing postcondition is strengthened, while the actual partition computation is unchanged apart from proof-only lemmas/asserts/attributes |
| U080 | N0 | CONFIRM_N0 | N0 | library changes are formatting; added `expect` statements are test diagnostics, not a co-evolving behavioral contract |

## Provenance gate

This batch uses the recovered exact pre-replay semantic-label snapshot rather than the stale GitHub metadata copy discovered during Batch 01. Its SHA-256 remains `b2b671cfeb17c25f5f5030cf1509fc17c1b28731983731ce88a76c552bb2e79a`.

For each of the six units, the exact original R03 `.diff.gz` was located using the recovered canonical commit, decompressed, and SHA-256 hashed independently. **6/6 decompressed patch hashes exactly match the frozen `patch_sha256` values.**

## Unit findings

### U067 — CONFIRM_N1

The commit adds two declarations to `WeakPre.dfy`: `StackToCond` and `StackToCondHelper`. The first is introduced with `ensures c.IsValid()` and a semantic body; the helper is introduced with four preconditions, three postconditions, a decreases clause, and a recursive implementation. The exact parent contains neither declaration. The only edit to a pre-existing routine is adding `{:opaque}` to `And`; `And`'s existing `requires this.IsValid()` and body are otherwise unchanged. There is therefore no historical old implementation/old contract for the newly introduced stack-to-condition functionality. N1 is confirmed.

### U069 — CONFIRM_N1

The parent `CFGState.dfy` goes directly from `ToString` to `IsBounded`; there is no stack-to-HTML routine. The patch adds `StackToHTML`, with `requires this.EGState?` and a body, plus a new recursive `StackToHTMLHelper`. Again, the body and its only behavioral precondition are born together. This is a clean new-declaration transition, not missed co-evolution. N1 is confirmed.

### U072 — CONFIRM_N0

This is an adversarial case because the patch is large and contains many textual `requires`, `ensures`, and executable-looking output changes. Source context resolves the ambiguity.

The pre-existing `ToDafny` and `PrintProofObjectBody` generator methods already have stable generator-level preconditions (`this.IsValid()`, `this.HasNoErrorState()`, and for the recursive method `index <= |a.states|`) before the patch. The commit changes what Dafny source text they print: imported modules, generated state types, generated stack expressions, generated preconditions, and generated control-flow code. Those quoted `requires`/`ensures` lines are strings emitted as generated Dafny code, not contract clauses on the generator method itself.

The patch also introduces `CFGCheckerToDafny` and `PrintCFGVerifierBody` with their own contracts, but these declarations have no historical old counterparts. Thus there is real executable/tool-output behavior change, yet no existing generator implementation whose own behavioral contract co-evolves. Treating generated contract text as the generator's source contract would be a construct error. N0 is confirmed.

### U078 — CONFIRM_N0

This commit again changes the proof-object generator substantially. `PrintProofObjectBody` switches the generated state representation back toward `EvmState.State`, changes generated preconditions, changes the generated terminal result shape, and suppresses recursive successor emission. Its own method contract, however, remains the same (`this.IsValid()`, `this.HasNoErrorState()`, `index <= |a.states|`, with the same decreases measure). The apparent contract movement is primarily inside strings representing the generated Dafny artifact.

A new `CFGRefineToDafny` method is added with `requires this.IsValid()` and `requires this.HasNoErrorState()`. Because that method did not exist in the parent, its contract/body cannot form an old/new historical pair. U078 therefore remains N0 rather than E0/E1.

### U079 — CONFIRM_N0

U079 is the strongest contract-side adversarial case in this batch. `SplitTrueAndFalse` is pre-existing and one postcondition is genuinely strengthened from `forall x:: x in SetU(r) ==> x < n` to `forall x:: x in SetU(r) ==> x in xs && x < n`.

But the semantic result computation is unchanged: it still constructs `xsTrue`, `xsFalse`, returns `[xsTrue]` when the false set is empty, otherwise returns `[xsTrue] + SplitTrueAndFalse(xsFalse, equiv, n)`. The newly inserted `lem1` and `lem2` calls, assertions, verification attributes, and time-limit/isolation attributes are proof/verification machinery; the two new lemmas are proof declarations. Other files in the commit similarly add verifier attributes or assertions.

So U079 is not a missed implementation-contract repair. It is a real contract strengthening plus proof-engineering work without a semantic executable-body transition of the same routine. N0 is confirmed.

### U080 — CONFIRM_N0

The core `EVMObject.dfy` edits are whitespace/comment formatting only. In `LoopDetectionTests.dfy`, `PrintPath` is reformatted but its existing precondition `|p.states| == |p.exits| + 1` is unchanged. The only substantive additions are `expect` checks inside a test loop that expose/diagnose path-index assumptions. These are test diagnostics, not a changed behavioral contract paired with a changed core executable routine. Remaining minimiser-test edits are whitespace. N0 is confirmed.

## Effect on the census

Batch 05 produces **no new adjudication correction**. The only correction after 24 audited units remains the Batch 04 correction U061 `N0 -> N1`.

- frozen composition: E0=3, E1=9, N0=37, N1=51;
- audited-corrected overlay: **E0=3, E1=9, N0=36, N1=52**;
- E0+E1 remains 12;
- E0 replay denominator remains 3;
- completed replay outcomes remain unchanged.

## Cumulative negative-audit status

After Batches 01–05: **24/31 audited = 23 CONFIRM, 0 TENSION, 1 ERROR**.

Remaining seven frozen suspicious negatives: `U082, U083, U084, U086, U087, U090, U097`.
