---
name: opulent-linkedin-context-showcase
description: Run one named person end to end at maximum depth — validate the identity, exhaust the Context.dev surface on them and their firm, assemble a fully populated dossier, scrape the upcoming event, draft the invitation, and render both to a Dither Kit dashboard. Use when demonstrating Opulent and Context.dev enrichment on a known list, building an evidence-backed person dossier, or producing a client-ready extraction report. This skill works a list you already have; it drafts but never sends, and it does not discover people, bypass access controls, or bulk scrape.
license: MIT
---

# Opulent LinkedIn Context Showcase

One person, everything knowable, fully sourced. A single LinkedIn URL goes in; a populated dossier, a scraped event, a drafted invitation, and a dashboard showing the whole chain come out.

**Depth over breadth is the whole point.** A hundred shallow rows prove nothing a list broker cannot claim. One subject taken as far as the evidence allows — profile, firm, industry codes, dated signals, visual identity, and a message whose every sentence traces to a field — proves the method.

The demonstration is the chain: the identity was fixed before retrieval, each field carries the page it came from, each unknown is named rather than filled, and the run reports what it cost.

## Before you start

Read in this order:

1. `references/contextdev-capabilities.md` — every provider call, its credit cost, and which one belongs at each stage.
2. `references/dossier-contract.md` — the output shape, the ten required fields, and the rules the validator enforces.
3. `references/dashboard-brief.md` — the two-layer dashboard, the chart contract, and what may never be styled as verified.
4. `references/event-and-outreach.md` — scraping the event page, choosing the reason to engage, and building the message.
5. `references/writing-quality.md` — the word-level rules every piece of prose here obeys.
6. `references/evidence-policy.md` — identity, claim, and privacy boundaries.

Two templates define the output shape and ship empty on purpose:

- `templates/dossier.template.json` — one person: the ten required fields plus identity integrity, career shape, firm intelligence, investment signal, public activity, and relationships. Every value null, every field carrying its own state.
- `templates/packet.template.json` — the run: scope, excluded rows, people, firms, event brief, operation ledger, data health, unknowns.
- `templates/event-invitation.tsx` — the outreach message. React Email on the Dither theme, adapted from the Dither welcome template with one change: a single call to action instead of three.

Fill them. Do not reshape them — the validator and the dashboard both read this contract.

## What you need

- **One subject** with an exact LinkedIn profile URL. `targets/roster.csv` ships as the candidate pool; pick a single row whose identity resolved cleanly at high confidence. A subject with roster variance or a low-confidence match is the wrong choice for a showcase — the demo should spend its depth on evidence, not on caveats.
- `CONTEXT_DEV_API_KEY` in the server-side environment, and access to the person-retrieval endpoint.
- A credit budget agreed before the run.

Missing credentials block retrieval only. Continue through validation and preparation, and report the blocked stage precisely rather than substituting for it.

## Procedure

### 1. Validate the roster and choose the subject

```bash
node scripts/load_targets.mjs targets/roster.csv --out artifacts/cohort.json
```

Every row needs an exact `linkedin.com/in/…` URL. **A row without one is rejected, never resolved by search.** A name and an employer is not an identity — several people share any given name, and the wrong match propagates into a dossier and then into whatever consumes it. The loader exits non-zero so a partial roster fails loudly instead of quietly shrinking.

Then pick **one** accepted row as the subject and say why. The rejected rows still appear in the dashboard: showing what the gate refused is part of what the gate is worth.

*Done when: the roster is validated, one subject is chosen, and the choice is stated.*

### 2. Prepare the subject and plan the spend

```bash
node scripts/prepare_cohort.mjs artifacts/cohort.json --out artifacts/prepared.json
```

The subject becomes one dossier record with all ten required fields at `pending_retrieval`, plus the planned operation list. Nothing executes yet.

Plan the full call list up front and price it, because this run deliberately reaches for the whole provider surface on one person. State the budget before spending it.

*Done when: the record exists, every planned call is listed with its cost, and the user has seen the total.*

### 3. Warm the cache

Fire prefetch for every unique firm domain as soon as it is known. It is free and fire-and-forget — never block the run on it.

*Done when: every unique domain has been prefetched or recorded as unavailable.*

### 4. Retrieve the person

One person-retrieval call. Never a second for an alternate spelling.

Store the raw response privately under a gitignored path, keyed by run. Record status, latency, and error classification per call. A call is `executed` only with an HTTP response **and** a receipt path; otherwise it is `blocked_missing_credentials`, `blocked_endpoint_access`, or `failed` — precisely, in that vocabulary.

