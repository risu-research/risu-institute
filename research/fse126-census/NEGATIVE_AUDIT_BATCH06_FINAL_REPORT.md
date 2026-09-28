# FSE126 negative sensitivity audit — Batch 06 FINAL

Date: 2026-09-28  
Frozen units: U082, U083, U084, U086, U087, U090, U097  
Repositories: `franck44/evm-dis` (6), `mit-pdos/daisy-nfsd` (1)  
Status: **BATCH CLOSED — 7/7 audited; C COMPLETE — 31/31**

## Result

Batch totals: **CONFIRM 5, TENSION 0, ERROR 2**.

| Unit | Frozen | Audit | Corrected | Core finding |
|---|---:|---:|---:|---|
| U082 | N0 | CONFIRM_N0 | N0 | existing lemma contract unchanged; proof body only |
| U083 | N0 | **ERROR** | **N1** | patch adds multiple new executable declarations with born-together contracts/bodies; existing opcode bodies remain unchanged while contracts strengthen |
| U084 | N0 | CONFIRM_N0 | N0 | `UpdateValues` implementation expression changes, but its external contract does not |
| U086 | N1 | CONFIRM_N1 | N1 | `Dup5` and `Swap3` are new declarations; parent has neither |
| U087 | N1 | **ERROR** | **E1** | existing `Swap3` implementation and contract are jointly repaired, but the large patch is not uniquely separable as a whole-unit two-factor replay |
| U090 | N0 | CONFIRM_N0 | N0 | proof/contract simplification preserves the function's extensional result computation |
| U097 | N0 | CONFIRM_N0 | N0 | proof lemma body only; live contract unchanged |

## Provenance gate

All seven units were recovered from the exact pre-replay snapshot and original R03 archive. The recovered label snapshot remains SHA-256 `b2b671cfeb17c25f5f5030cf1509fc17c1b28731983731ce88a76c552bb2e79a`.

For every target, the exact R03 `.diff.gz` was decompressed and independently hashed. **7/7 hashes equal the frozen `patch_sha256` values.** No adjudication below relies on the stale GitHub metadata copy.

## Unit findings

### U082 — CONFIRM_N0

The historical `PathHelperLemma` already has all of its requires/ensures in the parent. Its body is essentially empty. This patch fills that lemma body with a local `p'`, two quantified proof blocks, and assertions. The executable DFS routine and the lemma boundary contract do not co-evolve. This is pure proof discharge, so N0 is confirmed.

### U083 — ERROR: N0 -> N1

The frozen reason described this commit as contract-side strengthening with no implementation change. That is incomplete enough to make the primary N0 label wrong.

The exact patch does strengthen postconditions on many pre-existing abstract-opcode functions while leaving those existing function bodies intact. But it also introduces **new executable declarations** including `Peek`, `Push1`, `Push2`, `Push20`, `Dup1`–`Dup4`, and `Swap1`–`Swap2`. These declarations are born with their own requires/ensures and semantic bodies. The exact parent has only generic `PushN`, `Dup`, and `Swap`; it has no historical old version of these specialized declarations.

Therefore there is still no historical old/new executable-contract pair to replay for the newly introduced functionality, but the patch is not N0 “no executable implementation change.” Under the frozen primary taxonomy the correct negative class is **N1: non-pairable addition/augmentation**. This correction remains negative and does not alter replay eligibility.

### U084 — CONFIRM_N0

This commit replaces one executable expression inside `UpdateValues`: a `MapP(...)` computation becomes a sequence comprehension over the same successor indices, with an added bound assertion, specifically to avoid a Java-backend problem. The surrounding `UpdateValues` requires/ensures/decreases are unchanged. The lambda-level `requires` remains an internal indexing obligation, not a changed external behavioral contract of `UpdateValues`.

Thus there is a real implementation/tooling substitution, but no co-evolving behavioral contract for the same routine. N0 is confirmed. A secondary descriptor note is warranted: the frozen `impl_kind=proof_ghost` understates that a compilable function body changes, but that descriptor issue does not change the primary N0 result.

