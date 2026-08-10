import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const publicRoot = join(projectRoot, "public");
const canonicalUri = "https://risuinstitute.org/rels/appeal";
const frozenCore =
  "Identifies an affordance used to request review or reconsideration of the prior decision identified by or unambiguously associated with its context.";
const frozenRfcBinding =
  "Refers to a resource used to request review or reconsideration of the prior decision identified by or unambiguously associated with the link context.";
const obsoleteNativeUseCaveat =
  "Independent native publication by an external publisher has not yet been demonstrated.";
const identifierBoundary =
  "RFC 8288 does not make the URI and token equivalent";
const adjacentPurposeBoundary =
  "A complaint, dispute, support route, edit, retry, escalation, or cancellation does not qualify merely because it concerns the same matter.";
const revisedCausalStatement =
  "showed that discovery in this instance depended on asserted semantic identity rather than context or target alone.";
const reviewVerdict = "**READY FOR EXPERT REVIEW**";
const sourceBaselineCommit = "981c7394e00bf3251bb54b5fd9e664d145ba12ab";
const releaseStatus =
  "**PASS — Controlled interoperability demonstrated; adoption and registration remain unproven.**";
const evidenceAnchors = [
  "7dbeede9450f97e93d863d0e2cb825df2fea65f79659132c4b94f8edb8d6fcae",
  "babc39d09d1d35447d306bc7540f8dbe7d1aa2e4",
  "1ef2febc611de6f39a696234374470e6a2e0a8c1",
  "f33da8bd5f7c284e6bf6814a7ef1f8e0c9063c6b20a286517c18cb88ba3fdf13",
  "2bda28d5dbf1356ebcdf5de5033430cc65d3b1b813fd485888fe76d8e1d2cfde",
  "d87f45e5b3d70800e4e068a10ec5a234a02f5c9392803d957d4deaa910a18a8a",
  "5ff8d7101850f18510e251750a80f7f6011441a3bb358d65285a3600b376f06c",
  "f8236b0350bd883feebe2f822115e8ed926aadb22885197d737e5e45348a627a",
  "2087708b5134e4fffc959d9767920f1ea76a67277b4c2b776671cc02fc4d2bf7",
  "cfd95a3fd04fc1ad48934e5eec3caf18470a372b074923cf469aee058812fd75",
];

const productionPages = [
  "index.html",
  "work/index.html",
  "about/index.html",
  "rels/appeal.html",
  "work/appeal-interoperability/index.html",
];

async function readProject(path) {
  return readFile(join(projectRoot, path), "utf8");
}

async function listFiles(root) {
  const files = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(path)));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }
  return files;
}

function publicRelative(path) {
  return relative(publicRoot, path).split(sep).join("/");
}

function oneMatch(source, pattern, label) {
  const matches = [...source.matchAll(pattern)];
  assert.equal(matches.length, 1, `${label} must occur exactly once`);
  return matches[0][1];
}

async function publicPathExists(pathname) {
  let candidate;
  if (pathname === "/") {
    candidate = join(publicRoot, "index.html");
  } else if (pathname.endsWith("/")) {
    candidate = join(publicRoot, pathname.slice(1), "index.html");
  } else {
    const literal = join(publicRoot, pathname.slice(1));
    const extensionlessHtml = `${literal}.html`;
    try {
      return (await stat(literal)).isFile();
    } catch {
      candidate = extensionlessHtml;
    }
  }

  try {
    return (await stat(candidate)).isFile();
  } catch {
    return false;
  }
}

