#!/usr/bin/env python3
import json,sys,pathlib
p=pathlib.Path(sys.argv[1]); rows=[json.loads(f.read_text()) for f in p.glob('*.json')]; assert len(rows)==18,len(rows)
d={(r['revision'],r['contract_version'],r['mode']):r for r in rows}
def item(rev,version,mode):return d[(rev,version,mode)]
a='2022-11-28';b='2026-03-10'
assert len(set(r['sdk_source_hash'] for r in rows))==2
assert all(r['original_code_modified'] is False and r['live_github_called'] is False and r['negotiated_contract_on_every_call'] for r in rows)
assert item('before',a,'default')['client_result']['calls'][0]['return_value'] is True
assert item('before',b,'default')['client_result']['calls'][0]['return_value'] is False
assert item('proposed',b,'default')['client_result']['calls'][0]['return_value'] is False
for version in [a,b]:
 for mode in ['details','details_two']:
  x=item('proposed',version,mode);calls=x['client_result']['calls'];assert len(calls)==(2 if mode=='details_two' else 1)
  assert all(c.get('run_id') in x['created_ids'] and c.get('run_status')=='completed' for c in calls)
  if mode=='details_two':assert [c['run_conclusion'] for c in calls]==['success','failure']
 x=item('before',version,'details');assert x['created_ids']==[91001] and not x['client_result']['calls'][0].get('run_id')
 x=item('proposed',version,'details_denied');assert x['client_result']['calls'][0].get('run_id')==91001 and 'followup_error' in x['client_result']['calls'][0]
for rev in ('before','proposed'):
 x=item(rev,b,'default_twice');assert x['created_ids']==[91001,91002] and all(not c.get('run_id') for c in x['client_result']['calls'])
summary={'designed_conditions':len(rows),'before_2026_default':item('before',b,'default')['client_result']['calls'][0],'proposed_2026_default':item('proposed',b,'default')['client_result']['calls'][0],'proposed_2026_opt_in':item('proposed',b,'details')['client_result']['calls'][0],'proposed_2026_mixed_conclusions':item('proposed',b,'details_two')['client_result']['calls'],'proposed_2026_denied':item('proposed',b,'details_denied')['client_result']['calls'][0],'real_original_sdk_code':True,'proposed_patch_is_not_merged':True,'actual_live_github':False,'original_source_hashes':{rev:item(rev,b,'default')['sdk_source_hash'] for rev in ('before','proposed')}}
(p/'summary.json').write_text(json.dumps(summary,indent=2)+'\n');print('ORIGINAL_RUBY_SDK_BEFORE_PROPOSED_GATES_PASS',json.dumps(summary))
