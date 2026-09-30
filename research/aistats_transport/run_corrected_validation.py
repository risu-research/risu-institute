#!/usr/bin/env python3
from pathlib import Path
import itertools, json, re, unicodedata
import numpy as np
import pandas as pd
from scipy.stats import spearmanr, ks_2samp, wasserstein_distance

CC18={3,6,11,12,14,15,16,18,22,23,28,29,31,32,37,43,45,49,53,219,2074,2079,3021,3022,3481,3549,3560,3573,3902,3903,3904,3913,3917,3918,7592,9910,9946,9952,9957,9960,9964,9971,9976,9977,9978,9981,9985,10093,10101,14952,14954,14965,14969,14970,125920,125922,146195,146800,146817,146819,146820,146821,146822,146824,146825,167119,167120,167121,167124,167125,167140,167141}
MANIFEST177={3021,3,6,11,12,14,15,16,18,22,23,28,29,31,32,37,43,45,49,53,219,2074,2079,3022,3481,3549,3560,3573,3902,3903,3904,3913,3917,3918,7592,9910,9946,9952,9957,9960,9964,9971,9976,9977,9978,9981,9985,10093,10101,14952,14954,14965,14969,14970,125920,125922,146195,146800,146817,146819,146820,146821,146822,146824,146825,167119,167120,167121,167124,167125,167140,167141,7593,3953,34539,146212,146606,146818,168329,168330,168331,168332,168335,168337,168338,168868,168908,168909,168910,168911,168912,189354,189355,189356,3897,5,9965,190410,9987,14951,3686,9899,41,145799,42,146032,145977,145836,10089,3896,3540,3739,2867,14964,7,9,146192,9979,168340,3952,14967,190408,25,27,3567,35,3711,9984,3566,3620,3779,9986,3891,40,146063,48,50,54,145847,145984,59,3543,3510,2076,4,9974,125921,360948,146024,10,146206,3954,146065,24,3950,9892,9956,30,9890,3735,146210,3561,3647,167211,3485,3797,2068,39,146607,3889,3512,47,3748,3602,3731,9945,145793}
FINAL18=['CatBoost','DANet','DecisionTree','FTTransformer','KNN','LightGBM','LinearModel','MLP','MLP-rtdl','NODE','RandomForest','ResNet','SAINT','STG','SVM','TabNet','VIME','XGBoost']
CANON={'rtdl_FTTransformer':'FTTransformer','rtdl_MLP':'MLP-rtdl','rtdl_ResNet':'ResNet'}
B=10000; SEED=20260929

def tid(s):
    m=re.search(r'__(\d+)$',str(s)); return int(m.group(1)) if m else np.nan

def basename(s):
    x=re.sub(r'__\d+$','',str(s)); x=re.sub(r'^openml__','',x); return x

def normname(s):
    s=unicodedata.normalize('NFKD',str(s)).encode('ascii','ignore').decode().lower()
    s=re.sub(r'^openml','',s)
    return re.sub(r'[^a-z0-9]+','',s)

def bh(p):
    p=np.asarray(p,float); n=len(p); order=np.argsort(p); q=np.empty(n); prev=1.0
    for rank,idx in reversed(list(enumerate(order,start=1))):
        prev=min(prev,p[idx]*n/rank); q[idx]=prev
    return q

def boot(gi,go,seed):
    rng=np.random.default_rng(seed); est=float(go.mean()-gi.mean()); vals=np.empty(B); rev=np.empty(B,dtype=bool)
    for i in range(B):
        a=rng.choice(gi,len(gi),replace=True); b=rng.choice(go,len(go),replace=True)
        vals[i]=b.mean()-a.mean(); rev[i]=(np.sign(a.mean())!=np.sign(b.mean()) and a.mean()!=0 and b.mean()!=0)
    lo,hi=np.quantile(vals,[.025,.975]); centered=vals-est
    p=float((np.sum(np.abs(centered)>=abs(est))+1)/(B+1))
    return est,float(lo),float(hi),p,float(rev.mean())

def loo_retention(gi,go):
    base_rev=(np.sign(gi.mean())!=np.sign(go.mean()) and gi.mean()!=0 and go.mean()!=0)
    if not base_rev: return np.nan
    keep=0; total=0
    for k in range(len(gi)):
        x=np.delete(gi,k); total+=1; keep+=int(np.sign(x.mean())!=np.sign(go.mean()) and x.mean()!=0 and go.mean()!=0)
    for k in range(len(go)):
        y=np.delete(go,k); total+=1; keep+=int(np.sign(gi.mean())!=np.sign(y.mean()) and gi.mean()!=0 and y.mean()!=0)
    return keep/total