test("the Appeal identity, frozen text, v0.2 status, and identifier boundary are present", async () => {
  const appeal = await readProject("public/rels/appeal.html");

  assert.match(appeal, /<link rel="canonical" href="https:\/\/risuinstitute\.org\/rels\/appeal">/u);
  assert.ok(appeal.includes(canonicalUri));
  assert.equal(appeal.split(frozenCore).length - 1, 1);
  assert.equal(appeal.split(frozenRfcBinding).length - 1, 1);
  assert.match(appeal, /<dd>Experimental<\/dd>/u);
  assert.match(appeal, /Experimental semantic · v0\.2/u);
  assert.match(appeal, /specification version <strong>0\.2<\/strong>/u);
  assert.ok(appeal.includes(identifierBoundary));
  assert.equal(appeal.split(adjacentPurposeBoundary).length - 1, 1);
  assert.doesNotMatch(appeal, new RegExp(obsoleteNativeUseCaveat, "u"));
  assert.doesNotMatch(appeal, /https:\/\/risuinstitute\.org\/rels\/appeal\//u);
});

test("all production canonical URLs and titles are present and unique", async () => {
  const canonicals = [];
  const titles = [];

  for (const page of productionPages) {
    const html = await readProject(`public/${page}`);
    canonicals.push(
      oneMatch(html, /<link rel="canonical" href="([^"]+)">/gu, `${page} canonical`),
    );
    titles.push(oneMatch(html, /<title>([^<]+)<\/title>/gu, `${page} title`));
    oneMatch(
      html,
      /<meta name="description" content="([^"]+)">/gu,
      `${page} description`,
    );
  }

  assert.equal(new Set(canonicals).size, productionPages.length);
  assert.equal(new Set(titles).size, productionPages.length);
  assert.ok(canonicals.includes(canonicalUri));
});

test("publication text contains no obsolete status or inflated claim", async () => {
  const production = (
    await Promise.all(productionPages.map((page) => readProject(`public/${page}`)))
  ).join("\n");
  const releaseDocuments = (
    await Promise.all([
      "README.md",
      "RELEASE_CHECKLIST.md",
      "RELEASE_NOTES.md",
      "standards/iana-appeal-candidate.md",
      "standards/appeal-review-memo.md",
    ].map(readProject))
  ).join("\n");
  const reviewedText = `${production}\n${releaseDocuments}`;

  assert.doesNotMatch(reviewedText, /appeal\.example|wrong\.example/iu);
  assert.ok(!reviewedText.includes(obsoleteNativeUseCaveat));
  assert.doesNotMatch(
    reviewedText,
    /(?:has|have|achieved|proves?|establishes?)\s+(?:ecosystem|organic|independent organizational|industry) adoption/iu,
  );
  assert.doesNotMatch(
    reviewedText,
    /(?:is|was|has been)\s+(?:now\s+)?IANA[- ]registered|IANA registration (?:is|was|has been) (?:approved|complete)/iu,
  );
  assert.doesNotMatch(
    reviewedText,
    /(?:proves?|establishes?|demonstrates?) universal interoperability/iu,
  );
  assert.doesNotMatch(reviewedText, /Test B[^.]{0,100}(?:pending|not yet|still unproven)/iu);
  assert.doesNotMatch(reviewedText, /(?:PayPal|Stream) (?:is|are) (?:a )?RISU adopter/iu);
  assert.doesNotMatch(reviewedText, /(?:PayPal|Stream)[^.]{0,120}(?:uses?|publishes?) the RISU (?:URI|relation)/iu);
});

test("the public evidence page contains the frozen anchors and experimental limits", async () => {
  const evidence = await readProject("public/work/appeal-interoperability/index.html");

  for (const anchor of evidenceAnchors) assert.ok(evidence.includes(anchor), anchor);
  assert.match(evidence, /one controlled clean-room experimental instance/iu);
  assert.match(evidence, /not demonstrated/iu);
  assert.match(evidence, /The experiments tested only the extension URI\./u);
  assert.ok(evidence.includes(revisedCausalStatement));
  assert.doesNotMatch(evidence, /isolated the semantic match as the cause/iu);
  assert.doesNotMatch(evidence, /proof of (?:ecosystem )?adoption/iu);
});

test("the standards review classifies prior use without turning it into RISU adoption", async () => {
  const memo = await readProject("standards/appeal-review-memo.md");

  assert.ok(memo.includes("**Assessment: material review risk, but not a demonstrated registration\nprerequisite.**"));
  assert.ok(memo.includes("Neither PayPal nor Stream is presented as a RISU adopter"));
  assert.match(memo, /RFC\s+8288 does not identify an independent non-test RISU implementation as a formal\s+registration prerequisite\./u);
  assert.ok(memo.includes(reviewVerdict));
  assert.doesNotMatch(memo, /Assessment: blocking for submission now/iu);
  assert.doesNotMatch(memo, /record at least one credible non-test publisher use/iu);
});

test("the IANA candidate retains the exact frozen RFC 8288 binding", async () => {
  const candidate = await readProject("standards/iana-appeal-candidate.md");

  assert.match(candidate, /Relation Name:\nappeal\n/u);
  assert.equal(candidate.split(frozenRfcBinding).length - 1, 1);
  assert.ok(candidate.includes(`Reference:\n${canonicalUri}`));
  assert.match(candidate, /review artifact only; not submitted to IANA/iu);
});

