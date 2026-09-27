# FSE 2027 — 126-candidate semantic census: pre-replay adjudication freeze

Date: 2026-09-27

This file records the semantic adjudication state **before any new verifier replay of the E0 units**. The upstream mechanical frame remains 126 commit candidates and 100 within-repository patch-byte units. No unit is added or removed because of the labels below.

## Primary composition

Unique patch units (n=100):
- E0 — pairable executable–contract co-evolution: **3**
- E1 — executable–contract co-evolution but mechanically inseparable: **9**
- N0 — no executable–contract co-evolution under the frozen construct: **37**
- N1 — non-pairable artifact transition: **51**

The corresponding 126 commit aliases are:
- E0: **4**
- E1: **10**
- N0: **41**
- N1: **71**

The E0 units committed to reconstruction are:
- U003 — `ChuyueSun/Clover`, benchmark role, 2 alias commits
- U030 — `Consensys-Incorporated/evm-dafny`, core/library, EIP-3860
- U052 — `franck44/evm-dis`, core/library, reverse-transition map/proofs

## Interpretation boundary

This is an exact composition of the frozen **mechanical same-hunk frame**, not an ecosystem prevalence estimate. Benchmark/dataset and bulk artifact transitions remain in the 126/100 denominators because the frame was frozen mechanically; they are stratified rather than silently deleted.

The 12 semantic co-evolution units (E0+E1) are not yet 12 replayable PASS→PASS episodes. Only E0 units proceed to R0–R4 reconstruction. E1 records genuine semantic co-evolution for which the historical fragments are not mechanically separable under the predeclared rule.

## Replay gate

No new four-way outcome has been consulted in assigning this table. After this freeze:
1. all three E0 units must be attempted;
2. R0–R3 attrition remains visible and cannot be recoded as N0/N1;
3. only R4 units contribute four-way profile counts;
4. artifact role remains visible when interpreting any favorable benchmark result.

`semantic_labels_100_pre_replay.csv` SHA-256: `b2b671cfeb17c25f5f5030cf1509fc17c1b28731983731ce88a76c552bb2e79a`
