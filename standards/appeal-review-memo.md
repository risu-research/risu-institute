# Designated-expert review memo: candidate `appeal` relation

Date reviewed: 10 August 2026  
Review posture: skeptical RFC 8288 Designated Expert  
Artifact status: internal review candidate, not an IANA submission

## Materials and criteria

This review evaluates the frozen Definition and RFC 8288 Binding in the Appeal
semantic specification v0.2 candidate, RFC 8288 sections 2.1.1 and 2.1.1.1, and
the IANA Link Relation Types registry as updated 12 June 2026. It considers only
registered relations that could plausibly collide with the proposed
context-to-target relationship.

Primary references:

- [RFC 8288 — Web Linking](https://www.rfc-editor.org/rfc/rfc8288.html)
- [IANA Link Relation Types Registry](https://www.iana.org/assignments/link-relations/link-relations.xhtml)
- [PayPal Disputes Integration Guide](https://developer.paypal.com/docs/disputes/integration-guide/)
- [Stream Appeal API documentation](https://getstream.io/moderation/docs/node/content-moderation/appeals/)

RFC 8288 requires a freely available, stable specification and a short
description stated in terms of the relationship between link context and link
target. The registry is intended to reflect common use of links on the Internet;
experts may withhold a name that is too general or a relation that is not likely
to be used on the Internet. Its registration procedure does not state that the
exact relation identifier must already have an independent deployment or a
non-test implementation before expert review.

## 1. Is `appeal` too general a relation name?

**Strongest objection.** “Appeal” has many ordinary meanings: attraction,
fundraising requests, pleas, court proceedings, administrative remedies, and
requests to platform operators. Reserving the bare token might foreclose later,
more broadly useful meanings or cause publishers to use it for unrelated links.

**Assessment: non-blocking.** The proposed relation is intentionally
cross-domain, not application-specific, and the specification assigns a precise
decision-bound meaning. RFC 8288 asks that highly application-specific relations
use specific names so general names remain available for general use. Here, the
proposal actually occupies a general review-of-decision concept across
applications. Ordinary-language polysemy alone is not a collision.

**Minimal clarification needed.** None to the frozen core. Registry discussion
should quote the decision-bound Description in full and avoid describing the
token merely as “an appeal link.”

## 2. Does the definition improperly assume a legal concept?

**Strongest objection.** “Appeal” is a term of legal art. A registered token
could imply due process, standing, jurisdiction, a right to review, or review by
a superior authority. Those implications would be false for many platform or
machine decisions.

**Assessment: non-blocking.** The frozen Definition uses the operational phrase
“request review or reconsideration” and the specification expressly disclaims
standing, eligibility, authorization, legal entitlement, authority, and eventual
success. The relation describes purpose, not a legal status or remedy.

**Minimal clarification needed.** No core change. Any registration request
should point reviewers to the existing non-assertions rather than introduce
legal examples that could narrow the relation.

## 3. Is “prior decision” sufficiently general?

**Strongest objection.** A “decision” could mean an adjudication, policy outcome,
moderation action, fraud flag, payment decline, account restriction, or machine
classification. Without a universal Decision ID or decision ontology, consumers
cannot know whether the context identifies the right kind of decision.

**Assessment: non-blocking.** The relation does not need to classify decisions.
It requires only that the particular prior decision be identified by or
unambiguously associated with the context. That accommodates legal,
administrative, platform, moderation, account, payment, policy, and machine
decisions without claiming that they are procedurally equivalent.

**Minimal clarification needed.** None. A non-normative list of domains could
illustrate breadth, but it is unnecessary and must not create domain-specific
requirements.

## 4. Does the purpose accidentally include editing, retry, complaint, dispute,
escalation, support, or cancellation?

**Strongest objection.** Many resources let a user contest an outcome or change
inputs. A broad reading could turn almost any support, complaint, retry, edit,
dispute, escalation, or cancellation link into an `appeal` link, defeating
semantic interoperability.

**Assessment: non-blocking.** The relation applies only when the target is used
to request review or reconsideration of the prior decision bound to the context.
The public v0.2 candidate now says, non-normatively, that a complaint, dispute,
support route, edit, retry, escalation, or cancellation does not qualify merely
because it concerns the same matter. This supplies the needed boundary without
changing the frozen Definition or Binding.

**Minimal clarification needed.** None further before expert review. Preserve
the new adjacent-purpose note as non-normative deployment guidance.

## 5. Is the context requirement precise enough?

**Strongest objection.** “Unambiguously associated” is publisher-dependent and
not mechanically testable. A collection, account dashboard, case file, or API
root may contain multiple decisions, making the asserted relation ambiguous to a
consumer.

**Assessment: non-blocking.** RFC 8288 relation semantics routinely depend on
publisher assertions. The specification gives a concrete integrity rule: a broad
resource that could refer to several decisions is insufficient, and context must
never be widened. That is as precise as a carrier-neutral relation can be without
inventing a universal Decision ID.

**Minimal clarification needed.** None. Conformance examples could show a
single-decision context and reject a multi-decision dashboard, but the normative
boundary already exists.

## 6. Is the target constrained too much or too little?

**Strongest objection.** “A resource used to request” could be read narrowly as
only a directly invocable endpoint, excluding a form or interactive page, or
broadly enough to include policy documentation, generic support homepages, and
resources several steps removed from a request.

**Assessment: non-blocking.** The target is constrained by purpose, not by
representation or protocol. A form, endpoint, interactive document, or other
resource can qualify if it is used to request review or reconsideration. A
resource that only explains policy or gives generic support does not satisfy that
purpose merely because an appeal route exists somewhere beneath it.

**Minimal clarification needed.** A non-normative target example would help, but
the existing “purpose, not procedure” and context rules are sufficient for
registration semantics.

## 7. Does the semantic imply a method, media type, form, endpoint, or workflow?

**Strongest objection.** The word “affordance” and the phrase “used to request”
might lead consumers to assume an HTTP POST endpoint, a form representation, a
submission schema, or immediate invocability.

**Assessment: non-blocking.** The specification explicitly states that discovery
is not invocation and disclaims execution method, media type, form, endpoint,
schema, timing, and universal workflow. The RFC 8288 Binding constrains no media
type or HTTP method.

**Minimal clarification needed.** None.

## 8. Does an existing registered relation already express this relationship?

**Strongest objection.** A new relation is unnecessary if an existing relation
already covers the context-to-target link.

**Assessment: non-blocking; no collision found.** The current IANA registry has
no `appeal`, `complaint`, `dispute`, `review`, `reconsider`, or `cancel` relation.
The closest registered relations differ materially:

| Registered relation | Why it is not the same relationship |
| --- | --- |
| `help` | Context-sensitive help provides assistance; it need not request review of a prior decision. |
| `edit` | The target edits the context; an appeal requests review or reconsideration of a decision. |
| `edit-form` | The target provides a form for editing an associated resource, not necessarily for reviewing a decision. |
| `create-form` | The target provides a submission form for creating a resource; creation does not express the proposed purpose. |
| `service` | The target is an AtomPub service document, not a decision-review affordance. |
| `related` | This intentionally weak relation asserts only relatedness and does not carry the proposed purpose. |
| `describedby` | The target provides information about the context; description is not a request for review. |
| `payment` | The target accepts payment. Its procedure-neutral style is analogous, but its purpose is unrelated. |
| `replies` | The target is a reply to the context; a reply need not request reconsideration. |
| `status` | The target represents status; it does not request review of a prior decision. |

**Minimal clarification needed.** Keep this collision table in the review record;
do not add it to the concise semantic page.

## 9. Would `decision-appeal`, `review-request`, or `reconsider` be superior?

**Strongest objection.** A compound token would reduce legal ambiguity and make
the decision-bound scope visible without dereferencing the specification.

**Assessment: non-blocking; `appeal` remains the better candidate.**
`decision-appeal` is more explicit but redundant once the registered Description
is considered and may wrongly suggest a specialized decision vocabulary.
`review-request` is broader: it can describe peer review, document review, or
pre-decision review. `reconsider` is a verb, can imply return to the original
decision-maker, and omits the broader “review” branch. The concise token
`appeal` best matches the specified cross-domain purpose.

**Minimal clarification needed.** None.

## 10. Is there sufficient evidence that the relation is likely to be used on
the Internet?

**Strongest objection.** Tests A and B are controlled experiments. Test A was
seeded with the semantic meaning. Test B records one clean-room implementation
instance. Neither establishes organic deployment, an independent organization’s
intent to publish, a production use case, or demand from multiple implementers.
Passing interoperability tests can show that a relation is implementable without
showing adoption of the RISU URI or likely adoption of a future registered
token. RFC 8288 permits experts to question relations that are not likely to be
used on the Internet.

**Assessment: material review risk, but not a demonstrated registration
prerequisite.** The evidence must be separated carefully:

- **RISU adoption:** no independent organization is claimed to have adopted the
  RISU extension URI or a future registered `appeal` token. The controlled
  experiments remain implementation evidence, not adoption evidence.
- **Underlying appeal-affordance use:** PayPal documents appealing a lost
  dispute, and Stream documents submitting appeals against moderation
  decisions. These are independent prior uses of the underlying affordance.
- **Lexical and hypermedia shape:** PayPal's official guide names an `appeal`
  HATEOAS link in a dispute-details response. This is relevant prior Internet
  use of the lexical relation and a hypermedia action shape; it does not
  establish use of the RISU URI, an RFC 8288 relation, or compatibility with the
  RISU specification. Stream's Appeal API and `moderation.appeal` method are
  relevant lexical and procedural evidence, but are not presented as a
  hypermedia link relation.
- **Likely usefulness:** the same decision-review purpose appears in independent
  payment-dispute and content-moderation systems. Together with the controlled
  interoperability results, this supports a credible case that a
  carrier-neutral relation could be useful on the Internet. It does not prove
  adoption or guarantee that an expert will find the showing sufficient.

Neither PayPal nor Stream is presented as a RISU adopter, a publisher of the
RISU relation URI, or an implementation claiming RFC 8288 compatibility. RFC
8288 does not identify an independent non-test RISU implementation as a formal
registration prerequisite. Such an implementation would strengthen the record,
but its absence is not, by itself, a demonstrated blocker.

**Minimal clarification needed.** No core wording change. Preserve these source
citations and evidence classifications in the review record; do not recast the
controlled experiments, PayPal, or Stream as RISU adoption.

## 11. Are the extension URI and future registered token being conflated?

**Strongest objection.** Publishers and consumers may assume that
`rel="https://risuinstitute.org/rels/appeal"` and `rel="appeal"` compare equal
after registration. RFC 8288 explicitly does not grant that equivalence. A silent
switch would break existing consumers or create split semantics.

**Assessment: non-blocking in the v0.2 candidate.** The specification and IANA
candidate now state that the URI and token are different relation identifiers and
that any migration or dual-support policy requires separate specification.

**Minimal clarification needed.** Preserve this boundary in the published v0.2
document and in any future registration discussion.

## 12. Is the cited specification presently suitable as an IANA reference?

**Strongest objection.** A registration must cite a freely available, stable
specification. The v0.2 text is currently a local review candidate; the public
canonical page remains v0.1 until the candidate is deliberately published.

**Assessment: a precondition for submission, not a blocker to expert review and
not a semantic flaw.** The unversioned HTTPS reference is appropriate only
after the reviewed v0.2 text is published there and operational stability is
confirmed.

**Minimal clarification needed.** Publish the reviewed v0.2 candidate at the
stable URI before submission. Do not submit or imply registration while the
public reference still contains the obsolete experimental-status statement.

## Verdict

**READY FOR EXPERT REVIEW**

No fatal semantic collision, core-definition flaw, or demonstrated
expert-review blocker was found. The likely-use showing remains a material point
for an expert to evaluate, but RFC 8288 does not make prior independent adoption
of the exact relation identifier a formal prerequisite.

One operational precondition remains before an actual IANA request: publish the
reviewed v0.2 specification at the stable reference and confirm the public
response. That publication step is not part of this surgical review and does not
justify changing the frozen Definition or RFC 8288 Binding.
