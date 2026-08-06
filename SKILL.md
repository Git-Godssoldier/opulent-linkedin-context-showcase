---
name: opulent-linkedin-context-showcase
description: Take a supplied roster of people with LinkedIn URLs and run it end to end — validate identities, retrieve and extract structured profiles through Context.dev, assemble a provenance-carrying dossier per person, scrape the upcoming event, draft an event invitation per person, and render a Dither Kit dashboard. Use when demonstrating Opulent and Context.dev enrichment on a known list, building an evidence-backed person dossier, or producing a client-ready extraction report. This skill works a list you already have; it drafts but never sends, and it does not discover people, bypass access controls, or bulk scrape.
license: MIT
---

# Opulent LinkedIn Context Showcase

Turn a roster into a dossier and a drafted invitation. A list of names and URLs goes in; source-backed person records, a scraped event, one message per person, and a dashboard showing the whole chain come out.

The demonstration is the chain, not the data. Anyone can print a profile. What this shows is that each identity was fixed before retrieval, each field carries the page it came from, every sentence in the outreach traces back to one of those fields, each unknown is named rather than filled, and the run reports what it cost.

## Before you start

Read in this order:

1. `references/contextdev-capabilities.md` — every provider call, its credit cost, and which one belongs at each stage.
2. `references/dossier-contract.md` — the output shape, the ten required fields, and the rules the validator enforces.
3. `references/dashboard-brief.md` — the two-layer dashboard, the chart contract, and what may never be styled as verified.
4. `references/event-and-outreach.md` — scraping the event page, choosing the reason to engage, and building the message.
5. `references/evidence-policy.md` — identity, claim, and privacy boundaries.

Two templates define the output shape and ship empty on purpose:

- `templates/dossier.template.json` — one person: the ten required fields plus identity integrity, career shape, firm intelligence, investment signal, public activity, and relationships. Every value null, every field carrying its own state.
- `templates/packet.template.json` — the run: scope, excluded rows, people, firms, event brief, operation ledger, data health, unknowns.
- `templates/event-invitation.tsx` — the outreach message. React Email on the Dither theme, adapted from the Dither welcome template with one change: a single call to action instead of three.

Fill them. Do not reshape them — the validator and the dashboard both read this contract.

## What you need

- A roster with **exact LinkedIn profile URLs**. `targets/roster.csv` ships as the working input.
- `CONTEXT_DEV_API_KEY` in the server-side environment, and access to the person-retrieval endpoint.
- A credit budget agreed before the run.

Missing credentials block retrieval only. Continue through validation and preparation, and report the blocked stage precisely rather than substituting for it.

## Procedure

### 1. Load and validate the roster

```bash
node scripts/load_targets.mjs targets/roster.csv --out artifacts/cohort.json
```

Every row needs an exact `linkedin.com/in/…` URL. **A row without one is rejected, never resolved by search.** A name and an employer is not an identity — several people share any given name, and the wrong match propagates into a dossier and then into whatever consumes it.

Rejections are kept with their reasons and surface in the dashboard. The loader exits non-zero so a partial roster fails loudly instead of quietly shrinking.

*Done when: every row is accepted with a normalized URL or rejected with a reason.*

### 2. Prepare the cohort

```bash
node scripts/prepare_cohort.mjs artifacts/cohort.json --out artifacts/prepared.json
```

Each accepted target becomes one planned retrieval operation and one dossier record with all ten required fields at `pending_retrieval`. Nothing executes yet. Set the credit budget here from unique people and unique firms, and state it before spending it.

*Done when: one planned operation per person, one record per person, and a budget the user has seen.*

### 3. Warm the cache

Fire prefetch for every unique firm domain as soon as it is known. It is free and fire-and-forget — never block the run on it.

*Done when: every unique domain has been prefetched or recorded as unavailable.*

### 4. Retrieve each person

One person-retrieval call per unique LinkedIn URL. Never more than one per identity, and never a second call for an alternate spelling.

Store the raw response privately under a gitignored path, keyed by run. Record status, latency, and error classification per call. A call is `executed` only with an HTTP response **and** a receipt path; otherwise it is `blocked_missing_credentials`, `blocked_endpoint_access`, or `failed` — precisely, in that vocabulary.

*Done when: every person has a terminal status and, where executed, a receipt on disk.*

### 5. Resolve each firm once

One brand resolution per canonical domain, reused across everyone at that firm. Add industry codes. Where the dossier will carry the firm's identity, take the logo, palette, and a screenshot.

*Done when: every unique domain has one firm record, and no domain was resolved twice.*

### 6. Gather dated evidence

For the fields no profile can answer — whether someone is still actively investing, what changed recently — search for dated public signals inside the recency window, then extract against a schema with fact-checking on. Extraction is what turns a search result into a citable claim.

