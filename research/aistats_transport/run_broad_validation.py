#!/usr/bin/env python3
from pathlib import Path
import itertools, json, re, math
import numpy as np
import pandas as pd
from scipy.stats import spearmanr, kendalltau, ks_2samp, wasserstein_distance

CC18={3,6,11,12,14,15,16,18,22,23,28,29,31,32,37,43,45,49,53,219,2074,2079,3021,3022,3481,3549,3560,3573,3902,3903,3904,3913,3917,3918,7592,9910,9946,9952,9957,9960,9964,9971,9976,9977,9978,9981,9985,10093,10101,14952,14954,14965,14969,14970,125920,125922,146195,146800,146817,146819,146820,146821,146822,146824,146825,167119,167120,167121,167124,167125,167140,167141}
SELECTED18=['CatBoost','DANet','DecisionTree','FTTransformer','KNN','LightGBM','LinearModel','MLP','MLP-rtdl','NODE','RandomForest','ResNet','SAINT','STG','SVM','TabNet','VIME','XGBoost']
MANIFEST177={3021,3,6,11,12,14,15,16,18,22,23,28,29,31,32,37,43,45,49,53,219,2074,2079,3022,3481,3549,3560,3573,3902,3903,3904,3913,3917,3918,7592,9910,9946,9952,9957,9960,9964,9971,9976,9977,9978,9981,9985,10093,10101,14952,14954,14965,14969,14970,125920,125922,146195,146800,146817,146819,146820,146821,146822,146824,146825,167119,167120,167121,167124,167125,167140,167141,7593,3953,34539,146212,146606,146818,168329,168330,168331,168332,168335,168337,168338,168868,168908,168909,168910,168911,168912,189354,189355,189356,3897,5,9965,190410,9987,14951,3686,9899,41,145799,42,146032,145977,145836,10089,3896,3540,3739,2867,14964,7,9,146192,9979,168340,3952,14967,190408,25,27,3567,35,3711,9984,3566,3620,3779,9986,3891,40,146063,48,50,54,145847,145984,59,3543,3510,2076,4,9974,125921,360948,146024,10,146206,3954,146065,24,3950,9892,9956,30,9890,3735,146210,3561,3647,167211,3485,3797,2068,39,146607,3889,3512,47,3748,3602,3731,9945,145793}
assert len(CC18)==72 and len(MANIFEST177)==177
B=10000
SEED=20260929

def tid(s):
    m=re.search(r'__(\d+)$',str(s)); return int(m.group(1)) if m else np.nan

def base(s): return re.sub(r'__\d+$','',str(s)).replace('openml__','')

def bh(p):
    p=np.asarray(p,float); n=len(p); order=np.argsort(p); q=np.empty(n); prev=1.
    for rank,idx in reversed(list(enumerate(order,start=1))):
        prev=min(prev,p[idx]*n/rank); q[idx]=prev
    return q

def boot(gi,go,seed):
    rng=np.random.default_rng(seed); est=float(go.mean()-gi.mean()); vals=np.empty(B); rev=np.empty(B,dtype=bool)
    for i in range(B):
        a=rng.choice(gi,len(gi),True); b=rng.choice(go,len(go),True)
        vals[i]=b.mean()-a.mean(); rev[i]=(np.sign(a.mean())!=np.sign(b.mean()) and a.mean()!=0 and b.mean()!=0)
    lo,hi=np.quantile(vals,[.025,.975]); centered=vals-est
    p=float((np.sum(np.abs(centered)>=abs(est))+1)/(B+1))
    return est,float(lo),float(hi),p,float(rev.mean())

def loo_reversal(gi,go):
    total=0; keep=0
    for k in range(len(gi)):
        x=np.delete(gi,k); total+=1; keep+=int(np.sign(x.mean())!=np.sign(go.mean()) and x.mean()!=0 and go.mean()!=0)
    for k in range(len(go)):
        y=np.delete(go,k); total+=1; keep+=int(np.sign(gi.mean())!=np.sign(y.mean()) and gi.mean()!=0 and y.mean()!=0)
    return keep/total if total else np.nan

