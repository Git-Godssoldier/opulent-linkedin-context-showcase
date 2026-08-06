#!/usr/bin/env node
/**
 * run_calls.mjs — execute the whole provider plan for one subject in one command.
 *
 *   node scripts/run_calls.mjs --linkedin-url <url> --domain <bare-domain> [--dry-run]
 *
 * The call list below is the plan. Every method, path, and parameter name is fixed here
 * so no one has to derive them at run time — that derivation is where the 400s come from
 * (`/web/naics` takes `input`, not `domain`, while `/web/styleguide` takes `domain`).
 *
 * Writes one receipt per call to artifacts/receipts/, plus artifacts/calls-summary.json —
 * a compact index of status, credits, and receipt path. Read the summary, not the receipts.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const BASE = "https://api.context.dev/v1";
const OUT = "artifacts";

function args(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") a.dryRun = true;
    else if (argv[i].startsWith("--")) a[argv[i].slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = argv[++i];
  }
  return a;
}

/** The plan. Bare domain everywhere — no scheme, no www. */
function plan({ linkedinUrl, domain }) {
  return [
    { id: "01-person", capability: "person profile", method: "POST", path: "/people/retrieve",
      body: { identifiers: { linkedinUrl } }, credits: null },

    { id: "02-brand", capability: "firm resolve", method: "POST", path: "/brand/retrieve",
      body: { type: "domain", domain }, credits: 10 },

    // input, NOT domain. This is the single most common 400 in this plan.
    { id: "03-naics", capability: "NAICS codes", method: "GET", path: "/web/naics",
      query: { input: domain, maxResults: 5 }, credits: 10 },
    { id: "04-sic", capability: "SIC codes", method: "GET", path: "/web/sic",
      query: { input: domain, type: "latest_sec", maxResults: 5 }, credits: 10 },

    { id: "05-sitemap", capability: "sitemap", method: "GET", path: "/web/scrape/sitemap",
      query: { domain, maxLinks: 200 }, credits: 1 },
    { id: "06-crawl", capability: "bounded crawl", method: "POST", path: "/web/crawl",
      body: { url: `https://${domain}`, maxPages: 8, maxDepth: 2, followSubdomains: false }, credits: 8 },
    { id: "07-markdown", capability: "page read", method: "GET", path: "/web/scrape/markdown",
      query: { url: `https://${domain}`, maxAgeMs: 0 }, credits: 1 },

    // domain XOR directUrl on these three. viewport is an object, not a string.
    { id: "08-screenshot", capability: "screenshot", method: "GET", path: "/web/screenshot",
      query: { domain, fullScreenshot: true, handleCookiePopup: true }, credits: 5 },
    { id: "09-styleguide", capability: "styleguide", method: "GET", path: "/web/styleguide",
      query: { domain }, credits: 10 },
    { id: "10-fonts", capability: "fonts", method: "GET", path: "/web/fonts",
      query: { domain }, credits: 5 },

    { id: "11-signal-person", capability: "dated signal, person", method: "POST", path: "/web/search",
      body: { query: `"${domain}" partner investment 2026`, freshness: "year" }, credits: 10 },
    { id: "12-signal-firm", capability: "dated signal, firm", method: "POST", path: "/web/search",
      body: { query: `${domain} new fund close raise 2026`, freshness: "year" }, credits: 10 },
  ];
}

const a = args(process.argv.slice(2));
if (!a.linkedinUrl || !a.domain) {
  console.error("usage: node scripts/run_calls.mjs --linkedin-url <url> --domain <bare-domain> [--dry-run]");
  process.exit(2);
}
if (/^https?:|^www\./.test(a.domain)) {
  console.error(`--domain must be bare, e.g. example.com — got ${a.domain}`);
  process.exit(2);
}

const calls = plan(a);
const key = process.env.CONTEXT_DEV_API_KEY;
await mkdir(resolve(OUT, "receipts"), { recursive: true });

if (a.dryRun || !key) {
  const reason = a.dryRun ? "dry_run" : "blocked_missing_credentials";
  const summary = calls.map((c) => ({ ...c, status: reason, http_status: null, receipt: null }));
  await writeFile(resolve(OUT, "calls-summary.json"), JSON.stringify({ status: reason, calls: summary }, null, 2) + "\n");
  console.log(`${reason}: ${calls.length} calls planned, none executed`);
  for (const c of calls) console.log(`  ${c.id.padEnd(18)} ${c.method.padEnd(5)} ${c.path}`);
  process.exit(key || a.dryRun ? 0 : 1);
}

const summary = [];
for (const c of calls) {
  const url = new URL(BASE + c.path);
  for (const [k, v] of Object.entries(c.query ?? {})) url.searchParams.set(k, String(v));
  const started = Date.now();
  let res, bodyText;
  try {
    res = await fetch(url, {
      method: c.method,
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      ...(c.body ? { body: JSON.stringify(c.body) } : {}),
    });
    bodyText = await res.text();
  } catch (err) {
    summary.push({ ...c, status: "failed", http_status: null, error: err.message, receipt: null });
    console.log(`  ${c.id.padEnd(18)} FAILED  ${err.message}`);
    continue;
  }
  let parsed = null;
  try { parsed = JSON.parse(bodyText); } catch { /* keep the text */ }
  const receipt = `${OUT}/receipts/${c.id}.json`;
  await writeFile(resolve(receipt), JSON.stringify({
    id: c.id, capability: c.capability, method: c.method, endpoint: BASE + c.path,
    request: { query: c.query ?? null, body: c.body ?? null },
    http_status: res.status,
    safe_headers: {
      "x-ratelimit-remaining": res.headers.get("x-ratelimit-remaining"),
      "x-ratelimit-reset": res.headers.get("x-ratelimit-reset"),
    },
    latency_ms: Date.now() - started,
    response: parsed ?? bodyText.slice(0, 20_000),
    completed_at: new Date().toISOString(),
  }, null, 2) + "\n");

  const credits = parsed?.key_metadata?.credits_consumed ?? null;
  summary.push({
    id: c.id, capability: c.capability, method: c.method, endpoint: c.path,
    status: res.ok ? "executed" : "failed",
    http_status: res.status, credits, latency_ms: Date.now() - started, receipt,
  });
  console.log(`  ${c.id.padEnd(18)} ${String(res.status).padEnd(4)} ${credits ?? "-"} cr  ${receipt}`);
}

const spent = summary.reduce((n, s) => n + (Number(s.credits) || 0), 0);
await writeFile(resolve(OUT, "calls-summary.json"),
  JSON.stringify({ status: "complete", executed: summary.filter((s) => s.status === "executed").length,
                   failed: summary.filter((s) => s.status !== "executed").length,
                   credits_spent: spent, calls: summary }, null, 2) + "\n");
console.log(`\nexecuted ${summary.filter((s) => s.status === "executed").length}/${calls.length} · ${spent} credits · ${OUT}/calls-summary.json`);
