# RISU Institute site v0.2 release notes

**PASS — Controlled interoperability demonstrated; adoption and registration remain unproven.**

This release advances the experimental Appeal semantic document to v0.2 at
the controlled, unversioned identifier
`https://risuinstitute.org/rels/appeal`. RFC 8288 Web Linking remains the first
public experimental binding.

The semantic Definition and RFC 8288 Binding are unchanged. The status text now
records provider-independent consumer recognition and one controlled clean-room
public-definition-to-native-publication interoperability instance. A separate
public evidence page records design, limitations, negative controls, causal
order, and frozen SHA-256 anchors.

The release also states that the experimental extension URI and a potential
future registered token `appeal` would be different RFC 8288 relation
identifiers. No equivalence, migration policy, IANA registration, standardization,
ecosystem adoption, or universal interoperability is claimed.

A short non-normative clarification now distinguishes the relation from nearby
complaint, dispute, support, edit, retry, escalation, and cancellation purposes.
Those routes qualify only when the target is used to request review or
reconsideration of the prior decision bound to the context.

The site is a dependency-free public asset set with a pinned Cloudflare Wrangler
toolchain, an explicit `public/` deployment boundary, deterministic HTML and 404
handling, a slashless semantic canonical, and automated release-integrity and
local HTTP checks.

No Test A or Test B artifact was altered or regenerated. No provider mapping,
new carrier, semantic inference, workflow logic, or semantic expansion was
introduced.

This v0.2 source is released only from the validated release commit and is not
an IANA submission. The semantic URI remains unversioned.
