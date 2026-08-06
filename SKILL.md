---
name: opulent-linkedin-context-showcase
description: Run one named person end to end — validate identity, exhaust the Context.dev surface on them and their firm, build a sourced dossier, scrape the next VC Village event, render a React Email invitation, and show it in a Dither dashboard. Use for known-list enrichment demos or an evidence-backed person dossier. Drafts, never sends.
license: MIT
---

# Opulent LinkedIn Context Showcase

Seven commands, in order.

```bash
npm run targets                                              # 1
npm run calls -- --linkedin-url <URL> --domain <bare-domain> # 2
npm run event -- --url <luma-url>                            # 3
npm run assemble                                             # 4
npm run email                                                # 5
npm run validate                                             # 6
npm run dashboard                                            # 7
```

## Invariants

- `templates/` is read-only. Output goes to `artifacts/`.
- `executed` requires an HTTP response **and** a stored receipt. Otherwise `blocked_missing_credentials`, `blocked_endpoint_access`, or `failed`.
- Absence is `unknown`. Only dated evidence sets `false`.
- Read `artifacts/calls-summary.json`, not the receipts.
- The event page is read. No clicks that change state.
- The email is a draft.

## 1 · Targets

Rejects rows without an exact `linkedin.com/in/…` URL; exits non-zero if any fail.

Pick one accepted row at high confidence. Note its LinkedIn URL and the firm's **bare domain** (`slow.co`).

*Done: subject chosen, URL and bare domain in hand.*

## 2 · Calls

Runs the full plan, writes `artifacts/calls-summary.json` and one receipt per call.

Parameter shapes differ per endpoint and are already correct in `scripts/run_calls.mjs`. Do not hand-build requests.

- `/web/naics`, `/web/sic` → `input`
- `/web/styleguide`, `/web/fonts`, `/web/screenshot` → `domain` XOR `directUrl`
- `/utility/prefetch` → paid plan only, 403 otherwise, excluded from the plan

`--dry-run` prints the plan. No API key → `blocked_missing_credentials`; continue to step 3 and report it. Non-200 is a finding; record and move on.

*Done: summary written, every call terminal.*

## 3 · Event

VC Village publishes at `luma.com/vcvillage`.

Capture name, date, time, timezone, city, venue + confirmation state, hosts, description, speakers, sponsors, and any registered or remaining count shown. Only a number printed on the page may appear in the email.

*Done: `artifacts/event.json` written, missing fields named.*

## 4 · Assemble

Builds `artifacts/dossier.json` and `artifacts/packet.json`.

Every field: `value`, `state`, `confidence`, `source`, `source_url`, `observed_at`. All ten required fields appear regardless of outcome — email, phone, industries, title, organization, location, linkedin_headline, linkedin_about, actively_investing, changes_since_last.

No verification provider is wired, so email and phone are `unknown` with that reason.

Select one dated reason to engage, at the evidence's strength. Rank: dated signal in window → prior attendance → themed public activity → plain fit.

*Done: ten fields present, every `Verified` field has a source URL.*

## 5 · Email

Renders `templates/event-invitation.tsx` (React Email, Dither theme) to `artifacts/invitation.html` and `.txt`.

Load `references/writing-quality.md` and the house-voice section of `references/event-and-outreach.md` first.

Props come from the dossier and event brief. A prop without evidence is omitted; its section does not render. Body order: reason → event → room → one action. Subject and preview written last, together.

*Done: both files render, every claim maps to a dossier field, `review_state: hold`.*

## 6 · Validate

Exits non-zero on: missing required field, contact value without a verification source, `actively_investing: false` without dated evidence, `Verified` without a source URL, low confidence without recorded variance, `executed` without a receipt, or a secret in the packet.

*Done: exit 0.*

## 7 · Dashboard

Builds against `artifacts/packet.json` and serves it. Confirm the subject card, charts, excluded rows, and operation ledger render. Capture the view.

Decision layer first, audit layer collapsed. `proposed`, `blocked`, and `failed` are never styled as verified.

*Done: build clean, view captured.*

## Report

Capabilities run, capabilities skipped with reasons, credits spent, unknowns.

## References

Open on trigger.

| Trigger | File |
| --- | --- |
| Writing prose | `references/writing-quality.md` |
| Building the message | `references/event-and-outreach.md` |
| Field shape unclear | `references/dossier-contract.md` |
| Adding a provider call | `references/contextdev-capabilities.md` |
| Changing the dashboard | `references/dashboard-brief.md` |
| Claim boundary unclear | `references/evidence-policy.md` |
