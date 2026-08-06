import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { buildRequest, dedupeProfiles, ENDPOINT, normalizeLinkedInUrl } from "../scripts/contextdev_people.mjs";

const dossierTemplate = JSON.parse(
  await readFile(resolve("templates/dossier.template.json"), "utf8"),
);
const packetTemplate = JSON.parse(
  await readFile(resolve("templates/packet.template.json"), "utf8"),
);

const REQUIRED_FIELDS = [
  "email", "phone", "industries", "title", "organization",
  "location", "linkedin_headline", "linkedin_about",
  "actively_investing", "changes_since_last",
];

/* ---------------- identity ---------------- */

test("normalizes a public LinkedIn profile and strips query/hash", () => {
  assert.equal(
    normalizeLinkedInUrl("https://linkedin.com/in/example-person/?trk=public#bio"),
    "https://www.linkedin.com/in/example-person",
  );
});

test("rejects non-LinkedIn and non-profile URLs", () => {
  assert.throws(() => normalizeLinkedInUrl("https://example.com/in/person"));
  assert.throws(() => normalizeLinkedInUrl("https://www.linkedin.com/company/acme"));
});

test("deduplicates targets that differ only by URL decoration", () => {
  const deduped = dedupeProfiles([
    { id: "a", name: "A", linkedin_url: "https://www.linkedin.com/in/a" },
    { id: "a2", name: "A", linkedin_url: "https://linkedin.com/in/a/?utm=x" },
    { id: "b", name: "B", linkedin_url: "https://www.linkedin.com/in/b" },
  ]);
  assert.equal(deduped.length, 2);
});

/* ---------------- request shape ---------------- */

test("builds the exact bounded people request and carries no contact fields", () => {
  const request = buildRequest(
    { id: "subject", name: "Subject", linkedin_url: "https://www.linkedin.com/in/subject" },
    "run-test",
    "test",
  );
  assert.equal(ENDPOINT, "https://api.context.dev/v1/people/retrieve");
  assert.deepEqual(request.identifiers, { linkedinUrl: "https://www.linkedin.com/in/subject" });
  assert.equal(request.timeoutMS, 30_000);
  assert.ok(request.tags.includes("client:opulent"));
  assert.equal(Object.hasOwn(request, "email"), false);
  assert.equal(Object.hasOwn(request, "phone"), false);
});

/* ---------------- output contract ---------------- */

test("the dossier template carries all ten required fields, every one empty", () => {
  for (const name of REQUIRED_FIELDS) {
    const field = dossierTemplate.required_fields?.[name];
    assert.ok(field, `template is missing ${name}`);
    assert.equal(field.value, null, `${name} ships with a value`);
    assert.equal(field.state, "pending_retrieval", `${name} ships in a non-pending state`);
  }
});

test("the dossier template ships no data of any kind", () => {
  const serialized = JSON.stringify(dossierTemplate);
  assert.equal(dossierTemplate.name, null);
  assert.equal(dossierTemplate.linkedin_url, null);
  assert.doesNotMatch(serialized, /linkedin\.com\/in\//, "a real profile URL is baked into the template");
  assert.equal(dossierTemplate.outreach.reason_to_engage, null);
});

test("the dossier template keeps every extension block the run can populate", () => {
  for (const block of ["identity", "career", "firm", "investment_signal", "public_activity", "relationships", "outreach"]) {
    assert.ok(dossierTemplate[block], `template is missing the ${block} block`);
  }
});

test("the packet template carries the run record and ships empty", () => {
  for (const key of ["scope", "excluded", "people", "firms", "event", "messages", "context_operations", "data_health", "unknowns"]) {
    assert.ok(key in packetTemplate, `packet template is missing ${key}`);
  }
  assert.deepEqual(packetTemplate.people, []);
  assert.deepEqual(packetTemplate.messages, []);
  assert.equal(packetTemplate.event.event_name, null);
});
