import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const publicRoot = join(root, "public");

test("every research entry title is a primary navigation link", async () => {
  const page = await readFile(join(publicRoot, "work/index.html"), "utf8");
  const entries = [...page.matchAll(/<article class="research-entry">[\s\S]*?<\/article>/gu)];
  assert.equal(entries.length, 10);

  const expectedTitleLinks = [
    ["Consequence Closure", "/research/technical-notes/2026-03/"],
    ["Reliance Before Closure", "/research/technical-notes/2026-02/"],
    ["Bounded Agent Closure", "/work/bounded-agent-closure/"],
    ["Native++ v0.2", "/work/native-plus/"],
    ["ClosureProbe", "/work/closureprobe/"],
    ["Negative Result Warrant", "/tools/negative-result-warrant/"],
    ["Projection Assurance", "/research/technical-notes/2026-04/"],
    ["OpenAPI→MCP Problem-Semantics Preservation Profile", "/work/problem-semantics/"],
    ["HTTP→MCP Method-Inference Soundness Profile", "/work/http-mcp-method-inference/"],
    ["Appeal", "/rels/appeal"],
  ];

  for (const [title, href] of expectedTitleLinks) {
    assert.ok(page.includes(`<h3><a href="${href}">${title}</a></h3>`), title);
  }

  assert.ok(page.includes('/assets/research-ledger.css?v=20260904-v1'));
});

test("research ledger labels keep their own line box at responsive widths", async () => {
  const css = await readFile(join(publicRoot, "assets/research-ledger.css"), "utf8");

  for (const expected of [
    ".research-entry > div",
    "min-width: 0",
    ".research-entry .entry-label",
    "margin: 0 0 9px",
    "line-height: 1.45",
    "overflow-wrap: anywhere",
    ".research-entry h3",
    "margin: 0 0 10px",
    ".research-entry h3 a:focus-visible",
  ]) assert.ok(css.includes(expected), expected);

  assert.equal(css.includes("margin: -5px"), false);
});
