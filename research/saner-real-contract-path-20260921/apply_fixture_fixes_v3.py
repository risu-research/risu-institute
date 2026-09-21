from pathlib import Path
p=Path('full_path_matrix.mjs');s=p.read_text()
a="const spec={openapi:'3.0.3',info:{title:'SOURCE-DERIVED subset; NOT the complete original vendor spec',version:'pinned'},servers:[{url:base}],paths:{}};"
b="const spec={openapi:'3.0.3',info:{title:'SOURCE-DERIVED subset; NOT the complete original vendor spec',version:'pinned'},servers:[{url:base}],components:{securitySchemes:{bearerAuth:{type:'http',scheme:'bearer'}}},security:[{bearerAuth:[]}],paths:{}};"
assert s.count(a)==1,s.count(a)
s=s.replace(a,b)
p.write_text(s)
print('PINNED_PROVIDER_SECURITY_SCHEME_PRESENT')
