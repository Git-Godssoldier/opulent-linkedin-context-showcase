#!/usr/bin/env node

import { run } from "./contextdev_people.mjs";

try {
  const manifest = await run({ environment: process.env.OPULENT_ENV ?? "local" });
  if (manifest.counts.executed !== 3) {
    throw new Error(`LIVE_SCENARIO_INCOMPLETE: ${manifest.counts.executed}/3 calls executed successfully`);
  }
  process.stdout.write("LIVE_CONTEXTDEV_SCENARIO_PASS\n");
} catch (error) {
  process.stderr.write(`${error.code ?? error.message}\n`);
  process.exitCode = 2;
}
