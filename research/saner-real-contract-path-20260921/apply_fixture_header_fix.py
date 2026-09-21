from pathlib import Path
p=Path('full_path_matrix.mjs')
s=p.read_text()
a="parameters:['owner','repo','workflow_id'].map(x=>param(x)),requestBody:"
b="parameters:['owner','repo','workflow_id'].map(x=>param(x)).concat(param('X-GitHub-Api-Version','header')),requestBody:"
assert s.count(a)==1,s.count(a)
s=s.replace(a,b)
a="parameters:['owner','repo','run_id'].map(x=>param(x)),responses:"
b="parameters:['owner','repo','run_id'].map(x=>param(x)).concat(param('X-GitHub-Api-Version','header')),responses:"
assert s.count(a)==1,s.count(a)
s=s.replace(a,b)
p.write_text(s)
print('SOURCE_VERSION_HEADER_FIX_PASS')
