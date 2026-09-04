import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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
const frozenInspectorSha256 = {
  "app.js": "5430a6f21bbe71370cd977a91d53960f5c1e8a098c25e93eccf26716e64386df",
  "cases/c1-direct-zombie.json": "0a20d0ee69cf9c95bf5a9ec441648916bf69780bbaf1fc4189e38a5fae1ad1e1",
  "cases/c2-transitive-zombie.json": "b5efcc907373f0714ff4ee7cc03bffefc7b03e9315594d4e1c2a1dc17d7b2148",
  "cases/c3-pending-commitment.json": "b64c09940a66cd01109e59713a50869c6176af4a3e770caf6963cd15cd4c8d35",
  "cases/c4-retained-evidence.json": "4f56482cd100ebd23eeffffb82a3cf0190881e14e1ee7b61c3789249bc9c576c",
  "cases/c5-successor-transfer.json": "7df17c6124e8aa061bad160f20f6c0dd4f218e399132034b2dd3edcae4c4abd6",
  "cases/c6-missing-coverage.json": "2e16b8a48635f1a864360b4dfe4d5d822f59033e5454573c91e88523385733d8",
  "cases/c7-false-success.json": "491fd99ab2fbce22ef61bd7a66b0daa1bf2458d574fc09d63d4f6f69e0d24d8a",
  "cases/c8-fixed-point-winddown.json": "092bf4100e68ca7533334ce4fb6eeb8e7dd5cdc5c629a0df77a9fee15e68b299",
  "cases/index.json": "339784123923d8a4f5d5f25ed60989a6354723c9c786f4af02d94aa3a013d68d",
  "index.html": "bbd6eca2bdc925572d388c55c1f618332158a44aeb12f71b0a397c0f876d7ced",
  "style.css": "198a4ff1b7476d7c2e51838eafa6c44fd1fc7ca620fee568a897092659b7dd0c",
};
const technicalNoteTitle =
  "From Revocation to Closure: Verifying Attributable Consequences in AI Agent Decommissioning";
const technicalNoteAbstract =
  "Operational consequences may persist after an autonomous agent’s authority to initiate new work has been blocked. Delegated execution can remain active and commitments unsettled, while some effects may legitimately survive through transfer or retention. Authorization, task lifecycle, distributed termination, and finalization mechanisms address different parts of this lifecycle; none of those predicates alone establishes whether the retiring principal’s attributable consequences have reached allowed terminal dispositions. This note defines Bounded Agent Closure (BAC), a deterministic evidence verifier over a principal-relative consequence graph. BAC requires explicit source coverage and attribution, disposition-specific terminality, source-stability evidence, fresh observation of every reachable consequence, and final-pair semantic convergence under declared stability contracts. The frozen v0.3 implementation evaluates evidence across four domains, includes eight canonical boundary cases, and issues CLOSED only within the declared profile and source contracts. BAC defines a post-quiescence verification boundary for scoped, machine-auditable decommissioning claims.";
const technicalNoteDoi = "10.5281/zenodo.22005109";
const softwareDoi = "10.5281/zenodo.22005419";
const technicalNotePdf =
  "research/technical-notes/2026-01/RISU_Technical_Note_2026-01_From_Revocation_to_Closure.pdf";
const technicalNotePdfUrl = `https://risuinstitute.org/${technicalNotePdf}`;

