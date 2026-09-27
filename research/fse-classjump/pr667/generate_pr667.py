#!/usr/bin/env python3
from pathlib import Path
import re,hashlib,csv,shutil,json
P=Path(__file__).resolve().parent
SRC=P/'source'; OUT=P/'artifact'
if OUT.exists(): shutil.rmtree(OUT)
(OUT/'cells').mkdir(parents=True); (OUT/'results').mkdir(); (OUT/'provenance').mkdir()
base_bc=(SRC/'base-BackendContract.dfy').read_text(); head_bc=(SRC/'head-BackendContract.dfy').read_text()
base_mb=(SRC/'base-MemoryBackend.dfy').read_text(); head_mb=(SRC/'head-MemoryBackend.dfy').read_text()

def class_span(text, name):
    marker=f'class {name} extends Backend {{'; s=text.index(marker); op=text.index('{',s); dep=0
    for i in range(op,len(text)):
        if text[i]=='{': dep+=1
        elif text[i]=='}':
            dep-=1
            if dep==0:return s,i+1
    raise ValueError(name)

def move_span(text,name):
    cs,ce=class_span(text,name); sub=text[cs:ce]
    marker='  method Move(src: Path, dst: Path, overwrite: bool)'
    ms=cs+sub.index(marker)
    m=re.search(r'^  \{\s*$',text[ms:ce],re.M)
    if not m: raise ValueError('body open')
    bo=ms+m.start(); op=text.index('{',bo); dep=0
    for i in range(op,ce):
        if text[i]=='{':dep+=1
        elif text[i]=='}':
            dep-=1
            if dep==0:return ms,bo,i+1
    raise ValueError('end')

def hybrid(cls, contract_new, body_new):
    bms,bbo,ben=move_span(base_mb,cls); hms,hbo,hen=move_span(head_mb,cls)
    return (head_mb[hms:hbo] if contract_new else base_mb[bms:bbo]) + (head_mb[hbo:hen] if body_new else base_mb[bbo:ben])

def replace(text,cls,repl):
    ms,bo,en=move_span(text,cls); return text[:ms]+repl+text[en:]

def build_mb(i_new,c_new):
    t=base_mb
    for cls in ['MemoryBackendMinimal','MemoryBackend']:
        t=replace(t,cls,hybrid(cls,c_new,i_new))
    return t

def sha(t): return hashlib.sha256(t.encode()).hexdigest()
rows=[]
for i in (0,1):
  for c in (0,1):
    cell=f'I{i}_C{c}'; d=OUT/'cells'/cell; d.mkdir()
    bc=head_bc if c else base_bc; mb=build_mb(i,c)
    (d/'BackendContract.dfy').write_text(bc); (d/'MemoryBackend.dfy').write_text(mb)
    rows.append({'cell':cell,'implementation_new':i,'contract_new':c,'backend_sha256':sha(bc),'memory_sha256':sha(mb)})
assert (OUT/'cells'/'I0_C0'/'BackendContract.dfy').read_text()==base_bc
assert (OUT/'cells'/'I0_C0'/'MemoryBackend.dfy').read_text()==base_mb
assert (OUT/'cells'/'I1_C1'/'BackendContract.dfy').read_text()==head_bc
assert (OUT/'cells'/'I1_C1'/'MemoryBackend.dfy').read_text()==head_mb
needle='fs[dst].info.metadata == old(fs)[src].info.metadata'
for r in rows:
    bc=(OUT/'cells'/r['cell']/'BackendContract.dfy').read_text(); mb=(OUT/'cells'/r['cell']/'MemoryBackend.dfy').read_text()
    public=needle in bc[bc.index('method Move'):bc.index('// ====================================================================\n  // copy',bc.index('method Move'))]
    assert public==bool(r['contract_new'])
    for cls in ['MemoryBackend','MemoryBackendMinimal']:
        ms,bo,en=move_span(mb,cls); con=mb[ms:bo]; body=mb[bo:en]
        assert (needle in con)==bool(r['contract_new'])
        isnew=('srcEntry.info.metadata' in body and 'var newInfo := FileInfo' in body)
        assert isnew==bool(r['implementation_new'])
with (OUT/'results'/'design.csv').open('w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
for name in ['base-BackendContract.dfy','head-BackendContract.dfy','base-MemoryBackend.dfy','head-MemoryBackend.dfy','refs.txt','SHA256SUMS.txt']:
    shutil.copy2(SRC/name,OUT/'provenance'/name)
shutil.copy2(P/'PREDICTION_FREEZE.json',OUT/'provenance'/'PREDICTION_FREEZE.json')
print(json.dumps(rows,indent=2))
