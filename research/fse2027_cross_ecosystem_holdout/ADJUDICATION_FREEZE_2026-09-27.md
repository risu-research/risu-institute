# FSE 2027 Cross-Ecosystem Holdout — Adjudication Freeze

Frozen before any Verus/F* counterfactual hybrid replay on 2026-09-27 UTC.

Governing protocol: `research/fse2027_cross_ecosystem_holdout/PREREG_2026-09-27.md`, freeze commit `28587f3c05deb73819416074897fb85024688615`.

**No counterfactual hybrid has been verified in either stratum as of this commit. No verifier outcome was used for the selections below.**

## 1. Authoritative discovery frame

Authoritative workflow: `.github/workflows/fse-xeco-discovery-authoritative.yml`
Run: `36288771855`
Method: shallow-since clone covering the frozen 2024-01-01+ window; broad `git -G` capture as a superset; Python exact word-boundary lexeme filtering; merge diffs taken against first parent. This implementation was adopted because an earlier direct `git -G` use of `\b` undercounted Verus, while a broad-only stream overincluded lexical substrings. The correction changes discovery implementation only; it does not change the preregistered source frame or lexeme set.

Artifacts:
- Verus `fse-xeco-authoritative-V`, GitHub artifact 10921722258, artifact ZIP digest `sha256:686aacbb4fdc59030d42fe09b4cf30e0b24def4e04a0919fbc2160c0c8d02202`.
- F* `fse-xeco-authoritative-F`, GitHub artifact 10921158241, artifact ZIP digest `sha256:c7fa522eb059d1d8992a93a98d758834f071644fe2dc17d2888e7707dbf29476`.

Discovery counts (diagnostics, not prevalence):
- Verus: 823 exact contract-lexeme diff commits; 807 broad-structural; 794 same-hunk; 50 merge commits.
- F*: 1,756 exact contract-lexeme diff commits; 1,720 broad-structural; 1,701 same-hunk; 630 merge commits.

These counts are candidate-discovery diagnostics only. They are not semantic co-evolution rates.

A separate source-only structural-shortlist run (`36288848829`) was used only to reduce manual inspection cost. Its counts are not the authoritative denominator because that helper used a narrower history implementation and conservative callable parsers. It ran no verifier and no hybrid.

## 2. Verus adjudication

Known contamination exclusion: PR #1823 was inspected before this holdout and remains excluded regardless of quality or replayability.

