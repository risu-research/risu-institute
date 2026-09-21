#!/usr/bin/env python3
"""Unmodified PyGithub source at PR #3471 parent and merge, real HTTP against an isolated provider-contract fixture.
No GitHub workflow is dispatched on the live service. Each invocation is an independent Python process.
"""
import json,os,sys,threading,hashlib,inspect
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path

REV=os.environ['SDK_REV']
CONTRACT=os.environ['CONTRACT_VERSION']
MODE=os.environ.get('CALL_MODE','default')
TOKEN=os.environ.get('TEST_TOKEN','full')
OUT=Path(os.environ['OUTPUT_FILE'])
EVENTS=[]
COUNTER=0
class Handler(BaseHTTPRequestHandler):
    def log_message(self,*a):pass
    def answer(self,status,obj=None):
        data=b'' if obj is None else json.dumps(obj).encode()
        self.send_response(status)
        self.send_header('Content-Type','application/json')
        self.send_header('Content-Length',str(len(data)))
        self.send_header('X-GitHub-Api-Version-Selected',CONTRACT)
        self.end_headers()
        if data:self.wfile.write(data)
    def do_POST(self):
        global COUNTER
        n=int(self.headers.get('Content-Length','0'))
        body=json.loads(self.rfile.read(n) or b'{}')
        auth=self.headers.get('Authorization','')
        requested=self.headers.get('X-GitHub-Api-Version')
        event={'method':'POST','path':self.path,'body':body,'api_version_header':requested,'authorized':auth.lower().endswith('full') or auth.lower().endswith('start-only')}
        EVENTS.append(event)
        if not event['authorized']:return self.answer(401,{'message':'Invalid fixture token'})
        if requested != CONTRACT:return self.answer(400,{'message':'Fixture expects explicitly selected API version','received':requested,'expected':CONTRACT})
        if self.path!='/repos/acme/infra/actions/workflows/deploy.yml/dispatches':return self.answer(404,{'message':'Not found'})
        COUNTER+=1
        run_id=81000+COUNTER
        event['created_run_id']=run_id
        details=bool(body.get('return_run_details')) or CONTRACT=='2026-03-10'
        return self.answer(200,{'workflow_run_id':run_id,'run_url':f'http://127.0.0.1:{self.server.server_port}/repos/acme/infra/actions/runs/{run_id}','html_url':f'https://github.com/acme/infra/actions/runs/{run_id}'}) if details else self.answer(204)
    def do_GET(self):
        auth=self.headers.get('Authorization','')
        version=self.headers.get('X-GitHub-Api-Version')
        event={'method':'GET','path':self.path,'api_version_header':version,'authorized':auth.lower().endswith('full')}
        EVENTS.append(event)
        if not event['authorized']:return self.answer(403,{'message':'Fixture: start allowed, run read denied'})
        if version!=CONTRACT:return self.answer(400,{'message':'Wrong API version'})
        prefix='/repos/acme/infra/actions/runs/'
        if not self.path.startswith(prefix):return self.answer(404,{'message':'Unknown path'})
        try:rid=int(self.path[len(prefix):])
        except ValueError:return self.answer(404)
        if not 81000<rid<=81000+COUNTER:return self.answer(404,{'message':'Unknown run'})
        return self.answer(200,{'id':rid,'url':f'http://127.0.0.1:{self.server.server_port}{self.path}','status':'completed','conclusion':'success'})

srv=ThreadingHTTPServer(('127.0.0.1',0),Handler)
th=threading.Thread(target=srv.serve_forever,daemon=True);th.start()
base=f'http://127.0.0.1:{srv.server_port}'
result={'sdk_revision':REV,'contract_version':CONTRACT,'mode':MODE,'token_mode':TOKEN,'actual_live_github':False,'original_library_source_modified':False}
try:
    import github
    from github import Github,Auth
    from github.Workflow import Workflow
    from github.WorkflowRun import WorkflowRun
    version_file=Path(github.__file__).parent/'Workflow.py'
    result['actual_library_path']=str(version_file)
    result['workflow_source_sha256']=hashlib.sha256(version_file.read_bytes()).hexdigest()
    result['create_dispatch_signature']=str(inspect.signature(Workflow.create_dispatch))
    client=Github(auth=Auth.Token(TOKEN),base_url=base,api_version=CONTRACT,seconds_between_requests=0,seconds_between_writes=0,retry=None)
    obj=Workflow(client.requester,headers={},attributes={'url':base+'/repos/acme/infra/actions/workflows/deploy.yml','id':12,'name':'deploy'},completed=False)
    kwargs={'inputs':{'target':'production'}}
    if MODE in ('opt_in','opt_in_two','opt_in_denied'):kwargs['return_run_details']=True
    if MODE=='throw':kwargs['throw']=True
    count=2 if MODE in ('default_twice','opt_in_two') else 1
    calls=[]
    for i in range(count):
        record={'index':i}
        try:
            r=obj.create_dispatch('main',**kwargs)
            record.update({'return_type':type(r).__name__,'return_repr':str(r) if isinstance(r,bool) else 'WorkflowRun','returned_false':r is False,'run_id':None})
            if isinstance(r,WorkflowRun):
                record['run_id']=r.id
                record['run_url']=r.url
                try:
                    record['run_status']=r.status
                    record['run_conclusion']=r.conclusion
                except Exception as exc:record['followup_error']=type(exc).__name__+': '+str(exc)[:180]
        except Exception as exc:record['dispatch_error']=type(exc).__name__+': '+str(exc)[:180]
        calls.append(record)
    result['calls']=calls
    result['server_events']=EVENTS
    result['server_created_ids']=[x['created_run_id'] for x in EVENTS if x['method']=='POST' and 'created_run_id' in x]
    result['client_version_header_matches']=all(x['api_version_header']==CONTRACT for x in EVENTS)
    result['exact_id_correlations']=sum(x.get('run_id') in result['server_created_ids'] and x.get('run_status')=='completed' and x.get('run_conclusion')=='success' for x in calls)
    result['false_negative_count']=sum(x.get('returned_false') for x in calls if x['index'] < len(result['server_created_ids']))
    result['indistinguishable_dispatch_results']=count==2 and all(x.get('return_type')=='bool' and x.get('return_repr')=='True' for x in calls)
    client.close()
finally:srv.shutdown();srv.server_close()
OUT.parent.mkdir(parents=True,exist_ok=True)
OUT.write_text(json.dumps(result,indent=2)+'\n')
print('SDK_CASE',json.dumps({k:v for k,v in result.items() if k not in ('server_events','create_dispatch_signature','actual_library_path','workflow_source_sha256')},ensure_ascii=False),flush=True)
assert result['client_version_header_matches'],'API version was not actually negotiated in original SDK requests'
assert len(result['server_created_ids'])==(2 if MODE in ('default_twice','opt_in_two') else 1),'Dispatch did not reach HTTP fixture'
if REV=='pre' and CONTRACT=='2026-03-10' and MODE=='default':assert result['false_negative_count']==1
if REV=='post' and CONTRACT=='2026-03-10' and MODE=='default':assert result['calls'][0]['return_repr']=='True' and result['exact_id_correlations']==0
if REV=='post' and MODE in ('opt_in','opt_in_two') and TOKEN=='full':assert result['exact_id_correlations']==len(result['calls'])
if REV=='post' and MODE=='opt_in_denied':assert result['calls'][0]['run_id']==81001 and 'followup_error' in result['calls'][0]
print('SDK_CASE_GATES_PASS',REV,CONTRACT,MODE,flush=True)
