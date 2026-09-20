# G18 prospective three-case five-tier evidence-transfer study

UTC freeze 2026-09-20T14:09:57Z. This file was drafted before reading target diffs, source or results, based solely on GitHub commit search titles, timestamps and SHAs. Known earlier G11-G17 work is excluded. Commit titles expose intended problem types, so selection is outcome-blinded but not bug-type-blinded.

Three immutable picks:
P-IRQ: YosysHQ/picorv32 258d63d4762a86385f69c7699b485c0c5559c763 ('fix missed timer interrupts, when another interrupt activates shortly before', 2020).
P-RVFI: YosysHQ/picorv32 f33ddd3654faf1571ef765d898040f24cf092355 ('Fix in rvfi_mem_ handling (when compressed isa is enabled)', 2017).
S-CSR: olofk/serv 1e4ea0527e0c7a3737bc501aa5d93bb16508ec15 ('Fix CSR write detection in debug module', 2024).

The cases are purposively selected, not a representative sample. No replacement if negative, infeasible or unavailable. First parent from actual git metadata after freeze.

Same five successive tiers for each case: (1) original changed files vs historical CI/formal source fileset incl elaborated module, (2) product/formal configuration guards/parameters, (3) shortest genuine unchanged historical RTL regression with same environment parent/child and nonvacuity, (4) original existing formal checker with exact status; flag diagnostic edits, (5) evidence ledger with source SHA, assumption/ISA/checker/abstraction, incremental and cumulative wall-time, human investigation separately, cheapest sufficient reviewer decision. T0 metadata/diff inventory precedes tiers. No historic PASS/FAIL without archived original CI. No invented test if harness unavailable. Log all failures. Report measured CI time separately from analyst elapsed and simulator cycles. Success of study not contingent on positive cases. Later amendments appended and dated, never silently backdated.

Local fuller contemporaneous hash of preregistration: SHA256 837b75962339f833769f8d929016243d879ad6894095e5673ec4f717210f83d8.