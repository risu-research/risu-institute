# XH1 Phase-A Blind Adjudication — Batch 07

Freeze ID: `XH1-20260928`  
Batch members: `F3-C019..F3-C038`  
Candidates: **20**

## Outcome discipline
Only the exact frozen blind packets were inspected. No provenance, aliases, raw unblinded patches, commit metadata, original paths, parent/head source context, build output, verifier result, or replay outcome was opened or executed. Every ledger row records `provenance_opened=0` and `verifier_executed=0`.

## Provisional result
- N0: **19**
- N1: **1** (`F3-C022`)
- E1: **0**
- E0: **0**
- AMBIGUOUS: **0**

## Deep findings
`F3-C019` and `C020` are compiler/tactic fixes paired with newly added contract-bearing regression programs, not same-target contract changes. `F3-C021` is the opposite boundary case: the Reflection round-trip lemma's precondition is tightened, but the visible implementation does not behaviorally change in the unit, so it is contract-only N0.

`F3-C022` is the only N1. New `Pulse.Lib.Comment.comment_gen` and `comment` declarations are born with explicit behavioral contracts while extraction support for those new primitives is added. Because the contract-bearing functionality has no historical old declaration, an old implementation/contract side would be fabricated.

`F3-C023..C025` are broad Custard compiler/tooling changes whose frozen lexemes are decreases/proof or otherwise not same-target behavioral contracts. `C026` adds ghost array proof helpers and remains N0 because the functions are ghost. `C027..C038` repeatedly combine genuine compiler/codegen/simplification changes with newly added Pulse regression programs carrying requires/ensures. The contracts exercise the changes rather than govern the changed compiler functions.

This batch therefore reinforces the cross-ecosystem distinction between mechanical contract-token adjacency and semantic behavior-contract co-evolution.

## Integrity
- Source-context Phase B: **not opened**
- Build/verifier/replay: **not executed**
