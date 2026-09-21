#!/usr/bin/env python3
"""Use only the SDK's existing raw Requester; no SDK or converter modifications."""
import json,os
from github import Github,Auth
base=os.environ['MOCK_API_BASE'];version=os.environ['CONTRACT_VERSION']
g=Github(auth=Auth.Token('full'),base_url=base,api_version=version,seconds_between_requests=0,seconds_between_writes=0,retry=None)
_,payload=g.requester.requestJsonAndCheck('POST',base+'/repos/acme/infra/actions/workflows/deploy.yml/dispatches',input={'ref':'main','inputs':{'target':'production'},'return_run_details':True})
ident=payload['workflow_run_id']; _,status=g.requester.requestJsonAndCheck('GET',payload['run_url'])
print(json.dumps({'method':'original PyGithub Requester POST/GET','run_id':ident,'status':status['status'],'conclusion':status['conclusion']}))
g.close()
