#!/usr/bin/env python3
"""Fixed-head bridge-state replay for evm-dafny PR #171.

Adds one historically observed intermediate implementation (commit 6edc437f...) to
the existing endpoint-fragment design.  B0 pairs that bridge body with the old
State.Expand contract; B1 pairs it with the final new contract, both inside the
exact historical head tree.  This tests whether a real intermediate can provide
a verification-preserving bridge that the endpoint-only 2x2 lattice cannot show.
"""
from pathlib import Path
import hashlib, json, re, shutil, subprocess, sys
repo=Path(sys.argv[1]); dafny=Path(sys.argv[2]).resolve(); out=Path(sys.argv[3]); out.mkdir(parents=True,exist_ok=True)
BASE='0d1fae88f5f6191fe249baecf404e5b846f7e116'; HEAD='3e5ed81a48339acd79fb4e620219d81a099078ef'; BRIDGE='6edc437fe0051f9e30b06c7277dd9a9be778fee1'; REL='src/dafny/state.dfy'
def git(*args): return subprocess.check_output(['git','-C',str(repo),*args],text=True)
def text(ref): return git('show',f'{ref}:{REL}')
def split_method(t):
    m=re.search(r'function method Expand\(address:\s*nat,\s*len:\s*nat\)',t)
    if not m: raise RuntimeError('Expand not found')
    s=m.start(); op=t.find('{',m.end());
    if op<0: raise RuntimeError('body opener not found')
    dep=0
    for i in range(op,len(t)):
        if t[i]=='{': dep+=1
        elif t[i]=='}':
            dep-=1
            if dep==0: return s,op,i+1,t[s:op],t[op:i+1]
    raise RuntimeError('method end not found')
def norm(s): return re.sub(r'\s+',' ',s).strip()
def sha(s): return hashlib.sha256(s.encode()).hexdigest()
base=text(BASE); head=text(HEAD); bridge=text(BRIDGE)
bs,bo,be,bcon,bbody=split_method(base); hs,ho,he,hcon,hbody=split_method(head); xs,xo,xe,xcon,xbody=split_method(bridge)
# Bridge commit is expected to retain old contract while changing the body.
assert norm(xcon)==norm(bcon)
assert norm(xbody)!=norm(bbody) and norm(xbody)!=norm(hbody)
rows=[]
summary_re=re.compile(r'Dafny program verifier finished with\s+(\d+)\s+verified,\s+(\d+)\s+error')
for cell,contract in [('B0',bcon),('B1',hcon)]:
    work=out/f'work_{cell}'
    if work.exists(): shutil.rmtree(work)
    subprocess.check_call(['git','clone','-q','--no-checkout',str(repo),str(work)])
    subprocess.check_call(['git','-C',str(work),'checkout','-q','--detach',HEAD])
    hp=work/REL; ht=hp.read_text(); s,o,e,_,_=split_method(ht)
    method=contract+xbody
    hp.write_text(ht[:s]+method+ht[e:])
    constructed=hp.read_text()
    (out/f'{cell}_State.dfy').write_text(constructed)
    p=subprocess.run([str(dafny),'/compile:0',REL],cwd=work,text=True,capture_output=True,timeout=300)
    log=p.stdout+p.stderr; (out/f'{cell}.log').write_text(log); m=summary_re.search(log)
    rows.append({'cell':cell,'contract':'OLD' if cell=='B0' else 'NEW','implementation':'NATURAL_BRIDGE','returncode':p.returncode,'verified':int(m.group(1)) if m else None,'errors':int(m.group(2)) if m else None,'pass':bool(p.returncode==0 and m and int(m.group(2))==0),'state_sha256':sha(constructed),'method_sha256':sha(method)})
summary={'base':BASE,'head':HEAD,'bridge':BRIDGE,'bridge_subject':git('show','-s','--format=%s',BRIDGE).strip(),'bridge_contract_matches_old':True,'bridge_body_sha256':sha(xbody),'old_body_sha256':sha(bbody),'new_body_sha256':sha(hbody),'cells':rows}
(out/'bridge_cells_summary.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary,indent=2))
