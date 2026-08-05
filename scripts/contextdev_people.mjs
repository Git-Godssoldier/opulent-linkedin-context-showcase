#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const ENDPOINT = "https://api.context.dev/v1/people/retrieve";
const RETRYABLE = new Set([408, 429, 500]);
const SAFE_HEADERS = [
  "x-request-id",
  "x-ratelimit-limit",
  "x-ratelimit-remaining",
  "x-ratelimit-reset",
  "retry-after",
];

export function normalizeLinkedInUrl(value) {
  const url = new URL(String(value).trim());
  if (url.protocol !== "https:" || !/(^|\.)linkedin\.com$/i.test(url.hostname)) {
    throw new Error(`Unsupported LinkedIn URL: ${value}`);
  }
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0]?.toLowerCase() !== "in" || !parts[1]) {
    throw new Error(`Expected a public /in/ profile URL: ${value}`);
  }
  return `https://www.linkedin.com/in/${parts[1]}`;
}

export function dedupeProfiles(profiles) {
  const seen = new Set();
  return profiles.flatMap((profile) => {
    const linkedinUrl = normalizeLinkedInUrl(profile.linkedin_url);
    const key = linkedinUrl.toLowerCase();
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ ...profile, linkedin_url: linkedinUrl }];
  });
}

export function buildRequest(profile, runId, environment = "local") {
  return {
    identifiers: { linkedinUrl: normalizeLinkedInUrl(profile.linkedin_url) },
    timeoutMS: 30_000,
    tags: [
      "client:opulent",
      "app:linkedin-context-showcase",
      `run:${runId}`,
      `env:${environment}`,
      "scope:list",
    ],
  };
}

function safeHeaders(headers) {
  return Object.fromEntries(
    SAFE_HEADERS.flatMap((name) => {
      const value = headers.get(name);
      return value ? [[name, value]] : [];
    }),
  );
}

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function retryDelay(response, attempt) {
  const retryAfter = Number(response.headers.get("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter >= 0) return retryAfter * 1000;
  return Math.min(5000, 500 * 2 ** attempt + Math.floor(Math.random() * 200));
}

async function callProfile({ profile, requestBody, apiKey, runDir, fetchImpl = fetch }) {
  const startedAt = new Date();
  let response;
  let responseBody;
  let attempt = 0;
  let networkError;

  while (attempt < 3) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestBody.timeoutMS + 2_000);
    try {
      response = await fetchImpl(ENDPOINT, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      responseBody = await response.text();
    } catch (error) {
      networkError = {
        name: error?.name ?? "Error",
        message: error?.name === "AbortError" ? "Request timed out before an HTTP response." : "Network request failed before an HTTP response.",
      };
    } finally {
      clearTimeout(timeout);
    }

    if (networkError) break;
    if (!RETRYABLE.has(response.status) || attempt === 2) break;
    await sleep(retryDelay(response, attempt));
    attempt += 1;
  }

  const completedAt = new Date();
  let parsedBody;
  if (responseBody) {
    try {
      parsedBody = JSON.parse(responseBody);
    } catch {
      parsedBody = { raw_text: responseBody };
    }
  }

  const status = networkError
    ? "failed"
    : response.ok
    ? "executed"
    : [401, 403].includes(response.status)
      ? "blocked_endpoint_access"
      : "failed";
  const receipt = {
    schema_version: "1.0.0",
    profile_id: profile.id,
    profile_name: profile.name,
    method: "POST",
    endpoint: ENDPOINT,
    request: requestBody,
    status,
    http_status: response?.status ?? null,
    safe_headers: response ? safeHeaders(response.headers) : {},
    attempts: attempt + 1,
    started_at: startedAt.toISOString(),
    completed_at: completedAt.toISOString(),
    latency_ms: completedAt.getTime() - startedAt.getTime(),
    response: parsedBody ?? null,
    error: networkError ?? null,
  };
  const receiptPath = resolve(runDir, `${profile.id}.json`);
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  return { ...receipt, receipt_path: receiptPath };
}

function parseArgs(argv) {
  const args = { dryRun: false, out: null, environment: "local" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--out") args.out = argv[++index];
    else if (arg === "--environment") args.environment = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

export async function run({ dryRun = false, out = null, environment = "local" } = {}) {
  const baseline = JSON.parse(
    await readFile(resolve(ROOT, "fixtures/public-profile-baseline.json"), "utf8"),
  );
  const profiles = dedupeProfiles(baseline.profiles);
  if (profiles.length !== 3) throw new Error(`Expected exactly 3 unique profiles; received ${profiles.length}`);

  const runId = `showcase-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const requests = profiles.map((profile) => ({
    profile_id: profile.id,
    profile_name: profile.name,
    method: "POST",
    endpoint: ENDPOINT,
    body: buildRequest(profile, runId, environment),
  }));

  if (dryRun) {
    const plan = {
      status: "proposed",
      run_id: runId,
      count: requests.length,
      requests,
      note: "Dry run only. No provider call was attempted.",
    };
    process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
    return plan;
  }

  const apiKey = process.env.CONTEXT_DEV_API_KEY;
  if (!apiKey) {
    const blocked = {
      status: "blocked_missing_credentials",
      run_id: runId,
      count: requests.length,
      requests,
      note: "Set CONTEXT_DEV_API_KEY server-side; no provider call was attempted.",
    };
    process.stderr.write(`${JSON.stringify(blocked, null, 2)}\n`);
    const error = new Error("BLOCKED_CONTEXT_DEV_CREDENTIALS");
    error.code = "BLOCKED_CONTEXT_DEV_CREDENTIALS";
    throw error;
  }

  const runDir = resolve(ROOT, out ?? `.scratch/contextdev/${runId}`);
  await mkdir(runDir, { recursive: true });
  const receipts = [];
  for (let index = 0; index < profiles.length; index += 1) {
    receipts.push(
      await callProfile({
        profile: profiles[index],
        requestBody: requests[index].body,
        apiKey,
        runDir,
      }),
    );
  }

  const manifest = {
    schema_version: "1.0.0",
    run_id: runId,
    generated_at: new Date().toISOString(),
    run_dir: runDir,
    counts: {
      requested: profiles.length,
      executed: receipts.filter((item) => item.status === "executed").length,
      blocked: receipts.filter((item) => item.status.startsWith("blocked_")).length,
      failed: receipts.filter((item) => item.status === "failed").length,
    },
    receipts: receipts.map(({ response: _response, ...safe }) => safe),
  };
  await writeFile(resolve(runDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run(parseArgs(process.argv.slice(2))).catch((error) => {
    if (error.code !== "BLOCKED_CONTEXT_DEV_CREDENTIALS") {
      process.stderr.write(`${error.stack ?? error.message}\n`);
    }
    process.exitCode = 2;
  });
}
