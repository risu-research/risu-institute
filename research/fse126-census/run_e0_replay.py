#!/usr/bin/env python3
import argparse, csv, difflib, hashlib, json, os, re, shutil, subprocess, sys
from pathlib import Path

ROOT = Path.cwd()
OUT = ROOT / "out"
OUT.mkdir(exist_ok=True)

def run(cmd, cwd=None, check=True):
    p = subprocess.run(cmd, cwd=cwd, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if check and p.returncode != 0:
        raise RuntimeError(f"command failed {p.returncode}: {' '.join(cmd)}\nSTDOUT:\n{p.stdout}\nSTDERR:\n{p.stderr}")
    return p

def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def sha_text(s): return sha_bytes(s.encode())

def clone(repo, dst):
    run(["git","clone","--filter=blob:none","--quiet",f"https://github.com/{repo}.git",str(dst)])

def git_show(repo_dir, rev, path):
    p=run(["git","show",f"{rev}:{path}"],cwd=repo_dir)
    return p.stdout

def verify(dafny, args, cwd, log):
    p=run([dafny]+args,cwd=cwd,check=False)
    text=p.stdout+"\n--- STDERR ---\n"+p.stderr
    Path(log).write_text(text)
    m=re.findall(r"(\d+) verified, (\d+) errors?",text)
    verified=errors=None
    if m:
        verified,errors=map(int,m[-1])
    status="PASS" if p.returncode==0 and errors==0 else ("FAIL" if errors is not None and errors>0 else "INFRA")
    return dict(status=status,returncode=p.returncode,verified=verified,errors=errors)

def split_single_method(src):
    lines=src.splitlines(keepends=True)
    brace=None
    for i,line in enumerate(lines):
        if line.strip()=="{": brace=i; break
    if brace is None: raise ValueError("method opening brace not found")
    return ''.join(lines[:brace]), ''.join(lines[brace:])

def find_function_block(src, name):
    pat=re.compile(rf"(?m)^\s*function\s+{re.escape(name)}\(st:\s*ExecutingState\):\s*\(st':\s*State\)\s*$")
    m=pat.search(src)
    if not m: raise ValueError(f"function {name} signature not found")
    start=m.start()
    # body opener is a brace on its own line; contract set literals do not count
    lm=re.compile(r"(?m)^\s*\{\s*$").search(src,m.end())
    if not lm: raise ValueError(f"function {name} body opener not found")
    brace=lm.start()
    depth=0; end=None
    for i,ch in enumerate(src[brace:],brace):
        if ch=='{': depth+=1
        elif ch=='}':
            depth-=1
            if depth==0:
                end=i+1
                # include one trailing newline if present
                if end < len(src) and src[end]=='\n': end+=1
                break
    if end is None: raise ValueError(f"function {name} closing brace not found")
    return dict(start=start, brace=brace, end=end, spec=src[start:brace], body=src[brace:end], full=src[start:end])

def mask_two(src):
    blocks=[(n,find_function_block(src,n)) for n in ["Create","Create2"]]
    # reverse replacement
    out=src
    for n,b in sorted(blocks,key=lambda x:x[1]['start'],reverse=True):
        out=out[:b['start']]+f"@@FSE126_{n}@@\n"+out[b['end']:]
    return out

def assemble_two(context, source_spec, source_body):
    out=context
    for n in ["Create","Create2"]:
        s=find_function_block(source_spec,n)
        b=find_function_block(source_body,n)
        out=out.replace(f"@@FSE126_{n}@@\n",s['spec']+b['body'])
    return out

def write_manifest(unit, meta):
    (OUT/unit/"manifest.json").write_text(json.dumps(meta,indent=2,sort_keys=True))

def u003(dafny):
    unit="U003"; d=OUT/unit; d.mkdir(parents=True,exist_ok=True)
    repo="ChuyueSun/Clover"; head="464ecf80156798bb146a6676d50abf458e066ad2"; parent="097087fe670389ecbbb888c4fdeb6869b34be599"
    path="dataset/Dafny/textbook_algo/update_array/update_array_strong.dfy"
    r=d/"repo"; clone(repo,r)
    old=git_show(r,parent,path); new=git_show(r,head,path)
    ospec,obody=split_single_method(old); nspec,nbody=split_single_method(new)
    cells={"B0S0":ospec+obody,"B1S0":ospec+nbody,"B0S1":nspec+obody,"B1S1":nspec+nbody}
    assert cells['B0S0']==old and cells['B1S1']==new
    cdir=d/"cells"; cdir.mkdir(exist_ok=True)
    rows=[]
    for cid,src in cells.items():
        fp=cdir/f"{cid}.dfy"; fp.write_text(src)
        res=verify(dafny,["verify",str(fp.resolve())],ROOT,d/f"{cid}.log")
        rows.append(dict(cell=cid,sha256=sha_text(src),**res))
    with (d/"results.csv").open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=rows[0].keys()); w.writeheader(); w.writerows(rows)
    write_manifest(unit,{"repo":repo,"head":head,"parent":parent,"path":path,"old_source_sha256":sha_text(old),"new_source_sha256":sha_text(new),"dafny":run([dafny,"--version"],check=False).stdout.strip(),"results":rows})

