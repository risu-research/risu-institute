# Verus V3 — Complete 2026 blind adjudication

This record is committed before opening the 2026 provenance mapping and before any verifier replay. The canonical annual blind queue contains 242 same-hunk candidates from 265 contract-token history hits. Repository identity and source paths are inherent in the frozen V3 stratum; commit SHA/date/subject and verifier outcomes were not used.

A complete candidate-level CSV ledger was generated from the blind packets. Its SHA-256 is:

`38b8dbd39dddc7c54c82b181c4eac485f75b79866063fd50f386af8b210ec5dc`

The ledger has exactly 242 candidate rows plus its header. It is retained in the recovery package as `V3_2026_BLIND_LEDGER.csv`.

## Result

No 2026 candidate is `ELIGIBLE` or `ELIGIBLE_CONFOUNDED`. Therefore the preregistered Verus stop condition is not reached and adjudication must continue into 2025.

Blind label counts:

- `EXCLUDE_NON_LIBRARY_CONTRACT`: 145
- `EXCLUDE_NO_EXISTING_BODY_CONTRACT_HUNK`: 45
- `EXCLUDE_SPEC_WRAPPER_NO_BODY_PAIR`: 29
- `EXCLUDE_PROOF_SPEC_OR_TRUSTED_BODY`: 16
- `EXCLUDE_ITERATOR_SPEC_REDESIGN`: 1
- `EXCLUDE_TOOL_PROOF_REFACTOR`: 1
- `EXCLUDE_GHOST_SPEC_REPRESENTATION_MIGRATION`: 1
- `EXCLUDE_PROOF_DIAGNOSTIC_MIGRATION`: 1
- `EXCLUDE_PROOF_BODY_ONLY`: 1
- `EXCLUDE_SPEC_REFACTOR_TRUSTED_WRAPPERS`: 1
- `EXCLUDE_MACRO_REFACTOR`: 1

The first four classes implement necessary conditions already fixed by the freeze receipt: the contract must govern a verified executable implementation unit; pure proof/spec/trusted-wrapper changes do not qualify; and body plus contract must co-evolve in an existing declaration rather than merely appearing somewhere in the same commit. The seven residual candidates requiring semantic patch review were Q0056, Q0060, Q0095, Q0146, Q0155, Q0177, and Q0230; all seven were excluded on blind patch content for the named reasons above, not on provenance or verifier outcome.

This is a zero-positive annual slice, not evidence that Verus as an ecosystem lacks code-contract co-evolution.
