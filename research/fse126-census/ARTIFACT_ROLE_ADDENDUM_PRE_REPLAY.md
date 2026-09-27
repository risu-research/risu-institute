# FSE 2027 — artifact-role descriptor (frozen before replay)

Date: 2026-09-27.
This is a descriptive stratification and does not modify the frozen population, primary semantic labels, or replay eligibility.

Every semantic unit will additionally be coded, before new verifier outcomes, by the location/role of the changed Dafny artifact:

- `core_or_library`: source used as the project's implementation/library rather than a test fixture or corpus item;
- `test_or_example`: project tests, examples, proof examples, or demonstration programs;
- `dataset_or_benchmark`: benchmark/training/evaluation corpora stored in the repository;
- `generated`: generated verification/proof artifacts or machine-emitted Dafny source;
- `mixed`: materially spans more than one of the above;
- `unknown`: role cannot be determined reliably from path and source context.

This field prevents favorable benchmark/test episodes from being silently reported as production/core observations while still preserving them in the frozen census. Population tables will separate role strata wherever sample size permits.