def u030(dafny):
    unit="U030"; d=OUT/unit; d.mkdir(parents=True,exist_ok=True)
    repo="Consensys-Incorporated/evm-dafny"; head="78bfdfb28c7aba090c6007208966760c57750dfd"; parent="95d45699972fd97cfd06791505dc2d8f20c17dd5"
    path="src/dafny/bytecode.dfy"
    r=d/"repo"; clone(repo,r)
    old=git_show(r,parent,path); new=git_show(r,head,path)
    oldctx=mask_two(old); newctx=mask_two(new)
    if oldctx != newctx:
        diff=''.join(difflib.unified_diff(oldctx.splitlines(True),newctx.splitlines(True),fromfile='old-context',tofile='new-context'))
        (d/"outside_target_diff.txt").write_text(diff)
        (d/"R3.txt").write_text("R3: source outside Create/Create2 differs after placeholder masking; frozen mechanical isolation criterion failed.\n")
        write_manifest(unit,{"repo":repo,"head":head,"parent":parent,"status":"R3","reason":"outside-target context differs","old_source_sha256":sha_text(old),"new_source_sha256":sha_text(new)})
        return
    cells={
      "B0S0":assemble_two(oldctx,old,old),
      "B1S0":assemble_two(oldctx,old,new),
      "B0S1":assemble_two(oldctx,new,old),
      "B1S1":assemble_two(oldctx,new,new),
    }
    assert cells['B0S0']==old and cells['B1S1']==new
    cdir=d/"cells"; cdir.mkdir(exist_ok=True)
    run(["git","checkout","--quiet",head],cwd=r)
    rows=[]
    flags=["verify","--resource-limit","1000000","--verify-included-files","--function-syntax","4","--quantifier-syntax","4","src/dafny/evm.dfy"]
    for cid,src in cells.items():
        (r/path).write_text(src)
        (cdir/f"{cid}_bytecode.dfy").write_text(src)
        res=verify(dafny,flags,r,d/f"{cid}.log")
        rows.append(dict(cell=cid,sha256=sha_text(src),**res))
    with (d/"results.csv").open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=rows[0].keys()); w.writeheader(); w.writerows(rows)
    write_manifest(unit,{"repo":repo,"head":head,"parent":parent,"path":path,"old_source_sha256":sha_text(old),"new_source_sha256":sha_text(new),"masked_context_sha256":sha_text(oldctx),"dafny":run([dafny,"--version"],check=False).stdout.strip(),"flags":flags,"results":rows})

def u052_audit():
    unit="U052"; d=OUT/unit; d.mkdir(parents=True,exist_ok=True)
    repo="franck44/evm-dis"; head="ac962f72645d3d4a6c2d996b6ea19435ad630d2c"; parent="c194f56d15152c3e09f3bd8fa9c73875e1854592"; path="src/dafny/utils/Automata.dfy"
    r=d/"repo"; clone(repo,r)
    old=git_show(r,parent,path); new=git_show(r,head,path)
    p=run(["git","diff","--unified=1",parent,head,"--",path],cwd=r).stdout
    (d/"historical.diff").write_text(p)
    needles=["ghost predicate IsReversemapValid","ghost predicate IsReverseMapValid","static function AddKeyVal2","static lemma foo303","&& IsReverseMapValid()","AddEdgeInTRandTrNatPreservesValid"]
    evidence=[]
    for needle in needles:
        hits=[ln for ln in p.splitlines() if needle in ln]
        evidence.extend(hits[:4])
    report="# U052 R3 mechanical-isolation audit\n\n"
    report+="The patch-only semantic screen labeled U052 E0, so source-context reconstruction was mandatory. The exact historical diff shows that the same maintenance unit does more than alter a body and literal routine clauses: it deletes/renames the reverse-map predicate family, changes the logical `IsValid` definition to depend on the renamed predicate, removes helper functions/lemmas used by the old proof, and simultaneously changes `AddEdge` / `AddEdgeInTRandTrNatPreservesValid`. A two-factor body-versus-contract cross cell therefore requires an extra choice about which logical-definition/proof-support revision to carry. That choice is not a historical body fragment or a historical literal contract fragment and was not predeclared. Under the frozen rule, inventing that third compatibility edit is forbidden.\n\n**Disposition: R3 — cross-pair construction fails mechanical-isolation checks.** This is attrition of an E0-as-screened semantic unit, not a verifier FAIL and not a recoding to N0/N1.\n\nSelected exact-diff witnesses:\n\n```diff\n"+"\n".join(evidence)+"\n```\n"
    (d/"R3_ISOLATION_AUDIT.md").write_text(report)
    write_manifest(unit,{"repo":repo,"head":head,"parent":parent,"path":path,"status":"R3","old_source_sha256":sha_text(old),"new_source_sha256":sha_text(new),"historical_diff_sha256":sha_text(p),"evidence":evidence})

if __name__=='__main__':
    ap=argparse.ArgumentParser(); ap.add_argument('--unit',required=True,choices=['U003','U030','U052']); ap.add_argument('--dafny',default='dafny'); a=ap.parse_args()
    if a.unit=='U003': u003(a.dafny)
    elif a.unit=='U030': u030(a.dafny)
    else: u052_audit()
