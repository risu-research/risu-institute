#!/usr/bin/env python3
"""Observational NASA charge-trace audit; not a causal control or safety test."""
import csv, hashlib, json, sys
from pathlib import Path
import numpy as np
from scipy.io import loadmat
ROOT=Path(sys.argv[1]); OUT=Path(sys.argv[2]); OUT.mkdir(parents=True,exist_ok=True)
cycle_rows=[]; point_rows=[]; errors=[]
for name in ('B0005','B0006','B0007','B0018'):
    path=ROOT/(name+'.mat'); sha=hashlib.sha256(path.read_bytes()).hexdigest()
    print('LOADED',name,path.stat().st_size,sha,flush=True)
    src=loadmat(path,simplify_cells=True)[name]
    cycles=np.atleast_1d(src['cycle']); kinds={}
    for index,c in enumerate(cycles):
        kind=str(c['type']); kinds[kind]=kinds.get(kind,0)+1
        if kind!='charge': continue
        d=c['data'];t=np.asarray(d['Time'],dtype=float).ravel();T=np.asarray(d['Temperature_measured'],dtype=float).ravel();V=np.asarray(d['Voltage_measured'],dtype=float).ravel();I=np.asarray(d['Current_measured'],dtype=float).ravel()
        if min(len(t),len(T),len(V),len(I))<2 or len({len(t),len(T),len(V),len(I)})!=1:
            errors.append({'cell':name,'cycle':index,'reason':'empty/mismatch'});continue
        if not np.all(np.isfinite(t)&np.isfinite(T)&np.isfinite(V)&np.isfinite(I)):
            errors.append({'cell':name,'cycle':index,'reason':'nonfinite'});continue
        dt=np.diff(t);good=dt>0
        if not np.any(good):errors.append({'cell':name,'cycle':index,'reason':'no-positive-dt'});continue
        slopes=np.diff(T)[good]/dt[good]
        cycle_rows.append([name,index,len(t),t[0],t[-1],float(T.min()),float(T.max()),float(V.min()),float(V.max()),float(max(slopes)),float(min(slopes)),int(np.sum(~good)),sha])
        secs=np.arange(int(np.ceil(t[0])),int(np.floor(t[-1]))+1,dtype=float)
        ix=np.searchsorted(t,secs,side='right')-1;ok=(ix>=0)&(ix<len(t));ix=ix[ok]
        for j in range(0,len(ix),10):
            k=int(ix[j]);point_rows.append([name,index,float(t[k]),float(T[k]),float(V[k]),float(I[k])])
    print('CYCLES',name,len(cycles),kinds,'charge_clean',sum(x[0]==name for x in cycle_rows),flush=True)
with (OUT/'charge_cycle_audit.csv').open('w',newline='') as f:
    w=csv.writer(f);w.writerow(['cell','cycle_index','points','start_s','end_s','min_T_C','max_T_C','min_V_V','max_V_V','max_positive_C_per_s','min_negative_C_per_s','nonpositive_t_diffs','raw_sha256']);w.writerows(cycle_rows)
with (OUT/'charge_10s_observations.csv').open('w',newline='') as f:
    w=csv.writer(f);w.writerow(['cell','cycle_index','observed_time_s','temperature_C','voltage_V','current_A']);w.writerows(point_rows)
(OUT/'dataset_errors.json').write_text(json.dumps(errors,indent=2))
summary={'charged_cycles_by_cell':{n:sum(r[0]==n for r in cycle_rows) for n in ('B0005','B0006','B0007','B0018')},'point_rows_10s':len(point_rows),'max_temperature_C':max(r[6] for r in cycle_rows),'max_observed_positive_temperature_slope_C_per_s':max(r[9] for r in cycle_rows),'cycles_crossing_30C':sum(r[6]>30 for r in cycle_rows),'cycles_crossing_35C':sum(r[6]>35 for r in cycle_rows),'errors':len(errors),'data_type':'observational laboratory charge traces, not counterfactual interventions or a safety proof'}
(OUT/'dataset_summary.json').write_text(json.dumps(summary,indent=2));print('SUMMARY',json.dumps(summary),flush=True)
