# FSE126 negative sensitivity audit — Batch 01 freeze

Date: 2026-09-28
Repository batch: `Consensys-Incorporated/evm-dafny`
Parent protocol: `NEGATIVE_SENSITIVITY_AUDIT_FREEZE.md`

This batch audits the four frozen negative units from `Consensys-Incorporated/evm-dafny` selected by the predeclared 31-unit sensitivity rule:

- U028 — frozen N0 — commit `533db5e3ff1e9bca2ba4f407b29166bc5ca0a34a` — `Fix #621`
- U029 — frozen N0 — commit `5547027a39633f69d935e5d82014ef03379ccdaa` — `Support Shanghai Fork.`
- U031 — frozen N0 — commit `7086847ad1d750dc9ac03f40cc53b71bd81211ef` — `Add Cancun Tests`
- U033 — frozen N0 — commit `9c34c1cef1966e1f0a967c473787667146ee7fc3` — `Remove specifications from bytecodes`

No label may be changed silently. Each unit must receive exactly one sensitivity outcome:
`CONFIRM_N0`, `TENSION`, or `ERROR`.

Audit method, fixed before reviewing source context for this batch:
1. verify the exact commit/first-parent relation recorded in the frozen 100-unit table;
2. inspect every changed file and the exact diff, not only the originally triggering hunk;
3. distinguish executable operational behavior from ghost/proof/test/specification/formatting changes;
4. ask whether an existing executable declaration and an externally consumed behavioral contract both change semantically in the same historical unit;
5. if such co-evolution plausibly exists but the boundary is ambiguous or coupled to additional dimensions, record `TENSION` rather than promoting the unit;
6. use `ERROR` only if the frozen N0 label is demonstrably inconsistent with exact source context.

This is a sensitivity audit only. It does not alter the immutable pre-replay label table or the 100-unit denominator.
