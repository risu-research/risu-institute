from pathlib import Path
p=Path('live_readonly_github.mjs')
s=p.read_text()
a="@modelcontextprotocol/sdk/client/inMemory.js"
b="@modelcontextprotocol/sdk/inMemory.js"
assert s.count(a)==1
p.write_text(s.replace(a,b))
print('SDK_IMPORT_PATH_CORRECTED')
