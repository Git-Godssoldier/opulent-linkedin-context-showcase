---
name: opulent-linkedin-context-showcase
description: Build an evidence-safe Opulent showcase from a small, user-approved set of known public LinkedIn profile URLs. Use when asked to demonstrate Context.dev POST /people/retrieve, validate sponsor-affiliated public identities, preserve execution receipts, normalize professional profile fields, redact contact data, or render the included dither-chart dashboard. This skill is not for discovering people, bypassing LinkedIn controls, bulk scraping, LP research, sponsor prospecting, outreach, CRM writes, or relationship inference.
---

# Opulent LinkedIn Context Showcase

Turn a bounded list of verified public LinkedIn URLs into an auditable Context.dev retrieval run and a polished local dashboard. The included sample uses three Goodwin professionals because a public VC Village NYC event page names Goodwin as a sponsor. That proves firm-level sponsor affiliation only; it does not prove that any profiled person sponsored, hosted, attended, or endorsed the event.

## Before you start

Read:

1. `references/operation-contract.md` for the exact Context.dev call and receipt rules.
2. `references/evidence-policy.md` for identity, sponsor, privacy, and claim boundaries.
3. `references/dashboard-contract.md` before changing the visual output.

Require all of the following for a live run:

- a small user-approved set of exact LinkedIn profile URLs;
- a lawful professional-research purpose;
- `CONTEXT_DEV_API_KEY` in the server-side environment; and
- Context.dev account access to the private-alpha people retrieval endpoint.

If authentication or endpoint access is missing, stop the provider run with an explicit blocked receipt. You may still render a public-source validation baseline, but label it `public_validation_baseline`; never present it as Context output.

## Workflow

### 1. Fix the scope before retrieval

Use `user_list` mode. Normalize and deduplicate exact LinkedIn URLs. Do not guess a missing URL, expand the cohort, search for additional people, or accept a name-only match.

For the bundled showcase, the maximum is three unique people, three `POST /people/retrieve` calls, zero company calls, zero web extraction calls, and zero monitors.

### 2. Validate identity and affiliation separately

For each person, retain:

- the public LinkedIn URL supplied or approved for retrieval;
- an official employer biography that corroborates the person and current role;
- the employer name and role exactly supported by the sources; and
- a validation timestamp.

Retain sponsor proof as a separate firm-level record. Never convert `Goodwin sponsored a VC Village event` into `this Goodwin professional sponsored or attended it`.

### 3. Execute Context.dev once per unique URL

Run:

```bash
npm run context:dry-run
CONTEXT_DEV_API_KEY=ctxt_secret_... npm run context:live
```

The live script calls exactly:

```http
POST https://api.context.dev/v1/people/retrieve
Authorization: Bearer $CONTEXT_DEV_API_KEY
Content-Type: application/json
```

with `identifiers.linkedinUrl`, a bounded timeout, and stable tags. Never log the bearer token. Retry only 408, 429, and 500. One failed person must not erase successful receipts for the others.

### 3b. Return the ten enrichment fields

A recurring investor refresh is judged on a fixed field list, so every profile carries all ten
whether or not a value was found. A field that is absent from the packet is worse than one that
is present and `unknown`: the consumer cannot tell "we looked and found nothing" from "we never
looked".

| Field | Showcase behaviour |
| --- | --- |
| `email` | `not_retrieved`, value null — contact data is withheld here |
| `phone` | `not_retrieved`, value null — same reason, optional field |
| `industries` | Retrieved from the public employer profile |
| `title` | Retrieved |
| `organization` | Retrieved |
| `location` | Retrieved; a live call refines it |
| `linkedin_headline` | Needs a live retrieval; `unknown` without one |
| `linkedin_about` | Retrieved |
| `actively_investing` | `unknown` until a dated signal inside the recency window supports it |
| `changes_since_last` | `baseline` on a first observation — a change list needs a prior accepted refresh |

Two rules the validator enforces rather than trusts:

- **Contact values stay null in showcase mode.** These are real people's public profiles, and a
  demonstration has no business publishing their address or number. The state machine is the
  deliverable; the values are not. A production run resolves them and marks each `verified`,
  `accept_all`, `unknown`, `bounced`, or `candidate` before any writeback.
- **`actively_investing` may only be `false` with retrieved evidence.** Absence downgrades to
  `unknown`. A job title is not evidence, and silence is not a negative.

`field_coverage` scores against these ten, so the baseline reports 50% honestly rather than
scoring itself against the fields it happened to fill.

### 4. Preserve raw receipts privately

Live responses belong under `.scratch/contextdev/<run-id>/`, which is gitignored. Preserve per-person HTTP status, safe rate-limit headers, latency, request body, response body, and error classification. Do not publish raw provider responses by default.

Never label a call `executed` without an HTTP response and a receipt path. Use `blocked_missing_credentials`, `blocked_endpoint_access`, `failed`, or `executed` precisely.

### 5. Build the public packet

Run:

```bash
npm run build:packet
# After a live run:
npm run build:packet -- --manifest .scratch/contextdev/<run-id>/manifest.json
npm run validate
```

The builder emits `artifacts/showcase-packet.json` and `dashboard/data/showcase.json`. It strips personal email, phone, address, inferred contact routes, and any unapproved free text. Unsupported fields remain `Unknown`.

### 6. Render and inspect the dashboard

Run:

```bash
npm run dashboard:install
npm run dashboard:build
npm --prefix dashboard run dev
```

Inspect desktop and narrow layouts. Confirm that the provider status, source mode, sponsor boundary, profile links, official corroboration, and unknowns remain visible. A blocked Context run must never look like a successful extraction.

## Required output

Return:

- cohort counts: requested, deduplicated, eligible, executed, blocked, and failed;
- one Context operation ledger row per unique LinkedIn URL;
- receipt paths for live calls, or the exact blocked reason;
- normalized professional fields and visible unknowns;
- sponsor evidence with the firm-level boundary;
- the dashboard artifact/build result; and
- source links and checked dates.

## Safety and non-goals

- Do not automate LinkedIn login, CAPTCHA solving, cookie reuse, rate-limit evasion, or authenticated page scraping.
- Do not collect or infer personal emails, phone numbers, home addresses, family data, protected traits, or sensitive classifications.
- Do not use profile activity to infer intent, political views, health, religion, or private relationships.
- Do not send outreach, write to CRM, rank people for employment, or make eligibility decisions.
- Do not include LP workflows, fund-return research, sponsor prospecting, Ricochet workflows, or unrelated GTM discovery.
- Respect LinkedIn, Context.dev, source-site, and applicable data-protection terms.

## Verification

Run `npm run selftest`. A fully live provider scenario additionally requires `npm run context:live` with valid credentials and endpoint access. A passing fixture/build test proves the skill and dashboard mechanics; it does not prove live Context extraction.
