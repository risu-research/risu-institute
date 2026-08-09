# RISU Institute v0.1 release checklist

Run `pnpm install --frozen-lockfile` and `pnpm run check` from the exact release
revision before using this checklist. Record site and consumer revisions
separately.

## Hosting and public responses

- [ ] Domain control is confirmed for `risuinstitute.org` in the intended
  Cloudflare account.
- [ ] The HTTPS Custom Domain is connected and its certificate is active.
- [ ] `/` returns 200.
- [ ] `/rels/appeal` returns 200 directly with no trailing-slash dependency.
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
- [x] Independent native publication remains unproven.

## Consumer and source-control freeze

- [x] The consumer test suite passes if consumer source is present.
- [x] Any consumer change is limited to the authorized RFC 8288
  case-insensitive, character-by-character extension-relation URI comparison
  regression hardening.
- [ ] Exact release commit: `________________________________________`
- [x] Exact consumer freeze commit (recorded separately):
  `babc39d09d1d35447d306bc7540f8dbe7d1aa2e4`
- [ ] Site tag `site-v0.1` is considered after the release commit is fixed.
- [ ] Semantic-document tag `appeal-semantic-v0.1` is considered against the
  same frozen semantic content.
- [ ] The release and independent-publisher experiment use the recorded frozen
  consumer without source modification.
