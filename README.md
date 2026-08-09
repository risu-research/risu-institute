# RISU Institute public site v0.1

Static, dependency-free public website for RISU Institute, deployed as
Cloudflare Workers Static Assets without runtime Worker code.

## Canonical semantic identifier

https://risuinstitute.org/rels/appeal

The identifier is intentionally unversioned. The document currently describes
experimental specification v0.1.

## Repository boundary

Only `public/` is configured as the deployable asset directory. Project
documentation, tests, package metadata, and release files remain outside that
boundary. Cloudflare parses `public/_headers` and `public/_redirects` as static
asset controls and does not serve those two files as public assets.

`public/rels/appeal.html` is intentionally a file rather than a directory index.
With `html_handling` set to `auto-trailing-slash`, Cloudflare exposes it at the
slashless canonical path `/rels/appeal`. The explicit redirect sends
`/rels/appeal/` to `/rels/appeal` with status 301.

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

Recommended release tags are `site-v0.1` for the site baseline and
`appeal-semantic-v0.1` for the semantic document. Neither tag changes the
canonical URI.

## Design constraints

- No JavaScript or framework dependency in the public site.
- No analytics, cookies, or third-party assets.
- No empty programs, fake team, fake impact metrics, or implied external
  adoption.
- `/rels/appeal` is an authoritative semantic-definition surface, not a
  marketing page.
- Semantic scope must not be expanded casually.
