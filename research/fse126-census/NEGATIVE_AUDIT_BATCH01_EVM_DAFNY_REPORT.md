# FSE126 negative sensitivity audit — Batch 01 result

Date: 2026-09-28
Repository: `Consensys-Incorporated/evm-dafny`
Frozen units: U028, U029, U031, U033
Status: **BATCH CLOSED — 4/4 audited**

## Result

All four frozen N0 labels are confirmed under exact preserved patch bytes plus source-context review:

| Unit | Result | Key distinction |
|---|---|---|
| U028 | **CONFIRM_N0** | real executable RETURNDATA repair, but the changed `CreateReturn` contract is unchanged; the mechanical contract hit is a newly added logical predicate precondition |
| U029 | **CONFIRM_N0** | Shanghai configuration/runtime support is added, but the only Dafny `ensures` hit is a new proof lemma, not a contract on the changed executable behavior |
| U031 | **CONFIRM_N0** | Cancun/opcode/configuration semantics change, but the contract hit is the new `CancunFacts` proof lemma; no existing executable routine's behavioral contract co-evolves |
| U033 | **CONFIRM_N0** | specifications are removed/commented for verification performance while executable bytecode bodies remain semantically unchanged |

Batch totals: **CONFIRM 4, TENSION 0, ERROR 0**.

## U028 — important reason clarification

The frozen label is correct but its one-line reason was imprecise. The exact commit is a genuine runtime-semantics bug fix: failed contract-creation paths are changed to clear RETURNDATA. Source context shows that `CreateReturn` retains exactly the same `requires` clauses across the repair. The candidate entered the mechanical frame because the same patch also adds `IsEipActive`, a predicate with `requires this.EXECUTING?`. That new predicate is not the contract of the changed `CreateReturn` implementation and is not used by the repair. Hence U028 is not “no executable change”; it is **executable change without paired behavioral-contract change**, which is exactly N0 under the frozen construct.

## U029 and U031 — proof contracts are not behavioral co-evolution

Both commits add fork semantics/configuration and a `{:verify false}` facts lemma with an `ensures`. Treating the lemma postcondition as if it were the behavioral contract of `EipBytecodes` or the fork configuration would manufacture a code–contract pair that does not exist historically. U031 in particular modifies `EipBytecodes` and opcode constants while adding a separate `CancunFacts` proof lemma. These remain N0.

## U033 — contract-only maintenance

The commit message explicitly describes an experiment removing unnecessary `ensures` clauses to speed verification. Exact patch inspection shows mass removal of bytecode postconditions plus commented postconditions/formatting changes in memory/byte utilities. There is no corresponding semantic executable-body transition. This is a clean N0 confirmation.

## Provenance and metadata reconciliation

The audit discovered that the GitHub-rendered semantic-label CSV carried stale/reconstructed SHA metadata for these unit IDs. The preserved pre-replay local semantic-label snapshot, its contemporaneous SHA-256, `unit_metadata.csv`, exact R03 patch bytes, and current upstream commits all agree on the corrected unit mappings used here. A separate metadata-recovery note records this without overwriting either the frozen labels or historical GitHub artifact.

This batch is a sensitivity audit only. It changes no frozen primary label and contributes no new population denominator.
