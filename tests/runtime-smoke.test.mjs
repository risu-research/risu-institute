import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const wranglerCli = join(projectRoot, "node_modules", "wrangler", "bin", "wrangler.js");
const origin = "http://127.0.0.1:8791";
let server;
let serverOutput = "";

async function waitForServer() {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Wrangler exited before startup.\n${serverOutput}`);
    }
    try {
      const response = await fetch(`${origin}/`);
      if (response.status === 200) return;
    } catch {
      // The listener is not ready yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for Wrangler.\n${serverOutput}`);
}

before(async () => {
  server = spawn(
    process.execPath,
    [wranglerCli, "dev", "--ip", "127.0.0.1", "--port", "8791"],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        CI: "1",
        NO_UPDATE_NOTIFIER: "1",
        WRANGLER_WRITE_LOGS: "false",
        XDG_CACHE_HOME: join(projectRoot, ".wrangler", "cache"),
        XDG_CONFIG_HOME: join(projectRoot, ".wrangler", "config"),
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  server.stdout.on("data", (chunk) => {
    serverOutput += chunk;
  });
  server.stderr.on("data", (chunk) => {
    serverOutput += chunk;
  });
  await waitForServer();
});

after(async () => {
  if (server.exitCode !== null) return;
  server.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => server.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
  if (server.exitCode === null) server.kill("SIGKILL");
});

test("exact public surfaces return the expected status and Content-Type", async () => {
  const surfaces = [
    ["/", "text/html"],
    ["/work/", "text/html"],
    ["/research/", "text/html"],
    ["/research/technical-notes/", "text/html"],
    ["/research/technical-notes/2026-03/", "text/html"],
    ["/research/technical-notes/2026-03/RISU_Technical_Note_2026-03_Consequence_Closure.pdf", "application/pdf"],
    ["/research/technical-notes/2026-01/", "text/html"],
    ["/research/technical-notes/2026-01/RISU_Technical_Note_2026-01_From_Revocation_to_Closure.pdf", "application/pdf"],
    ["/about/", "text/html"],
    ["/rels/appeal", "text/html"],
    ["/work/appeal-interoperability/", "text/html"],
    ["/work/problem-semantics/", "text/html"],
    ["/tools/consequence-closure/", "text/html"],
    ["/tools/consequence-closure/inspector/", "text/html"],
    ["/tools/consequence-closure/inspector/app.js", "text/javascript"],
    ["/tools/consequence-closure/inspector/engine.js", "text/javascript"],
    ["/tools/consequence-closure/inspector/samples.js", "text/javascript"],
    ["/tools/consequence-closure/inspector/styles.css", "text/css"],
    ["/tools/agent-closure/", "text/html"],
    ["/tools/agent-closure/app.js", "text/javascript"],
    ["/tools/agent-closure/style.css", "text/css"],
    ["/tools/agent-closure/cases/index.json", "application/json"],
    ["/tools/agent-closure/cases/c1-direct-zombie.json", "application/json"],
    ["/tools/agent-closure/cases/c2-transitive-zombie.json", "application/json"],
    ["/tools/agent-closure/cases/c3-pending-commitment.json", "application/json"],
    ["/tools/agent-closure/cases/c4-retained-evidence.json", "application/json"],
    ["/tools/agent-closure/cases/c5-successor-transfer.json", "application/json"],
    ["/tools/agent-closure/cases/c6-missing-coverage.json", "application/json"],
    ["/tools/agent-closure/cases/c7-false-success.json", "application/json"],
    ["/tools/agent-closure/cases/c8-fixed-point-winddown.json", "application/json"],
    ["/tools/agent-closure/provenance.json", "application/json"],
    ["/tools/negative-result-warrant/", "text/html"],
    ["/tools/negative-result-warrant/core.js", "text/javascript"],
    ["/tools/negative-result-warrant/inspector.js", "text/javascript"],
    ["/tools/negative-result-warrant/inspector.css", "text/css"],
    ["/tools/negative-result-warrant/og.png", "image/png"],
    ["/tools/negative-result-warrant/provenance.json", "application/json"],
    ["/tools/negative-result-warrant/recorded/observations.js", "text/javascript"],
    ["/robots.txt", "text/plain"],
    ["/sitemap.xml", "application/xml"],
    ["/assets/style.css", "text/css"],
    ["/assets/favicon.svg", "image/svg+xml"],
  ];

  for (const [path, contentType] of surfaces) {
    const response = await fetch(`${origin}${path}`);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type") ?? "", new RegExp(`^${contentType.replace("+", "\\+")}`, "u"), path);
  }
});

test("the trailing-slash alias redirects to the slashless canonical path", async () => {
  const response = await fetch(`${origin}/rels/appeal/`, { redirect: "manual" });
  assert.equal(response.status, 301);
  assert.equal(new URL(response.headers.get("location"), origin).pathname, "/rels/appeal");
});

test("a missing URL returns the intended custom page with status 404", async () => {
  const response = await fetch(`${origin}/nothing-is-published-here`);
  assert.equal(response.status, 404);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html/u);
  assert.match(await response.text(), /Nothing is published at this address\./u);
});

