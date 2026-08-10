# IANA Link Relation candidate: `appeal`

Status: review artifact only; not submitted to IANA.

Relation Name:
appeal

Description:
Refers to a resource used to request review or reconsideration of the prior decision identified by or unambiguously associated with the link context.

Reference:
https://risuinstitute.org/rels/appeal

## Description review

Decision: retain the Description exactly as written.

The Description is already a short statement of the relationship between the
link context and link target, as requested by RFC 8288. Each qualifying phrase
does semantic work:

- “used to request” distinguishes an actionable request affordance from a
  resource that merely describes the decision;
- “review or reconsideration” states the narrow purpose without prescribing a
  procedure; and
- “identified by or unambiguously associated with the link context” prevents
  the relation from being asserted on a broad context containing several
  decisions.

Shortening the Description would create ambiguity without improving registry
fitness. Cosmetic brevity is not a sufficient reason to diverge from the frozen
RFC 8288 binding.

## Identifier boundary

The current experiment uses the extension relation URI:

`rel="https://risuinstitute.org/rels/appeal"`

A future IANA registration, if approved, would define the registered relation
token:

`rel="appeal"`

These are different RFC 8288 relation identifiers. RFC 8288 does not make them
equivalent. Any migration or dual-support policy would require a separate,
explicit specification.