test("the public directory is an explicit, reviewable allowlist", async () => {
  const expected = [
    "404.html",
    "_headers",
    "_redirects",
    "about/index.html",
    "assets/favicon.svg",
    "assets/style.css",
    "index.html",
    "rels/appeal.html",
    "robots.txt",
    "sitemap.xml",
    "work/appeal-interoperability/index.html",
    "work/index.html",
  ];
  const actual = (await listFiles(publicRoot)).map(publicRelative).sort();

  assert.deepEqual(actual, expected);
  assert.ok(actual.every((path) => !/(?:readme|prompt|checklist|notes|fixture|test|package)/iu.test(path)));
});

test("every internal page, stylesheet, and favicon link resolves inside public", async () => {
  const htmlPages = [...productionPages, "404.html"];

  for (const page of htmlPages) {
    const html = await readProject(`public/${page}`);
    const references = [...html.matchAll(/\b(?:href|src)="([^"]+)"/gu)].map(
      (match) => match[1],
    );

    for (const reference of references) {
      if (reference.startsWith("#")) continue;
      const url = new URL(reference, "https://risuinstitute.org/");
      if (url.origin !== "https://risuinstitute.org") continue;
      assert.equal(
        await publicPathExists(url.pathname),
        true,
        `${page} has a broken internal reference: ${reference}`,
      );
    }
  }
});

test("basic static HTML accessibility invariants hold", async () => {
  for (const page of [...productionPages, "404.html"]) {
    const html = await readProject(`public/${page}`);
    assert.match(html, /<html lang="en">/u, `${page} must declare its language`);
    assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/u);
    assert.match(html, /<nav[^>]+aria-label="[^"]+"/u, `${page} navigation needs a label`);
    assert.equal([...html.matchAll(/<h1\b/gu)].length, 1, `${page} must have one h1`);

    const levels = [...html.matchAll(/<h([1-6])\b/gu)].map((match) => Number(match[1]));
    for (let index = 1; index < levels.length; index += 1) {
      assert.ok(levels[index] <= levels[index - 1] + 1, `${page} skips a heading level`);
    }

    for (const anchor of html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gu)) {
      const text = anchor[1].replace(/<[^>]+>/gu, " ").replace(/\s+/gu, " ").trim();
      assert.notEqual(text, "", `${page} contains a link without meaningful text`);
    }
  }
});

test("Cloudflare routing preserves the slashless semantic identity and custom 404", async () => {
  const config = JSON.parse(await readProject("wrangler.jsonc"));
  const redirects = await readProject("public/_redirects");

  assert.equal(config.assets.directory, "./public");
  assert.equal(config.assets.not_found_handling, "404-page");
  assert.equal(config.assets.html_handling, "auto-trailing-slash");
  assert.equal(config.workers_dev, false);
  assert.deepEqual(config.routes, [
    { pattern: "risuinstitute.org", custom_domain: true },
  ]);
  assert.equal(redirects.trim(), "/rels/appeal/ /rels/appeal 301");
});

test("sitemap, manifest, and release documents agree on the frozen identity", async () => {
  const sitemap = await readProject("public/sitemap.xml");
  const manifest = JSON.parse(await readProject("RELEASE_MANIFEST.json"));
  const notes = await readProject("RELEASE_NOTES.md");

  assert.equal(
    [...sitemap.matchAll(/<loc>https:\/\/risuinstitute\.org\/rels\/appeal<\/loc>/gu)].length,
    1,
  );
  assert.doesNotMatch(sitemap, /<loc>https:\/\/risuinstitute\.org\/rels\/appeal\/<\/loc>/u);
  assert.equal(
    [...sitemap.matchAll(/<loc>https:\/\/risuinstitute\.org\/work\/appeal-interoperability\/<\/loc>/gu)].length,
    1,
  );
  assert.equal(manifest.canonical_semantic, canonicalUri);
  assert.equal(
    manifest.source_baseline_commit,
    sourceBaselineCommit,
  );
  assert.equal(manifest.semantic_status, "Experimental");
  assert.equal(manifest.iana_status, "Not registered");
  assert.ok(notes.includes(releaseStatus));
});
