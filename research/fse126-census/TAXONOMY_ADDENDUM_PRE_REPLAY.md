# FSE 2027 — secondary taxonomy addendum (frozen before replay)

Date: 2026-09-27.
Status: descriptive secondary coding only. This addendum does **not** alter the 126-commit frame, the 100 unique-patch denominator, the primary N0/N1/E0/E1/U labels, or the replay attrition rules frozen in `PROTOCOL_FREEZE.md`.

The direct-history screen intentionally used a broad Dafny token family. During patch-only inspection it became clear that mechanically adjacent changes can arise at different specification layers. To make attrition interpretable without changing eligibility after seeing verifier outcomes, every semantic unit will also receive the following outcome-blind descriptors before replay.

## Specification layer (`spec_kind`)

- `external_contract`: callable-routine boundary obligations such as `requires`, `ensures`, `modifies`, or `reads` whose truth constrains callers/implementations across a modular boundary.
- `internal_proof`: loop invariants, decreases clauses, assertions, lemma contracts, ghost-only obligations, and proof-maintenance annotations that do not constitute the executable routine's externally consumed behavioral contract.
- `mixed`: both external-contract and internal-proof changes occur in the unit.
- `logical_definition`: semantic predicate/function/specification definitions change, but the boundary is not a literal executable routine contract.
- `unknown`: patch bytes/source context do not permit a reliable layer assignment.

`spec_kind` is descriptive. A unit is not promoted to E0 merely because it contains a contract token; the primary semantic rubric still requires executable–contract co-evolution.

## Implementation layer (`impl_kind`)

- `executable_body`: non-ghost method/function behavior changes.
- `logical_body`: predicate/pure specification function body changes without an executable implementation transition.
- `proof_ghost`: lemma/ghost/proof-script body changes only.
- `none`: no semantic implementation-side change.
- `mixed`: more than one of the above is materially changed.
- `unknown`: insufficient context.

## Transition origin (`change_origin`)

- `modification`: an existing declaration is changed old→new.
- `addition`: the relevant declaration exists only in the new revision.
- `deletion`: the relevant declaration exists only in the old revision.
- `bulk_or_generated`: wholesale dataset/generated/benchmark/vendor transition where declaration-level old/new pairing is not a meaningful unit.
- `mixed`: multiple origin types occur.

## Why these fields are frozen now

They address a foreseeable construct-validity issue: a same-hunk search over Dafny contract tokens can overapproximate code–contract co-evolution because invariants, lemma postconditions, generated proof artifacts, and newly introduced declarations are mechanically close to executable code. Reporting this composition is scientifically useful even when most units attrit before replay. These descriptors will be assigned without consulting newly generated four-way verifier outcomes and will never be used to retroactively change the frozen frame.
