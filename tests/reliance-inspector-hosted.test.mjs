import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const inspector = join(root, "public", "tools", "reliance-inspector");
const text = (name) => readFile(join(inspector, name), "utf8");
const sha256 = async (name) => createHash("sha256").update(await readFile(join(inspector, name))).digest("hex");

test("hosted Reliance Inspector preserves frozen v0.4.0 browser assets", async () => {
  assert.equal(await sha256("app.js"), "5ced25a47111d39f49a09ac1202660468cbeb856425bfc278728fdab8d8b08b6");
  assert.equal(await sha256("styles.css"), "f06cd69a148fb34298d011280e1bdab52e2d469f88ad71984a77185de8089872");
  assert.equal(await sha256("cases.json"), "29ba243580ac7f96cf34b05031963d10417cd610142d55ddc594ba581e2bb252");
});

test("hosted Reliance Inspector is canonical-public and Python-local", async () => {
  const html = await text("index.html");
  assert.match(html, /PUBLIC CANONICAL MODE/u);
  assert.match(html, /Evidence-bundle verification and semantic-object evaluation require the archived loopback server and frozen Python consumer/u);
  assert.match(html, /10\.5281\/zenodo\.22037607/u);
  assert.match(html, /script src="\/tools\/reliance-inspector\/hosted-guard\.js"[\s\S]*script src="\/tools\/reliance-inspector\/app\.js"/u);
  assert.doesNotMatch(html, /https?:\/\/[^"']+\.js/u);
});

test("hosted boundary guard prevents static-host 405 responses from impersonating the local API", async () => {
  const guard = await text("hosted-guard.js");
  assert.match(guard, /\/api\/evaluate/u);
  assert.match(guard, /\/api\/verify-evidence/u);
  assert.match(guard, /status: 404/u);
});

test("canonical case payload remains inspectable and bounded", async () => {
  const data = JSON.parse(await text("cases.json"));
  assert.ok(Array.isArray(data.cases));
  assert.ok(data.cases.length >= 2);
  for (const c of data.cases) {
    assert.ok(c.id);
    assert.ok(c.result?.applicability);
    assert.ok(Array.isArray(c.nonclaims));
  }
});

test("deployment provenance names the authoritative software record and boundary", async () => {
  const p = JSON.parse(await text("provenance.json"));
  assert.equal(p.version, "0.4.0");
  assert.equal(p.softwareRecord, "https://doi.org/10.5281/zenodo.22037607");
  assert.equal(p.allVersionsRecord, "https://doi.org/10.5281/zenodo.22037606");
  assert.match(p.boundary, /does not host the loopback verification or semantic-evaluation API/u);
});

test("site security policy isolates the Reliance Inspector route", async () => {
  const headers = await readFile(join(root, "public", "_headers"), "utf8");
  const start = headers.indexOf("/tools/reliance-inspector/*");
  assert.notEqual(start, -1);
  const block = headers.slice(start);
  for (const directive of [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "connect-src 'self'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "Cache-Control: no-store",
  ]) assert.ok(block.includes(directive), directive);
});

test("tools directory exposes the Reliance Inspector as an instrument", async () => {
  const html = await readFile(join(root, "public", "tools", "index.html"), "utf8");
  const cardStart = html.indexOf('<article class="rv-other-card"><h3>Reliance Inspector</h3>');
  assert.notEqual(cardStart, -1);
  const card = html.slice(cardStart, html.indexOf("</article>", cardStart));
  assert.match(card, /Inspect evidence, assumptions, identities, and derivations behind a claim-specific relying decision\./u);
  assert.match(card, /href="\/tools\/reliance-inspector\/">Open Inspector/u);
});
