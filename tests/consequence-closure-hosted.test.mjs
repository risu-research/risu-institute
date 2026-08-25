import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const publicRoot = join(root, "public");

const frozenBrowserSha256 = {
  "index.html": "3e2d7f4d6c9f631bc7b7c6a40c98b00635d82f7677f13c243e993f3ec35eef66",
  "styles.css": "dd24b0f0cd84643a41c583c4348b22089de026b6bec7257740f014134eb7fe47",
  "engine.js": "6264d591f1a54ca320a5e3951fc2767b2b8a93dec8c60e3c60c51a698206a472",
  "samples.js": "141081b541847249d51266851e739513a821b55ad4fa7ee2efef151f40fb3b0d",
  "app.js": "7c0f42f3e7d777af7be904d4b3980237d83b43899fff01ba753b9f33d6f1506c",
};

test("the hosted Consequence Closure Inspector retains the frozen v0.5.0 browser bytes", async () => {
  for (const [name, expected] of Object.entries(frozenBrowserSha256)) {
    const bytes = await readFile(join(publicRoot, "tools/consequence-closure/inspector", name));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), expected, name);
  }
});

test("the Consequence Closure landing page binds the publication, software, and repository records", async () => {
  const page = await readFile(join(publicRoot, "tools/consequence-closure/index.html"), "utf8");
  for (const expected of [
    "Consequence Closure Inspector",
    "10.5281/zenodo.22095709",
    "10.5281/zenodo.22095595",
    "https://github.com/risu-research/consequence-closure",
    "/tools/consequence-closure/inspector/",
    "/research/technical-notes/2026-03/",
  ]) assert.ok(page.includes(expected), expected);
});

test("the frozen hosted Inspector has no runtime network or persistent browser state path", async () => {
  const runtime = await Promise.all(
    ["engine.js", "samples.js", "app.js"].map((name) =>
      readFile(join(publicRoot, "tools/consequence-closure/inspector", name), "utf8")
    )
  );
  const source = runtime.join("\n");
  for (const forbidden of [
    /\bfetch\s*\(/u,
    /\bXMLHttpRequest\b/u,
    /\bWebSocket\b/u,
    /\bEventSource\b/u,
    /\bsendBeacon\b/u,
    /\blocalStorage\b/u,
    /\bsessionStorage\b/u,
    /\bindexedDB\b/u,
    /\bserviceWorker\b/u,
  ]) assert.doesNotMatch(source, forbidden);
});

test("the institutional 2026-03 PDF is the selected frozen publication file", async () => {
  const bytes = await readFile(
    join(publicRoot, "research/technical-notes/2026-03/RISU_Technical_Note_2026-03_Consequence_Closure.pdf")
  );
  assert.equal(createHash("md5").update(bytes).digest("hex"), "55fc17a9eb7f4aa31923d19360dee24e");
  assert.ok(bytes.length < 5 * 1024 * 1024);
});

test("the hosted Inspector route has a no-network security boundary and is not indexed separately", async () => {
  const headers = await readFile(join(publicRoot, "_headers"), "utf8");
  for (const expected of [
    "/tools/consequence-closure/inspector/*",
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "connect-src 'none'",
    "frame-ancestors 'none'",
    "X-Robots-Tag: noindex, nofollow",
  ]) assert.ok(headers.includes(expected), expected);
});
