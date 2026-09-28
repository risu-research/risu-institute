# FSE 2027 v14 cross-ecosystem pairability integration report

Date: 2026-09-28
Baseline: `FSE2027_PASS_Is_A_Pair_v13_Post_Obligation_Interface_Refined`
Integrated manuscript: `FSE2027_PASS_Is_A_Pair_v14_Cross_Ecosystem_Pairability`

## Scientific integration

The revision preserves endpoint non-identifiability and four-way historical replay as the paper's central problem and method. It adds the completed XH1 prospective cross-ecosystem holdout as a complementary empirical layer: Dafny asks what replay reveals once a repair is mechanically pairable; XH1 asks how often semantically meaningful candidates reach that pairable state under a frozen reconstruction rule.

A new RQ3 asks how frozen candidates progress from syntactic co-change to semantic co-evolution and then to mechanically pairable historical replay. The six-repository Verus/F*/Pulse holdout contains 142 retained mechanical units. Final source-context labels are N0=110, N1=19, E1=13, E0=0, with no ambiguous units. The 13 E1 units are source-confirmed existing-target semantic co-evolution, but signature/type/state/helper/representation coupling prevents a unique two-factor historical split. The 19 N1 units lack a defensible historical old side. The deterministic 40-unit N0 audit produced no corrections; the only Phase-A-to-final correction was V1-C003, AMBIGUOUS to N0.

The manuscript explicitly does not convert these counts into ecosystem prevalence. XH1 is a bounded purposive holdout with frozen repositories, history windows, per-repository caps, token rules, adjudication taxonomy, and source-context audit procedure.

## Results changes

A new Results subsection, `RQ3. Semantic Co-Evolution Survives, but Pairability Collapses`, reports the full funnel and a compact ecosystem table. The interpretation is deliberately two-sided:

1. semantic code-contract co-evolution is not confined to Dafny;
2. real co-evolution does not imply that history supplies a unique I0/I1 x C0/C1 experiment.

The primary XH1 replay queue is therefore empty by the predeclared stop rule. No E1 unit is adapted into a researcher-authored four-way experiment.

## Discussion changes

Two new subsections make the result actionable.

`Pairability is an empirical bottleneck` combines the evidence without pooling incompatible denominators. The frozen Dafny pull-request screen shows severe attrition from discovery to one clean replay candidate; the Dafny direct-history scan shows that raw same-hunk volume is only a search diagnostic; XH1 prospectively confirms that even source-validated co-evolution can remain non-pairable.

`PairTrace: declaration-aligned discovery before replay` defines the exact tooling gap exposed by the evidence. PairTrace is a proposed design, not an evaluated implementation. It should:

- map declarations across parent/head history;
- attach behavioral contracts to the executable/interface declaration they govern;
- distinguish existing targets from births, deletions, and relocations;
- detect signature/type/state/helper/representation axes that make a two-factor split non-unique;
- emit an auditable pairability certificate only for E0;
- preserve E1 and N1 as meaningful non-replayable outcomes rather than silently rewriting them.

The attribution record is extended accordingly: it records declaration mapping, semantic class, pairability status, absent historical sides or third axes, and replay details only where replay is actually justified.

## Validity changes

The threats section now makes five boundaries explicit:

- E0=0 is relative to a deliberately conservative mechanical reconstruction construct;
- XH1 is a bounded purposive holdout, not a random ecosystem sample;
- semantic co-evolution transfers beyond Dafny, but cross-tool replay profiles remain untested because no XH1 unit was replay-eligible;
- blind Phase A, presealed Phase B, and the deterministic N0 audit constrain adjudication drift but do not prove zero classification error;
- PairTrace is a design implication and has no claimed precision/recall/runtime/usability result yet.

## Build and visual QA

- PDF: 20 pages total.
- Main text/figures/data availability end on page 18; references occupy pages 19-20.
- Undefined citations/references: 0.
- Overfull boxes: 0.
- PDF rendered successfully at 150 dpi.
- Manual inspection completed for page 1, page 7, page 10, pages 14-16, and page 18.
- No observed clipping, overlap, broken table, or broken glyph in the inspected pages.

## Claim boundary

> Four-way replay resolves endpoint non-identifiability when a historical code-contract change is mechanically separable. Across the independent XH1 holdout, genuine semantic co-evolution persists, but none of the 13 existing-target co-evolution units admits the predeclared unique two-factor split. Pairability is therefore a distinct empirical bottleneck, and candidate-discovery tooling should preserve that boundary rather than manufacture hybrids.

This is not a prevalence estimate, not evidence that E1 hybrids would fail or pass verification, and not an evaluation of PairTrace as an implemented tool.