# XH1 Phase-A Blind Adjudication — Batch 02

Freeze ID: `XH1-20260928`
Batch members: `V2-C006` + `V3-C001..V3-C019`
Candidates: **20**

## Outcome discipline

Only frozen blind packets were inspected. No `provenance.csv`, `aliases.csv`, raw patch, repository identity, commit metadata, source-context lookup, build, verifier, or replay outcome was used.

Provisional Phase-A counts:

- N0: **15**
- N1: **5**
- E0: **0**
- E1: **0**
- AMBIGUOUS: **0**

These are provisional blind labels. Every N1/E0/E1/AMBIGUOUS unit must be source-context adjudicated in Phase B before any verifier execution.

## Main blind findings

The five provisional N1 units are `V2-C006`, `V3-C004`, `V3-C008`, `V3-C010`, and `V3-C019`. Each is classified N1 because the qualifying functionality is born, relocated/promoted, or newly modeled in the unit rather than exposing a historical old/new declaration pair that can be swapped mechanically.

`V3-C012` is a useful mechanical-screen negative: the huge update contains many literal words such as “requires” and Rust variance identifiers such as `invariant`, but blind inspection does not show Verus behavioral-contract clauses co-evolving with the changed executable targets. It is provisional N0.

Several other N0 units (`V3-C002`, `V3-C006`, `V3-C007`) combine real compiler implementation changes with contract-bearing *test programs*. The frozen same-hunk screen therefore finds them, but the contract text governs the code being tested rather than the compiler routine that changed.

Iterator-library units `V3-C011`, `C013`–`C017` primarily add external specifications, proof models, or client tests for standard-library behavior whose executable implementation is not changed in the blind patch. They remain provisional N0 rather than being promoted merely because their specification text is extensive.

## Integrity

Each row records the exact blind-packet SHA-256. Every row is explicitly marked `provenance_opened=0` and `verifier_executed=0`. Phase B must not begin for Batch 02 until this ledger is committed.
