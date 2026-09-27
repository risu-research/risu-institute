#!/usr/bin/env python3
from pathlib import Path
import argparse,subprocess,re,csv,json,hashlib
P=Path(__file__).resolve().parent/'artifact'; ap=argparse.ArgumentParser(); ap.add_argument('dafny'); ap.add_argument('--timeout',type=int,default=300); a=ap.parse_args()
d=Path(a.dafny).resolve(); ver=subprocess.run([str(d),'--version'],capture_output=True,text=True).stdout.strip(); sha=hashlib.sha256(d.read_bytes()).hexdigest()
(P/'results'/'toolchain.json').write_text(json.dumps({'version':ver,'sha256':sha},indent=2)+'\n')
pat=re.compile(r'Dafny program verifier finished with (\d+) verified, (\d+) error')
rows=[]
for cell in ['I0_C0','I1_C0','I0_C1','I1_C1']:
    cd=P/'cells'/cell
    pr=subprocess.run([str(d),'verify','--verification-time-limit','180','MemoryBackend.dfy'],cwd=cd,capture_output=True,text=True,timeout=a.timeout)
    out=pr.stdout+pr.stderr; (P/'results'/f'{cell}.log').write_text(out); m=pat.search(out)
    rows.append({'cell':cell,'returncode':pr.returncode,'verified':m.group(1) if m else '','errors':m.group(2) if m else '','pass':int(pr.returncode==0 and m and int(m.group(2))==0)})
with (P/'results'/'replay.csv').open('w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
freeze=json.loads((P/'provenance'/'PREDICTION_FREEZE.json').read_text()); obs={r['cell']:bool(r['pass']) for r in rows}; expected=freeze['expected_cell_pass']; match=all(obs[k]==v for k,v in expected.items())
(P/'results'/'prediction_check.json').write_text(json.dumps({'expected':expected,'observed':obs,'exact_match':match},indent=2)+'\n')
print(json.dumps({'rows':rows,'prediction_exact_match':match},indent=2))
