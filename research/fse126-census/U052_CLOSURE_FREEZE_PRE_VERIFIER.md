# FSE126 U052 closure — source-isolation and endpoint freeze

Date: 2026-09-27
Status: frozen before any new U052 Dafny endpoint result.

This operationalizes the already-frozen U052 rule in `REPLAY_ENVIRONMENT_AND_CELL_FREEZE.md`. No four-way outcome has been consulted.

## Historical unit

- unit: U052
- repository: `franck44/evm-dis`
- head: `ac962f72645d3d4a6c2d996b6ea19435ad630d2c`
- exact first parent: `c194f56d15152c3e09f3bd8fa9c73875e1854592`
- changed Dafny file: `src/dafny/utils/Automata.dfy`
- artifact role: `core_or_library`
- pre-replay label: E0 (pairable candidate pending source-context isolation)

GitHub's exact compare reports one changed file for parent→head: `src/dafny/utils/Automata.dfy`, 57 additions and 283 deletions.

## Primary closure question

Does the historical transition admit a **unique mechanical two-factor decomposition** into:
1. executable implementation behavior; and
2. externally consumed routine-contract text,

such that both historical endpoints and both cross-pairs can be constructed by swapping only those exact historical fragments while every third-class logical/proof artifact is held fixed without invention, semantic rewriting, or endpoint-dependent choice?

## R3 decision rule

U052 is R3 (mechanical isolation failure), not verifier FAIL, if source-context inspection establishes any of the following:

- the meaning of a shared logical definition used by the pair (for example `IsValid`) changes between endpoints and choosing old versus new meaning is an additional semantic dimension;
- a predicate/helper/lemma required by one side is deleted, renamed, replaced, or changes contract/body such that a cross-pair requires choosing an endpoint-specific third artifact;
- an added/deleted declaration with no old/new counterpart is semantically material to the candidate behavior/contract relation;
- after masking the broadest defensible set of changed executable routine declarations, semantically material residual changes remain in logical definitions or proof infrastructure;
- any proposed cross cell needs a compatibility edit not present verbatim in either historical endpoint.

A parser/type error caused solely by an arbitrary third-artifact choice is **evidence of R3**, not semantic FAIL. No such arbitrary cell will be reported as part of a four-way profile.

## Machine-audit plan

The closure harness must:

1. assert the exact parent relation and exact one-file commit scope;
2. save old/new `Automata.dfy` hashes and unified diff;
3. extract and hash exact source spans for the major changed declarations;
4. produce two residual-diff certificates:
   - **boundary-routine mask**: remove complete `AddState`, `AddStates`, `AddEdge`, and `AddEdges` declarations from both endpoints and compare the remaining source;
   - **expanded pair mask**: additionally remove `AddEdgeInTRandTrNatPreservesValid`, giving the proposed two-factor decomposition every reasonable advantage while deliberately *not* hiding logical-definition changes;
5. classify residual semantic changes by named declaration, with at minimum explicit checks for `IsValid`, reverse-map predicates, and added/deleted predecessor/reverse-map proof declarations;
6. never construct four-way cells if either residual certificate contains semantically material third-class changes.

This is intentionally conservative: U052 was admitted as E0 by patch-only screening, but source-context adjudication is allowed to attrit it to R3 under the original frozen protocol.

## Endpoint environment

If source retrieval succeeds, both exact historical endpoints are checked independently under **Dafny 4.4.0**, which the repository README at the head revision identifies as its verification release.

The historical `build.gradle` verifies each `src/dafny/**/*.dfy` file independently with legacy Dafny flags `/dafnyVerify:1 /compile:0 /timeLimit:20 /vcsCores:12`. U052 therefore uses the exact target command:

`dafny /dafnyVerify:1 /compile:0 /timeLimit:20 /vcsCores:12 src/dafny/utils/Automata.dfy`

Raw stdout/stderr are preserved. Endpoint setup/tool failure before a verifier summary is INFRA. A genuine endpoint verifier failure is R2. If both endpoints pass but source isolation fails under the rules above, final disposition is R3.

No secondary Dafny version is used for the primary disposition.
