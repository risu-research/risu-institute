# FSE126 U003 closure result

Date: 2026-09-28
Status: **CLOSED — R4**
Primary four-way profile: **P/P/F/P** in frozen order `(B0S0, B1S0, B0S1, B1S1)` = `(old body/old spec, new body/old spec, old body/new spec, new body/new spec)`.
Artifact role remains **`dataset_or_benchmark`**. This result is not promoted to production/core evidence.

## Historical unit

Repository: `ChuyueSun/Clover`  
Historical commit: `464ecf80156798bb146a6676d50abf458e066ad2` (`add sglang clover implementation`)  
Exact first parent: `097087fe670389ecbbb888c4fdeb6869b34be599`  
Target: `dataset/Dafny/textbook_algo/update_array/update_array_strong.dfy`  
Declaration: `UpdateElements(a: array<int>)`.

GitHub history confirms that the head is exactly one commit ahead of the frozen parent. The commit is broad (new Clover implementation/log files plus benchmark edits), but among changed Dafny files there are exactly two: the target `update_array_strong.dfy` and `replace_strong.dfy`. The latter is whitespace/layout-only under the frozen token-insensitive check: removing whitespace yields identical old/new text. It is therefore not treated as a semantic replay dimension.

The same commit changes `update_array_spec.txt`. The old natural-language description explicitly says index 8 stays the same; the new description instead says all other elements stay the same and the array is at least 8 in length. Those descriptions are retained only as historical-intent provenance, never as formal replay fragments.

## Frozen mechanical partition

The target contains exactly one method. As predeclared before verifier execution, the method was split at its unique stand-alone body-opening brace:

- `S0` / `S1`: exact historical method signature plus `requires` / `modifies` / `ensures` bytes, excluding the opening brace;
- `B0` / `B1`: exact historical brace-delimited body bytes.

The four cells were generated only by concatenating those exact historical fragments. No compatibility edit or invented obligation was introduced.

Machine checks establish:

- `B0S0` is byte-identical to the exact parent target;
- `B1S1` is byte-identical to the exact head target;
- the target has no residual semantic context outside the unique `UpdateElements` declaration;
- companion `replace_strong.dfy` is whitespace-insensitive identical across endpoints.

Key exact target SHA-256 values:

- parent target: `4112f695a73616fb66950a806295607dacf6aab355c8b20f4e8fb459cd473661`
- head target: `d0e1ab20b4554bacb980b4ffa1abd66a19f02c8d129940738f25c6edce950788`
- `B1S0`: `14af35f84475a17f5e4cfc72726ef8489d4c40d2765418e3eca2acf840416ab0`
- `B0S1`: `0ba8856eb58848058d8274ab11ddbc5253121356c7ea02ff6d988a3178377d02`

## Primary reconstruction environment

Primary verifier: **Dafny 4.3.0**.  
Command for every endpoint/cell: `dafny verify <file>.dfy`.

The exact February 2024 historical commit does not itself pin a Dafny release. The already-frozen protocol selected 4.3.0 because Clover project setup documentation specifies that release. Therefore this is a pinned reconstruction environment, not a claim that the author necessarily used exactly 4.3.0 for this commit.

## Exact endpoint gate

| exact revision | result | verifier count |
|---|---|---:|
| parent `097087fe...` | **PASS** | 2 verified / 0 errors |
| head `464ecf80...` | **PASS** | 2 verified / 0 errors |

Both exact historical endpoints therefore satisfy the PASS→PASS gate, and the mechanically isolated unit proceeds to R4.

## Primary four-way replay

| cell | body | spec | result | verifier count |
|---|---|---|---|---:|
| `B0S0` | old | old | **PASS** | 2 / 0 |
| `B1S0` | new | old | **PASS** | 2 / 0 |
| `B0S1` | old | new | **FAIL** | 1 / 1 |
| `B1S1` | new | new | **PASS** | 2 / 0 |

Primary profile: **P/P/F/P**.

The sole failing cross-pair reaches Dafny verification normally. Dafny reports exactly:

`B0S1.dfy(8,8): Error: index out of range`

at the old-body access to `a[8]` in:

`a[4], a[8] := a[4] + 3, a[8] + 1;`

