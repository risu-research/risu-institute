# Blind adjudication — Verus Stage 1

Adjudicated from the frozen `blind/*.patch` packets for V1 and V2 before opening their provenance mapping and before any verifier replay. Repository/commit/date/subject metadata and verifier outcomes were not used. Source paths remained visible under the frozen protocol.

No candidate below is classified ELIGIBLE or ELIGIBLE_CONFOUNDED. Therefore the Verus stratum must continue to V3 under the frozen stop rule.

| Candidate | Blind label | Reason under frozen rule |
|---|---|---|
| V1-C001 | EXCLUDE_MIGRATION | Widespread mutable-reference postcondition migration (`self` to `final(self)`); no clean executable semantic repair paired with a semantic contract change. |
| V1-C002 | EXCLUDE_PROOF_SPEC | Set/spec representation and proof-support changes dominate; no clean same-declaration executable-body + semantic-contract pair isolated from proof work. |
| V1-C003 | EXCLUDE_API_MIGRATION | PCell/memory-content API migration changes construction/accessor forms; representation migration rather than a clean semantic repair episode. |
| V1-C004 | EXCLUDE_NEW_DECLARATION | A new contracted implementation unit is introduced; the old revision has no corresponding body+contract pair to cross. |
| V1-C005 | EXCLUDE_API_MIGRATION | Tracked mutable-reference API migration (`self`/`self_` and helper call form), not a clean semantic body+contract repair. |
| V1-C006 | EXCLUDE_SPEC_MIGRATION | Metadata constraints are removed/adjusted without a separable executable semantic body change in the same declaration. |
| V1-C007 | EXCLUDE_API_MIGRATION | Memory-content accessor representation changes (`@.value`/`mem_contents`/`value()`), excluded migration class. |
| V1-C008 | EXCLUDE_API_MIGRATION | Token accessor representation migration (`@.value` to method accessors), not a semantic repair pair. |
| V1-C009 | EXCLUDE_PROOF_REFACTOR | Proof helper addition plus proof/invariant infrastructure removal; no qualifying executable implementation repair. |
| V1-C010 | EXCLUDE_REPRESENTATION_MIGRATION | Large pointer-representation migration (`PPtr` to raw pointers) changes contracts and implementation pervasively; explicitly excluded by the frozen migration rule rather than forced into a 2x2. |
| V1-C011 | EXCLUDE_API_MIGRATION | Accessor/naming migration in specifications; no clean paired executable semantic change. |
| V1-C012 | EXCLUDE_DELETION_REWRITE | Large component removal/rewrite; no mechanically clean same-declaration old/new body-contract isolation. |
| V1-C013 | EXCLUDE_PROOF_INFRA_MIGRATION | Proof/invariant infrastructure migration/removal dominates; excluded proof/migration class. |
| V1-C014 | EXCLUDE_PROOF_ONLY | `invariant` to `invariant_except_break` plus proof assertion; no executable semantic change. |
| V1-C015 | EXCLUDE_INITIAL_IMPORT | Large initial source addition/import; no old corresponding declaration pair for four-way historical crossing. |
| V2-C001 | EXCLUDE_PROOF_ONLY | Extracts a proof lemma and rewires proof calls only; executable semantics unchanged. |
| V2-C002 | EXCLUDE_SPEC_TYPE_MIGRATION | Map/IMap and related proof/spec migration; no clean same-declaration executable semantic repair. |
| V2-C003 | EXCLUDE_SYNTAX_MIGRATION | Mutable-reference postcondition syntax migration to `final(...)`; body semantics unchanged. |
| V2-C004 | EXCLUDE_SYNTAX_MIGRATION | Option-pattern/spec syntax migration; no qualifying executable semantic body change. |
| V2-C005 | EXCLUDE_TERMINATION_ANNOTATION | Adds decreases/termination annotations to existing loops; body semantics unchanged. |
| V2-C006 | EXCLUDE_INITIAL_IMPORT | Initial bulk addition of the verified system; no old body+contract pair to cross. |

This record does not state that the repositories contain no code-contract co-evolution. It states only that the frozen first queue for V1/V2 contains no candidate satisfying the primary holdout eligibility rule.