const productionPages = [
  "index.html",
  "work/index.html",
  "work/consequence-closure/index.html",
  "work/reliance-before-closure/index.html",
  "work/bounded-agent-closure/index.html",
  "work/native-plus/index.html",
  "work/closureprobe/index.html",
  "work/projection-assurance/index.html",
  "work/http-mcp-method-inference/index.html",
  "research/index.html",
  "research/technical-notes/index.html",
  "research/technical-notes/2026-03/index.html",
  "research/technical-notes/2026-02/index.html",
  "research/technical-notes/2026-01/index.html",
  "about/index.html",
  "tools/index.html",
  "tools/consequence-closure/index.html",
  "tools/reliance-inspector/index.html",
  "rels/appeal.html",
  "work/appeal-interoperability/index.html",
  "work/problem-semantics/index.html",
  "tools/negative-result-warrant/index.html",
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
    "assets/research-ledger.css",
    "assets/style.css",
    "index.html",
    "rels/appeal.html",
    "research/index.html",
    "research/technical-notes/2026-01/RISU_Technical_Note_2026-01_From_Revocation_to_Closure.pdf",
    "research/technical-notes/2026-01/index.html",
    "research/technical-notes/2026-02/RISU_Technical_Note_2026-02_Reliance_Before_Closure.pdf",
    "research/technical-notes/2026-02/index.html",
    "research/technical-notes/2026-03/RISU_Technical_Note_2026-03_Consequence_Closure.pdf",
    "research/technical-notes/2026-03/index.html",
    "research/technical-notes/2026-04/RISU_Technical_Note_2026-04_Projection_Assurance.pdf",
    "research/technical-notes/2026-04/index.html",
    "research/technical-notes/index.html",
    "robots.txt",
    "sitemap.xml",
    "tools/agent-closure/app.js",
    "tools/agent-closure/cases/c1-direct-zombie.json",
    "tools/agent-closure/cases/c2-transitive-zombie.json",
    "tools/agent-closure/cases/c3-pending-commitment.json",
    "tools/agent-closure/cases/c4-retained-evidence.json",
    "tools/agent-closure/cases/c5-successor-transfer.json",
    "tools/agent-closure/cases/c6-missing-coverage.json",
    "tools/agent-closure/cases/c7-false-success.json",
    "tools/agent-closure/cases/c8-fixed-point-winddown.json",
    "tools/agent-closure/cases/index.json",
    "tools/agent-closure/index.html",
    "tools/agent-closure/provenance.json",
    "tools/agent-closure/style.css",
    "tools/consequence-closure/index.html",
    "tools/consequence-closure/inspector/app.js",
    "tools/consequence-closure/inspector/engine.js",
    "tools/consequence-closure/inspector/index.html",
    "tools/consequence-closure/inspector/samples.js",
    "tools/consequence-closure/inspector/styles.css",
    "tools/index.html",
    "tools/negative-result-warrant/core.js",
    "tools/negative-result-warrant/index.html",
    "tools/negative-result-warrant/inspector.css",
    "tools/negative-result-warrant/inspector.js",
    "tools/negative-result-warrant/og.png",
    "tools/negative-result-warrant/provenance.json",
    "tools/negative-result-warrant/recorded/observations.js",
    "tools/reliance-inspector/app.js",
    "tools/reliance-inspector/cases.json",
    "tools/reliance-inspector/hosted-guard.js",
    "tools/reliance-inspector/hosted.css",
    "tools/reliance-inspector/index.html",
    "tools/reliance-inspector/provenance.json",
    "tools/reliance-inspector/styles.css",
    "work/appeal-interoperability/index.html",
    "work/bounded-agent-closure/index.html",
    "work/closureprobe/index.html",
    "work/consequence-closure/index.html",
    "work/http-mcp-method-inference/index.html",
    "work/index.html",
    "work/native-plus/index.html",
    "work/problem-semantics/index.html",
    "work/projection-assurance/index.html",
    "work/reliance-before-closure/index.html",
  ];
  const discovered = (await listFiles(publicRoot)).map(publicRelative).sort();
  const actual = discovered.filter((path) => path !== ".DS_Store");

  assert.deepEqual(actual, expected);
  assert.ok(discovered.filter((path) => path.startsWith(".")).every((path) => [".assetsignore", ".DS_Store"].includes(path)));
  assert.ok(actual.every((path) =>
    path.startsWith("research/technical-notes/") ||
    !/(?:readme|prompt|checklist|notes|fixture|test|package)/iu.test(path)
  ));
});

