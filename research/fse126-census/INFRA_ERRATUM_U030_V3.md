# U030 v3 infrastructure erratum

Date: 2026-09-27

The U030 v3 run corrected the parent SHA and attempted historical submodule initialization, but upstream `.gitmodules` uses SSH-form public GitHub URLs (`git@github.com:...`). GitHub's hosted runner had no SSH key, so `git submodule update --init --recursive` failed before Dafny verification. The failure occurred while cloning `fixtures` and `libs/DafnyCrypto` and therefore produced no scientific verifier outcome.

Disposition: **INFRA only**. It contributes neither R-stage attrition nor a four-way profile.

The next retry changes transport only: public GitHub SSH-form URLs are rewritten to equivalent HTTPS URLs, and only the verification-required `libs/DafnyCrypto` submodule is initialized at each exact historical revision. No source, submodule revision, verifier version, verification flag, fragment boundary, or semantic reconstruction rule is changed.