test("developer-only and static-control files are not publicly served", async () => {
  const privatePaths = [
    "/README.md",
    "/CODEX_RELEASE_PROMPT.txt",
    "/RELEASE_CHECKLIST.md",
    "/RELEASE_NOTES.md",
    "/RELEASE_MANIFEST.json",
    "/package.json",
    "/tests/release-integrity.test.mjs",
    "/.DS_Store",
    "/.assetsignore",
    "/_headers",
    "/_redirects",
  ];

  for (const path of privatePaths) {
    const response = await fetch(`${origin}${path}`);
    assert.equal(response.status, 404, path);
  }
});

test("the reviewed static response headers are applied", async () => {
  const response = await fetch(`${origin}/`);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.equal(response.headers.get("permissions-policy"), "camera=(), microphone=(), geolocation=()");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
});

test("the inspector route is isolated by a no-connect Content Security Policy", async () => {
  const response = await fetch(`${origin}/tools/negative-result-warrant/`);
  const policy = response.headers.get("content-security-policy") ?? "";
  assert.match(policy, /default-src 'none'/u);
  assert.match(policy, /script-src 'self'/u);
  assert.match(policy, /style-src 'self'/u);
  assert.match(policy, /connect-src 'none'/u);
  assert.match(policy, /form-action 'none'/u);
  assert.match(response.headers.get("referrer-policy") ?? "", /(?:^|,\s*)no-referrer$/u);
  assert.equal(response.headers.get("cross-origin-opener-policy"), "same-origin");
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("the Agent Closure Inspector route has the canonical-only security boundary", async () => {
  const response = await fetch(`${origin}/tools/agent-closure/`);
  const policy = response.headers.get("content-security-policy") ?? "";

  for (const directive of [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'none'",
    "font-src 'none'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "manifest-src 'none'",
  ]) assert.ok(policy.includes(directive), directive);

  assert.match(response.headers.get("referrer-policy") ?? "", /(?:^|,\s*)no-referrer$/u);
  assert.deepEqual(
    new Set((response.headers.get("permissions-policy") ?? "").split(", ")),
    new Set(["camera=()", "microphone=()", "geolocation=()", "payment=()", "usb=()"]),
  );
  assert.equal(response.headers.get("cross-origin-opener-policy"), "same-origin");
  assert.equal(response.headers.get("cross-origin-resource-policy"), "same-origin");
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("the hosted surface exposes no arbitrary evidence evaluation endpoint", async () => {
  const response = await fetch(`${origin}/api/evaluate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  assert.ok([404, 405].includes(response.status), response.status);
});
test("the Consequence Closure Inspector route is local only and separately non-indexed", async () => {
  const response = await fetch(`${origin}/tools/consequence-closure/inspector/`);
  const policy = response.headers.get("content-security-policy") ?? "";
  for (const directive of [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'none'",
    "font-src 'none'",
    "connect-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "manifest-src 'none'",
  ]) assert.ok(policy.includes(directive), directive);
  assert.equal(response.headers.get("cross-origin-opener-policy"), "same-origin");
  assert.equal(response.headers.get("cross-origin-resource-policy"), "same-origin");
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.equal(response.headers.get("cache-control"), "no-store");
});