*Done when: every person has a terminal status and, where executed, a receipt on disk.*

### 5. Exhaust the firm

This is where the depth shows. On the subject's firm, in this order:

| Call | Produces |
| --- | --- |
| brand resolve | Canonical domain, description, industries, socials, address, logos, palette |
| NAICS + SIC | Normalized industry codes — what turns a firm into a segment |
| sitemap | The team, portfolio, and news paths, so the crawl is aimed rather than blind |
| bounded crawl | Team and portfolio pages as a corpus |
| markdown scrape | Any single page the crawl flagged as load-bearing |
| screenshot | The firm's site, for the dossier |
| styleguide + fonts | Palette and typography, so the dossier carries the subject's own visual identity |
| products, where the firm has any | Structured product detail |

Every call records its credits. A capability skipped is recorded as skipped, with the reason — an absent section should read as a decision, not an oversight.

*Done when: each applicable capability has been run or explicitly skipped, and the firm record is populated.*

### 6. Gather dated evidence

For the fields no profile can answer — whether someone is still actively investing, what changed recently — run several searches inside the recency window across distinct angles: the person by name, the firm's recent financings, fund announcements, hiring and leadership moves, talks and writing. Then extract against a schema with fact-checking on. Extraction is what turns a search result into a citable claim.

**Absence is a finding.** No dated signal inside the window means `unknown`. It never means `false`.

*Done when: every evidence-based field is either supported by a dated source or explicitly unknown.*

### 7. Scrape the upcoming event

A browser session, not a fetch — the event pages are JavaScript-rendered. Read the page; register for nothing and submit no form.

Capture the event brief: name, date, time, timezone, city, venue and its confirmation status, hosts, description, speakers, agenda, sponsors, and any registered or remaining count the page actually shows. Stamp every field with the URL and `scraped_at`.

**Only a number printed on the page may appear in a message.** Where the page shows no capacity, the message says nothing about scarcity.

*Done when: the brief is complete or each missing field is named, and nothing on the page was interacted with.*

### 8. Assemble the dossier

Fill the record from steps 4–7. Every field gets its value, state, confidence, source, source URL, and observation date. Where the roster and the public record disagree, record the variance rather than overwriting either.

Contact fields come only from a verification provider. A pattern-inferred address is `candidate` and stays out of anything downstream until verification promotes it.

*Done when: the subject carries all ten required fields plus every extension block the run could populate, and every `Verified` field carries a source URL.*

### 9. Validate

```bash
node scripts/validate_packet.mjs artifacts/packet.json
```

Exits non-zero on any breach: a missing field, a contact value without a verification source, `actively_investing: false` without dated evidence, a `Verified` field with no URL, a low-confidence identity with no recorded variance, an `executed` operation with no receipt, or a secret anywhere in the packet.

*Done when: the validator exits zero.*

### 10. Draft the message

Choose the single reason to engage from the dossier — strongest dated signal first, prior attendance next, themed public activity next, plain fit last. It travels at the strength the evidence supports.

Load `references/writing-quality.md` and the house-voice section of `references/event-and-outreach.md` first. Then fill `templates/event-invitation.tsx` from the dossier and the event brief. Order inside the message: the reason it arrived now, the event, who is in the room, one action. Subject and preview written last, as a pair. Any prop without evidence behind it is omitted and its section does not render.

Render to HTML and plain text, and preview at desktop and 390px.

*Done when: the draft exists, every claim in it traces to a dossier field, it passes the writing-quality rules, and it has not been sent.*

### 11. Render the dashboard

Build the two-layer dashboard, the subject's dossier route, and the rendered message beside it so a reviewer sees the claim and its source on one screen. With a single subject the analytics describe capability coverage and credit spend rather than a cohort distribution. Decision layer first — scope, cohort, analytics, excluded rows. Audit layer collapsed — operation ledger, data health, provenance appendix, unknowns.

Use the committed Dither Kit components for every chart.

*Done when: the export builds, the overview and one dossier have been inspected at desktop and at 390px, and the console is clean.*

### 12. Report the run

State which capabilities ran, which were skipped and why, what the run cost against budget, and what about this person remains unknown. On a single-subject run the unknowns section is short and specific, which makes it more useful than a long one — and it earns more trust than the findings do.

*Done when: counts, credits, blocks, and unknowns are all stated.*

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
