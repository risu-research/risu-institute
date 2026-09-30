#!/usr/bin/env python3
from pathlib import Path
import itertools, json, re
import numpy as np
import pandas as pd
from scipy.stats import spearmanr, ks_2samp, wasserstein_distance
from scipy.spatial.distance import cdist

CC18={3,6,11,12,14,15,16,18,22,23,28,29,31,32,37,43,45,49,53,219,2074,2079,3021,3022,3481,3549,3560,3573,3902,3903,3904,3913,3917,3918,7592,9910,9946,9952,9957,9960,9964,9971,9976,9977,9978,9981,9985,10093,10101,14952,14954,14965,14969,14970,125920,125922,146195,146800,146817,146819,146820,146821,146822,146824,146825,167119,167120,167121,167124,167125,167140,167141}
FINAL18=['CatBoost','DANet','DecisionTree','FTTransformer','KNN','LightGBM','LinearModel','MLP','MLP-rtdl','NODE','RandomForest','ResNet','SAINT','STG','SVM','TabNet','VIME','XGBoost']
CANON={'rtdl_FTTransformer':'FTTransformer','rtdl_MLP':'MLP-rtdl','rtdl_ResNet':'ResNet'}
MISSING6=[7593,9890,167121,168329,189355,189356]
INTERP=['f__pymfe.general.attr_to_inst','f__pymfe.general.cat_to_num','f__pymfe.general.freq_class.max','f__pymfe.general.freq_class.mean','f__pymfe.general.freq_class.median','f__pymfe.general.freq_class.min','f__pymfe.general.freq_class.range','f__pymfe.general.nr_attr','f__pymfe.general.nr_bin','f__pymfe.general.nr_cat','f__pymfe.general.nr_class','f__pymfe.general.total_num_instances','f__pymfe.general.nr_num']
B=10000; SEED=20260929

def tid(s):
    m=re.search(r'__(\d+)$',str(s)); return int(m.group(1)) if m else np.nan

def bh(p):
    p=np.asarray(p,float); n=len(p); order=np.argsort(p); q=np.empty(n); prev=1.
    for rank,idx in reversed(list(enumerate(order,start=1))):
        prev=min(prev,p[idx]*n/rank); q[idx]=prev
    return q

def prep_results(path):
    d=pd.read_csv(path); d['alg_name']=d.alg_name.replace(CANON); d['task_id']=d.dataset_name.map(tid)
    d=d[d.task_id.notna()].copy(); d.task_id=d.task_id.astype(int); d['in_cc18']=d.task_id.isin(CC18)
    return d

def aggregate_meta(path):
    m=pd.read_csv(path,low_memory=False)
    assert 'dataset_fold_id' in m.columns
    if 'f__pymfe.general.nr_inst' in m.columns:
        m['f__pymfe.general.total_num_instances']=pd.to_numeric(m['f__pymfe.general.nr_inst'],errors='coerce')/0.8
    m['dataset_basename']=m.dataset_fold_id.astype(str).str.replace(r'__fold_\d+$','',regex=True)
    # Match authors: median numeric features by dataset basename.
    a=m.groupby('dataset_basename',as_index=False).median(numeric_only=True)
    a['task_id']=a.dataset_basename.map(tid); a=a[a.task_id.notna()].copy(); a.task_id=a.task_id.astype(int)
    return m,a

