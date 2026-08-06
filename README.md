# opulent-linkedin-context-showcase

A skill for Opulent. It takes one named person with a known LinkedIn URL, takes them as far as public evidence allows, and produces a fully sourced dossier, a drafted event invitation, and a dashboard showing the whole chain.

This repository holds the **instructions and the output contract**. It performs no extraction and ships no gathered data. The templates are empty on purpose.

## What it does

Depth over breadth is the point. A hundred shallow rows prove nothing a list broker cannot claim; one subject taken to the limit of the evidence proves a method.

A single LinkedIn URL goes in. The run validates the identity before spending anything on it, exhausts the provider surface on that person and their firm — profile, brand resolution, industry codes, sitemap, bounded crawl, screenshot, styleguide, dated public signals — scrapes the upcoming event, and drafts one invitation whose every sentence traces back to a field the run produced. The dashboard shows the identity that was fixed before retrieval, the page each field came from, what the run cost, and what it could not answer.

## Run it

```bash
npm run targets     # validate the roster, reject anything without an exact profile URL
npm run prepare     # build the subject record and price the planned calls
npm run context:probe   # confirm the endpoint refuses an unauthenticated call
npm run validate    # check a filled packet against the contract
npm test            # contract tests over the templates and the request shape
```

Retrieval needs `CONTEXT_DEV_API_KEY` server-side and access to the person-retrieval endpoint. Without it the run still validates, prepares, and prices — and reports the retrieval stage as blocked rather than substituting for it.

## Layout

```
SKILL.md                        the 12-step procedure the agent follows
targets/roster.csv              the candidate pool; one row becomes the subject
templates/
  dossier.template.json         one subject: ten required fields + six extension blocks
  packet.template.json          the run: scope, event, messages, ledger, health, unknowns
  event-invitation.tsx          React Email on the Dither theme, one call to action
references/
  contextdev-capabilities.md    every provider call, its credit cost, when to reach for it
  dossier-contract.md           the field envelope and the rules the validator enforces
  event-and-outreach.md         event scrape, reason selection, message build, house voice
  writing-quality.md            word-level rules, with the full swap tables
  dashboard-brief.md            decision layer, audit layer, chart contract
  dashboard-contract.md         visual direction and licensing note
  evidence-policy.md            what may be claimed, from what, and where a claim stops
  operation-contract.md         the receipt shape every call carries
scripts/
  load_targets.mjs              roster validation; rejects anything without an exact URL
  prepare_cohort.mjs            subject record + planned operations, nothing executed
  contextdev_people.mjs         the retrieval client
  contextdev_auth_probe.mjs     unauthenticated-rejection check
  validate_packet.mjs           enforces the dossier contract
dashboard/                      Next.js app; reads the packet, renders its empty states
```

## The ten required fields

Every subject carries all ten, whatever the outcome: email, phone, industries, title, organization, location, LinkedIn headline, LinkedIn About, actively-investing, and changes-since-last.

A field missing from the packet is worse than one present and `unknown` — the reader cannot tell "we looked and found nothing" from "we never looked."

Beyond them, the dossier has room for career shape, firm intelligence, investment signal, public activity, relationship context, and identity integrity. Each is filled only when it was actually retrieved.

## What it will not do

- **No discovery.** A supplied list only. A name and an employer is not an identity, so a row without an exact profile URL is rejected rather than resolved by search.
- **No invention.** No guessed email, phone, URL, activity status, or relationship. Contact values come from a verification provider or they stay absent; a pattern-derived address is `candidate` and never promotes itself.
- **No inferred inactivity.** Absence downgrades to `unknown`. Only dated evidence sets a negative.
- **No gated access.** Public pages only. An interstitial ends that read and is reported, never worked around.
- **No state change.** The event page is read, never interacted with — no registration, no form, no click that changes anything.
- **No sending.** The run drafts and renders. Delivery is the client's existing system, and a person puts it there.

## Honesty rules the code enforces

A call is `executed` only with an HTTP response **and** a stored receipt; otherwise it is `proposed`, `blocked_missing_credentials`, `blocked_endpoint_access`, or `failed`, in that vocabulary. A `Verified` field carries a source URL. A low-confidence identity carries the variance that makes it low. Rejected rows appear in the dashboard, because what the gate refused is part of what the gate is worth.

## Credits

Structure and voice follow [browserbase/skills](https://github.com/browserbase/skills). The provider surface is [Context.dev](https://docs.context.dev/skill.md). The dashboard's visual direction is informed by the Opulent GTM Intelligence report application; see `references/dashboard-contract.md` for the licensing note. The email template adapts the Dither template from [resend/react-email](https://github.com/resend/react-email/tree/canary/apps/demo/emails), and the writing rules are vendored from [vercel-labs/marketing-team-eve-template](https://github.com/vercel-labs/marketing-team-eve-template).

MIT.
