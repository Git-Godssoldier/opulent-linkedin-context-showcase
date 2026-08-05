#!/usr/bin/env node

import { ENDPOINT } from "./contextdev_people.mjs";

const response = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    identifiers: { linkedinUrl: "https://www.linkedin.com/in/andrew-pusar-47108120" },
    timeoutMS: 5000,
    tags: ["client:opulent", "app:linkedin-context-showcase", "run:auth-probe", "env:local"],
  }),
});

const body = await response.text();
const result = {
  endpoint: ENDPOINT,
  attempted_without_authorization: true,
  http_status: response.status,
  expected_auth_rejection: [401, 403].includes(response.status),
  body_preview: body.slice(0, 240),
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!result.expected_auth_rejection) process.exitCode = 1;
