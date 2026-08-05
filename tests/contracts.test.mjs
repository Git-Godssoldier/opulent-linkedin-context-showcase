import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { buildRequest, dedupeProfiles, ENDPOINT, normalizeLinkedInUrl } from "../scripts/contextdev_people.mjs";

const fixture = JSON.parse(
  await readFile(resolve("fixtures/public-profile-baseline.json"), "utf8"),
);

test("normalizes a public LinkedIn profile and strips query/hash", () => {
  assert.equal(
    normalizeLinkedInUrl("https://linkedin.com/in/example-person/?trk=public#bio"),
    "https://www.linkedin.com/in/example-person",
  );
});

test("rejects non-LinkedIn and non-profile URLs", () => {
  assert.throws(() => normalizeLinkedInUrl("https://example.com/in/person"));
  assert.throws(() => normalizeLinkedInUrl("https://www.linkedin.com/company/goodwin"));
});

test("deduplicates by normalized LinkedIn URL", () => {
  const profiles = [
    fixture.profiles[0],
    { ...fixture.profiles[0], id: "duplicate", linkedin_url: `${fixture.profiles[0].linkedin_url}/?x=1` },
  ];
  assert.equal(dedupeProfiles(profiles).length, 1);
});

test("builds the exact bounded Context.dev people request", () => {
  const request = buildRequest(fixture.profiles[0], "run-test", "test");
  assert.equal(ENDPOINT, "https://api.context.dev/v1/people/retrieve");
  assert.deepEqual(request.identifiers, { linkedinUrl: fixture.profiles[0].linkedin_url });
  assert.equal(request.timeoutMS, 30_000);
  assert.ok(request.tags.includes("client:opulent"));
  assert.ok(request.tags.includes("scope:list"));
  assert.equal(Object.hasOwn(request, "email"), false);
});

test("fixture keeps sponsor and individual claims separate", () => {
  assert.match(fixture.sponsor.boundary, /Firm-level sponsor proof only/i);
  assert.equal(fixture.profiles.length, 3);
  assert.ok(fixture.profiles.every((profile) => profile.organization === "Goodwin"));
  assert.ok(fixture.profiles.every((profile) => profile.validation_status === "public_identity_validated"));
});
