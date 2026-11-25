import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const read = p => readFile(new URL("../public/"+p, import.meta.url), "utf8");
test("RISUAP publication is discoverable and counts distinguish source rows and native IDs", async () => {
  const [home,data,pubs,map] = await Promise.all(["index.html","data/index.html","research/index.html","sitemap.xml"].map(read));
  for (const page of [home,data,pubs]) {
    assert.ok(page.includes('href="/data/'));
    assert.ok(page.includes("https://doi.org/10.7910/DVN/GYY4TM"));
  }
  assert.ok(home.indexOf("25 NOV 2026") < home.indexOf("14 NOV 2026"));
  assert.match(data, /10,089,541/);
  assert.match(data, /Distinct business IDs<\/th><td>15,660/);
  assert.match(data, /Distinct transaction IDs<\/th><td>1/);
  assert.equal((data.match(/<tr><td>0[1-7]<\/td>/g)||[]).length,7);
  assert.equal((map.match(/<loc>https:\/\/risuinstitute\.org\/data\/<\/loc>/g)||[]).length,1);
  const json = JSON.parse(data.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(json["@type"],"Dataset");
  assert.equal(json.creator, undefined);
  assert.doesNotMatch(data,/Moon(?: Hwan)? Lee/i);
  assert.doesNotMatch(pubs.split('id="research-data-heading"')[1],/Moon(?: Hwan)? Lee/i);
  assert.match(data,/Counting Colorado Business Registry Transactions/);
  assert.match(data,/99\.93%/);
  assert.match(data,/493,851/);
  assert.match(data,/494,342/);
  assert.match(data,/RISUAP_COLORADO_DATA_GUIDE\.pdf/);
  assert.match(data,/data\.colorado\.gov\/d\/casm-dbbj/);
  assert.equal(json.includedInDataCatalog.name,"Harvard Dataverse");
  assert.doesNotMatch(data,/peer.reviewed|in partnership with Harvard|Harvard approved/i);
});
