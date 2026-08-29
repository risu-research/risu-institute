import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (p) => readFile(join(root,p),"utf8");
const shaB64 = (s) => createHash("sha256").update(s).digest("base64");

test("RISU Verify is exposed as working browser software, not a simulated verifier", async () => {
  const html=await read("public/tools/index.html");
  assert.ok(html.includes("RISU Verify Workbench"));
  assert.ok(html.includes("Inspect a real RISU result."));
  assert.ok(html.includes("report.json"));
  assert.ok(html.includes("certificate.json"));
  assert.ok(html.includes("run-manifest.json"));
  assert.ok(html.includes("crypto.subtle.digest"));
  assert.ok(html.includes("report_json_sha256"));
  assert.ok(html.includes("certificate_sha256"));
  assert.ok(html.includes("Certificate ↔ report worlds"));
  assert.ok(html.includes("Run manifest ↔ report digest"));
});

test("browser runtime has no network or persistent-state capability", async () => {
  const html=await read("public/tools/index.html");
  const js=html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/u)?.[1] || "";
  for (const forbidden of [/\bfetch\s*\(/u,/XMLHttpRequest/u,/WebSocket/u,/EventSource/u,/sendBeacon/u,/localStorage/u,/sessionStorage/u,/indexedDB/u,/serviceWorker/u]) assert.doesNotMatch(js,forbidden);
  assert.ok(js.includes("file.arrayBuffer()"));
  assert.ok(js.includes("URL.createObjectURL"));
});

test("CSP cryptographically pins the exact inline program and blocks connect", async () => {
  const html=await read("public/tools/index.html"); const headers=await read("public/_headers");
  const css=html.match(/<style>([\s\S]*?)<\/style>/u)?.[1] || "";
  const data=html.match(/<script type="application\/json" id="risu-examples">([\s\S]*?)<\/script>/u)?.[1] || "";
  const js=html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/u)?.[1] || "";
  assert.ok(headers.includes(`/tools/\n  Content-Security-Policy:`));
  assert.ok(headers.includes(`script-src 'sha256-${shaB64(data)}' 'sha256-${shaB64(js)}'`));
  assert.ok(headers.includes(`style-src 'self' 'sha256-${shaB64(css)}'`));
  assert.match(headers,/\/tools\/[\s\S]*?connect-src 'none'/u);
});

test("canonical evidence preserves the four calibrated outcomes and source identity", async () => {
  const html=await read("public/tools/index.html");
  const raw=html.match(/<script type="application\/json" id="risu-examples">([\s\S]*?)<\/script>/u)?.[1];
  const data=JSON.parse(raw);
  assert.equal(data.release,"0.4.0-rc1");
  assert.equal(data.core.version,"0.7.0");
  assert.equal(data.core.archive_sha256,"bc3c0be440b1b729d3131a630491cce62f1f885fb305aa46a4483fee0adad72f");
  assert.equal(data.cases.length,4);
  const byId=Object.fromEntries(data.cases.map((x)=>[x.id,x]));
  assert.deepEqual([byId["github-file-update-before"].structural.C,byId["github-file-update-before"].structural.D,byId["github-file-update-before"].structural.O],["C0","NA","NA"]);
  assert.deepEqual([byId["github-file-update-after"].structural.C,byId["github-file-update-after"].structural.D,byId["github-file-update-after"].structural.O],["C1","D1","O1"]);
  assert.deepEqual([byId["azure-wiki-etag"].structural.C,byId["azure-wiki-etag"].structural.D,byId["azure-wiki-etag"].structural.O],["C1","D1","O1"]);
  assert.deepEqual([byId["github-guarded-merge"].structural.C,byId["github-guarded-merge"].structural.D,byId["github-guarded-merge"].structural.O],["C1","D1","O0"]);
  assert.equal(byId["github-file-update-before"].source_semantic_digest,byId["github-file-update-after"].source_semantic_digest);
});

test("public copy states the scientific boundary rather than inflating browser checks", async () => {
  const html=await read("public/tools/index.html");
  for (const text of ["does not issue new assurance certificates","does not rerun the Python producer or independent proof checker","do not issue a new RISU verdict","retrospective validation against independently developed software"]) assert.ok(html.toLowerCase().includes(text.toLowerCase()),text);
  assert.ok(html.includes("10.5281/zenodo.22152024"));
  assert.ok(html.includes("df06e8d6a8b072333355e1ef91b80c30e43fa68d6fc4666dd920a3fc0e46fc6f"));
  assert.ok(html.includes("3316528f22599c808262d10c2c451df672b1cba0"));
});

test("homepage launches the Workbench in a new tab and retains the research progression", async () => {
  const home=await read("public/index.html");
  assert.ok(home.includes("Flagship software"));
  assert.ok(home.includes("RISU Verify"));
  assert.ok(home.includes('href="/tools/#workbench" target="_blank" rel="noopener"'));
  assert.ok(home.includes("Projection Assurance"));
  assert.ok(home.includes("10.5281/zenodo.22152024"));
});
