# FSE126 U030 v4 — transport-only closure retry freeze

Date: 2026-09-27

This retry is authorized solely to remove the infrastructure failure recorded for U030 v3. It does not alter the frozen semantic label, source revisions, fragment partition, verifier version, verification entry point, or verification flags.

Frozen scientific inputs:
- unit: U030
- repository: `Consensys-Incorporated/evm-dafny`
- head: `78bfdfb28c7aba090c6007208966760c57750dfd`
- exact first parent: `95d4569bf59b2c2fd63602cb2bc63a74a9dfb548`
- target source: `src/dafny/bytecode.dfy`
- declarations: `Create` and `Create2`
- contract fragment: exact historical signature plus pre/postcondition block
- implementation fragment: exact historical brace-delimited body
- verifier: Dafny 4.4.0
- entry point: `src/dafny/evm.dfy`
- flags: `verify --resource-limit 1000000 --verify-included-files --function-syntax 4 --quantifier-syntax 4`

The only allowed v4 change is transport/setup:
1. clone the public upstream repository over HTTPS;
2. at each exact historical revision, rewrite public GitHub SSH-form submodule URLs to their equivalent HTTPS URLs locally;
3. initialize only `libs/DafnyCrypto` at the exact gitlink revision recorded by that historical revision;
4. record the gitlink SHA actually checked out and assert it matches the superproject's recorded gitlink;
5. then run exact endpoints and, only if both endpoints are green and mechanical isolation succeeds, the four cells.

No source line, submodule revision, verifier version, verification flag, target declaration, fragment boundary, or result classification rule may be changed because of an observed outcome.

Outcome discipline remains the frozen census protocol:
- setup/transport/tool failure before a semantic verifier result = INFRA, not FAIL;
- endpoint semantic verifier failure = R2;
- non-mechanical cross-pair construction = R3;
- both endpoints green plus executable four-way cells = R4.
