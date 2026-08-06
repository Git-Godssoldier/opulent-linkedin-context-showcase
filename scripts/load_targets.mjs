#!/usr/bin/env node
/**
 * load_targets.mjs — turn a client target list into a validated `user_list` cohort.
 *
 *   node scripts/load_targets.mjs targets/<file>.csv [--out fixtures/<name>.json]
 *
 * Accepts the column shape a community roster actually arrives in:
 *   first_name, last_name, owner, city, organization, role, linkedin_url
 *
 * A row without an exact LinkedIn profile URL is REJECTED, never resolved by search.
 * "Millie Liu, First Star Partners" is a name and an employer, not an identity — and the
 * wrong match here flows downstream into an enrichment record and a platform writeback.
 * Supplying the URL is the client's step; guessing it is nobody's.
 */
import { readFileSync, writeFileSync } from "node:fs";

const [file, ...rest] = process.argv.slice(2);
const outFlag = rest.indexOf("--out");
const outPath = outFlag === -1 ? null : rest[outFlag + 1];
if (!file) {
  console.error("usage: node scripts/load_targets.mjs <targets.csv> [--out <path>]");
  process.exit(2);
}

const LINKEDIN = /^https:\/\/(www\.)?linkedin\.com\/in\/[^/?#]+/i;

function parseCsv(text) {
  const [head, ...lines] = text.trim().split(/\r?\n/);
  const cols = head.split(",").map((c) => c.trim().toLowerCase());
  return lines.filter(Boolean).map((line) => {
    const cells = line.match(/("([^"]|"")*"|[^,]*)/g).filter((_, i) => i % 2 === 0);
    const row = {};
    cols.forEach((c, i) => { row[c] = (cells[i] ?? "").replace(/^"|"$/g, "").replace(/""/g, '"').trim(); });
    return row;
  });
}

const rows = parseCsv(readFileSync(file, "utf8"));
const accepted = [];
const rejected = [];

for (const [i, row] of rows.entries()) {
  const name = [row.first_name, row.last_name].filter(Boolean).join(" ") || row.name || "";
  const url = row.linkedin_url || "";
  const problems = [];
  if (!name) problems.push("no name");
  if (!url) problems.push("no linkedin_url — supply the exact profile URL from the platform export");
  else if (!LINKEDIN.test(url)) problems.push(`linkedin_url is not a profile URL: ${url}`);
  if (problems.length) {
    rejected.push({ row: i + 2, name: name || "(unnamed)", organization: row.organization ?? null, problems });
    continue;
  }
  accepted.push({
    id: name.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    name,
    linkedin_url: url.replace(/[?#].*$/, "").replace(/\/+$/, ""),
    organization: row.organization || null,
    role: row.role || null,
    city: row.city || null,
    owner: row.owner || null,
  });
}

const seen = new Set();
const deduped = accepted.filter((t) => !seen.has(t.linkedin_url.toLowerCase()) && seen.add(t.linkedin_url.toLowerCase()));

const summary = {
  file,
  rows: rows.length,
  accepted: deduped.length,
  duplicates: accepted.length - deduped.length,
  rejected: rejected.length,
  targets: deduped,
  blocked: rejected,
};

if (outPath) writeFileSync(outPath, JSON.stringify(summary, null, 2) + "\n");

console.log(`rows:       ${rows.length}`);
console.log(`accepted:   ${deduped.length}`);
console.log(`duplicates: ${accepted.length - deduped.length}`);
console.log(`rejected:   ${rejected.length}`);
for (const r of rejected.slice(0, 20)) {
  console.log(`  row ${r.row}  ${r.name}${r.organization ? ` (${r.organization})` : ""} — ${r.problems.join("; ")}`);
}
if (rejected.length) {
  console.log(`\n${rejected.length} target(s) cannot enter the cohort without an exact LinkedIn profile URL.`);
  process.exit(1);
}