test("the Agent Closure Inspector retains the exact frozen publication bytes", async () => {
  for (const [path, expectedDigest] of Object.entries(frozenInspectorSha256)) {
    const bytes = await readFile(join(publicRoot, "tools/agent-closure", path));
    const actualDigest = createHash("sha256").update(bytes).digest("hex");
    assert.equal(actualDigest, expectedDigest, path);
  }
});

test("RISU Technical Note 2026-01 exposes exact scholarly metadata and visible identity", async () => {
  const note = await readProject("public/research/technical-notes/2026-01/index.html");
  const expectedMeta = {
    citation_title: technicalNoteTitle,
    citation_author: "Moon Lee",
    citation_publication_date: "2026/08/18",
    citation_technical_report_institution: "RISU Institute",
    citation_technical_report_number: "RISU Technical Note 2026-01",
    citation_doi: technicalNoteDoi,
    citation_pdf_url: technicalNotePdfUrl,
  };

  assert.equal(
    oneMatch(note, /<link rel="canonical" href="([^"]+)">/gu, "Technical Note canonical"),
    "https://risuinstitute.org/research/technical-notes/2026-01/",
  );
  assert.equal(
    oneMatch(note, /<h1[^>]*>([^<]+)<\/h1>/gu, "Technical Note visible title"),
    technicalNoteTitle,
  );
  for (const [name, expected] of Object.entries(expectedMeta)) {
    assert.equal(
      oneMatch(note, new RegExp(`<meta name="${name}" content="([^"]*)">`, "gu"), name),
      expected,
    );
  }
  assert.equal(
    oneMatch(
      note,
      /<meta name="citation_fulltext_world_readable" content="([^"]*)">/gu,
      "citation_fulltext_world_readable",
    ),
    "",
  );
  for (const [property, expected] of Object.entries({
    "og:type": "article",
    "og:title": technicalNoteTitle,
    "og:description": "RISU Technical Note 2026-01 defines Bounded Agent Closure, a deterministic evidence verifier for scoped operational closure after autonomous-agent retirement.",
    "og:url": "https://risuinstitute.org/research/technical-notes/2026-01/",
  })) {
    assert.equal(
      oneMatch(note, new RegExp(`<meta property="${property}" content="([^"]+)">`, "gu"), property),
      expected,
    );
  }

  assert.ok(note.includes(`<p>${technicalNoteAbstract}</p>`));
  for (const indexPage of [
    "public/research/index.html",
    "public/research/technical-notes/index.html",
  ]) assert.ok(!(await readProject(indexPage)).includes(technicalNoteAbstract));
  assert.ok(note.includes(technicalNoteDoi));
  assert.ok(note.includes(softwareDoi));
  assert.ok(note.includes(`href="/${technicalNotePdf}"`));
  assert.ok(note.includes("RISU Technical Note 2026-01"));
  assert.ok(note.includes("Moon Lee"));
  assert.doesNotMatch(note, /citation_(?:journal|volume|issue|firstpage|lastpage|issn)/iu);
  assert.doesNotMatch(note, /(?:peer[- ]reviewed|has undergone peer review|external peer review)/iu);
  assert.doesNotMatch(note, /(?:external|independent|industry) adoption (?:has been|is) (?:achieved|demonstrated|established)/iu);

  const jsonLd = oneMatch(
    note,
    /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/gu,
    "Technical Note JSON-LD",
  );
  const structured = JSON.parse(jsonLd);
  assert.equal(structured["@type"], "ScholarlyArticle");
  assert.equal(structured.headline, technicalNoteTitle);
  assert.equal(structured.isAccessibleForFree, true);
  assert.equal(structured.encoding.contentUrl, technicalNotePdfUrl);
});

