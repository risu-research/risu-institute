from pathlib import Path
import re, hashlib, csv, json, shutil, textwrap

ROOT=Path(__file__).resolve().parent
SRC=ROOT/'source'
OUT=ROOT/'artifact'
if OUT.exists(): shutil.rmtree(OUT)
(OUT/'cells').mkdir(parents=True)
(OUT/'provenance').mkdir()
(OUT/'results').mkdir()

base_bc=(SRC/'base-BackendContract.dfy').read_text()
head_bc=(SRC/'head-BackendContract.dfy').read_text()
base_mb=(SRC/'base-MemoryBackend.dfy').read_text()
head_mb=(SRC/'head-MemoryBackend.dfy').read_text()

def class_span(text, class_name):
    marker=f'class {class_name} extends Backend {{'
    s=text.index(marker)
    open_i=text.index('{', s)
    depth=0
    for i in range(open_i, len(text)):
        if text[i]=='{': depth+=1
        elif text[i]=='}':
            depth-=1
            if depth==0: return s, i+1
    raise ValueError(class_name)

def copy_span_in_class(text, class_name):
    cs,ce=class_span(text,class_name)
    sub=text[cs:ce]
    ms=sub.index('  method Copy(src: Path, dst: Path, overwrite: bool)')
    abs_ms=cs+ms
    m=re.search(r'^  \{\s*$', text[abs_ms:ce], flags=re.M)
    if not m: raise ValueError('body open')
    body_open=abs_ms+m.start()
    brace_i=text.index('{', body_open)
    depth=0
    for i in range(brace_i, ce):
        if text[i]=='{': depth+=1
        elif text[i]=='}':
            depth-=1
            if depth==0: return abs_ms, body_open, i+1
    raise ValueError('method end')

def hybrid_copy(class_name, contract_new, body_new):
    bms,bopen,bend=copy_span_in_class(base_mb,class_name)
    hms,hopen,hend=copy_span_in_class(head_mb,class_name)
    contract=head_mb[hms:hopen] if contract_new else base_mb[bms:bopen]
    body=head_mb[hopen:hend] if body_new else base_mb[bopen:bend]
    return contract+body

def replace_copy(text, class_name, replacement):
    ms,bo,en=copy_span_in_class(text,class_name)
    return text[:ms]+replacement+text[en:]

def build_memory(i_mem,i_min,c_mem,c_min):
    t=base_mb
    for cls,cn,bn in [('MemoryBackendMinimal',c_min,i_min),('MemoryBackend',c_mem,i_mem)]:
        t=replace_copy(t,cls,hybrid_copy(cls,cn,bn))
    return t

client_template='''include "MemoryBackend.dfy"\n\nmethod {name}(b: {typ}, src: Path, dst: Path, overwrite: bool)\n  requires IsFile(b.fs, src)\n  requires !IsDir(b.fs, dst)\n  requires !IsFile(b.fs, dst) || overwrite || src == dst\n  modifies b\n{{\n  assert src in b.fs && b.fs[src].FileEntry?;\n  var beforeMetadata := b.fs[src].info.metadata;\n  var r := b.Copy(src, dst, overwrite);\n  assert r.Ok?;\n  assert IsFile(b.fs, dst);\n  assert b.fs[dst].info.metadata == beforeMetadata;\n}}\n'''

