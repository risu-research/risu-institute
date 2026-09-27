# FSE126 negative-label sensitivity audit — target freeze

Date: 2026-09-27

Purpose: stress-test the semantic census for false-negative N0/N1 decisions. This is a **post-classification sensitivity audit**, not an independent blinded rater and not a new population denominator.

The audit target is selected mechanically from the already frozen 100-unit table plus patch-only feature vectors, without using a unit's verifier replay outcome. A frozen N0/N1 unit is audited iff all conditions hold:

1. `artifact_role == core_or_library`;
2. `change_origin == modification`;
3. `changed_files <= 5`;
4. `new_files == 0` and `deleted_files == 0`;
5. patch-only `exec_signal > 0`.

This deliberately overselects suspicious negatives: any unit that looks even superficially like existing executable code plus contracts is re-opened at source context. The rule selects 31 units:

`U028,U029,U031,U033,U043,U044,U045,U046,U047,U049,U050,U051,U054,U055,U057,U058,U059,U061,U067,U069,U072,U078,U079,U080,U082,U083,U084,U086,U087,U090,U097`

Audit outcomes are restricted to:
- `CONFIRM_N0` / `CONFIRM_N1`: source context supports the frozen negative label;
- `TENSION`: plausible executable–contract co-evolution exists but the source-context boundary remains ambiguous;
- `ERROR`: the frozen label is demonstrably inconsistent with the exact patch/source context.

The primary pre-replay label file is immutable. Any `ERROR` must be reported as an adjudication correction with both old and corrected labels; it may not be silently overwritten. `TENSION` is retained as a sensitivity finding rather than opportunistically promoted to E0/E1.
