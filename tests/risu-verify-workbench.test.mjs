import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
const root=dirname(dirname(fileURLToPath(import.meta.url))); const read=(p)=>readFile(join(root,p),"utf8"); const sha=(s)=>createHash("sha256").update(s).digest("base64");

test("public surface explains the problem before the formal machinery",async()=>{const h=await read("public/tools/index.html");for(const x of ["Consequence assurance","Surface compatibility is not consequence preservation.","One assurance record","Different systems. One consequence question.","Closure → Projection → Verification."])assert.ok(h.includes(x),x);assert.ok(h.indexOf("Surface compatibility")<h.indexOf("C / D / O"));});

test("Workbench is a three-mode assurance console",async()=>{const h=await read("public/tools/index.html");for(const x of ['data-pane="check"','data-pane="compare"','data-pane="examples"','Analyze an assurance record','Compare assurance records','Published examples'])assert.ok(h.includes(x),x);});

test("one-file handoff and raw artifact paths are executable",async()=>{const h=await read("public/tools/index.html");for(const x of ["risu.workbench-run/v0.1","risu.workbench-comparison/v0.1","unpackRunBundle","artifact_manifest_sha256","crypto.subtle.digest","report_json_sha256","certificate_sha256","compare-file-input"])assert.ok(h.includes(x),x);});

test("assurance record distinguishes browser verification from producer record",async()=>{const h=await read("public/tools/index.html");for(const x of ["Browser verified","Producer recorded","Frozen core identity","Assurance chain","Independent proof consumer","Record identity"])assert.ok(h.includes(x),x);});

test("runtime has no network or persistent browser state capability",async()=>{const h=await read("public/tools/index.html");const js=h.match(/<script>([\s\S]*?)<\/script><\/body>/u)?.[1]||"";for(const p of [/\bfetch\s*\(/u,/XMLHttpRequest/u,/WebSocket/u,/EventSource/u,/sendBeacon/u,/localStorage/u,/sessionStorage/u,/indexedDB/u,/serviceWorker/u])assert.doesNotMatch(js,p);assert.ok(js.includes("file.arrayBuffer()")||js.includes("arrayBuffer()"));});

test("CSP pins exact inline program and blocks runtime connect",async()=>{const h=await read("public/tools/index.html"),hdr=await read("public/_headers");const styles=[...h.matchAll(/<style>([\s\S]*?)<\/style>/gu)].map(m=>m[1]);const data=h.match(/<script type="application\/json" id="risu-examples">([\s\S]*?)<\/script>/u)[1];const js=h.match(/<script>([\s\S]*?)<\/script><\/body>/u)[1];for(const x of [data,js])assert.ok(hdr.includes(`'sha256-${sha(x)}'`));for(const x of styles)assert.ok(hdr.includes(`'sha256-${sha(x)}'`));assert.match(hdr,/\/tools\/[\s\S]*?connect-src 'none'/u);});

test("published calibration outcomes and historical source identity remain unchanged",async()=>{const h=await read("public/tools/index.html"),raw=h.match(/<script type="application\/json" id="risu-examples">([\s\S]*?)<\/script>/u)[1],d=JSON.parse(raw),by=Object.fromEntries(d.cases.map(x=>[x.id,x]));assert.deepEqual([by["github-file-update-before"].structural.C,by["github-file-update-before"].structural.D,by["github-file-update-before"].structural.O],["C0","NA","NA"]);assert.deepEqual([by["github-file-update-after"].structural.C,by["github-file-update-after"].structural.D,by["github-file-update-after"].structural.O],["C1","D1","O1"]);assert.deepEqual([by["azure-wiki-etag"].structural.C,by["azure-wiki-etag"].structural.D,by["azure-wiki-etag"].structural.O],["C1","D1","O1"]);assert.deepEqual([by["github-guarded-merge"].structural.C,by["github-guarded-merge"].structural.D,by["github-guarded-merge"].structural.O],["C1","D1","O0"]);assert.equal(by["github-file-update-before"].source_semantic_digest,by["github-file-update-after"].source_semantic_digest);});

test("claim boundary remains explicit",async()=>{const h=(await read("public/tools/index.html")).toLowerCase();for(const x of ["does not issue","does not rerun the python producer","not an independent bug-discovery claim","same declared source semantics","authoritative assurance verdict"])assert.ok(h.includes(x),x);});

test("homepage presents RISU Verify as a real result lifecycle",async()=>{const h=await read("public/index.html");for(const x of ["Check consequences, not appearances.","CLI / CI → .risu record → browser consumer","Open Assurance Workbench","10.5281/zenodo.22152024"])assert.ok(h.includes(x),x);});

test("Workbench responds to hash navigation after initial load",async()=>{const h=await read("public/tools/index.html");for(const x of ["function routeWorkbenchFromLocation()",'window.addEventListener("hashchange",routeWorkbenchFromLocation)','hash.startsWith("#workbench")'])assert.ok(h.includes(x),x);});
