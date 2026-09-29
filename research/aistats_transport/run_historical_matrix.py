#!/usr/bin/env python3
from pathlib import Path
import itertools, json, math, re
import numpy as np
import pandas as pd
from scipy.stats import spearmanr, kendalltau

CC18 = {
3,6,11,12,14,15,16,18,22,23,28,29,31,32,37,43,45,49,53,219,
2074,2079,3021,3022,3481,3549,3560,3573,3902,3903,3904,3913,3917,3918,
7592,9910,9946,9952,9957,9960,9964,9971,9976,9977,9978,9981,9985,
10093,10101,14952,14954,14965,14969,14970,125920,125922,146195,
146800,146817,146819,146820,146821,146822,146824,146825,167119,
167120,167121,167124,167125,167140,167141
}
assert len(CC18)==72

RNG_SEED=20260929
B=10000
MIN_COMMON=20


def task_id(s):
    m=re.search(r'__(\d+)$', str(s))
    return int(m.group(1)) if m else np.nan

def base_name(s):
    return re.sub(r'__\d+$','',str(s)).replace('openml__','')

def bh_qvalues(p):
    p=np.asarray(p,float)
    n=len(p); order=np.argsort(p); q=np.empty(n,float); prev=1.0
    for rank, idx in reversed(list(enumerate(order, start=1))):
        val=min(prev, p[idx]*n/rank)
        q[idx]=val; prev=val
    return q

def bootstrap_two_group(g_in,g_out,seed):
    rng=np.random.default_rng(seed)
    est=float(np.mean(g_out)-np.mean(g_in))
    vals=np.empty(B)
    for i in range(B):
        vals[i]=rng.choice(g_out,len(g_out),replace=True).mean()-rng.choice(g_in,len(g_in),replace=True).mean()
    lo,hi=np.quantile(vals,[.025,.975])
    # two-sided centered bootstrap p-value for H0 shift=0
    centered=vals-est
    p=float((np.sum(np.abs(centered)>=abs(est))+1)/(B+1))
    return est,float(lo),float(hi),p,float(np.mean(vals>0)),float(np.mean(vals<0))

def pairwise(df, metric='Accuracy__test_mean', exclude_duplicate_bases=False):
    d=df.copy()
    if exclude_duplicate_bases:
        counts=d[['task_id','dataset_base']].drop_duplicates().groupby('dataset_base').task_id.nunique()
        bad=set(counts[counts>1].index)
        d=d[~d.dataset_base.isin(bad)]
    algs=sorted(d.alg_name.unique())
    rows=[]
    for k,(a,b) in enumerate(itertools.combinations(algs,2)):
        A=d[d.alg_name==a][['task_id','in_cc18',metric]].rename(columns={metric:'ya'})
        C=d[d.alg_name==b][['task_id',metric]].rename(columns={metric:'yb'})
        m=A.merge(C,on='task_id').dropna()
        gi=(m[m.in_cc18].ya-m[m.in_cc18].yb).to_numpy(float)
        go=(m[~m.in_cc18].ya-m[m.in_cc18==False].yb).to_numpy(float)
        row={'algorithm_a':a,'algorithm_b':b,'n_cc18_common':len(gi),'n_outside_common':len(go)}
        if len(gi)>=MIN_COMMON and len(go)>=MIN_COMMON:
            di=float(gi.mean()); do=float(go.mean())
            est,lo,hi,p,ppos,pneg=bootstrap_two_group(gi,go,RNG_SEED+k)
            row.update({
                'eligible':True,'delta_cc18':di,'delta_outside':do,
                'interaction_shift_out_minus_cc18':est,
                'interaction_ci_lo':lo,'interaction_ci_hi':hi,'bootstrap_p':p,
                'sign_reversal':bool(np.sign(di)!=np.sign(do) and di!=0 and do!=0),
                'bootstrap_prob_shift_positive':ppos,'bootstrap_prob_shift_negative':pneg,
                'cc18_sd':float(np.std(gi,ddof=1)),'outside_sd':float(np.std(go,ddof=1)),
                'cc18_median':float(np.median(gi)),'outside_median':float(np.median(go))
            })
        else:
            row.update({'eligible':False,'sign_reversal':False})
        rows.append(row)
    out=pd.DataFrame(rows)
    mask=out.eligible.fillna(False)
    if mask.any():
        out.loc[mask,'bootstrap_q_bh']=bh_qvalues(out.loc[mask,'bootstrap_p'].values)
    return out

