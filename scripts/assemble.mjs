#!/usr/bin/env node
/**
 * assemble.mjs — receipts + event brief -> artifacts/dossier.json and artifacts/packet.json.
 *
 * A mechanical transform. It copies the templates, fills what the receipts actually contain,
 * and leaves everything else in its declared empty state. It makes no judgement: the reason
 * to engage, the subject choice, and every confidence call are yours to write in afterwards.
 *
 * templates/ is never written to.
 */
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const read = async (p) => JSON.parse(await readFile(resolve(p), "utf8"));
const maybe = async (p) => (existsSync(resolve(p)) ? read(p) : null);
const now = new Date().toISOString();

const summary = await maybe("artifacts/calls-summary.json");
if (!summary) { console.error("artifacts/calls-summary.json not found. Run npm run calls first."); process.exit(2); }
const event = (await maybe("artifacts/event.json")) ?? {};
const cohort = (await maybe("artifacts/cohort.json")) ?? {};

const receipts = {};
if (existsSync(resolve("artifacts/receipts"))) {
  for (const f of (await readdir(resolve("artifacts/receipts"))).filter((x) => x.endsWith(".json"))) {
    receipts[f.replace(/\.json$/, "")] = await read(`artifacts/receipts/${f}`);
  }
}
const ok = (id) => (receipts[id]?.http_status === 200 ? receipts[id].response : null);

const person = ok("01-person")?.person ?? null;
const brand = ok("02-brand")?.brand ?? null;
const field = (value, source, url) =>
  value === null || value === undefined || (Array.isArray(value) && !value.length)
    ? { value: null, state: "unknown", confidence: "Unknown", source: null, source_url: null, observed_at: null }
    : { value, state: "retrieved", confidence: "Verified", source, source_url: url ?? null, observed_at: now };

const dossier = await read("templates/dossier.template.json");
const subject = (cohort.targets ?? [])[0] ?? {};
dossier.id = subject.id ?? null;
dossier.name = person?.profile?.fullName ?? subject.name ?? null;
dossier.linkedin_url = subject.linkedin_url ?? null;
dossier.roster = { organization: subject.organization ?? null, role: subject.role ?? null, city: subject.city ?? null };

const R = dossier.required_fields;
R.title = field(person?.experience?.[0]?.title, "people_retrieve", dossier.linkedin_url);
R.organization = field(person?.experience?.[0]?.company?.display ?? brand?.title, "people_retrieve", dossier.linkedin_url);
R.location = field(person?.profile?.location, "people_retrieve", dossier.linkedin_url);
R.linkedin_headline = field(person?.profile?.headline, "people_retrieve", dossier.linkedin_url);
R.linkedin_about = field(person?.profile?.summary, "people_retrieve", dossier.linkedin_url);
R.industries = field(brand?.industries?.eic ?? null, "brand_retrieve", brand?.domain ? `https://${brand.domain}` : null);
// No verification provider is wired. These stay unknown with the reason attached.
for (const k of ["email", "phone"]) {
  R[k] = { value: null, state: "unknown", confidence: "Unknown", source: null, source_url: null,
           observed_at: null, reason: "No verification provider is configured; a value would be a guess." };
}
R.actively_investing = { value: null, state: "unknown", confidence: "Unknown", source: null, source_url: null,
  observed_at: null, reason: "Requires a dated signal inside the recency window. Absence is unknown, never false." };
R.changes_since_last = { value: [], state: "baseline", confidence: "Unknown", source: null, source_url: null,
  observed_at: now, reason: "First observation; a change list needs a prior accepted run." };

dossier.career = {
  experience: person?.experience ?? [], education: person?.education ?? [],
  skills: (person?.skills ?? []).map((s) => s?.name ?? s).filter(Boolean),
  tenure_current_months: null,
};
dossier.firm = {
  domain: brand?.domain ?? null, description: brand?.description ?? null,
  industries_eic: brand?.industries?.eic ?? [],
  naics: ok("03-naics")?.codes ?? [], sic: ok("04-sic")?.codes ?? [],
  socials: Object.fromEntries((brand?.socials ?? []).map((s) => [s.type, s.url])),
  hq_address: brand?.address ?? null, logo_url: brand?.logos?.[0]?.url ?? null,
  palette: brand?.colors ?? [], screenshot_url: ok("08-screenshot")?.screenshot ?? null,
  typography: ok("09-styleguide")?.styleguide?.typography ?? null,
};

const packet = await read("templates/packet.template.json");
Object.assign(packet, {
  stage: "assembled", generated_at: now, source_mode: summary.status === "complete" ? "contextdev_live" : summary.status,
  scope: {
    rows_in: cohort.rows ?? null, accepted: 1, rejected: cohort.rejected ?? null,
    unique_people: 1, unique_companies: brand ? 1 : 0,
    planned_calls: summary.calls?.length ?? 0, credit_budget: null, credits_spent: summary.credits_spent ?? null,
  },
  excluded: (cohort.blocked ?? []).map((b) => ({ name: b.name, organization: b.organization, reason: (b.problems ?? []).join("; ") })),
  people: [dossier], firms: brand ? [{ name: brand.title, domain: brand.domain }] : [], event,
  context_operations: (summary.calls ?? []).map((c) => ({
    profile_id: dossier.id, capability: c.capability, method: c.method,
    endpoint: `https://api.context.dev/v1${c.endpoint}`, status: c.status,
    http_status: c.http_status ?? null, credits: c.credits ?? null, receipt: c.receipt ?? null,
  })),
  data_health: {
    field_coverage_pct: Math.round(Object.values(R).filter((x) => x.state === "retrieved").length / Object.keys(R).length * 100),
    null_rates: {}, conflicts: 0, identity_resolution_pct: person ? 100 : 0, quarantined: cohort.rejected ?? 0,
  },
  unknowns: Object.entries(R).filter(([, v]) => v.state === "unknown").map(([k, v]) => `${k}: ${v.reason ?? "not retrieved"}`),
});

await mkdir(resolve("artifacts"), { recursive: true });
await writeFile(resolve("artifacts/dossier.json"), JSON.stringify(dossier, null, 2) + "\n");
await writeFile(resolve("artifacts/packet.json"), JSON.stringify(packet, null, 2) + "\n");
console.log(`artifacts/dossier.json  coverage ${packet.data_health.field_coverage_pct}%`);
console.log(`artifacts/packet.json   ${packet.context_operations.length} operations · ${packet.unknowns.length} unknowns`);
console.log("Still yours to write: outreach.reason_to_engage, subject, preview_text.");
