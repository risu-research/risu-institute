# FSE126 U003 closure — pre-verifier freeze

Date: 2026-09-28
Status: frozen before any new U003 Dafny outcome.

This operationalizes the already-frozen U003 rule in `REPLAY_ENVIRONMENT_AND_CELL_FREEZE.md`. No U003 four-way verifier result is used to choose fragments, versions, failure labels, or promotion rules.

## Historical unit

- unit: U003
- repository: `ChuyueSun/Clover`
- head: `464ecf80156798bb146a6676d50abf458e066ad2` (`add sglang clover implementation`)
- exact first parent: `097087fe670389ecbbb888c4fdeb6869b34be599`
- target: `dataset/Dafny/textbook_algo/update_array/update_array_strong.dfy`
- declaration: `UpdateElements(a: array<int>)`
- artifact role: `dataset_or_benchmark`
- pre-replay label: E0

GitHub compare establishes that head is one commit ahead of parent. The historical commit is broad, but among the two modified `.dfy` files the semantic executable/contract co-evolution is confined to `update_array_strong.dfy`. The other changed Dafny file, `replace_strong.dfy`, folds one already-present multiline loop invariant onto one line and is treated only as a formatting-sensitivity check, not as a replay dimension.

The same commit also changes `update_array_spec.txt`. That natural-language benchmark description is retained as historical intent/provenance, never spliced into verifier cells.

## Exact historical fragments

The target file contains one method. The cell constructor must locate the unique method-body opening brace after the method signature and contract clauses.

For each endpoint:

- **spec/contract fragment S** = exact bytes from the start of `method UpdateElements...` through the last `requires`/`modifies`/`ensures` line, excluding the method-body opening brace;
- **body fragment B** = exact bytes from the method-body opening brace through its matching closing brace, including both braces.

No normalization, repair, regenerated whitespace, helper declaration, or invented obligation is permitted inside either fragment.

Build exactly four primary cells:

- `B0S0`: old body + old spec
- `B1S0`: new body + old spec
- `B0S1`: old body + new spec
- `B1S1`: new body + new spec

The harness must assert before verification that `B0S0` is byte-identical to the exact parent target and `B1S1` is byte-identical to the exact head target. It must also replace the complete `UpdateElements` declaration in both endpoint files by one common placeholder and assert byte-identical residual context. Because the target consists only of that method, this is expected to be a strong isolation certificate rather than a repair operation.

## Endpoint and R-stage rules

- R0: exact source/revision cannot be recovered or hash-validated.
- R1: the frozen verifier environment cannot be executed.
- R2: either exact historical endpoint is not green under the frozen primary reconstruction environment.
- R3: the exact old/new method cannot be split and recombined mechanically under the fragment rule above without moving a third semantic artifact.
- R4: both exact endpoints are green and all four cells are executable under one fixed primary environment.

Parser/type/resolution/tool setup failures are never silently converted into semantic verifier FAIL. A cross-cell semantic FAIL requires Dafny to reach verification and report a source proof/well-formedness obligation failure attributable to that exact historical recombination.

## Primary and sensitivity verifier environments

### Primary

**Dafny 4.3.0** is frozen as the primary reconstruction environment. The February 2024 commit itself does not pin a Dafny release; later project setup documentation specifies 4.3.0. Therefore 4.3.0 is reported as a pinned reconstruction, not as a claim about the exact author's local toolchain.

Primary command:

`dafny verify <cell>.dfy`

No additional proof-strengthening flags are introduced.

### Predeclared sensitivity

**Dafny 4.4.0** runs the same four exact cell bytes after the primary run. It is a sensitivity analysis only and cannot replace the primary disposition.

The harness must preserve raw stdout/stderr, command lines, tool versions, cell SHA-256 hashes, and parsed verifier counts for both versions.

## Independent semantic witness check

After the primary four-way outcomes are fixed, the harness may compute a source-derived witness classification without changing any cell:

- detect which body versions syntactically access index `8`;
- detect the lower bound encoded by each historical `requires a.Length >= ...` clause;
- if a failing cross-pair combines a body that accesses `a[8]` with a contract admitting `a.Length == 8`, record `length_8` as a concrete array-bounds witness candidate and verify that Dafny's failure locus includes the relevant array access/well-formedness obligation.

This check is explanatory only. It must not be used to relabel a verifier outcome or invent a repaired cell.

## Historical-intent corroboration

The old `update_array_spec.txt` says index 8 stays the same, index 7 becomes 516, and index 4 increments by 3. The new description says all other elements stay the same and the array is at least 8 in length. These texts are saved and hashed as provenance. They support interpretation of the benchmark edit but are not treated as formal specifications and are not counted as a replay factor.

## Outcome discipline

1. U003 remains `dataset_or_benchmark` regardless of result.
2. A favorable nontrivial four-way profile may contribute to the frozen census composition but is never promoted to production/core evidence.
3. The primary profile is determined only by Dafny 4.3.0.
4. Dafny 4.4.0 is reported separately.
5. Exact raw failures and loci are preserved; no cross-pair is repaired to make the story cleaner.
6. U003 keeps its original E0-as-screened label even if it attrits at R0–R3.