test("the institutional Technical Note PDF retains the exact published bytes", async () => {
  const bytes = await readFile(join(publicRoot, technicalNotePdf));
  assert.equal(createHash("md5").update(bytes).digest("hex"), "66d263143b0e47c4b942762390235120");
  assert.ok(bytes.length < 5 * 1024 * 1024);
});

test("the Agent Closure Inspector is canonical-only and retains frozen provenance", async () => {
  const html = await readProject("public/tools/agent-closure/index.html");
  const runtime = await readProject("public/tools/agent-closure/app.js");
  const cases = JSON.parse(await readProject("public/tools/agent-closure/cases/index.json"));
  const provenance = JSON.parse(await readProject("public/tools/agent-closure/provenance.json"));

  assert.ok(html.includes("Static mode · Canonical evidence only"));
  assert.ok(html.includes("Eight generated evaluations from the frozen Phase-1 verifier."));
  assert.equal(cases.length, 8);
  assert.deepEqual(cases.map(({ file }) => file), [
    "c1-direct-zombie.json",
    "c2-transitive-zombie.json",
    "c3-pending-commitment.json",
    "c4-retained-evidence.json",
    "c5-successor-transfer.json",
    "c6-missing-coverage.json",
    "c7-false-success.json",
    "c8-fixed-point-winddown.json",
  ]);
  assert.match(
    runtime,
    /window\.location\.protocol === "http:" && window\.location\.hostname === "127\.0\.0\.1"/u,
  );
  assert.match(runtime, /dom\["open-file"\]\.disabled = !localEvaluationAvailable;/u);
  assert.match(runtime, /if \(localEvaluationAvailable\) dom\["file-input"\]\.click\(\);/u);
  assert.deepEqual(provenance, {
    artifact: "RISU Agent Closure Inspector",
    public_mode: "static-canonical-only",
    source_repository: "https://github.com/risu-research/bounded-agent-closure",
    source_tag: "inspector-v0.1-freeze",
    inspector_commit: "07325dd1304cc3fe1acd86ce50596161581a1cdb",
    engine_tag: "phase1-freeze-v0.3",
    engine_commit: "a46456f028cd3dd1d386111b1faab890a26ae5e9",
    profile: "RISU_AGENT_CLOSURE_V0",
    canonical_cases: 8,
    hosted_path: "https://risuinstitute.org/tools/agent-closure/",
    scope: "Canonical generated evaluations only. Arbitrary private evidence evaluation is available only from the local Inspector.",
  });
});

test("the Bounded Agent Closure research card routes through the website overview", async () => {
  const work = await readProject("public/work/index.html");
  const overviewHref = 'href="/work/bounded-agent-closure/"';
  const noteHref = 'href="/research/technical-notes/2026-01/"';
  const inspectorHref = 'href="/tools/agent-closure/"';
  const softwareHref = 'href="https://doi.org/10.5281/zenodo.22005419"';

  assert.equal(work.split(overviewHref).length - 1, 2, overviewHref);
  for (const href of [noteHref, inspectorHref, softwareHref]) {
    assert.equal(work.split(href).length - 1, 1, href);
  }
  assert.ok(work.indexOf(overviewHref) < work.indexOf(noteHref));
  assert.ok(work.indexOf(noteHref) < work.indexOf(inspectorHref));
  assert.ok(work.indexOf(inspectorHref) < work.indexOf(softwareHref));
});

test("the homepage features Projection Assurance and its published records", async () => {
  const home = await readProject("public/index.html");
  const noteHref = 'href="/research/technical-notes/2026-04/"';
  const noteDoiHref = 'href="https://doi.org/10.5281/zenodo.22149639"';
  const softwareHref = 'href="https://doi.org/10.5281/zenodo.22149593"';
  const capsuleHref = 'href="https://doi.org/10.5281/zenodo.22149517"';

  for (const href of [noteHref, noteDoiHref, softwareHref, capsuleHref]) {
    assert.equal(home.split(href).length - 1, 1, href);
  }
  assert.ok(home.indexOf(noteHref) < home.indexOf(noteDoiHref));
  assert.ok(home.indexOf(noteDoiHref) < home.indexOf(softwareHref));
  assert.ok(home.indexOf(softwareHref) < home.indexOf(capsuleHref));
});

