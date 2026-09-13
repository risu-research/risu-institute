from pathlib import Path

DETAIL = Path('public/work/projection-assurance/index.html')
TOOLS = Path('public/tools/index.html')
WORK = Path('public/work/index.html')
TEST = Path('tests/risu-verify-frontier.test.mjs')

s = DETAIL.read_text()
marker = '    <h2>Certificate-backed external cases</h2>'
assert s.count(marker) == 1
frontier = '''    <h2 id="research-frontier">Research frontier — September 2026</h2>
    <p>The published Projection Assurance record remains frozen. In parallel, RISU Verify is testing a narrower but harder question: when can a consequence judgment be tied to executable behavior rather than only to a declared target model?</p>
    <div class="callout"><p><strong>Current rule:</strong> one independently grounded forbidden effect can establish regression, but preservation requires closure over the declared consequential boundary. A clean run by itself is never promoted into proof of preservation.</p></div>
    <dl class="spec-grid">
      <dt>Observed regression</dt><dd>For a controlled execution, a concrete forbidden effect can be bound to the exact executable, world, and observed consequence, then checked independently as a regression witness.</dd>
      <dt>Bounded preservation</dt><dd>For an exact hermetic program and an explicit finite boundary, independent checkers reconstruct the consequence relation from the program bytes and exhaustively enumerated inputs before testing whether every realized consequence is allowed.</dd>
      <dt>Independent checking</dt><dd>The current research path uses separately implemented checkers, fixed known-answer vectors, adversarial mutation tests, and seeded generative differential checks. The producer is not allowed to self-declare a complete realized relation.</dd>
      <dt>Open boundary</dt><dd>Positive preservation is not yet claimed for unrestricted native software. The next research problem is how to justify a sound refinement from richer implementations into the bounded execution model without hiding or relabeling consequences.</dd>
    </dl>
    <p>This frontier does not replace the frozen Technical Note evaluation or the v0.7.0 scientific core. It extends the evidence architecture around the same consequence-centered discipline while keeping broader claims out of scope until a specific artifact earns them.</p>
    <p>The checkpoint is a project-level research update, not a claim of external peer-review acceptance or a new general-purpose product release.</p>

'''
DETAIL.write_text(s.replace(marker, frontier + marker))

s = TOOLS.read_text()
assert 'id="research-frontier"' not in s
start = s.index('<section class="rv-hero">')
end = s.index('</section>', start) + len('</section>')
block = '''
<section class="section" id="research-frontier"><div class="wrap rv-public-grid"><div class="rv-public-copy"><p class="rv-kicker-public">Research frontier · September 2026</p><h2>From declared models toward executable assurance.</h2><p>RISU Verify now separates two implementation-facing questions. A concrete forbidden effect can ground a regression claim when it is independently tied to an exact execution. Positive preservation is held to a stronger standard: within a deliberately bounded, hermetic execution model, independent checkers reconstruct the complete consequence relation from exact program bytes and the finite boundary before comparing it with what is allowed.</p><p>This is an active research frontier, not a new general-purpose release. Clean runs do not count as preservation, and unrestricted native software remains outside the positive-preservation scope.</p><div class="rv-actions"><a class="rv-btn secondary" href="/work/projection-assurance/#research-frontier">Read the research checkpoint</a></div></div><div class="rv-contrast"><div class="rv-contrast-row emphasis"><span>Regression</span><strong>One independently grounded forbidden consequence can be decisive.</strong></div><div class="rv-contrast-row"><span>Preservation</span><strong>Requires exhaustive closure over the declared bounded execution space.</strong></div><div class="rv-contrast-row"><span>Still open</span><strong>Sound refinement from richer or native implementations into that bounded model.</strong></div></div></div></section>'''
TOOLS.write_text(s[:end] + block + s[end:])

s = WORK.read_text()
old = '<p class="entry-summary">Projection Assurance tests preservation against a declared consequence rather than interface similarity. It separates correspondence, discrimination, operative placement, Exact Realization, and coverage, so a visible safeguard can fail when it stops governing the effect while a narrower target mechanism can still pass when it realizes the same consequence.</p>'
new = '<p class="entry-summary">Projection Assurance tests preservation against a declared consequence rather than interface similarity. It separates correspondence, discrimination, operative placement, Exact Realization, and coverage, so a visible safeguard can fail when it stops governing the effect while a narrower target mechanism can still pass when it realizes the same consequence. The active RISU Verify frontier now extends that discipline toward executable behavior: observed counterexamples can ground regression, while positive preservation is admitted only inside a bounded execution model whose consequence relation is independently reconstructed. General native-software preservation remains out of scope.</p>'
assert s.count(old) == 1
WORK.write_text(s.replace(old, new))

TEST.write_text('''import test from "node:test";\nimport assert from "node:assert/strict";\nimport { readFile } from "node:fs/promises";\nconst read = p => readFile(new URL(`../${p}`, import.meta.url), "utf8");\ntest("RISU Verify public frontier is scoped and review-safe", async () => {\n  const joined = `${await read("public/work/projection-assurance/index.html")}\\n${await read("public/tools/index.html")}\\n${await read("public/work/index.html")}`;\n  for (const phrase of ["Research frontier — September 2026","one independently grounded forbidden effect can establish regression","Clean runs do not count as preservation","General native-software preservation remains out of scope"]) assert.ok(joined.includes(phrase), phrase);\n  for (const identifying of ["IEEE PerCom","DVCon","IAPP Global Summit","NeurIPS","k1-binding-b1","k1-closure-c2"]) assert.ok(!joined.includes(identifying), identifying);\n});\n''')
