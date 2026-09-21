#!/usr/bin/env python3
"""Native raw SDK baselines: original pre-change Python/Ruby clients, actual HTTP, source-derived version behavior.
No external workflow dispatched, no source patches or new converter.
"""
import os,subprocess,threading,json,hashlib,pathlib
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
ROOT=pathlib.Path(os.environ['GITHUB_WORKSPACE']); HERE=pathlib.Path(__file__).parent;OUT=ROOT/'native_results';OUT.mkdir(exist_ok=True)
EVENTS=[];SEQ=0; VERSION='2022-11-28'
class H(BaseHTTPRequestHandler):
 def log_message(self,*a):pass
 def ret(self,status,body=None):
  b=b'' if body is None else json.dumps(body).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(b)));self.send_header('X-GitHub-Api-Version-Selected',VERSION);self.end_headers();self.wfile.write(b)
 def do_POST(self):
  global SEQ
  params=json.loads(self.rfile.read(int(self.headers.get('Content-Length','0'))) or '{}')
  ver=self.headers.get('X-GitHub-Api-Version');event={'method':'POST','path':self.path,'version':ver,'body':params};EVENTS.append(event)
  if ver!=VERSION:return self.ret(400,{'message':'Unexpected header version'})
  if self.path!='/repos/acme/infra/actions/workflows/deploy.yml/dispatches':return self.ret(404)
  SEQ+=1;rid=93000+SEQ;event['created_id']=rid
  if VERSION=='2022-11-28' and not params.get('return_run_details'):return self.ret(204)
  return self.ret(200,{'workflow_run_id':rid,'run_url':f'http://127.0.0.1:{self.server.server_port}/repos/acme/infra/actions/runs/{rid}','html_url':f'https://github.com/acme/infra/actions/runs/{rid}'})
 def do_GET(self):
  ver=self.headers.get('X-GitHub-Api-Version');event={'method':'GET','path':self.path,'version':ver};EVENTS.append(event)
  if ver!=VERSION:return self.ret(400,{'message':'Unexpected header version'})
  if not self.path.startswith('/repos/acme/infra/actions/runs/'):return self.ret(404)
  try:rid=int(self.path.rsplit('/',1)[-1])
  except ValueError:return self.ret(404)
  if rid not in [x.get('created_id') for x in EVENTS]:return self.ret(404)
  return self.ret(200,{'id':rid,'status':'completed','conclusion':'success'})
s=ThreadingHTTPServer(('127.0.0.1',0),H);threading.Thread(target=s.serve_forever,daemon=True).start()
try:
 rows=[]
 for language in ('py','ruby'):
  for version in ('2022-11-28','2026-03-10'):
   VERSION=version; start=len(EVENTS)
   env={**os.environ,'MOCK_API_BASE':f'http://127.0.0.1:{s.server_port}','CONTRACT_VERSION':version}
   if language=='py':
    env['PYTHONPATH']=str(ROOT/'py_pre');cmd=['python',str(HERE/'native_pygithub_client.py')]
    source=ROOT/'py_pre/github/Workflow.py'
   else:
    cmd=['ruby','-I',str(ROOT/'octo_before/lib'),str(HERE/'native_octokit_client.rb')]
    source=ROOT/'octo_before/lib/octokit/client/actions_workflows.rb'
   p=subprocess.run(cmd,env=env,capture_output=True,text=True,timeout=50)
   case={'language':language,'api_version':version,'unmodified_pre_change_sdk':True,'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'exit_code':p.returncode,'stderr':p.stderr[-1300:],'http_events':EVENTS[start:]}
   if p.returncode==0:
    lines=[t for t in p.stdout.splitlines() if t.startswith('{')];case['client']=json.loads(lines[-1]) if lines else {'stdout':p.stdout[-1400:]}
   else:case['stdout']=p.stdout[-2500:]
   rows.append(case);print('NATIVE_BASELINE',json.dumps(case),flush=True)
   assert p.returncode==0,(language,version,p.stderr)
   assert len(case['http_events'])==2 and [x['method'] for x in case['http_events']]==['POST','GET']
   assert all(x['version']==version for x in case['http_events'])
   assert case['http_events'][0]['body']['return_run_details'] is True
   assert case['http_events'][0]['created_id']==case['client']['run_id']
   assert case['http_events'][1]['path'].endswith('/'+str(case['client']['run_id']))
   assert case['client']['status']=='completed' and case['client']['conclusion']=='success'
 (OUT/'native_before_change_sdk_results.json').write_text(json.dumps(rows,indent=2)+'\n')
 print('NATIVE_EXISTING_SDK_NO_NEW_CONVERTER_PASS',len(rows))
finally:s.shutdown();s.server_close()