### Lower-rank source-only candidates inspected before the selected candidate
The following examples illustrate why lexical/structural hits were not automatically eligible:
- `f5cdebeed5d75d0be78368ad72a9f95754b097f7`, “Fix Vec::split_off spec (#1272)”: adds a `requires` obligation to the assumed specification; no corresponding executable body change in the same callable. EXCLUDE (contract-only).
- `5e892a3a10c967e60af18245c4a5795d186123a1`, invariant-credit availability: lexical hits arise from names/attributes such as `open_invariant_credit`; the edit changes cfg/attribute/signature presentation rather than a same-callable semantic contract plus executable body. EXCLUDE.
- `880913ad3dfb347c4f53b8962ee0824d6c52e141`, `atomic_ghost::into_inner`: the old candidate callable is commented out and the new commit activates/replaces it, so there is no preserved old live callable suitable for a historical old/new 2x2. EXCLUDE.
- `6d666cabd322b3723c927cd7e1dbc984cc9a8f39`, add `PointsTo::is_aligned` axiom: axiom/specification addition and documentation; no corresponding executable body repair. EXCLUDE.

### First nonempty tier: Tier A
Selected repair: `verus-lang/verus` commit `521f5e801c5321b1a9502f9955e0ef8c29606f65`, parent `ce612f9252fe52fc8d4df3a317f39efae3ecb0df`, subject `vstd: use type_invariant for InvCell`.

Isolated callable: `source/vstd/cell.rs`, `InvCell<T>::get`.

Why eligible before replay:
- same historical callable exists at both endpoints;
- old callable has explicit precondition `requires self.wf()`;
- new callable removes that explicit caller obligation;
- new executable body adds a proof block invoking `use_type_invariant(self)` before the unchanged operational read;
- the two dimensions are textual and mechanically separable without inventing semantics.

The surrounding commit also changes the type-invariant declaration and sibling methods. Those are held fixed on a documented head-background for causal cells, while exact historical whole-tree endpoint checks H0/H1 are retained separately.

### Frozen Verus causal construction
Background for C00/C10/C01/C11: exact HEAD tree `521f5e...`, except the `InvCell<T>::get` callable block.

- S0 = old explicit contract: include `requires self.wf(),`.
- S1 = new explicit contract: omit that `requires` clause; retain the historical `ensures self.inv(val)`.
- B0 = old body: no leading `proof { use_type_invariant(self); }` block.
- B1 = new body: include exactly the historical proof block from HEAD.

Cells:
- C00 B0S0: restore old precondition + old body in the HEAD background.
- C10 B1S0: old precondition + new proof block.
- C01 B0S1: new contract + old body.
- C11 B1S1: byte-identical HEAD callable.

Also verify exact historical trees H0=parent and H1=head before interpreting causal cells.

Toolchain strategy frozen before replay:
1. revision-local Rust toolchain (`rust-toolchain.toml` at selected head pins Rust 1.76.0), revision-local Z3 bootstrap (`source/tools/get-z3.sh`), activate `vargo`, then `vargo build --release`, which historically builds and verifies vstd;
2. if strategy 1 is infrastructure-blocked, use the same revision-local toolchain and build only the minimal vstd/verifier target supported by that revision;
3. if still blocked, use the nearest revision CI/build recipe without editing source to force compatibility.

The first complete scientific four-cell replay stops the Verus stratum even if its matrix does not resemble the Dafny matrices.

## 3. F* adjudication

### Lower-rank candidates inspected before the selected candidate
- `c3c681c78d6e9f144b0170a18be4de6a8df3f610`, `EqualOrDisjoint` example: the smallest apparent same-callable row is `ghost fn intro_refs_disj`; its contract and proof body co-change, but it is a ghost/proof function rather than an executable body. EXCLUDE under the preregistered proof-only exclusion.
- `1edf8eddb48ab9d68ae30f884dfdc34e4485a7a2`, indirection-theory `star_intro`: logical/proof definition, not an executable application body. EXCLUDE.
- bug-report/comment-only and commented-code rows appearing ahead of the selected candidate are EXCLUDE under test-only/comment-only rules.

### First nonempty tier: Tier A
Selected repair: `FStarLang/FStar` commit `74b3bb2b0e378a671d6f7bb62cd01a4134811bce`, parent `b6dcfd04c5c63c79e6a21c56227dcd098e8f69df`, subject `fix spinlock`.

File: `pulse/lib/pulse/lib/Pulse.Lib.SpinLock.fst`.

Affected executable callables used for the isolated repair: `acquire` and `release`.

Why eligible before replay:
- both are executable Pulse `fn` callables present at both historical endpoints;
- in each callable the `with_invariants` body-side expression changes from unqualified `iref_of l.i` to `CInv.iref_of l.i`;
- the corresponding explicit `ensures inv (...) ...` contract expression changes in lockstep from unqualified `iref_of l.i` to `CInv.iref_of l.i`;
- the two dimensions can be mechanically cross-combined;
- the commit adds `module CInv = Pulse.Lib.CancellableInvariant`, so the head background supplies the alias for every causal cell.

This is a deliberately outcome-blind holdout. The source change may prove semantically equivalent under the head namespace environment; that possibility is not a reason to demote or replace it after selection. A P/P/P/P result, if obtained, will be retained as a null coupling result for this Tier-A holdout.

### Frozen F* causal construction
Background for C00/C10/C01/C11: exact HEAD tree `74b3bb...`, except four occurrences inside `acquire`/`release` split by dimension.

- S0 = old contract expressions in the two `ensures inv (...)` lines: `iref_of l.i`.
- S1 = new contract expressions: `CInv.iref_of l.i`.
- B0 = old body-side `with_invariants (iref_of l.i)` in acquire/release.
- B1 = new body-side `with_invariants (CInv.iref_of l.i)` in acquire/release.

All other changes from the historical commit, including the `CInv` alias and other qualified call sites, stay at HEAD in the causal cells. C11 is byte-identical to the HEAD forms of the two isolated callables.

Also verify exact historical trees H0=parent and H1=head where the repository toolchain permits.

Toolchain strategy frozen before replay:
1. revision-local F*/Pulse build instructions and package pins from the selected revision; build/check the Pulse SpinLock library target under that exact tree;
2. if infrastructure-blocked, build the revision's F* compiler first and invoke the Pulse library make target directly with revision-local dependency paths;
3. if still blocked, use the nearest revision CI recipe/package snapshot without modifying the isolated source semantics.

The first complete scientific four-cell replay stops the F* stratum regardless of matrix.

## 4. Interpretation remains sealed

No matrix result is anticipated or required. In particular:
- Verus/F* are not promoted only if they reproduce P/P/F/P;
- P/P/P/P, endpoint failures, asymmetric failures, or other matrices are retained;
- infrastructure failures are labeled `INFRA_BLOCKED`, not scientific FAIL;
- lower tiers (including the source-only F* Tier-D lead around AVL delete) are not opened merely because a Tier-A scientific result is aesthetically weak.

Interpretation begins only after raw replay artifacts, exact commands, source hashes, and logs are frozen.