def selection_audit(meta, target_tasks, out):
    a=meta[meta.task_id.isin(target_tasks)].drop_duplicates('task_id').copy(); a['in_cc18']=a.task_id.isin(CC18)
    nums=[c for c in a.select_dtypes(include=[np.number]).columns if c not in {'task_id','in_cc18'}]
    rows=[]
    for c in nums:
        x=pd.to_numeric(a.loc[a.in_cc18,c],errors='coerce').replace([np.inf,-np.inf],np.nan).dropna().to_numpy(float)
        y=pd.to_numeric(a.loc[~a.in_cc18,c],errors='coerce').replace([np.inf,-np.inf],np.nan).dropna().to_numpy(float)
        if min(len(x),len(y))<10: continue
        sp=np.sqrt(((len(x)-1)*np.var(x,ddof=1)+(len(y)-1)*np.var(y,ddof=1))/(len(x)+len(y)-2))
        smd=(x.mean()-y.mean())/sp if sp>0 else np.nan; ks=ks_2samp(x,y); scale=np.std(np.r_[x,y],ddof=1)
        below=int((y<np.min(x)).sum()); above=int((y>np.max(x)).sum())
        rows.append({'feature':c,'n_cc18':len(x),'n_outside':len(y),'mean_cc18':x.mean(),'mean_outside':y.mean(),'smd':smd,'abs_smd':abs(smd) if np.isfinite(smd) else np.nan,'ks_stat':float(ks.statistic),'ks_p':float(ks.pvalue),'wasserstein_std':float(wasserstein_distance(x,y)/scale) if scale>0 else np.nan,'outside_below_cc18_min':below,'outside_above_cc18_max':above,'outside_beyond_cc18_range_fraction':(below+above)/len(y)})
    r=pd.DataFrame(rows)
    if len(r): r['ks_q_bh']=bh(r.ks_p.values)
    r=r.sort_values(['abs_smd','ks_stat'],ascending=False); r.to_csv(out/'selection_metafeatures_all.csv',index=False)
    ri=r[r.feature.isin(INTERP)].copy().sort_values('abs_smd',ascending=False); ri.to_csv(out/'selection_metafeatures_interpretable.csv',index=False)

    # Multivariate overlap on fixed interpretable features only, median-impute and z-standardize on target.
    use=[c for c in INTERP if c in a.columns]
    z=a[['task_id','in_cc18']+use].copy()
    for c in use:
        z[c]=pd.to_numeric(z[c],errors='coerce').replace([np.inf,-np.inf],np.nan); z[c]=z[c].fillna(z[c].median())
        sd=z[c].std(ddof=1); z[c]=(z[c]-z[c].mean())/(sd if sd>0 else 1)
    xb=z.loc[z.in_cc18,use].to_numpy(); xo=z.loc[~z.in_cc18,use].to_numpy()
    Db=cdist(xb,xb); np.fill_diagonal(Db,np.inf); bnn=Db.min(axis=1); onn=cdist(xo,xb).min(axis=1)
    overlap={'features':use,'cc18_n':len(xb),'outside_n':len(xo),'cc18_loo_nn_p95':float(np.quantile(bnn,.95)),'cc18_loo_nn_max':float(np.max(bnn)),'outside_nn_median':float(np.median(onn)),'outside_beyond_cc18_loo_p95_fraction':float(np.mean(onn>np.quantile(bnn,.95))),'outside_beyond_cc18_loo_max_fraction':float(np.mean(onn>np.max(bnn)))}
    pd.DataFrame({'outside_task_id':z.loc[~z.in_cc18,'task_id'].values,'nn_distance_to_cc18':onn}).sort_values('nn_distance_to_cc18',ascending=False).to_csv(out/'outside_support_distances.csv',index=False)
    return a,r,ri,overlap

