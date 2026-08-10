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
    ["/about/", "text/html"],
    ["/rels/appeal", "text/html"],
    ["/work/appeal-interoperability/", "text/html"],
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
