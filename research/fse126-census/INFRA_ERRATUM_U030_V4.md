# U030 v4 infrastructure erratum

Date: 2026-09-27
Workflow run: `36359236328`
Artifact: `10944129850` (`fse126-U030-v4-closure-dafny-4.4.0`)
Artifact ZIP SHA-256 reported by Actions: `bdadf6355cd8e76ebd3163d27ba735355b7f101651603542247b8fe069f4afcd`

U030 v4 preserved every frozen scientific input and attempted the pre-authorized SSH→HTTPS transport-only repair. The run still stopped before Dafny verification while initializing the exact historical `libs/DafnyCrypto` gitlink.

The reason is narrower than v3: the script installed the `url.https://github.com/.insteadOf=git@github.com:` rewrite in the **superproject's local Git config**. `git submodule update` subsequently launched the submodule clone using the URL registered from `.gitmodules`, `git@github.com:Consensys/DafnyCrypto.git`; that child clone did not consume the superproject-local rewrite and therefore attempted SSH. GitHub Actions had no SSH key and returned `Permission denied (publickey)`.

Disposition: **INFRA only**. No Dafny endpoint or cross-cell verification was reached; this run contributes neither R-stage attrition nor a four-way profile.

The next retry changes transport configuration only. After `git submodule sync`, it sets the registered submodule URL for the named historical submodule `DafnyCrypto` to the equivalent public HTTPS URL `https://github.com/Consensys/DafnyCrypto.git` in the superproject config (and records both `.gitmodules` and effective URL). The exact superproject revisions and exact gitlink SHAs remain authoritative and are asserted after checkout. No source, submodule revision, verifier version, flag, fragment boundary, or outcome rule changes.
