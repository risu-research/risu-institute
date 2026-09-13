import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = p => readFile(new URL(`../${p}`, import.meta.url), "utf8");
test("RISU Verify public frontier is scoped and review-safe", async () => {
  const joined = `${await read("public/work/projection-assurance/index.html")}\n${await read("public/tools/index.html")}\n${await read("public/work/index.html")}`;
  for (const phrase of ["Research frontier · September 2026","one independently grounded forbidden effect can establish regression","Clean runs do not count as preservation","General native-software preservation remains out of scope"]) assert.ok(joined.includes(phrase), phrase);
  for (const identifying of ["IEEE PerCom","DVCon","IAPP Global Summit","NeurIPS","k1-binding-b1","k1-closure-c2"]) assert.ok(!joined.includes(identifying), identifying);
});
