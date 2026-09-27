# FSE 2027 — 126-candidate semantic census protocol freeze

Frozen before semantic adjudication or verifier replay of the 126 recent direct-history candidates.
Date: 2026-09-27.

## 1. Frozen retrieval frame

The source frame is the completed ten-repository direct-history sensitivity arm already used by the paper. A commit enters this census iff:

1. it belongs to one of the exact ten repositories in the prior frozen frame;
2. its commit date is 2024-01-01 or later;
3. a `.dfy` diff changes at least one Dafny contract-token line (`requires`, `ensures`, `invariant`, `modifies`, `reads`, or `decreases`); and
4. the same diff hunk contains at least one other substantive changed `.dfy` line after excluding blank, comment-only, and delimiter-only lines.

The completed direct-history audit reports 126 such commit candidates. Reconstructing the preserved first-nine-repository patches and the separately completed `verified-betrfs` arm reproduces 126 exactly. The frame is closed: no candidate may be added or removed because of later semantic or verifier outcomes.

## 2. Two denominators, fixed in advance

- **Commit-candidate frame:** all 126 qualifying commits. This preserves the original mechanical census.
- **Semantic-adjudication units:** exact duplicate patch bytes within a repository are collapsed by `(repository, patch_sha256)`, while every alias commit remains recorded. This yields 100 unique patch units. Duplicate collapse prevents branch/cherry-pick aliases from receiving multiple semantic votes without erasing their occurrence in the 126-commit frame.

All composition tables will report both denominators where relevant. Four-way replay profiles will be counted by unique patch unit, with alias multiplicity reported separately.

## 3. Blinding and adjudication order

Semantic adjudication is performed before any new verifier result for these units is observed.

### Stage A — blinded patch adjudication

The adjudicator sees only a synthetic unit ID and patch text. Repository, commit SHA, date, subject, and historical verification outcome are hidden.

Each unit receives exactly one primary semantic label:

- **N0 — no executable–contract co-evolution.** The same-hunk mechanical hit does not contain a semantic change to executable implementation behavior together with a semantic contract change. Examples include formatting, comments, proof/lemma-only edits, assertion/proof-script maintenance, and contract-only changes accompanied by unrelated non-executable text.
- **N1 — non-pairable artifact transition.** Semantic Dafny content changes, but the patch is a wholesale artifact addition/removal, generated/dataset/benchmark import, rename, or comparable transition for which old/new implementation and contract fragments do not form a meaningful mechanically swappable historical pair.
- **E0 — candidate executable–contract co-evolution, mechanically separable from the patch.** A semantic executable implementation change and a semantic contract change can be identified as distinct historical fragments without inventing behavior or obligations.
- **E1 — executable–contract co-evolution, but mechanically inseparable.** Both semantic sides move, but constructing cross-pairs would require semantic invention, broad refactoring reversal, or non-historical repair choices.
- **U — unresolved from blinded patch bytes.** Patch context is insufficient to distinguish the above categories. A U unit proceeds to Stage B, never directly to replay.

### Stage B — outcome-blind source-context adjudication

For U units only, repository identity and surrounding source may be revealed, but verifier outcomes for reconstructed cells remain unseen. The unit is resolved to N0/N1/E0/E1 with a written reason. No verifier execution occurs until the semantic label is fixed.

## 4. Replay eligibility and attrition labels

Every E0 unit proceeds to historical reconstruction. Replay attrition is recorded rather than silently excluded:

- **R0 — exact source unavailable:** one of commit/parent/source fragments cannot be recovered or hash-validated.
- **R1 — environment unavailable:** historical/pinned verifier setup cannot be reconstructed within the declared reproducibility budget.
- **R2 — endpoint not green:** old/old or new/new fails under the fixed reconstructed verifier environment. This unit is a real co-evolution episode but not a PASS→PASS replay episode.
- **R3 — cross-pair construction fails mechanical-isolation checks:** later source context shows that the purported separability cannot be implemented without moving non-predeclared semantics. The semantic label remains E0-as-screened, but the replay is marked unavailable and the reason retained.
- **R4 — four-way executable:** both historical endpoints verify and the two cross-pairs can be built mechanically. All four outcomes are executed under one fixed environment.

No R0–R3 unit is recoded as N0/N1 merely because replay is inconvenient.

## 5. Four-way outcome coding

For each R4 unit report `(old/old, new/old, old/new, new/new)` with raw verifier counts and failure loci. Because R4 requires both historical endpoints to pass, the principal cross-pair profiles are:

- P/P/P/P — both cross-pairs compatible;
- P/P/F/P — new implementation backward-compatible; old implementation fails new contract;
- P/F/P/P — old implementation forward-compatible; new implementation fails old contract;
- P/F/F/P — both cross-pairs fail.

Any infrastructure result is never coded as verifier FAIL.

## 6. Population claims permitted and forbidden

Permitted:
- exact composition of the frozen 126-commit / 100-unique-patch frame;
- exact attrition flow from mechanical hit → semantic class → replayability;
- exact four-way profile distribution among R4 units;
- repository and artifact-type stratification within this frozen frame;
- sensitivity analyses that preserve the frozen frame and labels.

Forbidden without a new sampling design:
- ecosystem-wide prevalence claims;
- treating the ten repositories as a random or representative Dafny sample;
- counting duplicate patch aliases as independent semantic episodes;
- promoting benchmark/generated examples to production evidence after seeing favorable outcomes;
- changing semantic categories or replay eligibility because an outcome is interesting.

## 7. Mechanism follow-up rule

Only after the complete semantic census and all feasible R4 replays are fixed may individual units be selected for deeper obligation/topology/bridge analysis. Such follow-ups are mechanism studies, not additional population observations.

## 8. Frozen outputs

This freeze consists of:
- `population_126_commits.csv`
- `semantic_units_100_unblinded.csv`
- `semantic_units_100_blinded.csv`
- `FRAME_SHA256.txt`
- this protocol

The freeze commit precedes new semantic labels and new verifier outcomes for this census.
