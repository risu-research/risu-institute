# RISU Institute site v0.1 release notes

**PASS — Consumer-side zero-mapping bootstrap demonstrated; independent native use still unproven.**

This release publishes the experimental Appeal semantic v0.1 at the controlled,
unversioned identifier `https://risuinstitute.org/rels/appeal`. RFC 8288 Web
Linking is the first public experimental binding.

The site is a dependency-free public asset set with a pinned Cloudflare Wrangler
toolchain, an explicit `public/` deployment boundary, deterministic HTML and 404
handling, a slashless semantic canonical, and automated release-integrity and
local HTTP checks.

The only consumer hardening associated with this release is the narrow RFC 8288
regression for case-insensitive, character-by-character comparison of extension
relation URIs. No provider mapping, new carrier, LLM inference, workflow logic,
or semantic expansion was introduced.

Recommended tags: `site-v0.1` and `appeal-semantic-v0.1`. The semantic URI remains
unversioned.
