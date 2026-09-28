# FSE126 E0 replay closure summary

Date: 2026-09-28
Status: **all three frozen E0 units closed**.

The semantic census froze exactly three E0 units before new verifier replay: U003, U030, and U052. Their replay dispositions are now complete without changing any pre-replay semantic label or denominator.

| unit | repository / role | final replay stage | primary four-way profile | principal result |
|---|---|---|---|---|
| U003 | `ChuyueSun/Clover` / dataset-or-benchmark | **R4** | **P/P/F/P** | old body fails new widened input domain at `a[8]`; new body remains backward-compatible with old contract |
| U030 | `Consensys-Incorporated/evm-dafny` / core-library | **R4** | **P/F/P/P** | new EIP-3860 behavior violates old narrower result contract; old body remains admissible under new contract |
| U052 | `franck44/evm-dis` / core-library candidate | **R2** | none | exact head is not green under frozen Dafny 4.4.0; immediate child adds missing helpers; independent source-isolation audit also detects third semantic/proof dimensions |

## Exact E0 attrition

Frozen E0 denominator: **3 units**.

- R4: **2/3**
- R2: **1/3**
- R0: 0
- R1: 0
- R3 as primary stopping stage: 0

Among the **two R4 units only**, the exact profile distribution is:

- P/P/F/P: **1/2** (U003)
- P/F/P/P: **1/2** (U030)
- P/P/P/P: 0
- P/F/F/P: 0

These are exact counts inside the frozen E0 replay subset, not estimates of Dafny-project or software-ecosystem prevalence.

## Why the two R4 cases are complementary

U003 and U030 expose opposite one-sided compatibility directions.

- **U003:** the new implementation still satisfies the old contract (`B1S0 = PASS`), but the old implementation does not satisfy the new contract (`B0S1 = FAIL`). The failure is a well-formedness/domain mismatch: the new contract widens the legal array length from at least 9 to at least 8 while the old implementation still dereferences index 8.
- **U030:** the new implementation does not satisfy the old contract (`B1S0 = FAIL`), but the old implementation satisfies the new contract (`B0S1 = PASS`). The new EIP-3860 behavior introduces an `INSUFFICIENT_GAS` result excluded by the old postcondition but admitted by the new contract.

Thus the R4 subset already demonstrates that implementation/contract co-evolution is not directionally uniform: historical PASS→PASS endpoints can conceal incompatibility in either cross direction.

## U052 attrition is retained, not discarded

U052 remains E0-as-screened. It is not recoded after replay. Its R2 endpoint attrition is part of the planned denominator: the exact screened commit boundary is transiently incomplete under the frozen environment, and its immediate child supplies missing helper definitions. The independently frozen isolation audit also shows that the episode is not a clean two-factor body/contract swap even if one bundles the adjacent helper commit.

## Evidentiary roles

- U003 remains benchmark evidence and is never promoted to core/production evidence because its profile is favorable.
- U030 is the successful core/library R4 observation.
- U052 contributes attrition/mechanism evidence but no four-way profile.

The completed E0 closure therefore strengthens the census in two ways simultaneously: it retains every screened E0 attempt in the attrition accounting, and it reports nontrivial four-way profiles only where exact endpoint and mechanical-isolation gates were actually satisfied.
