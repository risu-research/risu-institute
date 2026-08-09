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
const nativeUseCaveat =
  "Independent native publication by an external publisher has not yet been demonstrated.";
const releaseStatus =
  "**PASS — Consumer-side zero-mapping bootstrap demonstrated; independent native use still unproven.**";

const productionPages = [
  "index.html",
  "work/index.html",
  "about/index.html",
  "rels/appeal.html",
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

test("the Appeal semantic identity, definition, binding, and status are frozen", async () => {
  const appeal = await readProject("public/rels/appeal.html");

  assert.match(appeal, /<link rel="canonical" href="https:\/\/risuinstitute\.org\/rels\/appeal">/u);
  assert.ok(appeal.includes(canonicalUri));
  assert.ok(appeal.includes(frozenCore));
  assert.ok(appeal.includes(frozenRfcBinding));
  assert.match(appeal, /<dd>Experimental<\/dd>/u);
  assert.ok(appeal.includes(nativeUseCaveat));
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

test("production pages contain no placeholder identity or native-adoption claim", async () => {
  const production = (
    await Promise.all(productionPages.map((page) => readProject(`public/${page}`)))
  ).join("\n");

  assert.doesNotMatch(production, /appeal\.example|wrong\.example/iu);
  assert.doesNotMatch(
    production,
    /independent native (?:publication|use)[^.]{0,80}(?:has|was) (?:now )?(?:been )?demonstrated/iu,
  );
  assert.ok(production.includes(nativeUseCaveat));
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
  assert.equal(manifest.canonical_semantic, canonicalUri);
  assert.equal(manifest.semantic_status, "Experimental");
  assert.ok(notes.includes(releaseStatus));
});
