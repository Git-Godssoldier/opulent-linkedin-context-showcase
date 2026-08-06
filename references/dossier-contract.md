# Dossier contract

The output shape. Every field carries its own provenance, so a reader can tell a retrieved fact from an absent one without inspecting the value.

## Field envelope

Every field in the dossier is an object, never a bare value:

```json
{ "value": null, "state": "pending_retrieval", "confidence": "Unknown",
  "source": null, "source_url": null, "observed_at": null }
```

- **`state`** — `pending_retrieval` · `retrieved` · `not_retrieved` · `unknown` · `blocked`
- **`confidence`** — `Verified` (a dated source in hand) · `Estimated` (inferred, inputs shown) · `Unknown`
- **`source`** — which capability produced it, e.g. `people_retrieve`, `web_extract`, `brand_retrieve`, `roster`
- **`source_url`** — the page the claim came from. A field with no URL cannot be `Verified`.
- **`observed_at`** — when it was seen, not when it became true

A field that is absent from the dossier is worse than one present and `unknown`: the reader cannot tell "we looked and found nothing" from "we never looked."

## The ten required fields

These are the contract. Every person carries all ten regardless of outcome.

| Field | Primary source | Notes |
| --- | --- | --- |
| `email` | verification provider | Required and current. State machine: `verified` · `accept_all` · `unknown` · `bounced` · `candidate`. A pattern-inferred address is `candidate` and never promotes itself. |
| `phone` | verification provider | Optional. Carry DNC status alongside it where the provider supplies one. |
| `industries` | `/web/naics`, `/web/sic`, `/brand/retrieve` | Normalized codes beat free text. Keep both. |
| `title` | `/people/retrieve` | Current role as the profile states it. |
| `organization` | `/people/retrieve`, `/brand/retrieve` | Resolve to a canonical domain, not just a name. |
| `location` | `/people/retrieve` | As stated. Record roster variance rather than overwriting it. |
| `linkedin_headline` | `/people/retrieve` | Verbatim. Paraphrase is where drift starts. |
| `linkedin_about` | `/people/retrieve` | Verbatim. |
| `actively_investing` | `/web/search` + `/web/extract` | `true` · `false` · `unknown`, from **dated** evidence inside the recency window. Absence downgrades to `unknown`; only dated evidence makes it `false`. A job title is not evidence. |
| `changes_since_last` | diff against prior accepted cycle | Array of `{field, before, after, observed_at, source_url}`. First run is `baseline` with an empty array — a change list needs a prior state. |

## Beyond the contract

What separates a dossier from a row. Each is optional; each is only included when it was actually retrieved.

**Career shape** — `experience[]` with company, title, and dates; `tenure_current_months`; `education[]`; `skills[]`. Together these answer "how did they get here", which a headline cannot.

**Firm intelligence** — `firm.domain`, `description`, `industries_eic`, `naics[]`, `sic[]`, `socials`, `hq_address`, `employee_estimate`. One `/brand/retrieve` per canonical domain, reused across everyone at that firm.

**Investment signal** — `recent_financings[]`, `fund_status` (a new fund, a close, a raise), `portfolio_themes[]`, `check_size_band` where public. These are what make the dossier current rather than biographical.

**Public activity** — `talks[]`, `writing[]`, `podcasts[]`, `press[]`, each dated with a URL. This is the raw material for a reason to engage.

**Relationship context** — `co_investors[]`, `shared_affiliations[]`, `prior_interactions[]`. State them precisely or omit them: co-attendance is co-attendance, never familiarity.

**Visual identity** — `firm.logo_url`, `firm.palette[]`, `firm.screenshot_url`, `firm.typography`. From `/brand/retrieve`, `/web/screenshot`, and `/web/styleguide`. A dossier that carries the subject's own mark and colors reads as researched rather than templated.

**Identity integrity** — `identity_confidence` (`high` · `medium` · `low`), `roster_variance` (where the supplied roster and the public record disagree), `alternates_considered[]` (other people who share the name). A low-confidence identity must carry the variance that makes it low.

## Run-level record

Alongside the people, the packet carries the run itself:

- **`scope`** — rows in, accepted, rejected with reasons, unique companies, planned calls, credit budget
- **`context_operations[]`** — one entry per call: natural-language job, method, full endpoint, body, expected response, write policy, `status`, `receipt`. A call is `executed` only with an HTTP response **and** a receipt path; otherwise `proposed`, `blocked_missing_credentials`, `blocked_endpoint_access`, or `failed`, precisely.
- **`data_health`** — field coverage, null rates, conflicts, identity resolution rate, quarantined rows
- **`unknowns[]`** — every open question, named. This section earns more trust than the findings do.
- **`excluded[]`** — rows that never entered the cohort, with the reason. A funnel with no visible rejections is one nobody can audit.

## Rules the validator enforces

1. All ten required fields present on every person, each with a `state`.
2. Contact values stay null unless a verification provider returned them.
3. `actively_investing` is `false` only with `state: retrieved` and a dated source.
4. Any field with `confidence: Verified` carries a `source_url`.
5. A `low` identity confidence carries a `roster_variance`.
6. `status: executed` carries a receipt path.
7. No provider secret appears anywhere in the packet.
