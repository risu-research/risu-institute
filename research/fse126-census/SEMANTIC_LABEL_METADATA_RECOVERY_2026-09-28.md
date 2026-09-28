# FSE126 semantic-label metadata recovery

Date: 2026-09-28

During the first frozen-negative source-context audit, the GitHub copy of `semantic_labels_100_pre_replay.csv` was found to contain stale/reconstructed repository metadata for some unit IDs. This is a **metadata transport/join issue**, not a change to the pre-replay semantic labels.

A pre-replay local checkpoint survives in `/mnt/data/fse126/census_stageA/`. Its exact file `semantic_labels_100_pre_replay.csv` was written at 2026-09-27 22:40:58 UTC, before the GitHub semantic-label commit at 22:45:16 UTC, and its contemporaneous hash file records:

`b2b671cfeb17c25f5f5030cf1509fc17c1b28731983731ce88a76c552bb2e79a  semantic_labels_100_pre_replay.csv`

The recovered file contains the same frozen primary-label composition (E0=3, E1=9, N0=37, N1=51) and matches the independently reconstructed `unit_metadata.csv` on all seven metadata fields checked (`repo`, commit, parent, date, subject, patch SHA-256, alias count) for **100/100 units**.

For Batch 01, its patch SHA-256 values also equal the SHA-256 of the exact preserved patch bytes in `census/patches/Uxxx.diff` and the decompressed original R03 patch artifacts:

- U028 `434aa9e8ead65c78973cae95ffd98a996afcb920f70d4fde41d8f33e67ee8695`
- U029 `6d86c9d4773fdf169eeb526dcb7285b7d8a5ed44897d298b1431831f28e6fefe`
- U031 `c2a6f86f9b23977d515cd65d484f25971d39f288ed88b6ab23f736e459775fb9`
- U033 `5908154e7947ccb61b844b5256050461701985709446d272ab63c5461b9e3772`

The earlier cryptographic `FRAME_SHA256.txt` hashes do **not** equal the later `*_v2.csv` reconstruction hashes, so the v2 frame tables are retained as audited reconstructions rather than falsely described as byte-identical recovery of the hash-only frozen frame. No denominator, unit ID, or semantic label is changed here.

Audit rule going forward: use the recovered pre-replay semantic-label snapshot for label/unit identity, and exact preserved R03 patch bytes for source-diff adjudication. Never overwrite the old GitHub file; preserve this reconciliation as provenance.
