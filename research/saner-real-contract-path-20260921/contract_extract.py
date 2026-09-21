#!/usr/bin/env python3
"""Download and inspect ORIGINAL vendor contracts. Extracted fixtures are explicitly NOT vendor originals."""
import hashlib,json,pathlib,urllib.request
O=pathlib.Path('contract_evidence');O.mkdir(exist_ok=True)
S={
 'azure_apim_2024':('Azure/azure-rest-api-specs','a5ad2d5901197028dc56f5685fa3f4e96cda9a55','specification/apimanagement/resource-manager/Microsoft.ApiManagement/ApiManagement/stable/2024-05-01/apimapis.json'),
 'github_2022':('github/rest-api-description','338cb199baa4f326790b0b1c246d8d4f481a82a0','descriptions/api.github.com/api.github.com.2022-11-28.json'),
 'github_2026':('github/rest-api-description','338cb199baa4f326790b0b1c246d8d4f481a82a0','descriptions/api.github.com/api.github.com.2026-03-10.json'),
 'google_run_v2':('googleapis/google-api-go-client','3b54280e94b227fc3b47639268d81018c8586e77','run/v2/run-api.json')}
def load(k):
 repo,rev,path=S[k];url=f'https://raw.githubusercontent.com/{repo}/{rev}/{path}'
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'saner-public-contract-research'}),timeout=90) as f:data=f.read()
 (O/f'{k}.json').write_bytes(data)
 print('ORIGINAL',k,len(data),hashlib.sha256(data).hexdigest(),url,flush=True)
 return json.loads(data),dict(repo=repo,ref=rev,path=path,url=url,sha256=hashlib.sha256(data).hexdigest())
a,am=load('azure_apim_2024');g22,m22=load('github_2022');g26,m26=load('github_2026');google,gm=load('google_run_v2')
def pick_azure(spec):
 candidates=[(p,i.get('delete')) for p,i in spec['paths'].items() if p.endswith('/apis/{apiId}') and 'delete' in i]
 assert len(candidates)==1,[(x[0],x[1].get('operationId')) for x in candidates]
 path,op=candidates[0];return dict(path=path,operationId=op.get('operationId'),responses=op.get('responses'),security=spec.get('securityDefinitions'),x_long_running=op.get('x-ms-long-running-operation'),parameters=op.get('parameters',[]))
def pick_git(spec):
 matches=[(p,i.get('post')) for p,i in spec['paths'].items() if p.endswith('/actions/workflows/{workflow_id}/dispatches') and 'post' in i]
 assert len(matches)==1
 path,op=matches[0]
 runs=[(p,i.get('get')) for p,i in spec['paths'].items() if p.endswith('/actions/runs/{run_id}') and 'get' in i]
 assert len(runs)==1
 return dict(path=path,dispatch_op=op.get('operationId'),dispatch_responses=op.get('responses'),dispatch_security=op.get('security'),run_get_path=runs[0][0],run_get_security=runs[0][1].get('security'),run_get_responses=runs[0][1].get('responses'))
def recurse(d,*keys):
 for k in keys:d=d[k]
 return d
job=recurse(google,'resources','projects','resources','locations','resources','jobs','methods','run')
operation=recurse(google,'resources','projects','resources','locations','resources','operations','methods','get')
summary={'azure':pick_azure(a),'github_2022':pick_git(g22),'github_2026':pick_git(g26),'google':{'run':job,'getOperation':operation,'operationSchema':google['schemas'].get('GoogleLongrunningOperation') or google['schemas'].get('Operation')},'sources':{'azure':am,'github_2022':m22,'github_2026':m26,'google':gm}}
(O/'contract_extract.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False))
for label in ['azure','github_2022','github_2026']:
 x=summary[label]
 print('EXTRACT',label,'path',x['path'],'response_keys',list((x.get('responses') or x.get('dispatch_responses') or {}).keys()),'run_get',x.get('run_get_path'),'long_running',x.get('x_long_running'),flush=True)
print('EXTRACT google',job.get('path'),job.get('response'),operation.get('path'),operation.get('scopes'),flush=True)
print('SOURCE_EXTRACTION_PASS')
