#!/usr/bin/env python3
from pathlib import Path
import csv
P=Path(__file__).resolve().parent/'artifact'
fresh=P/'results'/'fresh_verifier_matrix.csv'
if not fresh.exists(): raise SystemExit('No fresh verifier matrix yet.')
rows=list(csv.DictReader(fresh.open()))
print('cells',len(rows))
print('full_pass',sum(int(r['full_pass']) for r in rows))
for k in ['public','memory','minimal']:
    print(k+'_caller_pass',sum(int(r[k+'_pass']) for r in rows if r[k+'_pass']!=''))
for c in ['I11_C011','I11_C111','I00_C100']:
    r=next(x for x in rows if x['cell']==c); print(c,r)
