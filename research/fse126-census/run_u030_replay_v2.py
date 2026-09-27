#!/usr/bin/env python3
import csv, difflib, hashlib, json, re, shutil, subprocess
from pathlib import Path

OUT=Path('out/U030-v2'); OUT.mkdir(parents=True,exist_ok=True)
TMP=Path('/tmp/fse126-u030-repo')
REPO='Consensys-Incorporated/evm-dafny'
HEAD='78bfdfb28c7aba090c6007208966760c57750dfd'
PARENT='95d4569bf59b2c2fd63602cb2bc63a74a9dfb548'
BAD_PARENT_IN_FREEZE='95d45699972fd97cfd06791505dc2d8f20c17dd5'
PATH='src/dafny/bytecode.dfy'
FLAGS=['verify','--resource-limit','1000000','--verify-included-files','--function-syntax','4','--quantifier-syntax','4','src/dafny/evm.dfy']

def sh(cmd,cwd=None,check=True):
    p=subprocess.run(cmd,cwd=cwd,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    if check and p.returncode:
        raise RuntimeError(f"rc={p.returncode}: {' '.join(cmd)}\n{p.stdout}\n{p.stderr}")
    return p

def sha(s): return hashlib.sha256(s.encode()).hexdigest()
def git_show(rev,path): return sh(['git','show',f'{rev}:{path}'],cwd=TMP).stdout

def block(src,name):
    m=re.search(rf"(?m)^\s*function\s+{re.escape(name)}\(st:\s*ExecutingState\):\s*\(st':\s*State\)\s*$",src)
    if not m: raise ValueError(f'{name}: signature not found')
    op=re.search(r'(?m)^\s*\{\s*$',src[m.end():])
    if not op: raise ValueError(f'{name}: body opener not found')
    brace=m.end()+op.start()
    depth=0; end=None
    for i,ch in enumerate(src[brace:],brace):
        if ch=='{': depth+=1
        elif ch=='}':
            depth-=1
            if depth==0:
                end=i+1
                if end<len(src) and src[end]=='\n': end+=1
                break
    if end is None: raise ValueError(f'{name}: closing brace not found')
    return {'start':m.start(),'brace':brace,'end':end,'spec':src[m.start():brace],'body':src[brace:end]}

def mask(src):
    bs=[(n,block(src,n)) for n in ('Create','Create2')]
    out=src
    for n,b in sorted(bs,key=lambda t:t[1]['start'],reverse=True):
        out=out[:b['start']]+f'@@FSE126_{n}@@\n'+out[b['end']:]
    return out

def assemble(context,spec_src,body_src):
    out=context
    for n in ('Create','Create2'):
        s=block(spec_src,n); b=block(body_src,n)
        out=out.replace(f'@@FSE126_{n}@@\n',s['spec']+b['body'])
    return out

def verify(tag):
    p=sh(['dafny']+FLAGS,cwd=TMP,check=False)
    text=p.stdout+'\n--- STDERR ---\n'+p.stderr
    (OUT/f'{tag}.log').write_text(text)
    ms=re.findall(r'(\d+) verified, (\d+) errors?',text)
    v=e=None
    if ms: v,e=map(int,ms[-1])
    status='PASS' if p.returncode==0 and e==0 else ('FAIL' if e is not None and e>0 else 'INFRA')
    return {'stage':tag,'status':status,'returncode':p.returncode,'verified':v,'errors':e}

def main():
    if TMP.exists(): shutil.rmtree(TMP)
    sh(['git','clone','--filter=blob:none','--quiet',f'https://github.com/{REPO}.git',str(TMP)])
    actual_parent=sh(['git','rev-parse',f'{HEAD}^'],cwd=TMP).stdout.strip()
    if actual_parent != PARENT: raise RuntimeError(f'parent mismatch {actual_parent}')
    old=git_show(PARENT,PATH); new=git_show(HEAD,PATH)
    oldctx=mask(old); newctx=mask(new)
    if oldctx != newctx:
        (OUT/'outside_target_diff.txt').write_text(''.join(difflib.unified_diff(oldctx.splitlines(True),newctx.splitlines(True))))
        (OUT/'DISPOSITION.txt').write_text('R3: bytecode.dfy differs outside frozen Create/Create2 fragments.\n')
        (OUT/'manifest.json').write_text(json.dumps({'status':'R3','repo':REPO,'head':HEAD,'parent':PARENT,'bad_parent_in_initial_freeze':BAD_PARENT_IN_FREEZE},indent=2))
        return
    # Exact historical endpoint verification first.
    sh(['git','checkout','--quiet',PARENT],cwd=TMP)
    old_ep=verify('exact_parent_endpoint')
    sh(['git','checkout','--quiet',HEAD],cwd=TMP)
    new_ep=verify('exact_head_endpoint')
    if old_ep['status']!='PASS' or new_ep['status']!='PASS':
        (OUT/'DISPOSITION.txt').write_text('R2: one or both exact historical endpoints are not green under frozen Dafny 4.4.0 reconstruction.\n')
        (OUT/'endpoint_results.csv').write_text('stage,status,returncode,verified,errors\n'+ '\n'.join(','.join('' if x[k] is None else str(x[k]) for k in ['stage','status','returncode','verified','errors']) for x in [old_ep,new_ep])+'\n')
        (OUT/'manifest.json').write_text(json.dumps({'status':'R2','repo':REPO,'head':HEAD,'parent':PARENT,'bad_parent_in_initial_freeze':BAD_PARENT_IN_FREEZE,'endpoints':[old_ep,new_ep]},indent=2))
        return
    cells={'B0S0':assemble(oldctx,old,old),'B1S0':assemble(oldctx,old,new),'B0S1':assemble(oldctx,new,old),'B1S1':assemble(oldctx,new,new)}
    if cells['B0S0']!=old or cells['B1S1']!=new: raise RuntimeError('endpoint source identity assertion failed')
    cdir=OUT/'cells'; cdir.mkdir(exist_ok=True)
    rows=[]
    # fixed-head Dafny tree, changing bytecode only
    sh(['git','checkout','--quiet',HEAD],cwd=TMP)
    for cid,src in cells.items():
        (TMP/PATH).write_text(src); (cdir/f'{cid}_bytecode.dfy').write_text(src)
        r=verify(cid); r['cell']=cid; r['source_sha256']=sha(src); rows.append(r)
    with (OUT/'results.csv').open('w',newline='') as f:
        fields=['cell','status','returncode','verified','errors','source_sha256']; w=csv.DictWriter(f,fieldnames=fields); w.writeheader(); w.writerows({k:r.get(k) for k in fields} for r in rows)
    profile='/'.join('P' if r['status']=='PASS' else 'F' if r['status']=='FAIL' else 'I' for r in rows)
    disposition='R4' if all(r['status'] in {'PASS','FAIL'} for r in rows) else 'INFRA'
    (OUT/'DISPOSITION.txt').write_text(f'{disposition}: {profile}\n')
    manifest={'status':disposition,'profile':profile,'repo':REPO,'head':HEAD,'parent':PARENT,'bad_parent_in_initial_freeze':BAD_PARENT_IN_FREEZE,'path':PATH,'old_source_sha256':sha(old),'new_source_sha256':sha(new),'masked_context_sha256':sha(oldctx),'dafny':sh(['dafny','--version'],check=False).stdout.strip(),'flags':FLAGS,'exact_endpoints':[old_ep,new_ep],'cells':rows}
    (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2,sort_keys=True))

try:
    main()
except Exception as e:
    import traceback
    (OUT/'INFRA_FAILURE.txt').write_text(traceback.format_exc())
    raise