def complete_case_rank(df):
    algs=sorted(df.alg_name.unique())
    pivot=df.pivot_table(index='task_id',columns='alg_name',values='Accuracy__test_mean',aggfunc='mean')
    complete=pivot.dropna(subset=algs)
    mem=df[['task_id','in_cc18']].drop_duplicates().set_index('task_id').in_cc18
    ans={}
    for flag,label in [(True,'cc18'),(False,'outside')]:
        q=complete[mem.reindex(complete.index).fillna(False).values==flag]
        means=q.mean(axis=0).sort_values(ascending=False)
        ans[label]={'n_tasks':int(len(q)),'means':means.to_dict(),'rank_order':list(means.index)}
    common=set(ans['cc18']['means']).intersection(ans['outside']['means'])
    x=np.array([ans['cc18']['means'][a] for a in common]); y=np.array([ans['outside']['means'][a] for a in common])
    rho=spearmanr(x,y); tau=kendalltau(x,y)
    ans['concordance']={'spearman_rho':float(rho.statistic),'spearman_p':float(rho.pvalue),
                        'kendall_tau':float(tau.statistic),'kendall_p':float(tau.pvalue)}
    return ans

def main():
    src=Path('research/aistats_transport/input/tuned_aggregated_results.csv')
    outdir=Path('research/aistats_transport/results')
    outdir.mkdir(parents=True,exist_ok=True)
    df=pd.read_csv(src)
    df['task_id']=df.dataset_name.map(task_id)
    df=df[df.task_id.notna()].copy(); df['task_id']=df.task_id.astype(int)
    df['dataset_base']=df.dataset_name.map(base_name)
    df['in_cc18']=df.task_id.isin(CC18)

    task_table=df[['task_id','dataset_name','dataset_base','in_cc18']].drop_duplicates().sort_values('task_id')
    task_table.to_csv(outdir/'task_manifest_from_cleaned_results.csv',index=False)

    dup=(task_table.groupby('dataset_base').agg(n_task_ids=('task_id','nunique'),
          task_ids=('task_id',lambda x:';'.join(map(str,sorted(set(x))))),
          cc18_states=('in_cc18',lambda x:';'.join(map(str,sorted(set(x))))))
          .reset_index())
    dup=dup[dup.n_task_ids>1].sort_values(['n_task_ids','dataset_base'],ascending=[False,True])
    dup.to_csv(outdir/'duplicate_dataset_bases.csv',index=False)

    coverage=(df.groupby('alg_name').agg(rows=('task_id','size'),unique_tasks=('task_id','nunique'),
              cc18_tasks=('in_cc18','sum')).reset_index())
    # true unique CC18 task count per algorithm
    coverage['cc18_tasks']=coverage.alg_name.map(lambda a: df[(df.alg_name==a)&df.in_cc18].task_id.nunique())
    coverage['outside_tasks']=coverage.alg_name.map(lambda a: df[(df.alg_name==a)&(~df.in_cc18)].task_id.nunique())
    coverage.to_csv(outdir/'algorithm_coverage.csv',index=False)

    primary=pairwise(df,exclude_duplicate_bases=False)
    primary.to_csv(outdir/'pairwise_cc18_vs_outside_primary.csv',index=False)
    dedup=pairwise(df,exclude_duplicate_bases=True)
    dedup.to_csv(outdir/'pairwise_cc18_vs_outside_excluding_duplicate_bases.csv',index=False)

    elig=primary[primary.eligible==True].copy()
    eligd=dedup[dedup.eligible==True].copy()
    stable=elig[['algorithm_a','algorithm_b','sign_reversal']].merge(
        eligd[['algorithm_a','algorithm_b','sign_reversal']],on=['algorithm_a','algorithm_b'],suffixes=('_primary','_dedup'))
    stable['reversal_stable_to_dedupe']=stable.sign_reversal_primary & stable.sign_reversal_dedup
    stable.to_csv(outdir/'reversal_stability_dedupe.csv',index=False)

    rank=complete_case_rank(df)
    (outdir/'complete_case_rank_summary.json').write_text(json.dumps(rank,indent=2))

    summary={
      'source_rows':int(len(df)),
      'unique_task_ids':int(df.task_id.nunique()),
      'paper_reported_datasets':176,
      'cc18_overlap_task_ids':int(task_table[task_table.in_cc18].task_id.nunique()),
      'outside_cc18_task_ids':int(task_table[~task_table.in_cc18].task_id.nunique()),
      'missing_cc18_task_ids':sorted(CC18-set(task_table.task_id)),
      'algorithms':int(df.alg_name.nunique()),
      'algorithm_names':sorted(df.alg_name.unique()),
      'duplicate_dataset_bases_n':int(len(dup)),
      'primary_eligible_pairs':int(len(elig)),
      'primary_sign_reversals':int(elig.sign_reversal.sum()),
      'primary_reversal_fraction':float(elig.sign_reversal.mean()) if len(elig) else None,
      'primary_interactions_ci_excludes_zero':int(((elig.interaction_ci_lo>0)|(elig.interaction_ci_hi<0)).sum()),
      'primary_interactions_bh_q_lt_005':int((elig.bootstrap_q_bh<.05).sum()),
      'dedup_eligible_pairs':int(len(eligd)),
      'dedup_sign_reversals':int(eligd.sign_reversal.sum()),
      'stable_reversals_after_dedupe':int(stable.reversal_stable_to_dedupe.sum()),
      'rank_concordance_complete_case':rank['concordance']
    }
    # strongest shifts and reversals
    cols=['algorithm_a','algorithm_b','n_cc18_common','n_outside_common','delta_cc18','delta_outside',
          'interaction_shift_out_minus_cc18','interaction_ci_lo','interaction_ci_hi','bootstrap_p','bootstrap_q_bh','sign_reversal']
    summary['top_abs_interaction_shifts']=elig.assign(abs_shift=elig.interaction_shift_out_minus_cc18.abs()).sort_values('abs_shift',ascending=False).head(20)[cols].to_dict('records')
    summary['sign_reversal_pairs']=elig[elig.sign_reversal][cols].sort_values('bootstrap_q_bh').to_dict('records')
    (outdir/'summary.json').write_text(json.dumps(summary,indent=2))

    # Human-readable audit
    lines=['# Historical task-level CC18 transport audit','',
      f"Rows: {summary['source_rows']}",f"Unique task IDs in cleaned results: {summary['unique_task_ids']}",
      f"CC18 overlap: {summary['cc18_overlap_task_ids']}; outside CC18: {summary['outside_cc18_task_ids']}",
      f"Algorithms: {summary['algorithms']}",f"Eligible algorithm pairs: {summary['primary_eligible_pairs']}",
      f"Sign reversals: {summary['primary_sign_reversals']} ({summary['primary_reversal_fraction']:.1%})",
      f"Interaction bootstrap CIs excluding zero: {summary['primary_interactions_ci_excludes_zero']}",
      f"BH q<.05 interactions: {summary['primary_interactions_bh_q_lt_005']}",
      f"Stable reversals after excluding duplicated dataset-base names: {summary['stable_reversals_after_dedupe']}",'',
      '## Reversal pairs','']
    if len(summary['sign_reversal_pairs']):
        lines.append(pd.DataFrame(summary['sign_reversal_pairs']).to_markdown(index=False))
    (outdir/'REPORT.md').write_text('\n'.join(lines))
    print(json.dumps(summary,indent=2))

if __name__=='__main__': main()