This is not an infrastructure, parser, resolver, timeout, or solver-classification artifact.

## Why B0S1 fails — exact mechanism

The historical change couples two distinct semantic moves.

**Old contract (`S0`)** requires `a.Length >= 9` and explicitly requires index 8 to finish unchanged. The old body (`B0`) temporarily increments `a[8]` and then decrements it, restoring the original value. Under length at least 9, that body is well-defined and satisfies the old postconditions.

**New contract (`S1`)** weakens the input bound to `a.Length >= 8` and strengthens the frame-style postcondition to require every index except 4 and 7 to remain unchanged. The new body (`B1`) removes all index-8 accesses and changes only indices 4 and 7.

The old body is behaviorally compatible with the new frame postcondition whenever the array is long enough: at length at least 9 it restores index 8 and leaves other non-4/non-7 positions unchanged. The incompatibility is instead exposed by the **precondition widening**. `S1` admits an array of length exactly 8, but `B0` accesses index 8, which is out of bounds. Thus the P/P/F/P profile is explained by a concrete well-formedness witness rather than an opaque proof failure.

The predeclared source-derived witness check independently records:

- old spec minimum length = 9;
- new spec minimum length = 8;
- old body literal indices = `{4,7,8}`;
- new body literal indices = `{4,7}`;
- new spec admits length 8;
- old body accesses index 8;
- therefore length 8 is a concrete bounds witness for `B0S1`.

The raw Dafny failure locus agrees exactly with that source-derived witness.

## Why B1S0 passes

`B1` is backward-compatible with `S0`: the old contract's stronger length precondition (`>=9`) is sufficient for the new body's accesses, the new body increments index 4 by 3, sets index 7 to 516, and does not touch index 8. Hence the old index-8 preservation obligation remains satisfied.

This asymmetry is therefore substantive: the implementation cleanup supports the old contract, while the widened new input domain is unsafe for the old implementation.

## Predeclared Dafny 4.4.0 sensitivity

The same four exact cell bytes were re-run under Dafny `4.4.0+707b18acee078b3aa4d84c0590a980966bf22428`.

| cell | 4.4.0 result | verifier count |
|---|---|---:|
| `B0S0` | **PASS** | 2 / 0 |
| `B1S0` | **PASS** | 2 / 0 |
| `B0S1` | **FAIL** | 1 / 1 |
| `B1S1` | **PASS** | 2 / 0 |

Sensitivity profile: **P/P/F/P**, identical to the primary result. The same `a[8]` index-out-of-range locus is reported. This sensitivity result does not alter the primary 4.3.0 disposition.

## Artifact integrity and independent post-download audit

Primary workflow run: `36362455983`  
Workflow head: `d39d4904b0baa31457a2339fcd4c650631e351e7`  
Artifact ID: `10945877789`  
Artifact: `fse126-U003-closure-primary-4.3.0-sensitivity-4.4.0`  
Actions artifact ZIP SHA-256: `c7687a21a5094e7bbe2e4e234818040f97c81ec57383c9667e3496b78b0ed3b7`.

The artifact was downloaded independently after the workflow completed. Its locally recomputed ZIP SHA-256 equals the Actions digest exactly. The archive contains 50 files total: 49 scientific/provenance files plus `MANIFEST_SHA256.csv`. Every one of the **49 manifest entries recomputed correctly (49/49; 0 mismatches)**.

The independent audit also reconfirmed:

- `B0S0` bytes equal the exact parent target bytes;
- `B1S1` bytes equal the exact head target bytes;
- primary and sensitivity profiles are both P/P/F/P;
- primary `B0S1` and sensitivity `B0S1` each report one `index out of range` error at the historical `a[8]` access;
- source-derived length-8 witness facts match the failure locus.

## Population interpretation

U003 remains an **E0-as-screened** unit and contributes one **R4 P/P/F/P** profile to the frozen semantic-census replay denominator.

It remains benchmark evidence only. The favorable nontrivial profile is not converted into a production episode and is not used to imply ecosystem prevalence. Its value is narrower and cleaner: within the frozen candidate frame, an exact historical benchmark edit demonstrates that two green endpoint revisions can hide a one-sided compatibility failure caused specifically by an implementation's access domain lagging behind a widened contract domain.
