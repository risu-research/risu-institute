# XH1 Scanner Execution Checkpoint — Six Strata Complete

Freeze ID: `XH1-20260928`
Date: 2026-09-28
Original seal commit: `3b5827242eab51a41326b33dca048128749189eb`
Execution amendment: `XH1-A1`
Trigger commit: `633dea12f5dd935c415dbdb83e3405f109810fd6`
GitHub Actions run: `36373517423`
Run conclusion: **success**

## Scientific-execution status

All six frozen strata completed the exact sealed **mechanical scanner**. The push wrapper checked out the original seal commit, verified scanner Git blob `f5b233e573bf3f760dfeee50cb103231d063460a`, extracted the sealed clone/scan shell bodies, and executed those exact bodies. No verifier, build, four-way replay, or source-context semantic adjudication was executed by this run. Each artifact contains `WRAPPER_PROVENANCE.txt` with `verifier_executed=false`.

The wrapper-extracted sealed shell bodies had SHA-256:

- clone step: `62de35bcf8ee55759f692b43ae0b5298952b2c692d4a032312296b0b52798261`
- scan step: `8d5d0464288c405612d6b95d6bcb8dbb7f7802e3a024ed8e6256479464e7197f`

## Six frozen scan outputs

| ID | Frozen repository | contract-diff commits examined | same-hunk occurrences | unique units retained | cap | Artifact ID | Artifact ZIP SHA-256 |
|---|---|---:|---:|---:|---:|---:|---|
| V1 | `verus-lang/verified-memory-allocator` | 20 | 15 | 15 | 40 | 10950257187 | `309952e8693fc2f7919f52dbeaaf80b29a58461f292bb4d1e7cb6bb78746a3e2` |
| V2 | `verus-lang/verified-ironkv` | 6 | 6 | 6 | 40 | 10949569309 | `80cea5db691548bd2ed48d5670248f552e8ae9e5ce673f206f8b405803a17a20` |
| V3 | `verus-lang/verus` | 849 | 711 | 40 | 40 | 10949828303 | `0daaa2f92880866dea05567c1cc1f8e849f0c673eef945db7e318c8a55376f8d` |
| F1 | `hacl-star/hacl-star` | 64 | 60 | 40 | 40 | 10950600080 | `894412a8dba6bafded8afe8ce8f528ad680d8571ec65ce6453766bb58e33a86f` |
| F2 | `project-everest/mitls-fstar` | 1 | 1 | 1 | 40 | 10949599112 | `0652e4a2d6cf76e7717ef3944c2964c9a2ed70c14abca3d337eb9b9d5798b803` |
| F3 | `FStarLang/FStar` | 1162 | 1062 | 40 | 40 | 10949914391 | `eda60fa7aaa30e0c21e885730f74ac289ef08817b39149f742222496d95e6115` |

The frozen holdout therefore contains **142 retained blind mechanical units** after within-repository patch-byte deduplication and the predeclared 40-unit cap. This count is only the bounded holdout workload; it is not an ecosystem prevalence denominator.

## Artifact integrity audit

Downloaded artifact ZIP bytes were independently SHA-256 checked against the Actions artifact digests. Internal `SHA256SUMS.txt` entries were independently recomputed after extraction:

- V1: 35/35 internal entries match
- V2: 17/17 match
- V3: 85/85 match
- F1: 85/85 match
- F2: 7/7 match
- F3: 85/85 match

No mismatch was observed.

## Phase-A status at this checkpoint

Before any blind packet was inspected, deterministic batching was fixed in `PHASE_A_BATCHING_RULE.md`: manifest order V1,V2,V3,F1,F2,F3, scanner order within stratum, consecutive 20-unit batches.

Three complete 20-unit blind batches have now been adjudicated and committed **without opening provenance/source context and without verifier/build execution**:

- Batch 01: V1-C001..C015 + V2-C001..C005
- Batch 02: V2-C006 + V3-C001..C019
- Batch 03: V3-C020..C039

Across these first 60 blind units, the provisional Phase-A composition is:

- N0 = 48
- N1 = 10
- E1 = 1
- E0 = 0
- AMBIGUOUS = 1

These are provisional blind labels, **not final semantic counts**. The E1/AMBIGUOUS/N1 cases still require Phase-B exact source-context adjudication. The next deterministic Phase-A batch is `V3-C040` plus `F1-C001..C019`; it is intentionally left for a separate careful round because it crosses from the Verus stratum into HACL*/F* core/library history.
