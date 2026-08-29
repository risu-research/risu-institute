import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (p) => readFile(join(root, p), "utf8");

test("homepage presents RISU as an institutional research program, not a SaaS landing page", async () => {
  const h = await read("public/index.html");
  for (const x of [
    "Research for consequential machine action.",
    "Research field",
    "Three bounded questions, one consequence layer.",
    "Selected research",
    "Projection Assurance",
    "Consequence Closure",
    "RISU Verify",
    "Public research record",
  ]) assert.ok(h.includes(x), x);
  assert.ok(!h.includes('class="button'));
  assert.doesNotMatch(h, /world[- ]class|leading global|industry[- ]leading/iu);
});

test("research program preserves the three explicit threads and all current projects", async () => {
  const h = await read("public/work/index.html");
  for (const x of [
    "Reliance, finality, and consequence closure.",
    "Evidence qualification and transport.",
    "Semantic identity and preservation.",
    "Consequence Closure",
    "Reliance Before Closure",
    "Bounded Agent Closure",
    "ClosureProbe",
    "Negative Result Warrant",
    "Projection Assurance",
    "OpenAPI→MCP Problem-Semantics Preservation Profile",
    "HTTP→MCP Method-Inference Soundness Profile",
    "Appeal",
  ]) assert.ok(h.includes(x), x);
});

test("publication surfaces are scholarly ledgers with explicit publication boundaries", async () => {
  for (const path of ["public/research/index.html", "public/research/technical-notes/index.html"]) {
    const h = await read(path);
    for (const x of ["2026-04", "2026-03", "2026-02", "2026-01", "Projection Assurance", "Consequence Closure"]) assert.ok(h.includes(x), `${path}: ${x}`);
    assert.match(h, /peer review|peer[- ]review/iu);
    assert.doesNotMatch(h, /peer[- ]reviewed/iu);
  }
});

test("about page states actual organizational boundary and research discipline", async () => {
  const h = await read("public/about/index.html");
  for (const x of [
    "independent research initiative",
    "research initiative of RISU LLC",
    "Bound the claim.",
    "Preserve the evidence.",
    "Attack the mechanism.",
    "Keep the layer neutral.",
    "Publication discipline",
  ]) assert.ok(h.toLowerCase().includes(x.toLowerCase()), x);
});

test("design system is restrained, responsive, local-font only, and uses a dedicated institutional architecture", async () => {
  const c = await read("public/assets/style.css");
  for (const x of [
    "architecture-band",
    "selected-work",
    "public-record",
    "research-map",
    "@media (max-width: 1040px)",
    "@media (max-width: 760px)",
    "@media (max-width: 500px)",
    "--display:",
    "--sans:",
  ]) assert.ok(c.includes(x), x);
  assert.doesNotMatch(c, /https?:\/\//u);
  assert.doesNotMatch(c, /@import/u);
  assert.doesNotMatch(c, /linear-gradient|radial-gradient/iu);
});

test("homepage keeps canonical Projection Assurance record links singular", async () => {
  const h = await read("public/index.html");
  for (const href of [
    'href="/research/technical-notes/2026-04/"',
    'href="https://doi.org/10.5281/zenodo.22149639"',
    'href="https://doi.org/10.5281/zenodo.22149593"',
    'href="https://doi.org/10.5281/zenodo.22149517"',
  ]) assert.equal(h.split(href).length - 1, 1, href);
});
