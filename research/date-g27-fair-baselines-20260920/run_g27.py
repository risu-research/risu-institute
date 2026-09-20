#!/usr/bin/env python3
"""Run frozen G27 original RTL exhaustive native experiment; all raw results retained."""
import csv, hashlib, json, pathlib, re, subprocess, sys, time
R=pathlib.Path(__file__).resolve().parent
OUT=pathlib.Path(sys.argv[1]).resolve() if len(sys.argv)>1 else (R/'output')
OUT.mkdir(parents=True,exist_ok=True)
REVISIONS={'parent':'838d16615e81786062fae84b9f7c044fb8f6bbe4','child':'41e8aeedfd1e9ad5f95902c5b0dfc83d1c99e5d2'}
SOURCE='servile/servile_rf_mem_if.v'
LOG=[]
def cmd(argv,timeout=90,cwd=None):
    st=time.perf_counter();p=subprocess.run(argv,text=True,capture_output=True,timeout=timeout,cwd=cwd)
    return p,time.perf_counter()-st
repo=OUT/'upstream';rows=[]
try:
    p,elapsed=cmd(['git','clone','--filter=blob:none','https://github.com/olofk/serv.git',str(repo)],timeout=110)
    (OUT/'CLONE.log').write_text(p.stdout+p.stderr+f'\nexit={p.returncode} wall_s={elapsed:.6f}\n')
    if p.returncode: raise RuntimeError('upstream git clone failed')
    for revision,sha in REVISIONS.items():
        p,_=cmd(['git','-C',str(repo),'checkout','--detach',sha],timeout=50)
        (OUT/f'{revision}_CHECKOUT.log').write_text(p.stdout+p.stderr+f'\nexit={p.returncode}\n')
        if p.returncode: raise RuntimeError('upstream checkout failed '+revision)
        p,_=cmd(['git','-C',str(repo),'rev-parse',f'{sha}:{SOURCE}'])
        blobsha=p.stdout.strip(); assert p.returncode==0 and len(blobsha)==40
        src=(repo/SOURCE).read_bytes();blob='blob '+str(len(src))+'\0'
        calc=hashlib.sha1(blob.encode()+src).hexdigest()
        assert calc==blobsha,'upstream source git blob mismatch'
        srcpath=OUT/f'{revision}_ORIGINAL_servile_rf_mem_if.v';srcpath.write_bytes(src)
        (OUT/f'{revision}_SOURCE_ID.txt').write_text(f'commit={sha}\nfile={SOURCE}\ngit_blob={calc}\nsha256={hashlib.sha256(src).hexdigest()}\n')
        for csr in (0,1):
            key=f'{revision}_csr{csr}'
            vvp=OUT/f'{key}.vvp'
            argv=['iverilog','-g2012','-s','g27_native_exhaustive_tb','-o',str(vvp)]
            if csr:argv.append('-DCSR_ON')
            argv += [str(srcpath),str(R/'g27_native_exhaustive_tb.v')]
            c,compile_s=cmd(argv,timeout=50)
            (OUT/f'{key}_COMPILE.log').write_text(' '.join(argv)+'\n'+c.stdout+c.stderr+f'\nexit={c.returncode} wall_s={compile_s:.6f}\n')
            if c.returncode:raise RuntimeError('Icarus compile failed '+key)
            n,run_s=cmd(['vvp',str(vvp)],timeout=50)
            raw=n.stdout+n.stderr
            (OUT/f'{key}_NATIVE.log').write_text(raw+f'\nexit={n.returncode} wall_s={run_s:.6f}\n')
            lines=[line for line in raw.splitlines() if line.startswith('RESULT ')]
            assert n.returncode==0 and len(lines)==1,'invalid original RTL native result '+key
            m=re.fullmatch(r'RESULT csr=(\d+) checks=(\d+) errors=(\d+) x0=(\d+) x30=(\d+) x31=(\d+) other=(\d+)',lines[0]);assert m,key
            vals=list(map(int,m.groups())); assert vals[0]==csr and vals[1]==32768 and vals[2]==sum(vals[3:])
            target=(2040,1020,0,1020,0) if revision=='parent' and csr==0 else ((1020,1020,0,0,0) if revision=='parent' else (0,0,0,0,0))
            observed=(vals[2],*vals[3:]);assert observed==target, f'unexpected original RTL evidence {key}={observed}, predicted {target}'
            witnesses=[line for line in raw.splitlines() if line.startswith('WITNESS ')]
            assert (len(witnesses)>0)==(vals[2]>0),'missing positive/negative controls'
            rows.append(dict(revision=revision,csr=csr,source_git_blob=calc,checks=vals[1],errors=vals[2],x0=vals[3],x30=vals[4],x31=vals[5],other=vals[6],compile_wall_s=round(compile_s,6),native_wall_s=round(run_s,6),expected=target[0],status='PASS'))
    with (OUT/'G27_RESULTS.csv').open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
    summary={'actual_RTL_cases':sum(r['checks'] for r in rows),'failing_RTL_cases':sum(r['errors'] for r in rows),'original_distinct_fixes':1,'rows':rows,'source':SOURCE,'fixture_source':str(R/'g27_native_exhaustive_tb.v'),'limits':'One stable SRAM-return byte after a clock edge, not whole CPU or arbitrary memory timing; retrospective frozen prediction.'}
    (OUT/'G27_SUMMARY.json').write_text(json.dumps(summary,indent=2)+'\n')
    print('G27 ORIGINAL NATIVE BASELINE PASS 4/4')
    for r in rows:print(r['revision'],r['csr'],'checks',r['checks'],'errors',r['errors'],'x0',r['x0'],'x31',r['x31'],'seconds',r['native_wall_s'])
    print('CASES',summary['actual_RTL_cases'],'MISMATCHES',summary['failing_RTL_cases'])
except Exception as exc:
    (OUT/'ERROR.txt').write_text(type(exc).__name__+': '+str(exc)+'\n')
    raise