def pair_matrix(df,min_common=20):
    rows=[]
    for k,(a,b) in enumerate(itertools.combinations(FINAL18,2)):
        A=df[df.alg_name==a][['task_id','in_cc18','Accuracy__test_mean']].rename(columns={'Accuracy__test_mean':'ya'})
        C=df[df.alg_name==b][['task_id','Accuracy__test_mean']].rename(columns={'Accuracy__test_mean':'yb'})
        m=A.merge(C,on='task_id',how='inner').dropna()
        gi=(m[m.in_cc18].ya-m[m.in_cc18].yb).to_numpy(float)
        go=(m[~m.in_cc18].ya-m[~m.in_cc18].yb).to_numpy(float)
        r={'algorithm_a':a,'algorithm_b':b,'n_cc18_common':len(gi),'n_outside_common':len(go),'eligible':len(gi)>=min_common and len(go)>=min_common}
        if r['eligible']:
            di=float(gi.mean()); do=float(go.mean()); est,lo,hi,p,brp=boot(gi,go,SEED+k)
            rev=bool(np.sign(di)!=np.sign(do) and di!=0 and do!=0)
            r.update(delta_cc18=di,delta_outside=do,interaction_shift=est,ci_lo=lo,ci_hi=hi,bootstrap_p=p,
                     bootstrap_reversal_probability=brp,sign_reversal=rev,min_abs_contrast=min(abs(di),abs(do)),
                     strong_reversal_005=bool(rev and min(abs(di),abs(do))>=.005 and brp>=.8),
                     strong_reversal_010=bool(rev and min(abs(di),abs(do))>=.010 and brp>=.8),
                     loo_reversal_retention=loo_retention(gi,go))
        rows.append(r)
    z=pd.DataFrame(rows); mask=z.eligible==True
    z.loc[mask,'bootstrap_q_bh']=bh(z.loc[mask,'bootstrap_p'].values)
    return z

def prepare_broad(path):
    df=pd.read_csv(path); df['alg_name_raw']=df.alg_name; df['alg_name']=df.alg_name.replace(CANON)
    df['task_id']=df.dataset_name.map(tid); df=df[df.task_id.notna()].copy(); df.task_id=df.task_id.astype(int)
    df['dataset_base']=df.dataset_name.map(basename); df['norm_name']=df.dataset_base.map(normname); df['in_cc18']=df.task_id.isin(CC18)
    return df

