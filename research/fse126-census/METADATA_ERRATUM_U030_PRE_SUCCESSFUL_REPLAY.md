# Metadata erratum — U030 parent commit

Date: 2026-09-27
Status: recorded **before any successful U030 verifier replay**.

The pre-replay semantic-label CSV and first execution harness contain a transcription error in U030's parent SHA: `95d45699972fd97cfd06791505dc2d8f20c17dd5`.

GitHub's commit object for canonical head `78bfdfb28c7aba090c6007208966760c57750dfd` identifies the actual first parent as:

`95d4569bf59b2c2fd63602cb2bc63a74a9dfb548`

The first U030 Actions attempt did not yield a scientific replay result; its execution step failed while trying to reconstruct source using the nonexistent parent identifier. This is an infrastructure/metadata transcription failure, not R0–R4 attrition and not a verifier outcome.

This correction changes **only the parent identifier**. It does not change U030's frozen E0 semantic label, the selected head commit, source file, body/contract partition rule, historical Dafny 4.4.0 environment, or replay eligibility. The original frozen CSV is retained unchanged for provenance; all successful replay artifacts use the corrected parent and record both identifiers in their manifest.