test("the Research URLs appear in the sitemap exactly once", async () => {
  const sitemap = await readProject("public/sitemap.xml");
  for (const url of [
    "https://risuinstitute.org/research/",
    "https://risuinstitute.org/research/technical-notes/",
    "https://risuinstitute.org/research/technical-notes/2026-01/",
  ]) {
    assert.equal(sitemap.split(`<loc>${url}</loc>`).length - 1, 1, url);
  }
  assert.doesNotMatch(sitemap, /RISU_Technical_Note_2026-01_From_Revocation_to_Closure\.pdf/u);
});

test("the Agent Closure Inspector URL appears in the sitemap exactly once", async () => {
  const sitemap = await readProject("public/sitemap.xml");
  assert.equal(
    [...sitemap.matchAll(/<loc>https:\/\/risuinstitute\.org\/tools\/agent-closure\/<\/loc>/gu)].length,
    1,
  );
});

test("the Inspector runtime cannot initiate network or persistent browser state", async () => {
  const runtime = [
    await readProject("public/tools/negative-result-warrant/core.js"),
    await readProject("public/tools/negative-result-warrant/inspector.js"),
    await readProject("public/tools/negative-result-warrant/recorded/observations.js"),
  ].join("\n");
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
  ]) assert.doesNotMatch(runtime, forbidden);

  const html = await readProject("public/tools/negative-result-warrant/index.html");
  assert.doesNotMatch(html, /<script\b[^>]*\bsrc="https?:\/\//iu);
  assert.doesNotMatch(html, /<link\b[^>]*\bhref="https?:\/\/[^"]+"[^>]*\brel="stylesheet"/iu);
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
  assert.doesNotMatch(
    sitemap,
    /<loc>https:\/\/risuinstitute\.org\/rels\/appeal\/<\/loc>/u,
  );

  assert.equal(
    [...sitemap.matchAll(/<loc>https:\/\/risuinstitute\.org\/work\/appeal-interoperability\/<\/loc>/gu)].length,
    1,
  );

  assert.equal(
    [...sitemap.matchAll(/<loc>https:\/\/risuinstitute\.org\/work\/problem-semantics\/<\/loc>/gu)].length,
    1,
  );

  assert.equal(
    [...sitemap.matchAll(/<loc>https:\/\/risuinstitute\.org\/work\/consequence-closure\/<\/loc>/gu)].length,
    1,
  );

  assert.equal(
    [...sitemap.matchAll(/<loc>https:\/\/risuinstitute\.org\/work\/reliance-before-closure\/<\/loc>/gu)].length,
    1,
  );

  assert.equal(
    [...sitemap.matchAll(/<loc>https:\/\/risuinstitute\.org\/work\/bounded-agent-closure\/<\/loc>/gu)].length,
    1,
  );

  assert.equal(
    [...sitemap.matchAll(/<loc>https:\/\/risuinstitute\.org\/work\/native-plus\/<\/loc>/gu)].length,
    1,
  );

  assert.equal(
    [...sitemap.matchAll(/<loc>https:\/\/risuinstitute\.org\/work\/closureprobe\/<\/loc>/gu)].length,
    1,
  );

  assert.equal(
    [...sitemap.matchAll(/<loc>https:\/\/risuinstitute\.org\/work\/http-mcp-method-inference\/<\/loc>/gu)].length,
    1,
  );

  assert.equal(
    [...sitemap.matchAll(/<loc>https:\/\/risuinstitute\.org\/tools\/negative-result-warrant\/<\/loc>/gu)].length,
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