def pair_matrix(df, algs, min_common=20):
    rows=[]
    for k,(a,b) in enumerate(itertools.combinations(algs,2)):
        A=df[df.alg_name==a][['task_id','in_cc18','Accuracy__test_mean']].rename(columns={'Accuracy__test_mean':'ya'})
        C=df[df.alg_name==b][['task_id','Accuracy__test_mean']].rename(columns={'Accuracy__test_mean':'yb'})
        m=A.merge(C,on='task_id').dropna(); gi=(m[m.in_cc18].ya-m[m.in_cc18].yb).to_numpy(); go=(m[~m.in_cc18].ya-m[~m.in_cc18].yb).to_numpy()
        r={'algorithm_a':a,'algorithm_b':b,'n_cc18_common':len(gi),'n_outside_common':len(go),'eligible':len(gi)>=min_common and len(go)>=min_common}
        if r['eligible']:
            di,do=float(gi.mean()),float(go.mean()); est,lo,hi,p,brevp=boot(gi,go,SEED+k)
            rev=bool(np.sign(di)!=np.sign(do) and di!=0 and do!=0)
            r.update(delta_cc18=di,delta_outside=do,interaction_shift=est,ci_lo=lo,ci_hi=hi,bootstrap_p=p,bootstrap_reversal_probability=brevp,sign_reversal=rev,
                     min_abs_contrast=min(abs(di),abs(do)),strong_reversal_005=bool(rev and min(abs(di),abs(do))>=.005 and brevp>=.8),
                     strong_reversal_010=bool(rev and min(abs(di),abs(do))>=.010 and brevp>=.8),loo_reversal_retention=loo_reversal(gi,go) if rev else np.nan)
        rows.append(r)
    z=pd.DataFrame(rows); mask=z.eligible==True
    if mask.any(): z.loc[mask,'bootstrap_q_bh']=bh(z.loc[mask,'bootstrap_p'].values)
    return z

def metafeature_audit(meta, task_ids, outdir):
    meta=meta.copy(); meta['task_id']=meta.dataset_name.map(tid); meta=meta[meta.task_id.isin(task_ids)].drop_duplicates('task_id'); meta['in_cc18']=meta.task_id.isin(CC18)
    num=[c for c in meta.columns if c not in ['dataset_name','task_id','in_cc18'] and pd.api.types.is_numeric_dtype(meta[c])]
    rows=[]
    for c in num:
        x=pd.to_numeric(meta.loc[meta.in_cc18,c],errors='coerce').replace([np.inf,-np.inf],np.nan).dropna().to_numpy(); y=pd.to_numeric(meta.loc[~meta.in_cc18,c],errors='coerce').replace([np.inf,-np.inf],np.nan).dropna().to_numpy()
        if len(x)<10 or len(y)<10: continue
        vx=np.var(x,ddof=1); vy=np.var(y,ddof=1); sp=np.sqrt(((len(x)-1)*vx+(len(y)-1)*vy)/(len(x)+len(y)-2))
        smd=(x.mean()-y.mean())/sp if sp>0 else np.nan
        ks=ks_2samp(x,y,method='auto'); scale=np.nanstd(np.r_[x,y],ddof=1); wd=wasserstein_distance(x,y); wstd=wd/scale if scale>0 else np.nan
        rows.append({'feature':c,'n_cc18':len(x),'n_outside':len(y),'mean_cc18':x.mean(),'mean_outside':y.mean(),'smd':smd,'abs_smd':abs(smd) if np.isfinite(smd) else np.nan,'ks_stat':ks.statistic,'ks_p':ks.pvalue,'wasserstein_std':wstd})
    r=pd.DataFrame(rows)
    if len(r):
        r['ks_q_bh']=bh(r.ks_p.values); r=r.sort_values(['abs_smd','ks_stat'],ascending=False)
    r.to_csv(outdir/'metafeature_shift_all.csv',index=False)
    # interpretable/general descriptors are a predeclared secondary slice, excluding landmarking/model performance proxies
    if len(r):
        mask=(~r.feature.str.contains('landmarking',case=False,regex=False)) & (~r.feature.str.contains('relative',case=False,regex=False))
        r[mask].head(100).to_csv(outdir/'metafeature_shift_top_interpretable.csv',index=False)
    return {'meta_rows_matched':int(len(meta)),'numeric_features_tested':int(len(r)),'abs_smd_ge_05':int((r.abs_smd>=.5).sum()) if len(r) else 0,'abs_smd_ge_10':int((r.abs_smd>=1).sum()) if len(r) else 0,'ks_bh_q_lt_005':int((r.ks_q_bh<.05).sum()) if len(r) else 0,'top_features':r.head(20).to_dict('records') if len(r) else []}

