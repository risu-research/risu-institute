# RISU Institute public site v0.2

Dependency-light public website for RISU Institute, deployed as Cloudflare
Workers Static Assets without runtime Worker code. Core institutional pages are
static. Isolated public research instruments may use first-party browser
JavaScript when interaction is necessary to exercise the published artifact.

## Canonical semantic identifier

https://risuinstitute.org/rels/appeal

The identifier is intentionally unversioned. The document currently describes
experimental specification v0.2.

## Repository boundary

Only `public/` is configured as the deployable asset directory. Project
documentation, tests, package metadata, and release files remain outside that
boundary. Cloudflare parses `public/_headers`, `public/_redirects`, and
`public/.assetsignore` as static-asset controls and does not serve those files.
The asset ignore file excludes macOS `.DS_Store` metadata from deployment.

`public/rels/appeal.html` is intentionally a file rather than a directory index.
With `html_handling` set to `auto-trailing-slash`, Cloudflare exposes it at the
slashless canonical path `/rels/appeal`. The explicit redirect sends
`/rels/appeal/` to `/rels/appeal` with status 301.

## Negative Result Warrant Inspector

`/tools/negative-result-warrant/` is a browser-local experimental instrument
against the canonical Negative Result Warrant sources frozen at commit
`d3f9840d1e0794c675bd6e948cdbb0dcd315cd65`. Its artifact hierarchy is:

```text
canonical NegativeResultWarrant
  → canonical BoundNegativeEvidence
  → canonical AlgoliaRealSourceNegativeEvidence
  → Inspector-specific portable envelope 0.1.0
  → JSON serialization
  → receiver reconstruction and binding checks
  → exact premise gate
```

The portable envelope carries exact supplied request and response body text so
the receiver can reproduce both raw-body and normalized-profile bindings. It
never carries an API credential, but exported body content should still be
reviewed for other sensitive data. The receiver supplies the expected
application ID, credential fingerprint, and credential UTF-8 byte length
independently.

Receiver validation is not serialized authority. Imported evidence must be
reconstructed and validated again. User-supplied capture integrity is not
provider authentication.

## Local verification

Node.js 20 or later is required.

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm run check
```

`pnpm test` runs static release-integrity checks and starts a local Wrangler
server to verify the exact public URLs, content types, redirect, response
headers, custom 404, and public/private boundary. `pnpm run check` also validates
the deploy configuration with a Wrangler dry run.

For manual review:

```sh
pnpm run dev
```

## Production deployment

The committed Wrangler configuration names `./public` as the only asset
directory, disables the `workers.dev` route, and declares `risuinstitute.org` as
an exact Cloudflare Custom Domain.

Before the first production deployment:

1. Confirm that `risuinstitute.org` is an active zone in the intended Cloudflare
   account and that the operator controls it.
2. Check the apex hostname for an existing CNAME. Cloudflare cannot create a
   Worker Custom Domain on a hostname that already has one; resolve that conflict
   deliberately rather than inventing a replacement DNS record.
3. Authenticate Wrangler with the intended account and run `pnpm run check`.
4. Run `pnpm run deploy`. Because the Custom Domain is declared in
   `wrangler.jsonc`, this creates or updates the Worker and asks Cloudflare to
   attach the apex hostname and issue its certificate.
5. Complete every production check in `RELEASE_CHECKLIST.md` before tagging.

The equivalent dashboard path is **Workers & Pages → risu-institute → Settings
→ Domains & Routes → Add → Custom Domain**. Enter `risuinstitute.org` exactly.
Cloudflare manages the resulting DNS record and certificate; do not create
speculative DNS records first.

The sole historical baseline tag is `appeal-semantic-v0.1`. No `site-v0.1` tag
exists locally or on the upstream repository, and none is created
retroactively. The v0.2 release is anchored by `appeal-semantic-v0.2` only after
the exact release commit is published and verified. No tag changes the
canonical URI.

The controlled interoperability record is published from
`public/work/appeal-interoperability/index.html`. The review-only IANA candidate
and designated-expert memo remain outside the public asset boundary in
`standards/`.

## Design constraints

- Core institutional pages remain static and dependency-light.
- Isolated research instruments may use first-party browser JavaScript, remain
  separate from authoritative semantic-definition surfaces, and use no
  third-party runtime assets.
- No analytics, cookies, or third-party assets.
- No empty programs, fake team, fake impact metrics, or implied external
  adoption.
- `/rels/appeal` is an authoritative semantic-definition surface, not a
  marketing page.
- Semantic scope must not be expanded casually.
