#!/usr/bin/env node
/**
 * prepare_cohort.mjs — cohort JSON -> retrieval plan + empty enrichment record per person.
 *
 *   node scripts/prepare_cohort.mjs <cohort.json> [--out <path>]
 *
 * This is the structured-preparation stage: every accepted target becomes one planned
 * `POST /people/retrieve` operation and one enrichment record carrying all ten required
 * fields in their pre-retrieval state. Nothing is executed here and nothing is invented —
 * the plan is what a live run would send, and the record is the shape it would fill.
 */
import { readFileSync, writeFileSync } from "node:fs";

const [file, ...rest] = process.argv.slice(2);
const outFlag = rest.indexOf("--out");
const outPath = outFlag === -1 ? null : rest[outFlag + 1];
if (!file) { console.error("usage: node scripts/prepare_cohort.mjs <cohort.json> [--out <path>]"); process.exit(2); }

const cohort = JSON.parse(readFileSync(file, "utf8"));
const FIELDS = ["email","phone","industries","title","organization","location",
                "linkedin_headline","linkedin_about","actively_investing","changes_since_last"];

const prepared = cohort.targets.map((t) => ({
  id: t.id,
  name: t.name,
  linkedin_url: t.linkedin_url,
  roster: { organization: t.organization, role: t.role, city: t.city, owner: t.owner },
  operation: {
    natural_language_job: `Retrieve the current public professional profile for ${t.name} from their exact LinkedIn URL.`,
    method: "POST",
    endpoint: "https://api.context.dev/v1/people/retrieve",
    body: { identifiers: { linkedinUrl: t.linkedin_url } },
    write_policy: "artifact_only_no_crm_write",
    status: "proposed",
    receipt: null,
  },
  enrichment_fields: Object.fromEntries(FIELDS.map((f) => [f, { state: "pending_retrieval", value: null }])),
}));

const payload = {
  schema_version: "1.0.0",
  stage: "structured_preparation",
  source_list: cohort.file,
  counts: { rows: cohort.rows, prepared: prepared.length, blocked: cohort.rejected },
  blocked: cohort.blocked,
  cohort: prepared,
};
if (outPath) writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n");

console.log(`stage:    structured_preparation`);
console.log(`from:     ${cohort.file}`);
console.log(`prepared: ${prepared.length} retrieval operations, ${FIELDS.length} fields each`);
console.log(`blocked:  ${cohort.rejected}`);
for (const p of prepared) console.log(`  ${p.name.padEnd(20)} ${p.roster.organization ?? ""}`.padEnd(48) + p.linkedin_url);