rows=[]
for i_mem in (0,1):
  for i_min in (0,1):
    for c_pub in (0,1):
      for c_mem in (0,1):
        for c_min in (0,1):
          cell=f'I{i_mem}{i_min}_C{c_pub}{c_mem}{c_min}'
          d=OUT/'cells'/cell; d.mkdir()
          bc=head_bc if c_pub else base_bc
          mb=build_memory(i_mem,i_min,c_mem,c_min)
          (d/'BackendContract.dfy').write_text(bc)
          (d/'MemoryBackend.dfy').write_text(mb)
          (d/'client_public.dfy').write_text(client_template.format(name='PublicBackendCaller',typ='Backend'))
          (d/'client_memory.dfy').write_text(client_template.format(name='ConcreteMemoryCaller',typ='MemoryBackend'))
          (d/'client_minimal.dfy').write_text(client_template.format(name='ConcreteMinimalCaller',typ='MemoryBackendMinimal'))
          expected_full=(not c_mem or i_mem) and (not c_min or i_min) and (not c_pub or c_mem) and (not c_pub or c_min)
          rows.append({'cell':cell,'impl_memory':i_mem,'impl_minimal':i_min,'contract_public':c_pub,'contract_memory':c_mem,'contract_minimal':c_min,'mechanism_model_full_verify':int(expected_full),'mechanism_model_public_caller':int(expected_full and c_pub),'mechanism_model_memory_caller':int(expected_full and c_mem),'mechanism_model_minimal_caller':int(expected_full and c_min),'backend_sha256':hashlib.sha256(bc.encode()).hexdigest(),'memory_sha256':hashlib.sha256(mb.encode()).hexdigest()})

def sha(s): return hashlib.sha256(s.encode()).hexdigest()
cell00=OUT/'cells'/'I00_C000'; cell11=OUT/'cells'/'I11_C111'
assert sha((cell00/'BackendContract.dfy').read_text())==sha(base_bc)
assert sha((cell00/'MemoryBackend.dfy').read_text())==sha(base_mb)
assert sha((cell11/'BackendContract.dfy').read_text())==sha(head_bc)
assert sha((cell11/'MemoryBackend.dfy').read_text())==sha(head_mb)

for r in rows:
    d=OUT/'cells'/r['cell']; bc=(d/'BackendContract.dfy').read_text(); mb=(d/'MemoryBackend.dfy').read_text()
    pub='fs[dst].info.metadata == old(fs)[src].info.metadata' in bc[bc.index('method Copy'):bc.index('// ====================================================================\n  // Capability gate',bc.index('method Copy'))]
    spans={}
    for cls in ['MemoryBackend','MemoryBackendMinimal']:
        ms,bo,en=copy_span_in_class(mb,cls); contract=mb[ms:bo]; body=mb[bo:en]
        spans[cls]=('fs[dst].info.metadata == old(fs)[src].info.metadata' in contract,'srcEntry.info.metadata' in body and 'var newInfo := FileInfo' in body)
    assert pub==bool(r['contract_public'])
    assert spans['MemoryBackend']==(bool(r['contract_memory']),bool(r['impl_memory']))
    assert spans['MemoryBackendMinimal']==(bool(r['contract_minimal']),bool(r['impl_minimal']))

with (OUT/'results'/'matrix_design.csv').open('w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)

(OUT/'PROTOCOL.md').write_text('# Case B 32-cell CI replay\n\nGenerated from byte-preserved historical base/head source pairs. Five binary dimensions: two Copy bodies and three contract locations. Intermediate cells are research reconstructions, not upstream commits.\n')
(OUT/'provenance'/'toolchain.json').write_text(json.dumps({'required_dafny':'4.11.0','official_linux_url':'https://github.com/dafny-lang/dafny/releases/download/v4.11.0/dafny-4.11.0-x64-ubuntu-22.04.zip','official_distribution_sha256':'a46a9ff7cdd720f7955854c78e95df13f4cfe6b80691b05f8654fe19e8267179','dafny_executable_sha256':'e540b4826363afb87c326446239a682d45086905425fa6299c103eca9693846d'},indent=2)+'\n')
for n in ['base-BackendContract.dfy','head-BackendContract.dfy','base-MemoryBackend.dfy','head-MemoryBackend.dfy','refs.txt','SHA256SUMS.txt']:
    p=SRC/n
    if p.exists(): shutil.copy2(p, OUT/'provenance'/n)
manifest=[]
for p in sorted(OUT.rglob('*')):
    if p.is_file() and p.name!='MANIFEST.sha256': manifest.append(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+str(p.relative_to(OUT)))
(OUT/'MANIFEST.sha256').write_text('\n'.join(manifest)+'\n')
print(OUT)
print('cells',len(rows),'model_pass',sum(r['mechanism_model_full_verify'] for r in rows))
