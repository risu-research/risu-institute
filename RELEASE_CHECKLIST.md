# RISU Institute v0.2 release checklist

Run `pnpm install --frozen-lockfile` and `pnpm run check` from the exact release
revision before using this checklist. Record site and consumer revisions
separately.

## Hosting and public responses

- [ ] Domain control is confirmed for `risuinstitute.org` in the intended
  Cloudflare account.
- [ ] The HTTPS Custom Domain is connected and its certificate is active.
- [ ] `/` returns 200.
- [ ] `/rels/appeal` returns 200 directly with no trailing-slash dependency.
- [ ] `/work/appeal-interoperability/` returns 200.
- [ ] HTML, CSS, XML, text, and SVG responses have the correct `Content-Type`.
- [ ] `/rels/appeal/` returns 301 with `Location: /rels/appeal`.
- [ ] The document canonical remains exactly
  `https://risuinstitute.org/rels/appeal` (slashless).
- [ ] `/robots.txt` is reachable.
- [ ] `/sitemap.xml` is reachable and lists the slashless semantic URI.
- [ ] `/assets/favicon.svg` is reachable.
- [ ] A nonexistent URL returns the intended HTML page with status 404.

## Release integrity

- [x] No old placeholder semantic identity remains on any production page.
- [x] No README, prompt, test, package file, checklist, release note, or local
  artifact is reachable through the deployed asset surface.
- [x] The frozen core semantic remains exactly: “Identifies an affordance used
  to request review or reconsideration of the prior decision identified by or
  unambiguously associated with its context.”
- [x] The frozen RFC 8288 binding remains exactly: “Refers to a resource used to
  request review or reconsideration of the prior decision identified by or
  unambiguously associated with the link context.”
- [x] The semantic remains labeled Experimental.
- [x] Controlled clean-room native publication is described as one experimental
  instance, not adoption.
- [x] The extension URI and any future registered token are described as
  different RFC 8288 relation identifiers.
- [x] The non-normative adjacent-purpose note prevents complaint, dispute,
  support, edit, retry, escalation, and cancellation routes from qualifying
  merely because they concern the same matter.
- [x] No IANA registration, standardization, ecosystem adoption, or universal
  interoperability is claimed.
- [x] PayPal and Stream are not described as RISU adopters; their official
  documentation is used only as scoped evidence of underlying appeal-affordance
  usage.

## Consumer and source-control freeze

- [x] The consumer test suite passes if consumer source is present.
- [x] Any consumer change is limited to the authorized RFC 8288
  case-insensitive, character-by-character extension-relation URI comparison
  regression hardening.
- [ ] The exact release commit is recorded in the external release provenance.
- [x] Exact consumer freeze commit (recorded separately):
  `babc39d09d1d35447d306bc7540f8dbe7d1aa2e4`
- [x] No `site-v0.2` tag is created because the tag audit found no historical
  site-tag release series.
- [ ] The annotated semantic tag `appeal-semantic-v0.2` is created against the
  exact release commit only after successful live verification.
- [ ] The release and independent-publisher experiment use the recorded frozen
  consumer without source modification.
