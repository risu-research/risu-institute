import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const read=p=>readFile(new URL("../public/"+p,import.meta.url),"utf8");
test("institutional public pages use white canvas, visible publication groups and plain-language introductions",async()=>{
 const [css,home,work,pubs,about,tools,data]=await Promise.all(["assets/style.css","index.html","work/index.html","research/index.html","about/index.html","tools/index.html","data/index.html"].map(read));
 assert.match(css,/--canvas: #ffffff;/);
 for(const page of [home,work,pubs,about,tools,data]) assert.match(page,/style\.css\?v=20261125-institutional-white/);
 assert.match(home,/Software, evidence and public institutions/);
 assert.equal((pubs.match(/<h2 class="publication-group-title"/g)||[]).length,4);
 assert.equal((pubs.match(/<article class="publication-row">/g)||[]).length,8);
 assert.equal((work.match(/class="research-entry"/g)||[]).length,10);
 assert.match(about,/research initiative of RISU LLC/);
 assert.match(tools,/id="workbench"/);
 assert.match(data,/14474243">Download PDF/);
 assert.match(data,/14474231">Download the seven original CSV tables/);
});