**Absence is a finding.** No dated signal inside the window means `unknown`. It never means `false`.

*Done when: every evidence-based field is either supported by a dated source or explicitly unknown.*

### 7. Scrape the upcoming event

A browser session, not a fetch — the event pages are JavaScript-rendered. Read the page; register for nothing and submit no form.

Capture the event brief: name, date, time, timezone, city, venue and its confirmation status, hosts, description, speakers, agenda, sponsors, and any registered or remaining count the page actually shows. Stamp every field with the URL and `scraped_at`.

**Only a number printed on the page may appear in a message.** Where the page shows no capacity, the message says nothing about scarcity.

*Done when: the brief is complete or each missing field is named, and nothing on the page was interacted with.*

### 8. Assemble the dossiers

Fill the record from steps 4–6. Every field gets its value, state, confidence, source, source URL, and observation date. Where the roster and the public record disagree, record the variance rather than overwriting either.

Contact fields come only from a verification provider. A pattern-inferred address is `candidate` and stays out of anything downstream until verification promotes it.

*Done when: every person carries all ten required fields, and every `Verified` field carries a source URL.*

### 9. Validate

```bash
node scripts/validate_packet.mjs artifacts/packet.json
```

Exits non-zero on any breach: a missing field, a contact value without a verification source, `actively_investing: false` without dated evidence, a `Verified` field with no URL, a low-confidence identity with no recorded variance, an `executed` operation with no receipt, or a secret anywhere in the packet.

*Done when: the validator exits zero.*

### 10. Draft one message per person

Choose the single reason to engage from the dossier — strongest dated signal first, prior attendance next, themed public activity next, plain fit last. It travels at the strength the evidence supports.

Fill `templates/event-invitation.tsx` from the dossier and the event brief. Order inside the message: the reason it arrived now, the event, who is in the room, one action. Subject and preview written last, as a pair. Any prop without evidence behind it is omitted and its section does not render.

Render each message to HTML and plain text, and preview at desktop and 390px.

*Done when: every queued person has a draft whose every claim traces to a dossier field, and no draft has been sent.*

### 11. Render the dashboard

Build the two-layer dashboard, one dossier route per person, and the rendered message beside each dossier so a reviewer sees the claim and its source on one screen. Decision layer first — scope, cohort, analytics, excluded rows. Audit layer collapsed — operation ledger, data health, provenance appendix, unknowns.

Use the committed Dither Kit components for every chart.

*Done when: the export builds, the overview and one dossier have been inspected at desktop and at 390px, and the console is clean.*

### 12. Report the run

State what was retrieved, what was blocked and why, what it cost against budget, and what remains unknown. The unknowns section earns more trust than the findings do.

*Done when: counts, credits, blocks, and unknowns are all stated.*

## Note on the bundled prior demo

`fixtures/public-profile-baseline.json`, the `Goodwin` assertions in `scripts/validate_packet.mjs` and `tests/contracts.test.mjs`, and the sponsor section in `dashboard/app/page.tsx` belong to an earlier three-profile demonstration. They are retained so the repository keeps building, and they are **not** this skill's input. The roster is. Re-point them at the roster before the first client-facing run, or delete them.

## Boundaries

- **A supplied list only.** No discovery, no cohort expansion, no name-only matching.
- **Public profiles only.** Nothing behind a login, a CAPTCHA, a paywall, or an email gate.
- **Nothing invented.** No guessed email, phone, URL, activity status, or relationship. An absent value is reported absent.
- **No claim beyond the evidence.** A person appearing in this cohort is not thereby a member, attendee, customer, or endorser of anything. Firm-level facts stay at the firm level.
- **Contact data is handled, never published.** Values live in the private record; the public artifact carries the state.
- **Nothing sends.** This skill produces a dossier, a dashboard, and a draft. Delivery is the community's existing system, and a person puts it there.
- **The event page is read, never touched.** No registration, no form, no click that changes state.
- **No invented scarcity.** Capacity claims come from the page or are absent.

## Failure modes worth naming

| Symptom | Cause | Response |
| --- | --- | --- |
| A person resolves to the wrong profile | Name-only match slipped through | Reject the row; the loader should have caught it |
| Every field returns unknown for one person | URL is valid but the profile is restricted | Record `blocked` with the observed state; move on |
| Credit spend overruns the budget | A firm resolved once per person instead of once per domain | Dedupe by canonical domain before step 5 |
| `actively_investing` reads false across the cohort | Absence treated as a negative | Only dated evidence sets false; absence is unknown |
| The dashboard shows green for a blocked call | Status styled by presence rather than value | Style by status; blocked is never a shade of success |