def metadata_join_audit(df,meta,out):
    taskmap=df[['task_id','dataset_base','norm_name','in_cc18']].drop_duplicates()
    # exclude ambiguous name->multiple-task mappings in primary metadata analysis
    amb=taskmap.groupby('norm_name').task_id.nunique().rename('n_task_ids').reset_index()
    amb=amb[amb.n_task_ids>1]
    task_unique=taskmap[~taskmap.norm_name.isin(set(amb.norm_name))].copy()
    meta=meta.copy(); meta['meta_norm_name']=meta.dataset_name.map(normname)
    meta_dups=meta.groupby('meta_norm_name').size().rename('n_meta_rows').reset_index(); meta_amb=set(meta_dups[meta_dups.n_meta_rows>1].meta_norm_name)
    meta_unique=meta[~meta.meta_norm_name.isin(meta_amb)].copy()
    joined=task_unique.merge(meta_unique,left_on='norm_name',right_on='meta_norm_name',how='inner',suffixes=('_task','_meta'))
    joined.to_csv(out/'metafeature_joined_tasks.csv',index=False)
    amb.to_csv(out/'outcome_name_ambiguities.csv',index=False); meta_dups[meta_dups.n_meta_rows>1].to_csv(out/'meta_name_ambiguities.csv',index=False)
    unmatched=task_unique[~task_unique.norm_name.isin(set(meta_unique.meta_norm_name))]
    unmatched.to_csv(out/'metafeature_unmatched_tasks.csv',index=False)

    numeric=[]
    for c in joined.columns:
        if c in {'task_id','in_cc18'}: continue
        if pd.api.types.is_numeric_dtype(joined[c]): numeric.append(c)
    rows=[]
    for c in numeric:
        x=pd.to_numeric(joined.loc[joined.in_cc18,c],errors='coerce').replace([np.inf,-np.inf],np.nan).dropna().to_numpy()
        y=pd.to_numeric(joined.loc[~joined.in_cc18,c],errors='coerce').replace([np.inf,-np.inf],np.nan).dropna().to_numpy()
        if min(len(x),len(y))<10: continue
        vx=np.var(x,ddof=1); vy=np.var(y,ddof=1); sp=np.sqrt(((len(x)-1)*vx+(len(y)-1)*vy)/(len(x)+len(y)-2))
        smd=(x.mean()-y.mean())/sp if sp>0 else np.nan
        ks=ks_2samp(x,y); scale=np.nanstd(np.r_[x,y],ddof=1); wd=wasserstein_distance(x,y)
        rows.append({'feature':c,'n_cc18':len(x),'n_outside':len(y),'mean_cc18':x.mean(),'mean_outside':y.mean(),
                     'smd':smd,'abs_smd':abs(smd) if np.isfinite(smd) else np.nan,'ks_stat':float(ks.statistic),'ks_p':float(ks.pvalue),
                     'wasserstein_std':float(wd/scale) if scale>0 else np.nan})
    r=pd.DataFrame(rows)
    if len(r):
        r['ks_q_bh']=bh(r.ks_p.values); r=r.sort_values(['abs_smd','ks_stat'],ascending=False)
    r.to_csv(out/'metafeature_shift_all.csv',index=False)
    # Exclude obvious landmarking/model-performance proxy features for an interpretable selection slice.
    patt='landmark|relative|model|accuracy|f1|auc|logloss|score|time'
    interp=r[~r.feature.str.contains(patt,case=False,regex=True)].copy() if len(r) else r
    interp.head(250).to_csv(out/'metafeature_shift_interpretable.csv',index=False)
    return {
      'outcome_unique_task_names':int(taskmap.norm_name.nunique()),'outcome_ambiguous_names':int(len(amb)),
      'meta_unique_names':int(meta.meta_norm_name.nunique()),'meta_ambiguous_names':int(len(meta_amb)),
      'matched_tasks_primary':int(joined.task_id.nunique()),'matched_cc18':int(joined.loc[joined.in_cc18,'task_id'].nunique()),
      'matched_outside':int(joined.loc[~joined.in_cc18,'task_id'].nunique()),'unmatched_outcome_tasks':int(unmatched.task_id.nunique()),
      'numeric_features_tested':int(len(r)),'abs_smd_ge_05':int((r.abs_smd>=.5).sum()) if len(r) else 0,
      'abs_smd_ge_10':int((r.abs_smd>=1).sum()) if len(r) else 0,'ks_bh_q_lt_005':int((r.ks_q_bh<.05).sum()) if len(r) else 0,
      'top_interpretable':interp.head(25).to_dict('records') if len(interp) else []
    }

def default_coverage(path,tuned_tasks,out):
    d=pd.read_csv(path); d['alg_name_raw']=d.alg_name; d['alg_name']=d.alg_name.replace(CANON); d['task_id']=d.dataset_name.map(tid)
    d=d[d.task_id.notna()].copy(); d.task_id=d.task_id.astype(int); tasks=set(d.task_id.unique())
    cols=list(d.columns)
    likely=[c for c in cols if any(k in c.lower() for k in ['default','tuned','hparam','param','type','setting'])]
    profile={'rows':int(len(d)),'unique_tasks':len(tasks),'unique_algorithms':int(d.alg_name.nunique()),'columns':cols,
             'likely_setting_columns':likely,'extra_tasks_vs_tuned':sorted(tasks-set(tuned_tasks)),'missing_manifest177':sorted(MANIFEST177-tasks)}
    vc={}
    for c in likely:
        try: vc[c]=d[c].astype(str).value_counts(dropna=False).head(30).to_dict()
        except Exception: pass
    profile['likely_setting_value_counts']=vc
    missing6=sorted(MANIFEST177-set(tuned_tasks))
    d[d.task_id.isin(missing6)].to_csv(out/'default_hparams_rows_for_tuned_missing_tasks.csv',index=False)
    (out/'default_hparams_coverage.json').write_text(json.dumps(profile,indent=2,default=str))
    return profile

