import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

async function* htmlFiles(dir) {
  for (const e of await readdir(dir,{withFileTypes:true})) {
    const path=join(dir,e.name);
    if(e.isDirectory()) yield* htmlFiles(path);
    else if(e.isFile() && e.name.endsWith(".html")) yield path;
  }
}
test("public institutional pages avoid unsupported corporate affiliation claims",async()=>{
  const root=fileURLToPath(new URL("../public/",import.meta.url));
  for await(const p of htmlFiles(root)){
    const html=await readFile(p,"utf8");
    assert.doesNotMatch(html,/RISU\s*,?\s*LLC/i,p);
  }
});
