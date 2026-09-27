#!/usr/bin/env python3
import csv, json, re, subprocess, sys, time
from pathlib import Path

repo=Path(sys.argv[1]); dafny=Path(sys.argv[2]).resolve(); out=Path(sys.argv[3]); out.mkdir(parents=True,exist_ok=True)
BASE='0d1fae88f5f6191fe249baecf404e5b846f7e116'; HEAD='3e5ed81a48339acd79fb4e620219d81a099078ef'
def git(*args,check=True):
    return subprocess.run(['git','-C',str(repo),*args],text=True,capture_output=True,check=check)
commits=git('rev-list','--reverse',f'{BASE}..{HEAD}').stdout.splitlines(); assert len(commits)==14
refs=[BASE]+commits
summary_re=re.compile(r'Dafny program verifier finished with\s+(\d+)\s+verified,\s+(\d+)\s+error')
rows=[]
for idx,sha in enumerate(refs):
    git('checkout','-q','--detach',sha)
    subject=git('show','-s','--format=%s',sha).stdout.strip()
    start=time.time()
    # Match the historical verifier while minimizing unrelated Java/Gradle dependencies.
    p=subprocess.run([str(dafny),'/compile:0','src/dafny/state.dfy'],cwd=repo,text=True,capture_output=True,timeout=300)
    elapsed=time.time()-start
    log=p.stdout+p.stderr
    (out/f'{idx:02d}_{sha[:12]}.log').write_text(log)
    m=summary_re.search(log)
    rows.append({'index':idx,'sha':sha,'subject':subject,'returncode':p.returncode,'verified':int(m.group(1)) if m else '', 'errors':int(m.group(2)) if m else '', 'pass':int(p.returncode==0 and m and int(m.group(2))==0),'seconds':round(elapsed,3)})
with (out/'natural_history_verification.csv').open('w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
summary={'base':BASE,'head':HEAD,'states_checked':len(rows),'passes':sum(r['pass'] for r in rows),'failures':sum(1-r['pass'] for r in rows),'rows':rows}
(out/'natural_history_verification.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary,indent=2))
