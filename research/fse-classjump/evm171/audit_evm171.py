#!/usr/bin/env python3
import subprocess,sys,re,hashlib,csv,json
from pathlib import Path
REPO=Path(sys.argv[1]); OUT=Path(sys.argv[2]); OUT.mkdir(parents=True,exist_ok=True)
BASE='0d1fae88f5f6191fe249baecf404e5b846f7e116'; HEAD='3e5ed81a48339acd79fb4e620219d81a099078ef'; PATH='src/dafny/state.dfy'
def git(*args): return subprocess.check_output(['git','-C',str(REPO),*args],text=True)
commits=git('rev-list','--reverse',f'{BASE}..{HEAD}').splitlines(); assert len(commits)==14, len(commits)

def extract(text):
    matches=list(re.finditer(r'function method Expand\(address:\s*nat,\s*len:\s*nat\)',text))
    if len(matches)!=1: raise RuntimeError(f'Expand matches={len(matches)}')
    s=matches[0].start(); op=text.find('{',matches[0].end())
    if op<0: raise RuntimeError('no body brace')
    dep=0; end=None
    for i in range(op,len(text)):
        if text[i]=='{': dep+=1
        elif text[i]=='}':
            dep-=1
            if dep==0: end=i+1; break
    if end is None: raise RuntimeError('no end')
    return text[s:op],text[op:end],text[s:end]
def norm(s): return re.sub(r'\s+',' ',s).strip()
def h(s): return hashlib.sha256(norm(s).encode()).hexdigest()
def at(ref): return git('show',f'{ref}:{PATH}')
bh,bb,bm=extract(at(BASE)); hh,hb,hm=extract(at(HEAD)); HB={'OLD':h(bb),'NEW':h(hb)}; HC={'OLD':h(bh),'NEW':h(hh)}
rows=[]
refs=[BASE]+commits
for idx,sha in enumerate(refs):
    txt=at(sha); hd,bd,whole=extract(txt); ch=h(hd); ih=h(bd)
    c='OLD' if ch==HC['OLD'] else ('NEW' if ch==HC['NEW'] else 'OTHER')
    i='OLD' if ih==HB['OLD'] else ('NEW' if ih==HB['NEW'] else 'OTHER')
    rows.append({'index':idx,'sha':sha,'subject':git('show','-s','--format=%s',sha).strip(),'date':git('show','-s','--format=%cI',sha).strip(),'contract_class':c,'implementation_class':i,'contract_hash':ch,'implementation_hash':ih,'whole_method_hash':h(whole),'is_cross_newimpl_oldcontract':int(i=='NEW' and c=='OLD'),'is_cross_oldimpl_newcontract':int(i=='OLD' and c=='NEW')})
with (OUT/'natural_intermediates.csv').open('w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
trans=[]; prev=None
for r in rows:
    key=(r['implementation_class'],r['contract_class'],r['whole_method_hash'])
    if key!=prev:
        trans.append(r); prev=key
summary={'pr_commits':14,'base':BASE,'head':HEAD,'exact_newimpl_oldcontract_commits':[r['sha'] for r in rows if r['is_cross_newimpl_oldcontract']], 'exact_oldimpl_newcontract_commits':[r['sha'] for r in rows if r['is_cross_oldimpl_newcontract']], 'distinct_method_states':len({r['whole_method_hash'] for r in rows}), 'transition_points':[{'index':r['index'],'sha':r['sha'],'subject':r['subject'],'implementation_class':r['implementation_class'],'contract_class':r['contract_class']} for r in trans]}
(OUT/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
(OUT/'fragments').mkdir(exist_ok=True)
for r in rows:
    p=OUT/'fragments'/f"{r['whole_method_hash']}.dfyfrag"
    if not p.exists():
        _,_,w=extract(at(r['sha'])); p.write_text(w)
print(json.dumps(summary,indent=2))
