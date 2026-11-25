import assert from "node:assert/strict";
import { readFile, mkdtemp, writeFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import test from "node:test";

const run = promisify(execFile);
test("research news keeps dates, headlines and metadata in natural top-aligned flow", async t => {
  let chrome;
  for (const candidate of [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser"].filter(Boolean)) {
    try { await access(candidate); chrome = candidate; break; } catch {}
  }
  if (!chrome) { if (process.env.CI) assert.fail("Chromium required in CI"); return t.skip("Chromium unavailable"); }
  const [home, css] = await Promise.all(["index.html", "assets/style.css"].map(p => readFile(new URL("../public/"+p,import.meta.url),"utf8")));
  // Inline the real stylesheet. Use neutral image placeholders to test layout independently of external image hosts.
  const image = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='420' height='240'%3E%3C/svg%3E";
  const source = home.replace(/<link rel="stylesheet" href="\/assets\/style\.css[^"]*">/, () => "<style>"+css+"</style>").replace(/(<img\b[^>]*?\bsrc=")[^"]*(")/g, (_,a,b)=>a+image+b);
  const probe = '<script>const b=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}};const a=[...document.querySelectorAll(".update-entry:not(.update-entry--data)")].map(e=>({article:b(e),image:b(e.querySelector(".update-thumb")),date:b(e.querySelector("time")),title:b(e.querySelector("h3")),body:b(e.querySelector(".update-main")),side:b(e.querySelector(".update-side"))}));const out=document.createElement("pre");out.id="layout-result";out.textContent=btoa(JSON.stringify({a,width:innerWidth}));document.body.append(out);</script>';
  const dir=await mkdtemp(join(tmpdir(),"risu-news-layout-"));
  try {
    const file=join(dir,"index.html");
    await writeFile(file,source.replace("</body>",probe+"</body>"));
    for (const width of [1440,1125,820,500]) {
      const {stdout}=await run(chrome,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage","--disable-background-networking","--hide-scrollbars","--user-data-dir="+join(dir,"profile-"+width),"--window-size="+width+",1000","--dump-dom",pathToFileURL(file).href],{timeout:25000,maxBuffer:4*1024*1024});
      const match=stdout.match(/<pre id="layout-result">([A-Za-z0-9+/=]+)<\/pre>/);
      assert.ok(match,"missing layout measurement at "+width);
      const {a,width:actual}=JSON.parse(Buffer.from(match[1],"base64").toString("utf8"));
      assert.equal(a.length,6);
      for (const x of a) {
        assert.ok(Math.abs(x.image.top-x.date.top)<=1,"photo/date alignment at "+actual);
        assert.ok(x.title.top-x.date.bottom>=0 && x.title.top-x.date.bottom<=8,"date/title spacing at "+actual);
        assert.ok(x.side.top-x.body.bottom>=0 && x.side.top-x.body.bottom<=10,"body/metadata spacing at "+actual);
        assert.ok(x.article.right<=actual+1,"article overflow at "+actual);
      }
      if(actual>760) for(let i=0;i<a.length;i+=2) {
        assert.ok(Math.abs(a[i].title.top-a[i+1].title.top)<=1,"paired headlines at "+actual);
        assert.ok(Math.abs(a[i].image.top-a[i+1].image.top)<=1,"paired photos at "+actual);
      }
    }
  } finally { await rm(dir,{recursive:true,force:true}); }
});
