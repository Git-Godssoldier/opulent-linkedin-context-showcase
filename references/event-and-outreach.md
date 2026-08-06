# Event scrape and outreach

The dossier says who someone is. The event says why now. Neither alone produces a message worth sending.

## Scraping the event

VC Village publishes events on Luma — `luma.com/vcvillage` for the series, and a per-event page such as `luma.com/vcvillage-vmic`. These pages are JavaScript-rendered, so this is one of the few stages that genuinely needs a browser session rather than a fetch.

**Read the page, do not interact with it.** Register for nothing, click no RSVP control, submit no form. A scrape that leaves a registration behind has changed the thing it was measuring.

Extract into the event brief:

| Field | Why the outreach needs it |
| --- | --- |
| `event_name`, `event_url` | Identity and the RSVP destination |
| `date`, `start_time`, `timezone` | The date goes in the message; the timezone stops an off-by-one |
| `city`, `venue`, `venue_status` | Location, and whether it is confirmed or still to be announced |
| `host[]` | Who signs the message |
| `description`, `theme` | The audience line, in the event's own words |
| `registered_count`, `capacity`, `spots_remaining` | Real scarcity, if the page shows it. Only a number from the page may appear in a message |
| `speakers[]`, `agenda[]` | Named draws, which are often the strongest reason to attend |
| `sponsors[]` | Firm-level only. A sponsor logo is not a claim about any individual |
| `series_context` | Prior events in the series, for a returning-guest line |

Record `scraped_at` and the URL on every field. An event page changes — a date moves, a venue is confirmed, seats fill — and a message built on a stale read is wrong in a way the reader can see.

**Capacity discipline.** If the page shows seats remaining, that number may be used. If it does not, the message says nothing about scarcity. Invented urgency is the fastest way to make an automated system obvious, and it costs more than the RSVP it buys.

## Choosing the reason to engage

One reason per person, and it comes from the dossier, not from the event.

Strongest first:

1. A dated signal inside the recency window — a new fund, a financing, a hire, an expansion, a leadership move
2. Prior attendance at a named event in the series
3. Public activity that maps to this event's theme — a talk, a post, a thesis
4. The fit itself, said plainly, when no dated signal exists

The reason travels at the strength the evidence supports. **"Announced a first close" is not "just raised their fund."** Compressing a claim into a subject line is exactly where it gets hardened, and a message that overstates its evidence fails in the reply rather than in review.

Relationship language is precise or absent. Co-attendance is co-attendance. It is not familiarity, and it is never an introduction unless someone agreed to make one.

## Building the message

Load `references/writing-quality.md` first — the word-level rules apply here before any of the structure below. The em dash is the single strongest tell, and an invitation that reads as generated will have its evidence discounted along with its prose.

Use `templates/event-invitation.tsx`. It is the Dither React Email template adapted for this job, with one deliberate departure from the source: the welcome layout carries three calls to action, and this one carries a single RSVP link.

Fill the props from the run:

| Prop | Comes from |
| --- | --- |
| `recipientFirstName` | Dossier. First name only — a full name in a greeting reads as a mail merge |
| `reason`, `reasonSourceUrl` | The chosen dated signal and the page it came from |
| `eventName`, `eventDate`, `eventCity`, `eventVenue`, `rsvpUrl` | The scraped event brief |
| `audienceLine` | The event page's own description of who attends |
| `senderName`, `senderTitle` | A person, never a department |
| `previewText` | Written last, with the subject, as a pair |

A prop with no evidence behind it is omitted and its section does not render. An empty venue line is better than a guessed one.

### Order inside the message

1. The reason it arrived now
2. The event: date, city, venue
3. Who is in the room
4. One action

The failure shape is the community's origin story where the reader's reason should be.

### Subject and preview

Written last, together, once the body exists. Front-load the real content — the first 35 to 40 characters are what survives truncation on a phone. The preview extends the subject rather than repeating it, and it is never left unset or the client fills it with whatever the HTML starts with.

Specific beats clever. A subject that says what is inside keeps its promise, and keeping the promise is what protects the next send to that person.

### Length

Shorter is always better. If a paragraph is not carrying the reason, the event, or the action, it goes.

## House voice: the community's own sponsor thread

The only approved outreach the community has supplied is one real sponsor sequence. Read it as the voice to match, and note what it does rather than what a template would do.

**It opens with scale, not story.**

> Between VC Village and MATCH HOUSE we are at well over 1000+ investor members/attendees and even more founders!

For a sponsor, audience scale *is* the reason to care — they are buying access to the room. This is the one case where leading with the community's own numbers is correct. An attendee invitation that opened this way would be leading with the wrong subject.

**It answers audience questions with ranges and examples, not adjectives.**

> Founders are all over the place and range from early stage, under $100k in ARR, through late stage, $2m ARR plus.
>
> GP LP Dinners have a lot of emerging managers which is great.

Plus a named prior event and the returning-versus-new split. Vague audience answers are what stall sponsor threads; specifics are what move them.

**It asks for one thing at a time.** Interest first. Materials, invite lists, and payment come after agreement, each in its own message — not bundled into the opener.

**Its stated preference is brevity.** In the community's own words, across several rounds of edits:

> Shorter is always better haha!

The sponsor description that finally passed is two sentences: who they are, and what they do for this specific audience. No history, no adjectives, no claim the sponsor did not make.

**It gives lead time.** Sponsors are asked roughly two months out. Surfacing one three weeks before the event has already lost the deal it recommends.

Match this register. Where this file and the sponsor thread disagree, the thread wins — it is the client's actual voice, and these rules are a reconstruction of it.

## Review before anything sends

Every message is a draft. A person approves, holds, or rejects it — on the message as well as on the recipient.

- **approve** — goes to the sending system as written
- **hold** — right person, wrong message; revise and keep their place
- **reject** — the claim does not hold up, which is a finding about the evidence and not only about the copy

A message rejected for overstating its evidence sends you back to the dossier row, not to the thesaurus.

**This skill drafts and renders. It does not send.** Delivery is the community's existing system, and a human puts it there.

## Rendering and proof

Render the template to HTML and to plain text — some clients show the text part and an autogenerated one reads as broken. Preview at desktop and at 390px. Capture the rendered message alongside the dossier so a reviewer sees the claim and its source on one screen.
