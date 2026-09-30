#!/usr/bin/env python3
from pathlib import Path
import json, re
import numpy as np
import pandas as pd

CC18={3,6,11,12,14,15,16,18,22,23,28,29,31,32,37,43,45,49,53,219,2074,2079,3021,3022,3481,3549,3560,3573,3902,3903,3904,3913,3917,3918,7592,9910,9946,9952,9957,9960,9964,9971,9976,9977,9978,9981,9985,10093,10101,14952,14954,14965,14969,14970,125920,125922,146195,146800,146817,146819,146820,146821,146822,146824,146825,167119,167120,167121,167124,167125,167140,167141}
CANON={'rtdl_FTTransformer':'FTTransformer','rtdl_MLP':'MLP-rtdl','rtdl_ResNet':'ResNet'}
PAIRS=[('NODE','RandomForest'),('NODE','SAINT'),('SAINT','SVM')]
METRICS={'Accuracy__test_mean':1.0,'F1__test_mean':1.0,'Log Loss__test_mean':-1.0}
B=10000; SEED=20260930

def tid(s):
    m=re.search(r'__(\d+)$',str(s)); return int(m.group(1)) if m else np.nan

def base(s):
    return re.sub(r'__\d+$','',str(s)).replace('openml__','')

def prep(path):
    d=pd.read_csv(path); d['alg_name']=d.alg_name.replace(CANON); d['task_id']=d.dataset_name.map(tid)
    d=d[d.task_id.notna()].copy(); d.task_id=d.task_id.astype(int); d['in_cc18']=d.task_id.isin(CC18); d['dataset_base']=d.dataset_name.map(base)
    return d

def pair_values(d,a,b,metric,dedupe=False):
    if metric not in d.columns: return None
    A=d[d.alg_name==a][['task_id','dataset_base','in_cc18',metric]].rename(columns={metric:'ya'})
    C=d[d.alg_name==b][['task_id',metric]].rename(columns={metric:'yb'})
    m=A.merge(C,on='task_id').dropna()
    if dedupe:
        counts=m.groupby('dataset_base').task_id.nunique(); bad=set(counts[counts>1].index); m=m[~m.dataset_base.isin(bad)]
    return m

def stats(m,utility_sign,seed):
    m=m.copy(); m['d']=utility_sign*(m.ya-m.yb)
    gi=m[m.in_cc18].d.to_numpy(float); gt=m.d.to_numpy(float)
    db=float(gi.mean()); dp=float(gt.mean()); actual=(np.sign(db)!=np.sign(dp) and db!=0 and dp!=0)
    rng=np.random.default_rng(seed); rev=np.empty(B,dtype=bool); shifts=np.empty(B)
    # stratified bootstrap retains benchmark/outside composition while target is their union
    go=m[~m.in_cc18].d.to_numpy(float)
    for i in range(B):
        bi=rng.choice(gi,len(gi),True); bo=rng.choice(go,len(go),True); bt=np.r_[bi,bo]
        rev[i]=(np.sign(bi.mean())!=np.sign(bt.mean()) and bi.mean()!=0 and bt.mean()!=0)
        shifts[i]=bt.mean()-bi.mean()
    # direct leave-one-common-task-out, recomputing benchmark if removed task is in benchmark
    keep=0; total=0
    for ix in m.index:
        q=m.drop(index=ix); qb=q[q.in_cc18].d; qt=q.d
        if len(qb)==0: continue
        total+=1; keep+=int(np.sign(qb.mean())!=np.sign(qt.mean()) and qb.mean()!=0 and qt.mean()!=0)
    return {'n_cc18':int(m.in_cc18.sum()),'n_outside':int((~m.in_cc18).sum()),'delta_benchmark_utility':db,'delta_target_utility':dp,
            'sign_reversal':bool(actual),'bootstrap_reversal_probability':float(rev.mean()),
            'target_minus_benchmark':float(dp-db),'shift_ci_lo':float(np.quantile(shifts,.025)),'shift_ci_hi':float(np.quantile(shifts,.975)),
            'loo_reversal_retention':float(keep/total) if total else None,'n_loo':total}

def main():
    root=Path('research/aistats_transport'); out=root/'results_robustness'; out.mkdir(parents=True,exist_ok=True)
    d=prep(root/'input/broad_tuned_aggregated_results.csv')
    rows=[]; k=0
    for a,b in PAIRS:
        for metric,sgn in METRICS.items():
            for dedupe in [False,True]:
                m=pair_values(d,a,b,metric,dedupe)
                if m is None: continue
                r=stats(m,sgn,SEED+k); k+=1
                rows.append({'algorithm_a':a,'algorithm_b':b,'metric':metric,'utility_sign':sgn,'dedupe_dataset_base':dedupe,**r})
    R=pd.DataFrame(rows); R.to_csv(out/'strong_reversal_metric_dedupe_loo.csv',index=False)
    # Compact pair-level robustness: how many of 3 metrics preserve benchmark->target sign flip, with and without dedupe.
    compact=[]
    for a,b in PAIRS:
        for dedupe in [False,True]:
            q=R[(R.algorithm_a==a)&(R.algorithm_b==b)&(R.dedupe_dataset_base==dedupe)]
            compact.append({'algorithm_a':a,'algorithm_b':b,'dedupe_dataset_base':dedupe,'metrics_available':len(q),'metrics_with_reversal':int(q.sign_reversal.sum()),'min_bootstrap_reversal_probability':float(q.bootstrap_reversal_probability.min()),'min_loo_retention':float(q.loo_reversal_retention.min())})
    C=pd.DataFrame(compact); C.to_csv(out/'strong_reversal_compact.csv',index=False)
    summary={'rows':len(R),'metrics_present':sorted(R.metric.unique()),'pairs':PAIRS,'compact':C.to_dict('records'),'detail':R.to_dict('records')}
    (out/'summary_robustness.json').write_text(json.dumps(summary,indent=2,default=str))
    lines=['# Strong benchmark-to-target reversal robustness','',C.to_markdown(index=False),'','## Full metric × dedupe × LOO results','',R.to_markdown(index=False)]
    (out/'REPORT_ROBUSTNESS.md').write_text('\n'.join(lines))
    print(json.dumps(summary,indent=2,default=str))
if __name__=='__main__': main()
