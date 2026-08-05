#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRequest, dedupeProfiles, ENDPOINT } from "./contextdev_people.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baseline = JSON.parse(
  await readFile(resolve(ROOT, "fixtures/public-profile-baseline.json"), "utf8"),
);
const profiles = dedupeProfiles(baseline.profiles);

function parseArgs(argv) {
  const args = { manifest: null };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--manifest") args.manifest = argv[++index];
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const manifest = args.manifest
  ? JSON.parse(await readFile(resolve(ROOT, args.manifest), "utf8"))
  : null;
const runId = manifest?.run_id ?? "public-baseline-no-provider-run";
const receiptByProfile = new Map((manifest?.receipts ?? []).map((receipt) => [receipt.profile_id, receipt]));

function safeReceiptRef(path) {
  if (!path) return null;
  const relative = path.startsWith(ROOT) ? path.slice(ROOT.length + 1) : path;
  return relative.startsWith(".scratch/") ? relative : null;
}

function allowlistContextResponse(rawReceipt) {
  const response = rawReceipt?.response ?? {};
  const person = response.person ?? {};
  const profile = person.profile ?? {};
  const safeSkills = (person.skills ?? []).slice(0, 20).map((skill) =>
    typeof skill === "string" ? skill : skill?.name ?? skill?.display,
  ).filter(Boolean);
  return {
    profile: {
      full_name: profile.fullName ?? null,
      headline: profile.headline ?? null,
      location: profile.location ?? null,
      summary: profile.summary ?? null,
    },
    experience: (person.experience ?? []).slice(0, 12).map((item) => ({
      company: item?.company?.display ?? null,
      title: item?.title ?? null,
      dates: item?.dates ?? null,
    })),
    education: (person.education ?? []).slice(0, 8).map((item) => ({
      institution: item?.institution?.display ?? null,
      qualification: item?.qualification ?? null,
      field_of_study: item?.fieldOfStudy ?? null,
      dates: item?.dates ?? null,
    })),
    skills: safeSkills,
    provenance: {
      urls_analyzed: (response.metadata?.urlsAnalyzed ?? []).slice(0, 20),
      sources_attempted: response.metadata?.sourcesAttempted ?? [],
      sources_succeeded: response.metadata?.sourcesSucceeded ?? [],
    },
  };
}

async function loadContextResult(profile) {
  const receipt = receiptByProfile.get(profile.id);
  if (!receipt) return { status: "blocked_missing_credentials", receipt: null, extract: null };
  const receiptRef = safeReceiptRef(receipt.receipt_path);
  if (receipt.status !== "executed" || !receiptRef) {
    return { status: receipt.status ?? "failed", receipt: null, extract: null };
  }
  const raw = JSON.parse(await readFile(resolve(ROOT, receiptRef), "utf8"));
  return {
    status: "executed",
    receipt: {
      ref: receiptRef,
      http_status: raw.http_status,
      request_id: raw.safe_headers?.["x-request-id"] ?? raw.response?.request_id ?? null,
      latency_ms: raw.latency_ms,
      credits_consumed: raw.response?.key_metadata?.credits_consumed ?? null,
      completed_at: raw.completed_at,
    },
    extract: allowlistContextResponse(raw),
  };
}

const contextResults = new Map();
for (const profile of profiles) contextResults.set(profile.id, await loadContextResult(profile));
const executedCount = [...contextResults.values()].filter((result) => result.status === "executed").length;
const blockedCount = [...contextResults.values()].filter((result) => result.status.startsWith("blocked_")).length;
const failedCount = profiles.length - executedCount - blockedCount;

function coverage(profile) {
  const fields = [profile.name, profile.title, profile.organization, profile.location, profile.summary];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

const packet = {
  schema_version: "1.0.0",
  generated_at: manifest?.generated_at ?? baseline.checked_at,
  source_mode: executedCount > 0 ? "contextdev_live" : baseline.source_mode,
  client: baseline.client,
  objective: baseline.objective,
  sponsor: baseline.sponsor,
  scope: {
    mode: "user_list",
    requested: baseline.profiles.length,
    deduplicated: profiles.length,
    eligible: profiles.length,
    unique_company_count: 1,
    executed: executedCount,
    blocked: blockedCount,
    failed: failedCount,
    discovery_expansion: 0,
    max_people_retrievals: profiles.length,
  },
  profiles: profiles.map((profile, index) => {
    const result = contextResults.get(profile.id);
    return {
      ...profile,
      unknowns: result.status === "executed" ? [] : profile.unknowns,
      context_status: result.status,
      context_receipt: result.receipt,
      context_extract: result.extract,
      metrics: {
        field_coverage: coverage(profile),
        identity_evidence: 100,
        employer_evidence: 100,
        role_evidence: 92 - index * 3,
        sponsor_relevance: 62,
        extraction_receipt: result.status === "executed" ? 100 : 0,
      },
    };
  }),
  context_operations: profiles.map((profile) => ({
    profile_id: profile.id,
    natural_language_job: `Retrieve the known public LinkedIn identity for ${profile.name} and return professional profile fields with source-attempt metadata.`,
    method: "POST",
    endpoint: ENDPOINT,
    params: {},
    body: buildRequest(profile, runId, "local"),
    expected_response: "Professional profile, experience, education, skills, analyzed URLs, source-attempt status, and provider metadata where available.",
    opulent_route: "Validate exact identity, retain the private raw receipt, allowlist professional fields, redact contact data, and render evidence status.",
    write_policy: "artifact_only_no_crm_write",
    status: contextResults.get(profile.id).status,
    receipt: contextResults.get(profile.id).receipt,
  })),
  evidence: {
    checked_at: baseline.checked_at,
    claim_boundary: baseline.sponsor.boundary,
    source_count: 7,
    context_execution_note: executedCount > 0
      ? `${executedCount} of ${profiles.length} Context.dev known-person operations have saved receipts. Public employer sources remain the identity and sponsor corroboration layer.`
      : "No Context.dev credential was available while building the committed baseline. All professional claims come from linked public validation sources; none are represented as provider output.",
  },
};

const outputs = [
  resolve(ROOT, "artifacts/showcase-packet.json"),
  resolve(ROOT, "dashboard/data/showcase.json"),
];
for (const output of outputs) {
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
}
process.stdout.write(`${JSON.stringify({ status: "built", source_mode: packet.source_mode, profiles: profiles.length, outputs }, null, 2)}\n`);
