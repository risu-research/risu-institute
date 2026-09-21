#!/usr/bin/env python3
import json,sys,collections,pathlib
p=pathlib.Path(sys.argv[1]);a=[json.loads(f.read_text()) for f in p.glob('*.json')]
assert len(a)==18,('Missing a designed condition',len(a))
d={(x['sdk_revision'],x['contract_version'],x['mode']):x for x in a}
def r(rev,version,mode):return d[(rev,version,mode)]
old='2022-11-28';new='2026-03-10'
assert len(set(x['workflow_source_sha256'] for x in a))==2
assert all(x['client_version_header_matches'] for x in a)
assert r('pre',old,'default')['calls'][0]['return_repr']=='True'
assert r('pre',new,'default')['calls'][0]['return_repr']=='False'
assert r('post',new,'default')['calls'][0]['return_repr']=='True'
assert r('post',new,'default')['exact_id_correlations']==0
assert r('post',new,'opt_in')['exact_id_correlations']==1
assert r('post',old,'opt_in')['exact_id_correlations']==1
assert r('post',new,'opt_in_two')['exact_id_correlations']==2
assert len(set(r('post',new,'opt_in_two')['server_created_ids']))==2
assert r('post',new,'default_twice')['exact_id_correlations']==0
assert r('post',new,'default_twice')['indistinguishable_dispatch_results']
assert r('post',new,'opt_in_denied')['calls'][0]['run_id']==81001
assert r('post',new,'opt_in_denied')['exact_id_correlations']==0
assert not any('dispatch_error' in c for x in a if x['mode'] not in ('opt_in_denied',) for c in x['calls'])
assert all(x['actual_live_github'] is False and x['original_library_source_modified'] is False for x in a)
report={'cases':len(a),'old_pre_default':r('pre',old,'default')['calls'][0],'new_pre_default':r('pre',new,'default')['calls'][0],'new_post_default':r('post',new,'default')['calls'][0],'new_post_opt_in':r('post',new,'opt_in')['calls'][0],'new_post_opt_in_denied':r('post',new,'opt_in_denied')['calls'][0],'all_contract_headers_explicit_and_correct':True,'separate_original_source_hashes':{k:r(k,old,'default')['workflow_source_sha256'] for k in ('pre','post')},'actual_live_github':False,'fixture_post_2026_old_sdk_false_negative':True,'old_and_new_success_when_2022_default':True,'new_sdk_opt_in_exact_link_and_completion':True,'new_sdk_default_id_lost_even_on_2026':True,'start_only_permission_cannot_prove_terminal_state':True}
(p/'summary.json').write_text(json.dumps(report,indent=2)+'\n')
print('SAME_REAL_SDK_BEFORE_AFTER_GATES_PASS',json.dumps(report,ensure_ascii=False))
