# FSE126 U030 closure result

Date: 2026-09-27
Status: **CLOSED — R4**
Four-way profile: **P/F/P/P** in frozen order `(old body/old spec, new body/old spec, old body/new spec, new body/new spec)`.

## Historical unit

Repository: `Consensys-Incorporated/evm-dafny`
Historical repair: commit `78bfdfb28c7aba090c6007208966760c57750dfd` (“Limit initcode (EIP-3860)”)  
Exact first parent: `95d4569bf59b2c2fd63602cb2bc63a74a9dfb548`  
Dafny target: `src/dafny/bytecode.dfy`, declarations `Create` and `Create2`.

The body change adds the EIP-3860 oversized-initcode branch returning `ERROR(INSUFFICIENT_GAS)`. The contract change replaces the older, substantially more specific postconditions with a weaker outcome-enumeration postcondition that also admits `INSUFFICIENT_GAS`.

## Frozen environment

- Dafny: `4.4.0+707b18acee078b3aa4d84c0590a980966bf22428`
- historical verification entry point: `src/dafny/evm.dfy`
- flags: `verify --resource-limit 1000000 --verify-included-files --function-syntax 4 --quantifier-syntax 4`
- historical `DafnyCrypto` gitlink at both endpoints: `d67531318c191f5703b71b256352c58f9e0c2e4a`
- historical `.gitmodules` transport URL: `git@github.com:Consensys/DafnyCrypto.git`
- execution-only transport substitution: `https://github.com/Consensys/DafnyCrypto.git`

The checked-out submodule SHA equals the exact gitlink at both revisions. No dependency revision was changed.

## Mechanical isolation certificate

The v5 harness replaced the complete `Create` and `Create2` declarations by placeholders in both historical `bytecode.dfy` revisions before constructing cells.

- old source SHA-256: `ea4ff3397897fd2a6bafa79b551bf00fb07f5dfd814d216978b40aec28634eaa`
- new source SHA-256: `1767e51d441d2a22ce8f7bbdfe36befd20820cbe59dbfb1b78462b1bbd307494`
- old masked-context SHA-256: `fa80b8e46b991dd8a3d1d1270ee99cbbcbd4fac7c53f12a585de258abe61d9fc`
- new masked-context SHA-256: `fa80b8e46b991dd8a3d1d1270ee99cbbcbd4fac7c53f12a585de258abe61d9fc`

Thus the Dafny file is byte-identical outside the frozen `Create`/`Create2` declarations. The harness also asserts `B0S0` is byte-identical to the exact parent file and `B1S1` is byte-identical to the exact head file.

A separate metadata erratum records that the historical commit also edits `src/test/java/dafnyevm/GeneralStateTests.java`. That Java test-list edit is outside the Dafny verification artifact and no replay cell modifies it.

## Exact endpoint verification

| state | result | verifier count |
|---|---|---:|
| exact parent | PASS | 632 verified / 0 errors |
| exact head | PASS | 632 verified / 0 errors |

Both exact historical endpoints therefore satisfy the frozen PASS→PASS gate.

## Four-way replay

| cell | body | spec | result | verifier count |
|---|---|---|---|---:|
| B0S0 | old | old | **PASS** | 632 / 0 |
| B1S0 | new | old | **FAIL** | 630 / 2 |
| B0S1 | old | new | **PASS** | 632 / 0 |
| B1S1 | new | new | **PASS** | 632 / 0 |

Profile: **P/F/P/P**.

The failing cross-pair is not infrastructure. Dafny reaches verification and reports exactly two return-path postcondition failures, one in `Create` and one in `Create2`. In both functions the reported old postcondition permits only continuing/executing, stack-underflow, or write-protection outcomes. The new body has an EIP-3860 path that returns `ERROR(INSUFFICIENT_GAS)`, so that body no longer satisfies the old contract.

Conversely, the old body verifies against the new contract. This is therefore a one-sided historical compatibility relation in the direction opposite to a “new implementation satisfies old contract” repair: here the new behavior requires a broadened/weakened contract, while the old behavior remains admissible under the new contract.

This interpretation is deliberately limited to the executed historical pair. The run does not claim that only the two reported top-level clauses would fail under a clause-by-clause diagnostic; Dafny's reported failure loci are the exact machine-checked evidence used here.

## Artifact integrity

GitHub Actions run: `36359517394`  
Workflow head: `f71b6ab937ddd269fde4602d8e5579a08477efde`  
Artifact ID: `10944822511`  
Artifact name: `fse126-U030-v5-closure-dafny-4.4.0`  
Artifact ZIP SHA-256: `97d21818de9d780f4e08dc0c83112c11f8e710214deb97ce05f5eda08b097430`

The artifact contains 20 hashed scientific files plus the hash manifest. An independent post-download audit recomputed every entry in `MANIFEST_SHA256.csv` with **0 mismatches**, rechecked endpoint source identity, equality of masked contexts, exact submodule gitlinks, and the R4 profile.

## Prior attempts and outcome discipline

Earlier U030 attempts are retained as provenance but have no scientific outcome:
- initial attempt: bad parent-SHA transcription, corrected before any successful replay;
- v2: missing `DafnyCrypto` submodule; mistakenly emitted R2, then explicitly corrected to INFRA under the frozen protocol;
- v3: public submodules attempted via SSH and failed before Dafny;
- v4: SSH→HTTPS rewrite was placed only in superproject-local `url.*.insteadOf`, which the child submodule clone did not consume; failed before Dafny;
- v5: effective named-submodule URL was changed to equivalent public HTTPS transport while exact gitlinks were asserted; replay completed.

None of the infrastructure attempts contributes a verifier FAIL, an R-stage attrition event, or a four-way profile.

## Population interpretation

U030 remains one pre-replay E0 unit in the frozen 100-unit semantic census. Its successful closure contributes exactly one core/library R4 observation, profile P/F/P/P. It does not alter the 126-commit frame, 100-unit denominator, semantic labels, or any other unit's eligibility.
