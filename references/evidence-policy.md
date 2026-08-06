# Evidence policy

What may be claimed, from what, and where a claim stops.

## Three different claims

Keep them apart. Collapsing them is the failure this policy exists to prevent.

1. **Identity claim** — the supplied LinkedIn URL and a first-party corroborating page refer to the same named person at the same current firm.
2. **Attribute claim** — a specific field (title, organization, location, headline) is what the retrieved profile says it is, on the date it was read.
3. **Activity claim** — a dated public signal shows the person or their firm doing something inside the recency window.

An identity claim never implies an activity claim. A firm-level fact never implies a personal one. A person working at a firm that did something did not thereby do it.

## Identity

- Only an **exact** LinkedIn profile URL enters the run. A name and an employer is not an identity.
- Where the supplied roster and the public record disagree — a different city, a differently named firm — record the variance. Do not overwrite either side, and do not quietly pick one.
- Where several people share a name and none can be separated on evidence, the row is rejected with that reason. A probable match is marked `public_identity_probable` and carries the variance that makes it probable.
- Confidence is stated per subject: `high`, `medium`, or `low`. A `low` confidence without a recorded variance is a validation failure, not a judgement call.

## Attributes

- Every field carries its source, source URL, and observation date. A field with `confidence: Verified` and no URL is invalid.
- Verbatim beats paraphrase for headline and summary text. Paraphrase is where drift starts.
- Absence is a finding. `unknown` is a real answer and is always preferable to an inference presented as a fact.

## Activity

- `actively_investing` and every other activity field require a **dated** signal inside the recency window.
- Absence downgrades to `unknown`. It never implies `false`. Only explicit dated evidence sets a negative.
- A job title is not evidence of activity. Neither is firm membership, follower count, or profile completeness.

## Contact data

- Contact values come only from a verification provider, never from inference or pattern.
- A pattern-derived address is `candidate` and stays out of every downstream artifact until verification promotes it.
- Contact values live in the private run record. The published artifact carries the state, not the value.

## Access

- Public pages only. Nothing behind a login, a CAPTCHA, a paywall, or an email gate.
- An interstitial or challenge ends that read. It is reported as `blocked` with what was observed, and it is never worked around.
- The event page is read, never interacted with. No registration, no form submission, no state-changing click.

## Claims about people and organizations

- A sponsor relationship is firm-level. It says nothing about any individual at that firm — not that they sponsored, hosted, attended, registered for, or endorsed anything.
- Appearing in a cohort is not membership, attendance, custom, or endorsement of anything.
- Relationship language is precise or absent. Co-attendance is co-attendance. It is never familiarity, and never an introduction unless someone has agreed to make one.

## Operation status

A call is `executed` only with an HTTP response **and** a stored receipt. Otherwise it is `proposed`, `blocked_missing_credentials`, `blocked_endpoint_access`, or `failed` — in that vocabulary, precisely. Fallback work is never described as the capability it replaced, and a proposed operation is never rendered as a completed one.

## Publication

Anything published carries only what the evidence supports. Where a subject's own material is used — a firm's logo, palette, or description — it is used to present that subject, not to imply their participation in or endorsement of the work.
