#!/usr/bin/env python3
import csv, difflib, hashlib, json, re, shutil, subprocess, traceback
from pathlib import Path

OUT=Path('out/U030-v5'); OUT.mkdir(parents=True,exist_ok=True)
TMP=Path('/tmp/fse126-u030-repo-v5')
REPO='Consensys-Incorporated/evm-dafny'
HEAD='78bfdfb28c7aba090c6007208966760c57750dfd'
PARENT='95d4569bf59b2c2fd63602cb2bc63a74a9dfb548'
PATH='src/dafny/bytecode.dfy'
SUBMODULE_NAME='DafnyCrypto'
SUBMODULE_PATH='libs/DafnyCrypto'
SUBMODULE_HTTPS='https://github.com/Consensys/DafnyCrypto.git'
FLAGS=['verify','--resource-limit','1000000','--verify-included-files','--function-syntax','4','--quantifier-syntax','4','src/dafny/evm.dfy']


def sh(cmd,cwd=None,check=True):
    p=subprocess.run(cmd,cwd=cwd,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    if check and p.returncode:
        raise RuntimeError(f"rc={p.returncode}: {' '.join(cmd)}\nSTDOUT:\n{p.stdout}\nSTDERR:\n{p.stderr}")
    return p


def sha_text(s): return hashlib.sha256(s.encode()).hexdigest()
def git_show(rev,path): return sh(['git','show',f'{rev}:{path}'],cwd=TMP).stdout

def gitlink_sha(rev,path):
    line=sh(['git','ls-tree',rev,path],cwd=TMP).stdout.strip()
    m=re.match(r'^160000 commit ([0-9a-f]{40})\t',line)
    if not m: raise RuntimeError(f'expected gitlink for {path} at {rev}, got: {line!r}')
    return m.group(1)


def historical_submodule_url():
    p=sh(['git','config','-f','.gitmodules','--get',f'submodule.{SUBMODULE_NAME}.url'],cwd=TMP)
    u=p.stdout.strip()
    if not u: raise RuntimeError('historical submodule URL is empty')
    return u


def checkout_with_required_submodule(rev):
    sh(['git','checkout','--quiet','--detach',rev],cwd=TMP)
    expected=gitlink_sha(rev,SUBMODULE_PATH)
    original_url=historical_submodule_url()

    # Remove any state from the previous historical revision before re-initialization.
    sh(['git','submodule','deinit','-f','--',SUBMODULE_PATH],cwd=TMP,check=False)
    sub=TMP/SUBMODULE_PATH
    if sub.exists(): shutil.rmtree(sub)
    modules=TMP/'.git'/'modules'/SUBMODULE_PATH
    if modules.exists(): shutil.rmtree(modules)

    # Sync historical metadata, then override transport only. The gitlink, not the URL,
    # remains the authoritative content identity and is asserted after checkout.
    sh(['git','submodule','sync','--',SUBMODULE_PATH],cwd=TMP)
    sh(['git','config',f'submodule.{SUBMODULE_NAME}.url',SUBMODULE_HTTPS],cwd=TMP)
    effective_url=sh(['git','config','--get',f'submodule.{SUBMODULE_NAME}.url'],cwd=TMP).stdout.strip()
    if effective_url != SUBMODULE_HTTPS:
        raise RuntimeError(f'effective URL mismatch: {effective_url!r}')

    sh(['git','submodule','update','--init','--checkout','--',SUBMODULE_PATH],cwd=TMP)
    actual=sh(['git','-C',SUBMODULE_PATH,'rev-parse','HEAD'],cwd=TMP).stdout.strip()
    if actual != expected:
        raise RuntimeError(f'submodule revision mismatch at {rev}: expected {expected}, got {actual}')
    return {
        'revision':rev,
        'historical_url':original_url,
        'effective_transport_url':effective_url,
        'expected_gitlink':expected,
        'checked_out_gitlink':actual,
    }


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
        token=f'@@FSE126_{n}@@\n'
        if out.count(token)!=1: raise RuntimeError(f'{n}: placeholder count != 1')
        out=out.replace(token,s['spec']+b['body'])
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
    return {'stage':tag,'status':status,'returncode':p.returncode,'verified':v,'errors':e,'log_sha256':sha_text(text)}


def write_csv(path,rows,fields):
    with Path(path).open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=fields); w.writeheader()
        for r in rows: w.writerow({k:r.get(k) for k in fields})


def write_manifest(obj):
    (OUT/'manifest.json').write_text(json.dumps(obj,indent=2,sort_keys=True))


