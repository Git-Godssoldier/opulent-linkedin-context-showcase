#!/usr/bin/env node
/**
 * scrape_event.mjs — open the event brief for a URL, then validate what you filled in.
 *
 *   node scripts/scrape_event.mjs --url <luma-url>     # writes the skeleton
 *   node scripts/scrape_event.mjs --check              # validates artifacts/event.json
 *
 * The read itself is yours: these pages are JavaScript-rendered, so a browser session
 * does the looking. This script fixes the shape so nothing has to be guessed, and refuses
 * a brief that claims a count the page did not show.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1]; };
const OUT = resolve("artifacts/event.json");

if (process.argv.includes("--check")) {
  if (!existsSync(OUT)) { console.error("artifacts/event.json not found. Run with --url first."); process.exit(2); }
  const e = JSON.parse(await readFile(OUT, "utf8"));
  const problems = [];
  for (const k of ["event_name", "event_url", "date", "city", "scraped_at"]) if (!e[k]) problems.push(`${k} is empty`);
  if (e.read_only !== true) problems.push("read_only must stay true — the page is read, never interacted with");
  for (const k of ["registered_count", "capacity", "spots_remaining"]) {
    if (e[k] !== null && e[k] !== undefined && !e.counts_shown_on_page) {
      problems.push(`${k} is set but counts_shown_on_page is false — only a number printed on the page may be used`);
    }
  }
  if (problems.length) { for (const p of problems) console.error(`  ${p}`); process.exit(1); }
  console.log(`event brief OK · ${e.event_name} · ${e.date} · ${e.city}`);
  process.exit(0);
}

const url = arg("url");
if (!url) { console.error("usage: node scripts/scrape_event.mjs --url <luma-url> | --check"); process.exit(2); }

await mkdir(resolve("artifacts"), { recursive: true });
await writeFile(OUT, JSON.stringify({
  event_name: null, event_url: url, date: null, start_time: null, timezone: null,
  city: null, venue: null, venue_status: null, hosts: [], description: null, theme: null,
  speakers: [], agenda: [], sponsors: [],
  counts_shown_on_page: false, registered_count: null, capacity: null, spots_remaining: null,
  series_context: null, scraped_at: null, source_url: url, read_only: true,
}, null, 2) + "\n");
console.log(`artifacts/event.json opened for ${url}`);
console.log("Read the page in a browser session, fill the fields, set scraped_at, then: npm run event -- --check");