def main():
    root=Path('research/aistats_transport'); out=root/'results_corrected'; out.mkdir(parents=True,exist_ok=True)
    df=prepare_broad(root/'input/broad_tuned_aggregated_results.csv')
    present=sorted(set(FINAL18)&set(df.alg_name)); assert present==sorted(FINAL18), (present, sorted(set(FINAL18)-set(present)))
    pm=pair_matrix(df,20); pm.to_csv(out/'final18_pairwise_broad.csv',index=False); e=pm[pm.eligible==True].copy()
    assert len(e)==153, len(e)

    old=pd.read_csv(root/'results/pairwise_cc18_vs_outside_primary.csv')
    comp=old.merge(pm,on=['algorithm_a','algorithm_b'],suffixes=('_104','_171'))
    both=comp[(comp.eligible_104==True)&(comp.eligible_171==True)].copy(); comp['same_reversal_flag']=comp.sign_reversal_104==comp.sign_reversal_171
    rho=spearmanr(both.interaction_shift_out_minus_cc18,both.interaction_shift)
    comp.to_csv(out/'replication_104_vs_171_final18.csv',index=False)

    meta=pd.read_csv(root/'input/metafeatures.csv',low_memory=False)
    meta_summary=metadata_join_audit(df,meta,out)
    default_summary=default_coverage(root/'input/broad_with_default_hparams.csv',set(df.task_id),out)

    summary={
      'tuned_rows':int(len(df)),'tuned_unique_tasks':int(df.task_id.nunique()),'cc18_overlap':int(df.loc[df.in_cc18,'task_id'].nunique()),
      'outside_cc18':int(df.loc[~df.in_cc18,'task_id'].nunique()),'final18_all_present':True,'eligible_pairs':int(len(e)),
      'sign_reversals':int(e.sign_reversal.sum()),'reversal_fraction':float(e.sign_reversal.mean()),
      'strong_reversal_005':int(e.strong_reversal_005.sum()),'strong_reversal_010':int(e.strong_reversal_010.sum()),
      'ci_excludes_zero':int(((e.ci_lo>0)|(e.ci_hi<0)).sum()),'bh_q_lt_005':int((e.bootstrap_q_bh<.05).sum()),
      'median_loo_retention_reversals':float(e.loc[e.sign_reversal,'loo_reversal_retention'].median()),
      'reversal_flag_agreement_104_vs_171':float(comp.same_reversal_flag.mean()),
      'interaction_shift_spearman_104_vs_171':float(rho.statistic),'interaction_shift_spearman_p':float(rho.pvalue),
      'missing_manifest177_from_tuned':sorted(MANIFEST177-set(df.task_id)),'metadata':meta_summary,'default_hparams':default_summary
    }
    cols=['algorithm_a','algorithm_b','n_cc18_common','n_outside_common','delta_cc18','delta_outside','interaction_shift','ci_lo','ci_hi','bootstrap_q_bh','bootstrap_reversal_probability','min_abs_contrast','loo_reversal_retention','strong_reversal_005','strong_reversal_010']
    summary['reversal_pairs']=e[e.sign_reversal][cols].sort_values(['strong_reversal_005','bootstrap_q_bh'],ascending=[False,True]).to_dict('records')
    summary['strong_reversal_pairs_005']=e[e.strong_reversal_005][cols].sort_values('bootstrap_q_bh').to_dict('records')
    (out/'summary_corrected.json').write_text(json.dumps(summary,indent=2,default=str))
    report=['# Corrected 18-algorithm historical transport validation','',
      f"Tuned frame: {summary['tuned_unique_tasks']} task IDs = {summary['cc18_overlap']} CC18 + {summary['outside_cc18']} outside.",
      f"All 18 final algorithm identities canonicalized; {summary['eligible_pairs']}/153 pairs analyzable.",
      f"Sign reversals: {summary['sign_reversals']}/153 ({summary['reversal_fraction']:.1%}).",
      f"Strong reversals (.005 rule): {summary['strong_reversal_005']}; .010 rule: {summary['strong_reversal_010']}.",
      f"Interaction CIs excluding zero: {summary['ci_excludes_zero']}; BH q<.05: {summary['bh_q_lt_005']}.",
      f"104-vs-171 interaction-shift Spearman: {summary['interaction_shift_spearman_104_vs_171']:.3f}.",
      f"Metadata matched tasks: {meta_summary['matched_tasks_primary']} ({meta_summary['matched_cc18']} CC18 + {meta_summary['matched_outside']} outside).",
      f"Metadata features |SMD|>=0.5: {meta_summary['abs_smd_ge_05']}; BH-KS q<.05: {meta_summary['ks_bh_q_lt_005']}.",'',
      '## Strong reversal pairs','',pd.DataFrame(summary['strong_reversal_pairs_005']).to_markdown(index=False),'',
      '## Top interpretable selection-shift features','',pd.DataFrame(meta_summary['top_interpretable']).to_markdown(index=False) if meta_summary['top_interpretable'] else 'No matched features.']
    (out/'REPORT_CORRECTED.md').write_text('\n'.join(report))
    print(json.dumps(summary,indent=2,default=str))
if __name__=='__main__': main()
