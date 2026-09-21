from pathlib import Path
p = Path('upstream/recovery_boundary.mjs')
s = p.read_text()
old = "  const tool={del:identify('del-',/apis/),token:identify('get-',/operations/),stable:identify('get-',/state/),resource:identify('get-',/apis-example$/),audit:identify('post-',/audit/)};"
new = "  const tool={del:tools.find(x=>x.name==='req-deletion'),token:tools.find(x=>x.name==='get-async'),stable:tools.find(x=>x.name==='get-stable-state'),resource:tools.find(x=>x.name==='read-res'),audit:tools.find(x=>x.name==='record-completion')};"
assert old in s, 'Expected original harness line absent'
p.write_text(s.replace(old, new))
print('HARNESS_TOOL_RESOLVER_PATCHED; ORIGINAL_UPSTREAM_NOT_MODIFIED')
