#!/usr/bin/env python3
import csv, difflib, hashlib, json, re, shutil, subprocess, traceback
from pathlib import Path

OUT=Path('out/U030-v3'); OUT.mkdir(parents=True,exist_ok=True)
TMP=Path('/tmp/fse126-u030-repo-v3')
REPO='Consensys-Incorporated/evm-dafny'
HEAD='78bfdfb28c7aba090c6007208966760c57750dfd'
PARENT='95d4569bf59b2c2fd63602cb2bc63a74a9dfb548'
PATH='src/dafny/bytecode.dfy'
FLAGS=['verify','--resource-limit','1000000','--verify-included-files','--function-syntax','4','--quantifier-syntax','4','src/dafny/evm.dfy']

def sh(cmd,cwd=None,check=True):
    p=subprocess.run(cmd,cwd=cwd,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    if check and p.returncode:
        raise RuntimeError(f"rc={p.returncode}: {' '.join(cmd)}\nSTDOUT:\n{p.stdout}\nSTDERR:\n{p.stderr}")
    return p

def sha(s): return hashlib.sha256(s.encode()).hexdigest()
def git_show(rev,path): return sh(['git','show',f'{rev}:{path}'],cwd=TMP).stdout

def checkout_with_submodules(rev):
    sh(['git','checkout','--quiet',rev],cwd=TMP)
    sh(['git','submodule','sync','--recursive'],cwd=TMP)
    sh(['git','submodule','update','--init','--recursive'],cwd=TMP)

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
    out=src
    bs=[(n,block(src,n)) for n in ('Create','Create2')]
    for n,b in sorted(bs,key=lambda x:x[1]['start'],reverse=True):
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
    if p.returncode==0 and e==0: status='PASS'
    elif e is not None and e>0: status='FAIL'
    else: status='INFRA'
    return {'stage':tag,'status':status,'returncode':p.returncode,'verified':v,'errors':e}

def write_csv(path, rows, fields):
    with Path(path).open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=fields); w.writeheader(); w.writerows({k:r.get(k) for k in fields} for r in rows)

def main():
    if TMP.exists(): shutil.rmtree(TMP)
    sh(['git','clone','--filter=blob:none','--quiet',f'https://github.com/{REPO}.git',str(TMP)])
    actual_parent=sh(['git','rev-parse',f'{HEAD}^'],cwd=TMP).stdout.strip()
    if actual_parent!=PARENT: raise RuntimeError(f'parent mismatch: {actual_parent}')
    old=git_show(PARENT,PATH); new=git_show(HEAD,PATH)
    oldctx,newctx=mask(old),mask(new)
    if oldctx!=newctx:
        (OUT/'outside_target_diff.txt').write_text(''.join(difflib.unified_diff(oldctx.splitlines(True),newctx.splitlines(True),fromfile='old-context',tofile='new-context')))
        (OUT/'DISPOSITION.txt').write_text('R3: bytecode.dfy differs outside frozen Create/Create2 fragments.\n')
        (OUT/'manifest.json').write_text(json.dumps({'status':'R3','repo':REPO,'head':HEAD,'parent':PARENT},indent=2))
        return

    checkout_with_submodules(PARENT)
    old_ep=verify('exact_parent_endpoint')
    checkout_with_submodules(HEAD)
    new_ep=verify('exact_head_endpoint')
    eps=[old_ep,new_ep]
    write_csv(OUT/'endpoint_results.csv',eps,['stage','status','returncode','verified','errors'])
    if any(x['status']=='INFRA' for x in eps):
        (OUT/'DISPOSITION.txt').write_text('INFRA: exact endpoint setup/tool execution did not reach a classified verifier outcome.\n')
        (OUT/'manifest.json').write_text(json.dumps({'status':'INFRA','repo':REPO,'head':HEAD,'parent':PARENT,'endpoints':eps},indent=2))
        return
    if any(x['status']=='FAIL' for x in eps):
        (OUT/'DISPOSITION.txt').write_text('R2: one or both exact historical endpoints fail verification under the frozen historical environment.\n')
        (OUT/'manifest.json').write_text(json.dumps({'status':'R2','repo':REPO,'head':HEAD,'parent':PARENT,'endpoints':eps},indent=2))
        return

    cells={'B0S0':assemble(oldctx,old,old),'B1S0':assemble(oldctx,old,new),'B0S1':assemble(oldctx,new,old),'B1S1':assemble(oldctx,new,new)}
    if cells['B0S0']!=old or cells['B1S1']!=new: raise RuntimeError('endpoint source identity assertion failed')
    cdir=OUT/'cells'; cdir.mkdir(exist_ok=True)
    checkout_with_submodules(HEAD)
    rows=[]
    for cid,src in cells.items():
        (TMP/PATH).write_text(src); (cdir/f'{cid}_bytecode.dfy').write_text(src)
        r=verify(cid); r['cell']=cid; r['source_sha256']=sha(src); rows.append(r)
    write_csv(OUT/'results.csv',rows,['cell','status','returncode','verified','errors','source_sha256'])
    if any(r['status']=='INFRA' for r in rows):
        disposition='INFRA'; profile='/'.join('I' if r['status']=='INFRA' else ('P' if r['status']=='PASS' else 'F') for r in rows)
    else:
        disposition='R4'; profile='/'.join('P' if r['status']=='PASS' else 'F' for r in rows)
    (OUT/'DISPOSITION.txt').write_text(f'{disposition}: {profile}\n')
    manifest={'status':disposition,'profile':profile,'repo':REPO,'head':HEAD,'parent':PARENT,'path':PATH,'old_source_sha256':sha(old),'new_source_sha256':sha(new),'masked_context_sha256':sha(oldctx),'dafny':sh(['dafny','--version'],check=False).stdout.strip(),'flags':FLAGS,'exact_endpoints':eps,'cells':rows}
    (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2,sort_keys=True))

try:
    main()
except Exception:
    (OUT/'INFRA_FAILURE.txt').write_text(traceback.format_exc())
    raise
