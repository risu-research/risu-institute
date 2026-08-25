# RISU Institute public site

Dependency-light public website for RISU Institute, deployed as Cloudflare
Workers Static Assets without runtime Worker code. Core institutional pages are
static. Selected research instruments may use first-party browser JavaScript
when interaction is necessary to exercise a published artifact.

## Public information architecture

- **Research** (`/work/`) — current research organized by research thread.
- **Publications** (`/research/`) — RISU Technical Notes and persistent records.
- **Tools** (`/tools/`) — public research instruments and instrument records.
- **About** (`/about/`) — research program, method, and publication discipline.

The current research program spans semantic identity and preservation, evidence
qualification and transport, and reliance, finality, and consequence closure.

## Canonical semantic identifier

https://risuinstitute.org/rels/appeal

The identifier is intentionally unversioned. The document currently describes
experimental specification v0.2. The authoritative semantic-definition surface
remains distinct from project summaries and research-instrument pages.

## Research publications

RISU Technical Notes are published under `/research/technical-notes/` and link
to persistent DOI records. Institutional PDFs mirror the corresponding
published records; they are not silent new editions.

Current notes:

- RISU Technical Note 2026-03 — *Consequence Closure: Semantic Assurance at the
  Machine Action Boundary*.
- RISU Technical Note 2026-02 — *Reliance Before Closure: Evidence-Qualified
  Stability for Machine Decisions Under Unresolved Effects*.
- RISU Technical Note 2026-01 — *From Revocation to Closure: Verifying
  Attributable Consequences in AI Agent Decommissioning*.

## Research instruments

`/tools/` is the institutional index for selected research instruments.

- `/tools/consequence-closure/` is the institutional record for Consequence
  Closure Inspector v0.5.0. `/tools/consequence-closure/inspector/` serves the
  exact frozen browser files without a hosted semantic backend.
- `/tools/reliance-inspector/` is an institutional landing page for the
  local-first Reliance Inspector v0.4.0 release. It is not a hosted semantic
  evaluator.
- `/tools/agent-closure/` exposes canonical generated evaluations from the
  frozen Agent Closure Inspector. Its published bytes remain frozen.
- `/tools/negative-result-warrant/` is a browser-local experimental instrument
  for reconstructing and validating bounded negative-evidence premises.

Instrument pages do not enlarge the claims of the underlying research artifact.

## Repository boundary

Only `public/` is configured as the deployable asset directory. Project
documentation, tests, package metadata, and release files remain outside that
boundary. Cloudflare parses `public/_headers`, `public/_redirects`, and
`public/.assetsignore` as static-asset controls and does not serve those files.

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

`pnpm test` runs static release-integrity checks and local HTTP checks.
`pnpm run check` also validates the deployment configuration with a Wrangler dry
run.

For manual review:

```sh
pnpm run dev
```

## Production deployment

The committed Wrangler configuration names `./public` as the only asset
directory, disables the `workers.dev` route, and declares `risuinstitute.org` as
an exact Cloudflare Custom Domain.

Before deployment, run `pnpm test` and `pnpm run check`, review the public-file
allowlist, and confirm that all DOI, repository, and internal links resolve to
the intended public records.

## Design constraints

- Core institutional pages remain static and dependency-light.
- Research instruments remain separate from authoritative semantic-definition
  surfaces and use no third-party runtime assets.
- No analytics, cookies, or third-party assets.
- No empty programs, fabricated impact metrics, or implied external adoption.
- Published claims must remain no broader than the evidence and scope declared
  by the underlying artifact.
- Frozen research-instrument bytes are not modified by site-shell refreshes.
