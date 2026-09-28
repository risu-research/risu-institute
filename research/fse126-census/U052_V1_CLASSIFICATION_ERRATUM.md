# U052 v1 classification erratum

Date: 2026-09-27
Run: `36360837030`
Artifact: `10945711827`

The v1 harness classified the exact head endpoint as `INFRA` because Dafny returned nonzero without printing the usual `Dafny program verifier finished ...` verification summary. Inspection of the preserved raw log shows that this was not a runner/setup failure: Dafny 4.4.0 successfully parsed the invocation and reported **13 source-level resolution/type errors** in exact historical `src/dafny/utils/Automata.dfy`, including unresolved `AddKeyVal`, `ReverseMapsIsCongruent`, and `ExtendByOneGoodIsGood` references.

Under the frozen census protocol, `R2` is the attrition label for an exact old/old or new/new endpoint that is not green under the fixed reconstructed verifier environment. An endpoint resolution failure is not a four-way semantic `FAIL`, but it is still evidence that the exact endpoint is **not green** when the toolchain itself ran successfully. Therefore v1's generic `INFRA` label is too coarse.

Before final disposition, v2 will distinguish:
- `PASS`: verifier summary with zero errors;
- `VERIFY_FAIL`: verifier summary with verification errors;
- `RESOLUTION_NOT_GREEN`: Dafny reports source resolution/type errors under a functioning pinned toolchain;
- `INFRA`: clone/tool/runtime failure that prevents Dafny from evaluating the exact source.

A post-v1 history diagnostic also identified the immediate child commit `ac0d71b96d32962d5b7f88ebd511d3d4851286f8` (26 seconds later by commit timestamp). GitHub records its parent as exact U052 head `ac962f72645d3d4a6c2d996b6ea19435ad630d2c`; it changes only `src/dafny/utils/MiscTypes.dfy` and adds the helper declarations referenced by the U052 head. V2 may verify this immediate child **only as a diagnostic**. It cannot be substituted for the frozen U052 endpoint and cannot rescue U052 into R4.

The v1 source-isolation certificate remains valid and outcome-independent: even after masking the changed boundary routines and their principal proof lemma, semantically material residual changes remain (`IsValid`, reverse-map predicates, added `PredNat`/`revTransitionsIsBounded`, deleted helper/proof declarations). If the head had been green, those facts would independently trigger the frozen R3 rule.