def target_matrix(df,out):
    rows=[]; rng=np.random.default_rng(SEED)
    for j,(aa,bb) in enumerate(itertools.combinations(FINAL18,2)):
        A=df[df.alg_name==aa][['task_id','in_cc18','Accuracy__test_mean']].rename(columns={'Accuracy__test_mean':'ya'})
        C=df[df.alg_name==bb][['task_id','Accuracy__test_mean']].rename(columns={'Accuracy__test_mean':'yb'})
        m=A.merge(C,on='task_id').dropna(); gi=(m[m.in_cc18].ya-m[m.in_cc18].yb).to_numpy(float); go=(m[~m.in_cc18].ya-m[~m.in_cc18].yb).to_numpy(float)
        if min(len(gi),len(go))<20: continue
        db=float(gi.mean()); do=float(go.mean()); dp=float(np.r_[gi,go].mean()); shift=dp-db
        vals=np.empty(B); rev=np.empty(B,dtype=bool)
        for k in range(B):
            bi=rng.choice(gi,len(gi),True); bo=rng.choice(go,len(go),True); bt=np.r_[bi,bo].mean(); vals[k]=bt-bi.mean(); rev[k]=(np.sign(bi.mean())!=np.sign(bt) and bi.mean()!=0 and bt!=0)
        lo,hi=np.quantile(vals,[.025,.975]); centered=vals-shift; p=float((np.sum(np.abs(centered)>=abs(shift))+1)/(B+1))
        brevp=float(rev.mean()); actual=bool(np.sign(db)!=np.sign(dp) and db!=0 and dp!=0)
        attenuation=abs(dp)/abs(db) if db!=0 else np.nan
        rows.append({'algorithm_a':aa,'algorithm_b':bb,'n_cc18':len(gi),'n_outside':len(go),'n_target':len(gi)+len(go),'delta_benchmark':db,'delta_outside':do,'delta_target':dp,'target_minus_benchmark':shift,'shift_ci_lo':float(lo),'shift_ci_hi':float(hi),'shift_bootstrap_p':p,'benchmark_to_target_sign_reversal':actual,'bootstrap_target_reversal_probability':brevp,'min_abs_benchmark_target':min(abs(db),abs(dp)),'strong_target_reversal_005':bool(actual and min(abs(db),abs(dp))>=.005 and brevp>=.8),'strong_target_reversal_010':bool(actual and min(abs(db),abs(dp))>=.010 and brevp>=.8),'target_to_benchmark_abs_ratio':attenuation,'benchmark_margin_ge_005_target_below_005':bool(abs(db)>=.005 and abs(dp)<.005),'benchmark_margin_reduced_ge_75pct':bool(abs(db)>=.005 and abs(dp)<=.25*abs(db))})
    r=pd.DataFrame(rows); r['shift_q_bh']=bh(r.shift_bootstrap_p.values); r.to_csv(out/'benchmark_to_full_target_pairs.csv',index=False)
    return r

def interaction_meta(df,meta,strong_pairs,out):
    rows=[]
    fixed=[c for c in INTERP if c in meta.columns]
    mm=meta[['task_id']+fixed].drop_duplicates('task_id')
    for _,p in strong_pairs.iterrows():
        aa,bb=p.algorithm_a,p.algorithm_b
        A=df[df.alg_name==aa][['task_id','Accuracy__test_mean']].rename(columns={'Accuracy__test_mean':'ya'})
        C=df[df.alg_name==bb][['task_id','Accuracy__test_mean']].rename(columns={'Accuracy__test_mean':'yb'})
        d=A.merge(C,on='task_id').merge(mm,on='task_id'); d['contrast']=d.ya-d.yb
        local=[]
        for c in fixed:
            q=d[['contrast',c]].replace([np.inf,-np.inf],np.nan).dropna()
            if len(q)<20: continue
            s=spearmanr(q.contrast,q[c]); local.append({'algorithm_a':aa,'algorithm_b':bb,'feature':c,'n':len(q),'spearman_rho':float(s.statistic),'spearman_p':float(s.pvalue)})
        if local:
            L=pd.DataFrame(local); L['spearman_q_bh_within_pair']=bh(L.spearman_p.values); rows.extend(L.to_dict('records'))
    r=pd.DataFrame(rows); r.to_csv(out/'strong_pair_metafeature_interactions.csv',index=False)
    return r

def failure_audit(path,out):
    f=pd.read_csv(path,low_memory=False); cols=list(f.columns); rec=[]
    ss=f.astype(str)
    for t in MISSING6:
        mask=ss.apply(lambda col: col.str.contains(r'(?<!\d)'+str(t)+r'(?!\d)',regex=True,na=False)).any(axis=1)
        q=f[mask].copy(); q.to_csv(out/f'failed_rows_task_{t}.csv',index=False)
        rec.append({'task_id':t,'failed_rows':int(mask.sum()),'columns':';'.join(cols)})
    r=pd.DataFrame(rec); r.to_csv(out/'missing6_failure_audit.csv',index=False); return r,cols

