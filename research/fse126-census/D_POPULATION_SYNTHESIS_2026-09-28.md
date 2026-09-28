# FSE126 Stage D — Population Synthesis

Date: 2026-09-28  
Status: **D1 canonical population synthesis complete**

## Executive result

The frozen direct-history screen contains **126 commit candidates**, which collapse to **100 within-repository unique patch-byte units**. The pre-replay semantic adjudication classified **12/100 units as executable–contract co-evolution** (E0=3, E1=9). A preselected adversarial audit of 31 suspicious negative units found three classification errors; two remained negative-subclass corrections and one (U087) moved N1→E1. The transparent audit-corrected descriptive overlay is therefore **13/100 semantic co-evolution units: E0=3, E1=10**.

This is a composition of the frozen mechanical frame, **not an ecosystem prevalence estimate**.

The frozen replay-eligible denominator remains exactly **three E0 units**. All three were attempted. Two reached R4 and yielded nontrivial but opposite one-sided compatibility profiles:
- U003: **P/P/F/P** (benchmark role);
- U030: **P/F/P/P** (core/library role).
U052 stopped at **R2** because the exact frozen head was not green; it remains in the attrition denominator.

## Population funnel

| Stage | Count | Meaning |
|---|---:|---|
| Mechanical same-hunk commit candidates | 126 | frozen commit frame |
| Unique patch-byte semantic units | 100 | primary semantic denominator |
| Frozen semantic co-evolution E0+E1 | 12 | pre-replay primary adjudication |
| Audit-corrected semantic co-evolution E0+E1 | 13 | sensitivity overlay only |
| Frozen pairable E0 | 3 | all attempted |
| R4 executable four-way | 2 | U003, U030 |
| R2 endpoint not green | 1 | U052 |

## Frozen versus audit-corrected composition

| Label | Frozen units | Frozen commit aliases | Corrected units | Corrected commit aliases |
|---|---:|---:|---:|---:|
| E0 | 3 | 4 | 3 | 4 |
| E1 | 9 | 10 | 10 | 11 |
| N0 | 37 | 41 | 35 | 39 |
| N1 | 51 | 71 | 52 | 72 |

Commit aliases are occurrence counts, **not independent semantic votes**.

## Adversarial negative audit

The negative audit was intentionally biased toward the units most likely to expose false negatives: core/library, modification, <=5 files, no added/deleted files, and a patch-level executable signal. It is therefore a sensitivity analysis, not a random validation sample.

Final outcome:
- **28 CONFIRM**
- **0 TENSION**
- **3 ERROR**

Corrections:
- U061: N0→N1
- U083: N0→N1
- U087: N1→E1

Only U087 changes whether a unit belongs to semantic co-evolution. Crucially, **no correction changes E0**, so the frozen replay denominator and every replay outcome remain untouched.

## Repository concentration

The 100 unique units occur in 8 repositories that contributed at least one mechanical candidate. Corrected semantic co-evolution is concentrated in three repositories:

- `franck44/evm-dis`: 9 corrected E0/E1 units
- `ChuyueSun/Clover`: 2 corrected E0/E1 units
- `Consensys-Incorporated/evm-dafny`: 2 corrected E0/E1 units

Of the 13 corrected E0/E1 units, **10 are coded core_or_library**, 2 dataset_or_benchmark, and 1 mixed. This improves the evidence base beyond a single benchmark, but it also means repository dependence remains a major limitation: 9/13 corrected E units come from `franck44/evm-dis`.

## Replay attrition and directionality

All frozen E0 units were attempted:
- R4: 2/3
- R2: 1/3
- R0/R1: 0
- R3 as primary stopping stage: 0

Among the two R4 units, neither is P/P/P/P:
- U003 is P/P/F/P: the new implementation is backward-compatible with the old contract, but the old implementation is unsafe under the new widened input domain.
- U030 is P/F/P/P: the new implementation introduces a result excluded by the old contract, while the old implementation remains admissible under the new contract.

The exact R4 subset therefore demonstrates **both directions of one-sided incompatibility** inside the frozen replay set. This is an exact descriptive fact about two R4 units, not a frequency estimate.

## What the population study establishes

1. A broad same-hunk contract-token screen is substantially overinclusive: most mechanical hits are proof-only, new declarations, generated-artifact effects, contract-only evolution, or otherwise not a pairable implementation–contract historical transition.
2. Semantic co-evolution nevertheless survives the screen in a nonzero set of real historical units, including core/library units.
3. Pairability is materially rarer than semantic co-evolution: the corrected overlay contains 13 E units, but only the three pre-replay E0 units are mechanically swappable under the frozen rule.
4. Transparent attrition matters. U052 shows that a seemingly pairable semantic episode can fail the PASS→PASS endpoint gate at the exact commit boundary.
5. When pairable PASS→PASS episodes do survive, the two observed R4 units expose opposite directional incompatibilities rather than universal cross-compatibility.

## What it does not establish

- No ecosystem-wide prevalence.
- No random-sample estimate for Dafny repositories.
- No false-negative rate from 3/31, because the 31 were intentionally selected as suspicious negatives.
- No independence assumption across units in the same repository or adjacent history.
- No claim that E1 units would yield the same four-way behavior if one invented a decomposition.
- No claim that the favorable U003 benchmark is production evidence.

## Data-lineage and integrity checks

- The recovered exact 100-unit pre-replay semantic-label snapshot has SHA-256 `b2b671cfeb17c25f5f5030cf1509fc17c1b28731983731ce88a76c552bb2e79a`.
- The original frame hash record is preserved in `FRAME_SHA256.txt`.
- The reconstructed 126-commit alias map joins **126/126 commits** to a frozen 100-unit `(repo, patch_sha256)` key and reproduces every unit's recorded alias count **100/100**. It is therefore used here as a validated alias map, not represented as byte-identical to the original frozen `population_126_commits.csv`.
- The 31-unit audit ledger and three explicit corrections remain preserved on this branch.

## Stage-D judgment boundary

This completes the **descriptive population synthesis**. It deliberately stops short of the Stage-E manuscript decision. The strongest immediate implication is that v14 can now be supported by a real frozen population/attrition study rather than by three deep cases alone, but the evidence is still concentrated: only three predeclared E0 units were replayable candidates, only one core/library E0 reached R4, and corrected E units are dominated by one repository. Those facts must remain visible when deciding whether to rewrite the paper around the population study or keep it as a strong validation layer.
