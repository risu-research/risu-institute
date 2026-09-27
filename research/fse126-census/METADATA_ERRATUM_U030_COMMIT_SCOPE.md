# U030 metadata erratum — commit scope

Date: 2026-09-27

A sentence in `REPLAY_ENVIRONMENT_AND_CELL_FREEZE.md` says that U030's historical commit “changes only `src/dafny/bytecode.dfy`.” That wording is too broad.

GitHub's canonical commit object for `78bfdfb28c7aba090c6007208966760c57750dfd` contains two changed files:
1. `src/dafny/bytecode.dfy`, which carries the Dafny `Create`/`Create2` body-and-contract change used by the census replay; and
2. `src/test/java/dafnyevm/GeneralStateTests.java`, which removes the EIP-3860 initcode-limit tests from the exclusion list.

The intended and correct statement is: **among Dafny source files, the commit changes only `src/dafny/bytecode.dfy`; the commit also changes a Java test file outside the Dafny verification artifact.**

This correction does not alter U030's frozen E0 label or replay boundary. The v5 isolation check proves that `src/dafny/bytecode.dfy` is byte-identical between parent and head after replacing only the frozen `Create` and `Create2` declarations by placeholders. The verification entry point is `src/dafny/evm.dfy`; the Java test-list edit is not part of any reconstructed verifier cell.
