import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
const root=dirname(dirname(fileURLToPath(import.meta.url)));
const read=(p)=>readFile(join(root,p),"utf8");
const shaB64=(s)=>createHash("sha256").update(s).digest("base64");

test("RISU Verify leads with a plain-language problem and progressive disclosure",async()=>{const h=await read("public/tools/index.html");for(const x of ["Same tool.","Different consequence.","RISU Verify checks whether that safeguard survived.","Why it matters:","Safeguard preserved","Safeguard lost","Not enough assurance","Technical details · C / D / O"])assert.ok(h.includes(x),x);assert.ok(h.indexOf("Why this exists")<h.indexOf("Evidence and reproducibility"));});

test("Workbench starts as actual artifact software rather than a canonical demo",async()=>{const h=await read("public/tools/index.html");for(const x of ["Check a RISU result in your browser.","report.json","certificate.json","run-manifest.json","crypto.subtle.digest","file.arrayBuffer()","Certificate and report worlds","Run manifest and report digest","Export browser check receipt"])assert.ok(h.includes(x),x);assert.ok(h.includes('href="#workbench" target="_blank" rel="noopener"'));});

test("Browser runtime cannot initiate network or persistent browser state",async()=>{const h=await read("public/tools/index.html");const js=h.match(/<script>([\s\S]*?)<\/script><\/body>/u)?.[1]||"";for(const r of [/\bfetch\s*\(/u,/XMLHttpRequest/u,/WebSocket/u,/EventSource/u,/sendBeacon/u,/localStorage/u,/sessionStorage/u,/indexedDB/u,/serviceWorker/u])assert.doesNotMatch(js,r);assert.ok(js.includes("crypto.subtle.digest"));assert.ok(js.includes("URL.createObjectURL"));});

test("CSP pins exact inline data, program, and style and blocks connect",async()=>{const h=await read("public/tools/index.html"),headers=await read("public/_headers");const css=h.match(/<style>([\s\S]*?)<\/style>/u)?.[1]||"",data=h.match(/<script type="application\/json" id="risu-examples">([\s\S]*?)<\/script>/u)?.[1]||"",js=h.match(/<script>([\s\S]*?)<\/script><\/body>/u)?.[1]||"";assert.ok(headers.includes(`script-src 'sha256-${shaB64(data)}' 'sha256-${shaB64(js)}'`));assert.ok(headers.includes(`style-src 'self' 'sha256-${shaB64(css)}'`));assert.match(headers,/\/tools\/[\s\S]*?connect-src 'none'/u);});

test("Published calibration facts and source identity remain exact",async()=>{const h=await read("public/tools/index.html");const raw=h.match(/<script type="application\/json" id="risu-examples">([\s\S]*?)<\/script>/u)?.[1];const d=JSON.parse(raw);assert.equal(d.release,"0.4.0-rc1");assert.equal(d.core.version,"0.7.0");assert.equal(d.core.archive_sha256,"bc3c0be440b1b729d3131a630491cce62f1f885fb305aa46a4483fee0adad72f");assert.equal(d.cases.length,4);const m=Object.fromEntries(d.cases.map(x=>[x.id,x]));assert.deepEqual([m["github-file-update-before"].structural.C,m["github-file-update-before"].structural.D,m["github-file-update-before"].structural.O],["C0","NA","NA"]);assert.deepEqual([m["github-file-update-after"].structural.C,m["github-file-update-after"].structural.D,m["github-file-update-after"].structural.O],["C1","D1","O1"]);assert.deepEqual([m["azure-wiki-etag"].structural.C,m["azure-wiki-etag"].structural.D,m["azure-wiki-etag"].structural.O],["C1","D1","O1"]);assert.deepEqual([m["github-guarded-merge"].structural.C,m["github-guarded-merge"].structural.D,m["github-guarded-merge"].structural.O],["C1","D1","O0"]);assert.equal(m["github-file-update-before"].source_semantic_digest,m["github-file-update-after"].source_semantic_digest);});

test("Public copy keeps the scientific boundary explicit",async()=>{const h=(await read("public/tools/index.html")).toLowerCase();for(const x of ["does not rerun the python producer","does not issue a new risu assurance certificate","retrospective validation","prospective generalization is reserved for corpus 0.1","bounded, model-relative assurance"])assert.ok(h.includes(x),x);});

test("Homepage gives non-specialists a direct path to understand, check, and try",async()=>{const h=await read("public/index.html");for(const x of ["Same tool. Different consequence.","Understand RISU Verify","Check a RISU result","Try a real before and after case","10.5281/zenodo.22152024","Projection Assurance"])assert.ok(h.includes(x),x);assert.ok(h.includes('href="/tools/#workbench" target="_blank" rel="noopener"'));});