def main():
    root=Path('research/aistats_transport'); out=root/'results_closure'; out.mkdir(parents=True,exist_ok=True)
    df=prep_results(root/'input/broad_tuned_aggregated_results.csv'); target=set(df.task_id.unique())
    raw,agg=aggregate_meta(root/'input/metafeatures.csv'); agg.to_csv(out/'agg_metafeatures_author_reproduction.csv',index=False)
    matched,allsel,interpretable,overlap=selection_audit(agg,target,out)
    tm=target_matrix(df,out)
    # mechanism analysis uses five outcome-independent strong reversal pairs from prior preregistered robustness rule.
    prior=pd.read_csv(root/'results_corrected/final18_pairwise_broad.csv'); strong=prior[prior.strong_reversal_005==True][['algorithm_a','algorithm_b']]
    mech=interaction_meta(df,matched,strong,out)
    failures,fcols=failure_audit(root/'input/failed_experiments.csv',out)
    rev=tm[tm.benchmark_to_target_sign_reversal]; strongrev=tm[tm.strong_target_reversal_005]
    summary={'target_tasks':len(target),'cc18_tasks':len(target&CC18),'outside_tasks':len(target-CC18),'pairs':len(tm),'benchmark_to_target_reversals':int(len(rev)),'benchmark_to_target_reversal_fraction':float(len(rev)/len(tm)),'strong_target_reversal_005':int(len(strongrev)),'strong_target_reversal_010':int(tm.strong_target_reversal_010.sum()),'shift_ci_excludes_zero':int(((tm.shift_ci_lo>0)|(tm.shift_ci_hi<0)).sum()),'shift_bh_q_lt_005':int((tm.shift_q_bh<.05).sum()),'margin_ge005_to_below005':int(tm.benchmark_margin_ge_005_target_below_005.sum()),'margin_reduced_ge75pct':int(tm.benchmark_margin_reduced_ge_75pct.sum()),'raw_meta_rows':int(len(raw)),'aggregated_meta_datasets':int(agg.dataset_basename.nunique()),'aggregated_meta_unique_task_ids':int(agg.task_id.nunique()),'meta_target_matched':int(matched.task_id.nunique()),'meta_cc18_matched':int(matched[matched.in_cc18].task_id.nunique()),'meta_outside_matched':int(matched[~matched.in_cc18].task_id.nunique()),'selection_numeric_features_tested':int(len(allsel)),'selection_abs_smd_ge_05':int((allsel.abs_smd>=.5).sum()),'selection_abs_smd_ge_10':int((allsel.abs_smd>=1).sum()),'selection_ks_bh_q_lt_005':int((allsel.ks_q_bh<.05).sum()),'interpretable_selection_features':interpretable.to_dict('records'),'multivariate_support':overlap,'strong_pair_meta_tests':int(len(mech)),'strong_pair_meta_bh_q_lt_005':int((mech.spearman_q_bh_within_pair<.05).sum()) if len(mech) else 0,'missing6_failure_rows':failures.to_dict('records'),'failed_experiment_columns':fcols,'target_reversal_pairs':rev.sort_values('bootstrap_target_reversal_probability',ascending=False).to_dict('records'),'strong_target_reversal_pairs':strongrev.sort_values('bootstrap_target_reversal_probability',ascending=False).to_dict('records')}
    (out/'summary_closure.json').write_text(json.dumps(summary,indent=2,default=str))
    lines=['# Benchmark-to-target closure','',f"Target: {summary['target_tasks']} task IDs ({summary['cc18_tasks']} CC18 + {summary['outside_tasks']} outside).",f"Actual benchmark→full-target winner reversals: {summary['benchmark_to_target_reversals']}/{summary['pairs']} ({summary['benchmark_to_target_reversal_fraction']:.1%}).",f"Strong target reversals (.005): {summary['strong_target_reversal_005']}; (.010): {summary['strong_target_reversal_010']}.",f"Benchmark margins >=.005 collapsing below .005: {summary['margin_ge005_to_below005']}; reduced >=75%: {summary['margin_reduced_ge75pct']}.",f"Author-style metadata aggregation: {summary['aggregated_meta_unique_task_ids']} task IDs; matched target {summary['meta_target_matched']}.",f"Selection features |SMD|>=.5: {summary['selection_abs_smd_ge_05']}; |SMD|>=1: {summary['selection_abs_smd_ge_10']}; BH-KS q<.05: {summary['selection_ks_bh_q_lt_005']}.",'','## Actual target reversals','',rev.to_markdown(index=False),'','## Interpretable selection shifts','',interpretable.to_markdown(index=False),'','## Missing-six failure audit','',failures.to_markdown(index=False)]
    (out/'REPORT_CLOSURE.md').write_text('\n'.join(lines))
    print(json.dumps(summary,indent=2,default=str))
if __name__=='__main__': main()