### U086 — CONFIRM_N1

The parent has generic `Dup`/`Swap`, plus specialized `Dup1`–`Dup4` and `Swap1`–`Swap2`; it does **not** have `Dup5` or `Swap3`. This commit introduces both as new declarations with contracts and bodies, and changes the pretty-printer's SWAP3 output to call the new `Swap3` helper. Because no old `Dup5`/`Swap3` declaration exists, constructing an old/new contract-body pair would fabricate an old side. N1 is confirmed.

### U087 — ERROR: N1 -> E1

This is the most important result of the final audit.

U086's head, which is U087's historical ancestry, already contains a `Swap3` declaration. That old declaration requires at least four operands but incorrectly duplicates Swap2 semantics: its contract says stack positions 0 and 2 are exchanged, and its body executes `s.stack[0 := s.stack[2]][2 := s.stack[0]]`.

U087 changes that **existing declaration**. In the head, `Swap3` now specifies positions 0 and 3, adds `ensures s' == Swap(s, 3)`, and executes `s.stack[0 := s.stack[3]][3 := s.stack[0]]`. Hence a semantic executable body change and a semantic behavioral-contract change unquestionably co-evolve on an existing routine. Frozen N1 (“no meaningful old/new pair”) is therefore false.

However U087 is not clean E0 at the patch-unit level. The same exact patch adds many concrete Push/Dup/Swap/Log declarations, strengthens postconditions across a large fraction of the abstract semantics, and rewrites pretty-printer mappings. Turning the entire historical patch into one implementation axis and one contract axis while keeping exact parent/head endpoints would require non-unique semantic choices about these added declarations and widespread contract-only edits. The corrected unit-level class is therefore **E1: genuine executable-contract co-evolution, mechanically inseparable as a whole patch**.

This is a sensitivity correction only. The pre-replay primary label file and the primary E0 replay denominator remain immutable; U087 is not retroactively inserted into the completed E0 replay population.

### U090 — CONFIRM_N0

`SplitTrueAndFalse` does lose two postconditions and its proof scaffolding is rewritten. But its returned mathematical value is unchanged. Old recursive case: call proof lemmas, then return `[xsTrue] + SplitTrueAndFalse(xsFalse, equiv, n)`. New recursive case: bind that same recursive result to `iter`, prove properties with assertions, then return `[xsTrue] + iter`. The base case is also unchanged. This is contract/proof simplification, not a semantic executable-result transition. N0 is confirmed.

### U097 — CONFIRM_N0

In Daisy NFSd, the live declaration `decode_encode_uint64_seq_id` is a lemma. The patch adds assertions and calls to existing proof lemmas inside its proof body. Its live ensures clause is unchanged. A longer alternative lemma appears only inside a block comment. There is no executable routine behavior plus behavioral-contract co-evolution. N0 is confirmed.

## Completed negative sensitivity audit

Across all six batches, the mechanically frozen suspicious-negative audit is now complete:

- audited: **31/31**;
- **CONFIRM: 28**;
- **TENSION: 0**;
- **ERROR: 3**.

The three explicit primary-label corrections are:
1. U061: `N0 -> N1`;
2. U083: `N0 -> N1`;
3. U087: `N1 -> E1`.

The frozen 100-unit composition remains immutable for the preregistered primary analysis: `E0=3, E1=9, N0=37, N1=51`.

The transparent audit-corrected overlay is now:

- **E0=3**;
- **E1=10**;
- **N0=35**;
- **N1=52**.

Thus the corrected overlay contains **13 semantic co-evolution units**, versus 12 in the frozen adjudication. Importantly, E0 remains 3, so the predeclared primary replay denominator and all R2/R4 outcomes are unchanged.

Because the 31 units were deliberately selected as the most suspicious negatives rather than sampled randomly, `3/31` must **not** be reported as an ecosystem false-negative rate. It is a targeted sensitivity result: under an adversarial source-context recheck, 28 frozen negatives survive, two are negative-subclass corrections, and one previously negative unit reveals genuine but inseparable co-evolution.
