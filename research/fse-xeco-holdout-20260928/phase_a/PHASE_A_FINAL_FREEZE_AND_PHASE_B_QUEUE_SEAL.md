# XH1 Phase-A Final Freeze and Phase-B Queue Seal

Freeze ID: `XH1-20260928`

Phase A is complete for all **142/142** retained mechanical units. No source-context or verifier/build/replay outcome was used to create the provisional labels.

## Final provisional Phase-A counts
- N0: **109**
- N1: **19**
- E1: **13**
- E0: **0**
- AMBIGUOUS: **1**

By ecosystem:
- Verus: N0=49, N1=10, E1=1, E0=0, AMBIGUOUS=1
- F*/Pulse: N0=60, N1=9, E1=12, E0=0, AMBIGUOUS=0

## Deterministic N0 negative-audit seal
Per the frozen protocol, within each ecosystem every provisional N0 was ranked by SHA-256 of `XH1-20260928|candidate_id|patch_sha256`; the first `min(20,N0_count)` were selected. This selection was computed after Phase A completion and before any Phase-B source context was opened.

- Verus N0 population: **49**; deterministic audit subset: **20**
- F*/Pulse N0 population: **60**; deterministic audit subset: **20**

## Frozen Phase-B queue
All provisional E1/N1/AMBIGUOUS units are mandatory Phase-B source-context units, together with the 40 deterministic N0 audit units. The frozen queue therefore contains **73** units: Verus **32**, F*/Pulse **41**.

No source context has been opened for this queue and no verifier/build/replay has been executed as part of this seal. Final semantic labels must be fixed before verifier outcomes are observed.
