# XH1 Phase-A Blind Adjudication Batching Rule

Freeze ID: `XH1-20260928`
Date: 2026-09-28
Status: fixed before inspection of any XH1 blind patch content

Phase-A candidate order is deterministic and independent of semantic content:

1. concatenate holdouts in the manifest order `V1, V2, V3, F1, F2, F3`;
2. within each holdout, use scanner-emitted candidate order (`C001`, `C002`, ...);
3. split the resulting sequence into consecutive batches of **20 candidates**, with one final remainder batch if necessary;
4. adjudicate every candidate in a batch before opening Phase-B provenance/source context for any candidate from that batch;
5. Phase A may use only the corresponding `blind/<candidate_id>.patch` text plus the frozen protocol/taxonomy. Do not open `provenance.csv`, `aliases.csv`, raw patch paths, commit metadata, repository identity, or verifier/build results during Phase A;
6. record one provisional label from `E0`, `E1`, `N0`, `N1`, `AMBIGUOUS`, an inferable target description, and a concise patch-text reason. `E0` at Phase A is only provisional because exact old/new existence and pairability are confirmed in Phase B;
7. no candidate is skipped for size, apparent importance, expected outcome, or inconvenience. If blind text is insufficient, use `AMBIGUOUS` rather than provenance leakage.

Mechanical scan counts may be used only to determine how many deterministic batches exist; they are not semantic outcomes.