def main():
    root=Path('research/aistats_transport'); out=root/'results_broad'; out.mkdir(parents=True,exist_ok=True)
    df=pd.read_csv(root/'input/broad_tuned_aggregated_results.csv'); df['task_id']=df.dataset_name.map(tid); df=df[df.task_id.notna()].copy(); df.task_id=df.task_id.astype(int); df['dataset_base']=df.dataset_name.map(base); df['in_cc18']=df.task_id.isin(CC18)
    tasks=set(df.task_id.unique()); algs=sorted(df.alg_name.unique()); selected=[a for a in SELECTED18 if a in algs]
    coverage=df.groupby('alg_name').task_id.nunique().sort_values(ascending=False); coverage.to_csv(out/'algorithm_task_coverage.csv',header=['unique_tasks'])
    tasktab=df[['task_id','dataset_name','dataset_base','in_cc18']].drop_duplicates().sort_values('task_id'); tasktab.to_csv(out/'broad_task_manifest.csv',index=False)
    prov={'rows':int(len(df)),'unique_task_ids':len(tasks),'algorithms':len(algs),'algorithm_names':algs,'selected18_present':selected,'cc18_overlap':len(tasks&CC18),'outside_cc18':len(tasks-CC18),'manifest177_overlap':len(tasks&MANIFEST177),'manifest177_missing':sorted(MANIFEST177-tasks),'broad_not_in_manifest177':sorted(tasks-MANIFEST177),'missing_cc18':sorted(CC18-tasks)}
    # all available, plus selected18-only
    pm=pair_matrix(df,selected,20); pm.to_csv(out/'selected18_pairwise_broad.csv',index=False)
    allpm=pair_matrix(df,algs,20); allpm.to_csv(out/'all_algorithms_pairwise_broad.csv',index=False)
    # threshold sensitivity
    th=[]
    for n in [10,15,20,25,30]:
        q=pair_matrix(df,selected,n); e=q[q.eligible==True]
        th.append({'min_common':n,'eligible_pairs':len(e),'sign_reversals':int(e.sign_reversal.sum()) if len(e) else 0,'strong_rev_005':int(e.strong_reversal_005.sum()) if len(e) else 0,'q_lt_005':int((e.bootstrap_q_bh<.05).sum()) if len(e) else 0})
    pd.DataFrame(th).to_csv(out/'threshold_sensitivity.csv',index=False)
    # Compare with complete-case 104 analysis
    old=pd.read_csv(root/'results/pairwise_cc18_vs_outside_primary.csv')
    comp=old.merge(pm,on=['algorithm_a','algorithm_b'],suffixes=('_104','_broad'))
    comp['same_reversal_flag']=comp.sign_reversal_104==comp.sign_reversal_broad
    both=comp[(comp.eligible_104==True)&(comp.eligible_broad==True)].copy()
    shift_r=spearmanr(both.interaction_shift_out_minus_cc18,both.interaction_shift) if len(both)>2 else None
    comp.to_csv(out/'replication_104_vs_broad.csv',index=False)
    e=pm[pm.eligible==True].copy()
    metares={}
    mp=root/'input/metafeatures.csv'
    if mp.exists():
        meta=pd.read_csv(mp,low_memory=False); metares=metafeature_audit(meta,tasks,out)
    summary={**prov,'selected18_eligible_pairs':int(len(e)),'selected18_sign_reversals':int(e.sign_reversal.sum()),'selected18_strong_reversal_005':int(e.strong_reversal_005.sum()),'selected18_strong_reversal_010':int(e.strong_reversal_010.sum()),'selected18_ci_excludes_zero':int(((e.ci_lo>0)|(e.ci_hi<0)).sum()),'selected18_bh_q_lt_005':int((e.bootstrap_q_bh<.05).sum()),'median_loo_retention_among_reversals':float(e.loc[e.sign_reversal,'loo_reversal_retention'].median()) if e.sign_reversal.any() else None,'same_reversal_flag_104_vs_broad_fraction':float(both.same_reversal_flag.mean()),'interaction_shift_spearman_104_vs_broad':float(shift_r.statistic) if shift_r else None,'interaction_shift_spearman_p':float(shift_r.pvalue) if shift_r else None,'metafeatures':metares,'threshold_sensitivity':th}
    cols=['algorithm_a','algorithm_b','n_cc18_common','n_outside_common','delta_cc18','delta_outside','interaction_shift','ci_lo','ci_hi','bootstrap_q_bh','bootstrap_reversal_probability','min_abs_contrast','loo_reversal_retention','strong_reversal_005','strong_reversal_010']
    summary['broad_reversal_pairs']=e[e.sign_reversal][cols].sort_values(['strong_reversal_005','bootstrap_q_bh'],ascending=[False,True]).to_dict('records')
    (out/'summary_broad.json').write_text(json.dumps(summary,indent=2,default=str))
    lines=['# Broad historical validation','',f"Broad tasks: {len(tasks)}; algorithms: {len(algs)}; selected18 present: {len(selected)}",f"Manifest177 overlap: {len(tasks&MANIFEST177)}/177; missing: {len(MANIFEST177-tasks)}; extras: {len(tasks-MANIFEST177)}",f"CC18 overlap: {len(tasks&CC18)} / 72",f"Eligible selected18 pairs: {len(e)}; reversals: {int(e.sign_reversal.sum())}; strong(.005): {int(e.strong_reversal_005.sum())}; BH q<.05 interactions: {int((e.bootstrap_q_bh<.05).sum())}",f"104-vs-broad reversal-flag agreement: {both.same_reversal_flag.mean():.3f}; interaction-shift Spearman: {shift_r.statistic:.3f}" if shift_r else '',f"Median leave-one-task-out reversal retention: {summary['median_loo_retention_among_reversals']}",'', '## Threshold sensitivity','',pd.DataFrame(th).to_markdown(index=False),'','## Broad reversal pairs','',e[e.sign_reversal][cols].to_markdown(index=False)]
    (out/'REPORT_BROAD.md').write_text('\n'.join(lines))
    print(json.dumps(summary,indent=2,default=str))
if __name__=='__main__': main()