def finalize_hash_manifest():
    rows=[]
    for p in sorted(OUT.rglob('*')):
        if p.is_file() and p.name!='MANIFEST_SHA256.csv':
            rows.append({'path':str(p.relative_to(OUT)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size})
    write_csv(OUT/'MANIFEST_SHA256.csv',rows,['path','sha256','bytes'])


def main():
    if TMP.exists(): shutil.rmtree(TMP)
    sh(['git','clone','--filter=blob:none','--no-checkout','--quiet',f'https://github.com/{REPO}.git',str(TMP)])
    actual_parent=sh(['git','rev-parse',f'{HEAD}^'],cwd=TMP).stdout.strip()
    if actual_parent!=PARENT: raise RuntimeError(f'parent mismatch: expected {PARENT}, got {actual_parent}')

    old=git_show(PARENT,PATH); new=git_show(HEAD,PATH)
    oldctx,newctx=mask(old),mask(new)
    source_meta={
        'repo':REPO,'head':HEAD,'parent':PARENT,'path':PATH,
        'old_source_sha256':sha_text(old),'new_source_sha256':sha_text(new),
        'old_masked_context_sha256':sha_text(oldctx),'new_masked_context_sha256':sha_text(newctx),
    }
    (OUT/'source_identity.json').write_text(json.dumps(source_meta,indent=2,sort_keys=True))
    if oldctx!=newctx:
        diff=''.join(difflib.unified_diff(oldctx.splitlines(True),newctx.splitlines(True),fromfile='old-context',tofile='new-context'))
        (OUT/'outside_target_diff.txt').write_text(diff)
        (OUT/'DISPOSITION.txt').write_text('R3: bytecode.dfy differs outside frozen Create/Create2 fragments.\n')
        write_manifest({'status':'R3',**source_meta,'outside_target_diff_sha256':sha_text(diff)})
        finalize_hash_manifest(); return

    submods=[]
    submods.append(checkout_with_required_submodule(PARENT))
    old_ep=verify('exact_parent_endpoint')
    submods.append(checkout_with_required_submodule(HEAD))
    new_ep=verify('exact_head_endpoint')
    eps=[old_ep,new_ep]
    write_csv(OUT/'endpoint_results.csv',eps,['stage','status','returncode','verified','errors','log_sha256'])
    (OUT/'submodule_identity.json').write_text(json.dumps(submods,indent=2,sort_keys=True))

    dafny_version=sh(['dafny','--version'],check=False).stdout.strip()
    base_manifest={**source_meta,'dafny':dafny_version,'flags':FLAGS,'submodule_name':SUBMODULE_NAME,'submodule_path':SUBMODULE_PATH,'submodule_revisions':submods,'exact_endpoints':eps}
    if any(x['status']=='INFRA' for x in eps):
        (OUT/'DISPOSITION.txt').write_text('INFRA: exact endpoint setup/tool execution did not reach a classified verifier outcome.\n')
        write_manifest({'status':'INFRA',**base_manifest}); finalize_hash_manifest(); return
    if any(x['status']=='FAIL' for x in eps):
        (OUT/'DISPOSITION.txt').write_text('R2: one or both exact historical endpoints fail verification under the frozen environment.\n')
        write_manifest({'status':'R2',**base_manifest}); finalize_hash_manifest(); return

    cells={
        'B0S0':assemble(oldctx,old,old),
        'B1S0':assemble(oldctx,old,new),
        'B0S1':assemble(oldctx,new,old),
        'B1S1':assemble(oldctx,new,new),
    }
    if cells['B0S0']!=old: raise RuntimeError('B0S0 endpoint source identity assertion failed')
    if cells['B1S1']!=new: raise RuntimeError('B1S1 endpoint source identity assertion failed')
    cdir=OUT/'cells'; cdir.mkdir(exist_ok=True)

    # Because masked old/new context is asserted byte-identical, one fixed head context is valid.
    # Every cell uses the exact head historical dependency gitlink; only frozen bytecode fragments vary.
    cell_submodule=checkout_with_required_submodule(HEAD)
    rows=[]
    for cid in ('B0S0','B1S0','B0S1','B1S1'):
        src=cells[cid]
        (TMP/PATH).write_text(src)
        (cdir/f'{cid}_bytecode.dfy').write_text(src)
        r=verify(cid); r['cell']=cid; r['source_sha256']=sha_text(src); rows.append(r)
    write_csv(OUT/'results.csv',rows,['cell','status','returncode','verified','errors','source_sha256','log_sha256'])

    if any(r['status']=='INFRA' for r in rows):
        disposition='INFRA'
        profile='/'.join('I' if r['status']=='INFRA' else ('P' if r['status']=='PASS' else 'F') for r in rows)
    else:
        disposition='R4'
        profile='/'.join('P' if r['status']=='PASS' else 'F' for r in rows)
    (OUT/'DISPOSITION.txt').write_text(f'{disposition}: {profile}\n')
    write_manifest({'status':disposition,'profile':profile,**base_manifest,'cell_environment_submodule':cell_submodule,'cells':rows})
    finalize_hash_manifest()

try:
    main()
except Exception:
    (OUT/'INFRA_FAILURE.txt').write_text(traceback.format_exc())
    finalize_hash_manifest()
    raise
