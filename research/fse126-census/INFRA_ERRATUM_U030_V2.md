# U030 v2 infrastructure-disposition erratum

Date: 2026-09-27

The corrected-parent U030 v2 run reached both exact historical source revisions but Dafny returned before verification because the clone did not initialize the repository's pinned `libs/DafnyCrypto` submodule. The raw logs report five missing-include parse errors from that absent submodule.

The v2 harness then wrote `R2` because its endpoint gate failed to distinguish `INFRA` from a semantic endpoint verifier `FAIL`. That disposition is **invalid under the frozen protocol**, which explicitly states that infrastructure/setup failures are never semantic FAIL and never R2.

Therefore the v2 run is recorded as **INFRA only** and contributes no R-stage attrition or four-way result. The next run initializes submodules at each exact historical revision and separately treats:
- `INFRA`: setup/tool failure, retryable, no scientific outcome;
- `FAIL`: verifier reached the program and reported semantic/proof errors;
- `PASS`: verified endpoint/cell.

This correction does not change any semantic label, reconstruction rule, verifier version, or source fragment. It restores the predeclared outcome discipline before a successful U030 replay exists.
