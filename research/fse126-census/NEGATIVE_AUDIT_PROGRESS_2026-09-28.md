# FSE126 frozen-negative audit progress

Date: 2026-09-28
Parent freeze: `NEGATIVE_SENSITIVITY_AUDIT_FREEZE.md`

Completed: **12 / 31 frozen units**.

- Batch 01 — `Consensys-Incorporated/evm-dafny`: U028, U029, U031, U033 — 4/4 CONFIRM.
- Batch 02 — `dafny-lang/libraries`: U043, U044 — 2/2 CONFIRM.
- Batch 03 — `franck44/evm-dis` early-history subset: U045, U046, U047, U049, U050, U051 — 6/6 CONFIRM.

Cumulative sensitivity outcomes so far:
- CONFIRM: **12**
- TENSION: **0**
- ERROR: **0**

Remaining 19 frozen units:
`U054,U055,U057,U058,U059,U061,U067,U069,U072,U078,U079,U080,U082,U083,U084,U086,U087,U090,U097`.

The remaining work will stay split into small source-context batches. In particular, the 18 remaining `franck44/evm-dis` units will not be adjudicated as one block; they will be grouped chronologically/source-locally, followed by the single `mit-pdos/daisy-nfsd` unit U097.

No frozen primary semantic label, 126/100 denominator, or E0 replay result has been changed by this sensitivity audit.
