import assert from "node:assert/strict";
import { readFile, mkdtemp, writeFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import test from "node:test";

const run = promisify(execFile);
test("Colorado data layout keeps the photograph near the summary and findings within their columns", async t => {
  let chrome;
  for (const candidate of [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser"].filter(Boolean)) {
    try { await access(candidate); chrome = candidate; break; } catch {}
  }
  if (!chrome) { if (process.env.CI) assert.fail("Chromium required in CI"); return t.skip("Chromium unavailable"); }
  const [home, css] = await Promise.all(["data/index.html", "assets/style.css"].map(p => readFile(new URL("../public/"+p,import.meta.url),"utf8")));
  const image = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='960' height='612'%3E%3C/svg%3E";
  const source = home.replace(/<link rel="stylesheet" href="\/assets\/style\.css[^"]*">/, () => "<style>"+css+"</style>").replace(/(<img\b[^>]*?\bsrc=")[^"]*(")/g, (_,a,b)=>a+image+b);
  const probe = '<script>const b=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}};const get=s=>b(document.querySelector(s));const out=document.createElement("pre");out.id="layout-result";out.textContent=btoa(JSON.stringify({width:innerWidth,scroll:document.documentElement.scrollWidth,summary:get(".data-summary"),photo:get(".data-editorial-photo"),heading:get(".data-record-heading"),repository:get(".data-repository"),detail:get(".data-finding-detail"),copy:get(".data-finding-copy"),table:get(".data-case-table"),spec:get(".data-spec")}));document.body.append(out);</script>';
  const dir=await mkdtemp(join(tmpdir(),"risu-data-layout-"));
  try {
    const file=join(dir,"index.html");
    await writeFile(file,source.replace("</body>",probe+"</body>"));
    for (const width of [1440,1125,990,820,500]) {
      const {stdout}=await run(chrome,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage","--disable-background-networking","--hide-scrollbars","--user-data-dir="+join(dir,"profile-"+width),"--window-size="+width+",1000","--dump-dom",pathToFileURL(file).href],{timeout:25000,maxBuffer:4*1024*1024});
      const match=stdout.match(/<pre id="layout-result">([A-Za-z0-9+/=]+)<\/pre>/);
      assert.ok(match,"missing layout measurement at "+width);
      const x=JSON.parse(Buffer.from(match[1],"base64").toString("utf8"));
      assert.ok(x.scroll<=x.width+1,"horizontal overflow at "+x.width);
      assert.ok(x.photo.top-x.summary.bottom>=0 && x.photo.top-x.summary.bottom<=24,"photo gap at "+x.width);
      assert.ok(Math.abs(x.photo.left-x.summary.left)<=1,"photo left edge at "+x.width);
      assert.ok(x.detail.left>=x.copy.left-1 && x.detail.right<=x.copy.right+1,"finding detail inside text column at "+x.width);
      if(x.width>760) {
        assert.ok(Math.abs(x.heading.top-x.repository.top)<=1,"metadata top alignment");
        assert.ok(x.detail.right<=x.table.left-12,"finding detail intrudes into table column");
        assert.ok(x.photo.right<=x.spec.left-12,"photo intrudes into metadata column");
      } else assert.ok(x.table.top>=x.detail.bottom,"mobile table order");
      console.log("Colorado layout "+x.width+"px: photo gap="+(x.photo.top-x.summary.bottom)+"px; horizontal overflow="+(x.scroll-x.width)+"px");
    }
  } finally { await rm(dir,{recursive:true,force:true}); }
});
