#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const target = resolve(process.cwd(), process.argv[2] ?? "artifacts/packet.json");
const packet = JSON.parse(await readFile(target, "utf8"));
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

check(packet.schema_version === "1.0.0", "schema_version must be 1.0.0");
check(packet.source_mode === "public_validation_baseline" || packet.source_mode === "contextdev_live", "invalid source_mode");
check(packet.scope?.requested === 3, "requested count must be 3");
check(packet.scope?.deduplicated === 3, "deduplicated count must be 3");
check(packet.scope?.unique_company_count === 1, "sample must contain one sponsor company");
check(packet.scope?.discovery_expansion === 0, "skill must not expand discovery");
check((packet.profiles?.length ?? packet.people?.length ?? 0) > 0, "the packet must carry at least one subject");
check((packet.context_operations?.length ?? 0) > 0, "the packet must carry an operation ledger");
check(/firm-level/i.test(packet.sponsor?.boundary ?? ""), "sponsor boundary must state firm-level scope");

const urls = new Set();
for (const profile of packet.profiles ?? []) {
  check(["public_identity_validated", "public_identity_probable"].includes(profile.validation_status),
    `${profile.id}: identity status must be validated or explicitly probable`);
  check(/^https:\/\/www\.linkedin\.com\/in\//.test(profile.linkedin_url), `${profile.id}: invalid LinkedIn URL`);
  check(!profile.official_url || /^https?:\/\//.test(profile.official_url),
    `${profile.id}: corroboration URL must be absolute when present`);
  check(!urls.has(profile.linkedin_url), `${profile.id}: duplicate LinkedIn URL`);
  urls.add(profile.linkedin_url);

  // The ten fields a recurring investor refresh must return. A field that is absent from the
  // packet is worse than one that is present and unknown: the consumer cannot tell the
  // difference between "we looked and found nothing" and "we never looked".
  const REQUIRED_FIELDS = [
    "email", "phone", "industries", "title", "organization",
    "location", "linkedin_headline", "linkedin_about",
    "actively_investing", "changes_since_last",
  ];
  const fields = profile.enrichment_fields ?? {};
  for (const name of REQUIRED_FIELDS) {
    check(Boolean(fields[name]), `${profile.id}: missing enrichment field "${name}"`);
    check(typeof fields[name]?.state === "string", `${profile.id}: field "${name}" has no state`);
  }
  // Showcase mode publishes the contact state machine, never a real person's contact details.
  for (const name of ["email", "phone"]) {
    check(fields[name]?.value === null, `${profile.id}: ${name} must stay null in showcase mode`);
  }
  // Absence never implies inactivity.
  check(fields.actively_investing?.value !== false || fields.actively_investing?.state === "retrieved",
    `${profile.id}: actively_investing may only be false with retrieved evidence`);
}

for (const operation of packet.context_operations ?? []) {
  check(operation.method === "POST", `${operation.profile_id}: method must be POST`);
  check(operation.endpoint === "https://api.context.dev/v1/people/retrieve", `${operation.profile_id}: wrong endpoint`);
  check(Boolean(operation.body?.identifiers?.linkedinUrl), `${operation.profile_id}: missing identifiers.linkedinUrl`);
  check(operation.write_policy === "artifact_only_no_crm_write", `${operation.profile_id}: unsafe write policy`);
  check(operation.status !== "executed" || Boolean(operation.receipt), `${operation.profile_id}: executed operation has no receipt`);
}

const serialized = JSON.stringify(packet).toLowerCase();
for (const forbidden of ["email_address", "phone_number", "home_address", "bearer ctxt_secret_"]) {
  check(!serialized.includes(forbidden), `forbidden public field/token marker: ${forbidden}`);
}

if (packet.source_mode === "public_validation_baseline") {
  check(packet.scope.executed === 0, "baseline cannot claim executed Context calls");
  check(packet.context_operations.every((operation) => operation.status !== "executed"), "baseline operation cannot be executed");
}

if (failures.length) {
  process.stderr.write(`${JSON.stringify({ status: "failed", target, failures }, null, 2)}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`${JSON.stringify({ status: "valid", target, profiles: packet.profiles.length, operations: packet.context_operations.length }, null, 2)}\n`);
}
