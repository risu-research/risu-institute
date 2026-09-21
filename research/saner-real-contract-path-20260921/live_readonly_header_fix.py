from pathlib import Path
p=Path('live_readonly_github.mjs')
s=p.read_text()
a="run_id:runId,'X-GitHub-Api-Version':'2026-03-10'"
assert s.count(a)==1,s.count(a)
s=s.replace(a,'run_id:runId')
p.write_text(s)
print('NO_DUPLICATE_Ivo_GITHUB_VERSION_HEADER')
