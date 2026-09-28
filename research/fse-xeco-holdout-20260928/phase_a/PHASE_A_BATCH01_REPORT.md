# XH1 Phase-A Blind Adjudication — Batch 01

Freeze ID: `XH1-20260928`  
Batch rule: frozen before blind inspection in `PHASE_A_BATCHING_RULE.md`  
Batch members: `V1-C001..V1-C015` + `V2-C001..V2-C005`  
Candidates: **20**

## Outcome discipline

This ledger was produced from `blind/<candidate>.patch` text only. Repository identity, commit SHA/date/subject, original paths, `provenance.csv`, `aliases.csv`, raw patches, source context, build results, and verifier outcomes were not used. No verifier/build was run.

Provisional Phase-A counts:

- N0: **14**
- N1: **4**
- E1: **1**
- E0: **0**
- AMBIGUOUS: **1**

These are **not final semantic labels**. Under the frozen protocol, every provisional E0/E1/N1/AMBIGUOUS unit requires Phase-B exact source-context adjudication before any verifier outcome is observed.

## Highest-information blind findings

`V1-C010` is provisional **E1**. Blind text shows existing executable pointer calculations moving from integer/PPtr reconstruction to raw-pointer `with_addr` operations while contracts add pointer provenance/metadata guarantees. The same unit is a broad pointer-model/type migration across many declarations, so the blind patch does not expose a unique whole-unit two-factor split.

`V1-C003` is intentionally **AMBIGUOUS**, not forced into a favorable or negative class. The patch changes `PCell::empty` to initialized cells while also migrating permission/value APIs and contracts. Blind text alone cannot establish whether this is only verification-library representation migration or a semantic initialization transition.

The four provisional N1 units are structural additions/deletions/relocations rather than clean existing-declaration old/new pairs: `V1-C004`, `V1-C012`, `V1-C013`, and `V1-C015`.

The remaining fourteen units are provisional N0 for proof/spec/tool-language migrations or contract-only/proof-only changes without blind evidence of a semantic executable-behavior transition on the same target.

## Integrity

Every ledger row records the SHA-256 of the exact blind packet used. `provenance_opened=0` and `verifier_executed=0` are explicit per-row fields.

Phase B must not begin for this batch until this ledger is committed.
