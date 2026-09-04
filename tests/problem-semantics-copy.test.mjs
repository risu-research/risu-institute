import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const pagePath = join(root, "public/work/problem-semantics/index.html");

test("Problem Semantics page keeps the frozen result and current reading style", async () => {
  const page = await readFile(pagePath, "utf8");

  for (const expected of [
    '<link rel="canonical" href="https://risuinstitute.org/work/problem-semantics/">',
    "What is being preserved?",
    "No silent loss + no unsupported gain.",
    "The frozen 12-case profile",
    "Where the tested translations lost meaning",
    "A preserving translation",
    "Fresh-install reproduction",
    "For the frozen profile tested here, semantic loss is not forced by the tested MCP carrier capacity.",
    "11 PRESERVED, 0 LOSS, 0 INVENTED, and 1 NOT_APPLICABLE",
    "FastMCP 3.4.7",
    "CNOE openapi-mcp-codegen",
    "nihal1294/openapi-to-mcp",
    "meta.error.retryable=true",
    "07bcc4d7b13402c120fb26d28a35f1af5a271f61",
    "10.5281/zenodo.21911147",
    "f1a7dbddbeecb1cee1cdc84f34ff89b99c653267a10cfb51ebc8bfdf4df9b158",
    "profile/PROFILE.md",
    "profile/CLAIM_LEDGER.md",
    "verify_release.py",
  ]) assert.ok(page.includes(expected), expected);

  assert.equal(page.includes("\u2014"), false, "Problem Semantics page contains an em dash");
  assert.doesNotMatch(page, /\binvolv(?:e|es|ed|ing|ement)\b/iu);
  assert.doesNotMatch(page, /Strongest supported conclusion/iu);
  assert.doesNotMatch(page, /What this does not establish/iu);
});
