#!/usr/bin/env python3
"""Original Octokit Ruby before/PR-head code and identical real HTTP traces.
PR #1800 remains OPEN: this evaluates proposed code, not a released SDK.
"""
import json,os,sys,threading,subprocess,hashlib,pathlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
REV=os.environ['SDK_REV']; VERSION=os.environ['CONTRACT_VERSION']; MODE=os.environ['CALL_MODE']; LIB=os.environ['OCTOKIT_LIB'];OUT=pathlib.Path(os.environ['OUTPUT_FILE'])
EVENTS=[];COUNTER=0
class H(BaseHTTPRequestHandler):
 def log_message(self,*args):pass
 def reply(self,status,body=None):
  b=b'' if body is None else json.dumps(body).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(b)));self.send_header('X-GitHub-Api-Version-Selected',VERSION);self.end_headers();self.wfile.write(b)
 def do_POST(self):
  global COUNTER
  raw=self.rfile.read(int(self.headers.get('Content-Length','0')));params=json.loads(raw or b'{}');version=self.headers.get('X-GitHub-Api-Version');auth=self.headers.get('Authorization','');ev={'method':'POST','path':self.path,'version_header':version,'body':params,'authorized':auth.lower().endswith('full') or auth.lower().endswith('start-only')};EVENTS.append(ev)
  if not ev['authorized']:return self.reply(401,{'message':'Invalid fixture token'})
  if version!=VERSION:return self.reply(400,{'message':'Requested version differs from fixture','requested':version,'expected':VERSION})
  if self.path!='/repos/acme/infra/actions/workflows/deploy.yml/dispatches':return self.reply(404,{'message':'Unknown fixture operation'})
  COUNTER+=1;rid=91000+COUNTER;ev['created_run_id']=rid
  if params.get('return_run_details') or VERSION=='2026-03-10':return self.reply(200,{'workflow_run_id':rid,'run_url':f'http://127.0.0.1:{self.server.server_port}/repos/acme/infra/actions/runs/{rid}','html_url':f'https://github.com/acme/infra/actions/runs/{rid}'})
  return self.reply(204)
 def do_GET(self):
  version=self.headers.get('X-GitHub-Api-Version');auth=self.headers.get('Authorization','');ev={'method':'GET','path':self.path,'version_header':version,'authorized':auth.lower().endswith('full')};EVENTS.append(ev)
  if not ev['authorized']:return self.reply(403,{'message':'Fixture start permission but no run read permission'})
  if version!=VERSION:return self.reply(400,{'message':'Wrong API version'})
  prefix='/repos/acme/infra/actions/runs/'
  if not self.path.startswith(prefix):return self.reply(404,{'message':'Not found'})
  try:rid=int(self.path[len(prefix):])
  except ValueError:return self.reply(404)
  if rid<=91000 or rid>91000+COUNTER:return self.reply(404,{'message':'Unknown run'})
  return self.reply(200,{'id':rid,'status':'completed','conclusion':'failure' if rid==91002 else 'success','url':f'http://127.0.0.1:{self.server.server_port}{self.path}'})
srv=ThreadingHTTPServer(('127.0.0.1',0),H);threading.Thread(target=srv.serve_forever,daemon=True).start()
try:
 env={**os.environ,'MOCK_API_BASE':f'http://127.0.0.1:{srv.server_port}','SDK_REV':REV,'CONTRACT_VERSION':VERSION,'CALL_MODE':MODE}
 proc=subprocess.run(['ruby','-I',LIB,str(pathlib.Path(__file__).parent/'octokit_client.rb')],env=env,capture_output=True,text=True,timeout=40)
 summary={'original_code_modified':False,'live_github_called':False,'project':'Octokit Ruby','pr_merged':False,'original_commit':os.environ['ORIGINAL_SHA'],'revision':REV,'contract_version':VERSION,'mode':MODE,'sdk_source_hash':hashlib.sha256((pathlib.Path(LIB)/'octokit/client/actions_workflows.rb').read_bytes()).hexdigest(),'ruby_returncode':proc.returncode,'stderr':proc.stderr[-1600:],'server_events':EVENTS}
 if proc.returncode==0:
  lines=[x for x in proc.stdout.splitlines() if x.startswith('{')];summary['client_result']=json.loads(lines[-1]) if lines else {'parse_error':proc.stdout[-2000:]}
 else:summary['client_stdout']=proc.stdout[-3000:]
 summary['created_ids']=[ev['created_run_id'] for ev in EVENTS if 'created_run_id' in ev]
 summary['negotiated_contract_on_every_call']=bool(EVENTS) and all(ev['version_header']==VERSION for ev in EVENTS)
 OUT.parent.mkdir(exist_ok=True,parents=True);OUT.write_text(json.dumps(summary,indent=2)+'\n');print('RUBY_CASE',json.dumps(summary,ensure_ascii=False),flush=True)
 assert proc.returncode==0,('Ruby original client crashed',proc.stderr)
 assert summary['negotiated_contract_on_every_call'],'Octokit did not send intended version header'
 assert len(summary['created_ids'])==(2 if MODE in ('default_twice','details_two') else 1),'Dispatch failed to reach provider fixture'
finally:srv.shutdown();srv.server_close()
