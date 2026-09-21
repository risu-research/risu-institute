import http from 'node:http';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {once} from 'node:events';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {OpenAPIServer} from './dist/bundle.js';

// Original vendor documents, hash-pinned by contract_extract.py, are NOT themselves
// directly passed to the converters: Swagger 2, OAS3 and Google Discovery are normalized
// to small SOURCE-DERIVED OpenAPI 3 fixtures. The two converter sources remain unchanged.
const directory=process.env.CONTRACT_DIR||'../contract_evidence';
const E=JSON.parse(fs.readFileSync(`${directory}/contract_extract.json`));
const A=JSON.parse(fs.readFileSync(`${directory}/azure_apim_2024.json`));
const G22=JSON.parse(fs.readFileSync(`${directory}/github_2022.json`));
const G26=JSON.parse(fs.readFileSync(`${directory}/github_2026.json`));
const GOOGLE=JSON.parse(fs.readFileSync(`${directory}/google_run_v2.json`));
const az=E.azure.path,gh=E.github_2022.path,ghget=E.github_2022.run_get_path;
const azget='/subscriptions/{subscriptionId}/providers/Microsoft.ApiManagement/locations/{location}/operationResults/{operationId}';
const googlerun='/v2/projects/{project}/locations/{location}/jobs/{job}:run',googleget='/v2/projects/{project}/locations/{location}/operations/{operation}';
const param=(name,location='path')=>({name,in:location,required:location==='path',schema:{type:'string'}});
function fixture(provider,base){
  const spec={openapi:'3.0.3',info:{title:'SOURCE-DERIVED subset; NOT the complete original vendor spec',version:'pinned'},servers:[{url:base}],paths:{}};
  if(provider==='azure'){
    const op=A.paths[az].delete;
    assert.equal(op['x-ms-long-running-operation'],true);assert.ok(op.responses['202'].headers['Azure-AsyncOperation']);
    spec.paths[az]={delete:{operationId:'azureDeleteApi',summary:op.description,parameters:['subscriptionId','resourceGroupName','serviceName','apiId'].map(x=>param(x)).concat(param('api-version','query'),param('If-Match','header')),responses:{'202':{description:op.responses['202'].description,headers:{'Azure-AsyncOperation':{schema:{type:'string'}},location:{schema:{type:'string'}}}},'204':{description:op.responses['204'].description}}}};
    // Monitor route is independently in Azure's original routes.tsp at the same pinned SHA.
    spec.paths[azget]={get:{operationId:'azureGetOperationResult',summary:'Get operation result, 202 pending / 200 complete',parameters:['subscriptionId','location','operationId'].map(x=>param(x)).concat(param('api-version','query')),responses:{'200':{description:'Operation completed'},'202':{description:'Operation pending'}}}};
  }else if(provider.startsWith('github')){
    const source=provider==='github22'?G22:G26,op=source.paths[gh].post;
    assert.deepEqual(Object.keys(op.responses).sort(),provider==='github22'?['200','204']:['200']);
    spec.paths[gh]={post:{operationId:'githubDispatch',summary:op.summary||'Dispatch workflow',parameters:['owner','repo','workflow_id'].map(x=>param(x)),requestBody:structuredClone(op.requestBody),responses:structuredClone(op.responses)}};
    spec.paths[ghget]={get:{operationId:'githubGetRun',summary:'Get specific workflow run',parameters:['owner','repo','run_id'].map(x=>param(x)),responses:{'200':{description:'Workflow run'}}}};
  }else{
    assert.equal(E.google.run.response.$ref,'GoogleLongrunningOperation');assert.equal(E.google.getOperation.httpMethod,'GET');assert.ok(GOOGLE.schemas.GoogleLongrunningOperation.properties.error);
    // Discovery flatPath is rendered as an OAS path without changing HTTP routing semantics.
    spec.paths[googlerun]={post:{operationId:'googleRunJob',summary:E.google.run.description,parameters:['project','location','job'].map(x=>param(x)),responses:{'200':{description:'GoogleLongrunningOperation',content:{'application/json':{schema:{type:'object'}}}}}}};
    spec.paths[googleget]={get:{operationId:'googleGetOperation',summary:E.google.getOperation.description,parameters:['project','location','operation'].map(x=>param(x)),responses:{'200':{description:'GoogleLongrunningOperation',content:{'application/json':{schema:{type:'object'}}}}}}};
  }
  return spec;
}
let state,requests=[];
const api=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://127.0.0.1');const path=u.pathname;
  requests.push({case:state?.id,method:req.method,path,query:u.search,auth:req.headers.authorization==='Bearer full'?'full':req.headers.authorization==='Bearer start'?'start':'missing'});
  const json=(status,data,headers={})=>{res.writeHead(status,{'Content-Type':'application/json',...headers});res.end(JSON.stringify(data));};
  if(!state)return json(500,{error:'no case'});
  if(!['Bearer full','Bearer start'].includes(req.headers.authorization))return json(401,{error:'no bearer authorization'});
  const starter=req.method===(state.provider==='azure'?'DELETE':'POST')&&path===state.startPath;
  if(starter){
    state.started++;
    if(state.provider==='azure'){
      if(req.headers['if-match']!=='*'||u.searchParams.get('api-version')!=='2024-05-01')return json(400,{error:'If-Match or api-version absent'});
      if(state.variant==='complete'){res.writeHead(204);return res.end();}
      const url=`http://127.0.0.1:${state.port}${state.monitorPath}?api-version=2024-05-01`;
      res.writeHead(202,{'Azure-AsyncOperation':url,location:url,'Content-Length':'0'});return res.end();
    }
    if(state.provider.startsWith('github')){
      const version=state.provider==='github22'?'2022-11-28':'2026-03-10';
      if(req.headers['x-github-api-version']!==version)return json(400,{error:'X-GitHub-Api-Version mismatch'});
      let text='';req.on('data',c=>text+=c);req.on('end',()=>{
        let input;try{input=JSON.parse(text);}catch{return json(400,{error:'invalid body'});}
        if(input.ref!=='main')return json(400,{error:'incorrect ref'});
        if(state.variant==='empty'){
          if(input.return_run_details!==false)return json(400,{error:'2022 false not requested'});
          res.writeHead(204);return res.end();
        }
        if(state.provider==='github22'&&input.return_run_details!==true)return json(400,{error:'2022 true not requested'});
        if(state.provider==='github26'&&'return_run_details' in input)return json(400,{error:'2026 contract has no such argument'});
        return json(200,{workflow_run_id:state.runId,run_url:`http://127.0.0.1:${state.port}${state.monitorPath}`,html_url:`https://github.com/example/repo/actions/runs/${state.runId}`});
      });return;
    }
    return json(200,{name:state.googleName,done:false});
  }
  if(req.method==='GET'&&path===state.monitorPath){
    if(req.headers.authorization!=='Bearer full')return json(403,{error:'synthetic principal has start permission but lacks read-operation permission'});
    state.reads++;
    if(state.provider==='azure'){
      if(u.searchParams.get('api-version')!=='2024-05-01')return json(400,{error:'missing API version'});
      if(state.reads===1){res.writeHead(202,{location:`http://127.0.0.1:${state.port}${state.monitorPath}?api-version=2024-05-01`});return res.end();}
      return json(200,{});
    }
    if(state.provider.startsWith('github'))return json(200,state.variant==='failure'?{id:state.runId,status:'completed',conclusion:'failure'}:state.reads>1?{id:state.runId,status:'completed',conclusion:'success'}:{id:state.runId,status:'in_progress',conclusion:null});
    return json(200,state.reads===1?{name:state.googleName,done:false}:state.variant==='failure'?{name:state.googleName,done:true,error:{code:7,message:'Synthetic job execution failed'}}:{name:state.googleName,done:true,response:{'@type':'type.googleapis.com/google.cloud.run.v2.Execution'}});
  }
  return json(404,{error:'no such operation ID or route'});
});
function unpack(r){
 if(r?.isError)return {error:true,text:(r.content||[]).map(c=>c.text||'').join(' '),raw:r};
 let data=r.structuredContent&&Object.keys(r.structuredContent).length?r.structuredContent:null;
 if(data===null){const t=(r.content||[]).filter(x=>x.type==='text').map(x=>x.text).join('\n');try{data=JSON.parse(t);}catch{data=t;}}
 return {data,raw:r};
}
function asBody(r){const x=r.data;return x&&typeof x==='object'&&'status' in x&&'headers' in x?{status:x.status,headers:x.headers,body:x.body}: {body:x};}
async function connect(which,spec,port,access){
 let client,server,ct,st;
 if(which==='ivo'){
  server=new OpenAPIServer({name:'unchanged-ivo',version:'1',apiBaseUrl:`http://127.0.0.1:${port}`,openApiSpec:'inline',specInputMethod:'inline',inlineSpecContent:JSON.stringify(spec),transportType:'stdio',toolsMode:'all',verbose:false,headers:{Authorization:`Bearer ${access}`}});
  [ct,st]=InMemoryTransport.createLinkedPair();await server.start(st);client=new Client({name:'source-matrix',version:'1'},{capabilities:{}});await client.connect(ct);
 }else{
  fs.writeFileSync('source_derived_proxy_spec.json',JSON.stringify(spec));
  ct=new StdioClientTransport({command:process.env.PROXY_BINARY,env:{...process.env,MCP_SPEC:`${process.cwd()}/source_derived_proxy_spec.json`,MCP_BASE_URL:`http://127.0.0.1:${port}`,MCP_TOOL_PREFIX:'api',MCP_AUTH_TOKEN:access}});
  client=new Client({name:'source-matrix',version:'1'},{capabilities:{}});await client.connect(ct);
 }
 const tools=(await client.listTools()).tools;
 let start,monitor;
 if(which==='ivo'){
   start=tools.find(t=>/^(del|post)-/.test(t.name));
   monitor=tools.find(t=>t.name.startsWith('get-'));
 }else{
   const list=tools.find(t=>/list_endpoints$/.test(t.name)),invoke=tools.find(t=>/call_endpoint$/.test(t.name));assert.ok(list&&invoke);
   const discovered=unpack(await client.callTool({name:list.name,arguments:{limit:100}})).data;
   const items=discovered.items||discovered.endpoints||[];
   start=items.find(t=>['POST','DELETE'].includes(String(t.method).toUpperCase()));
   monitor=items.find(t=>String(t.method).toUpperCase()==='GET');
   if(start&&monitor){start={name:invoke.name,toolName:start.toolName};monitor={name:invoke.name,toolName:monitor.toolName};}
 }
 assert.ok(start&&monitor,`Generated tools unresolved ${which} ${JSON.stringify(tools.map(t=>t.name))}`);
 return {tools:tools.map(t=>({name:t.name,inputSchema:t.inputSchema})),call:async(t,args)=>unpack(await client.callTool({name:t.name,arguments:which==='ivo'?args:{toolName:t.toolName,...args}})),start,monitor,close:async()=>{try{await client.close();}catch{}try{await st?.close();}catch{}try{await ct?.close();}catch{}}};
}
function beginArgs(c){
 if(c.provider==='azure')return {subscriptionId:'00000000-0000-0000-0000-000000000000',resourceGroupName:'rg',serviceName:'service',apiId:'example','api-version':'2024-05-01','If-Match':'*'};
 if(c.provider.startsWith('github'))return {owner:'example',repo:'repo',workflow_id:'workflow.yml',ref:'main',...(c.provider==='github22'?{return_run_details:c.variant!=='empty'}:{})};
 return {project:'test',location:'us-central1',job:'example'};
}
function getHandle(which,r,c){
 if(r.error)return {problem:'start tool error: '+r.text};
 const v=asBody(r),body=v.body;
 if(c.provider==='azure'){
   if(which==='ivo')return {problem:'HTTP status and operation header not visible in original empty-body MCP output'};
   if(v.status===204&&c.variant==='complete')return {initialComplete:true};
   const url=Object.entries(v.headers||{}).find(([key])=>key.toLowerCase()==='azure-asyncoperation')?.[1];
   if(v.status!==202||!url)return {problem:'Missing HTTP 202 and monitor URL'};
   const parsed=new URL(url),match=parsed.pathname.match(/\/operationResults\/([^/]+)$/);
   if(parsed.hostname!=='127.0.0.1'||!match)return {problem:'Cannot safely bind URL to operationId'};
   return {operationId:decodeURIComponent(match[1])};
 }
 if(c.provider.startsWith('github'))return Number.isInteger(body?.workflow_run_id)?{run_id:String(body.workflow_run_id)}:{problem:'No workflow_run_id in original response'};
 const matched=body?.name?.match(/^projects\/([^/]+)\/locations\/([^/]+)\/operations\/([^/]+)$/);
 return matched?{project:matched[1],location:matched[2],operation:matched[3]}:{problem:'No valid Google Operation.name'};
}
function getArgs(c,h){
 if(c.provider==='azure')return {subscriptionId:'00000000-0000-0000-0000-000000000000',location:'eastus',operationId:h.operationId,'api-version':'2024-05-01'};
 if(c.provider.startsWith('github'))return {owner:'example',repo:'repo',run_id:h.run_id};
 return {project:h.project,location:h.location,operation:h.operation};
}
function judge(which,r,c){
 if(r.error)return {result:'DENIED_OR_ERROR',detail:r.text};
 const v=asBody(r),b=v.body;
 if(c.provider==='azure')return {result:v.status===202?'PENDING':v.status===200?'SUCCESS':'UNKNOWN_STATUS_LOSS'};
 if(c.provider.startsWith('github'))return {result:b?.status==='completed'?b.conclusion==='success'?'SUCCESS':'FAILURE':b?.status?'PENDING':'UNKNOWN'};
 if(b?.name!==state.googleName)return {result:'UNKNOWN_WRONG_OPERATION'};
 return {result:b.done===false?'PENDING':b.done===true&&b.error?'FAILURE':b.done===true&&b.response?'SUCCESS':'UNKNOWN'};
}
const design=[{provider:'azure',variant:'async'},{provider:'azure',variant:'complete'},{provider:'github22',variant:'empty'},{provider:'github22',variant:'details'},{provider:'github26',variant:'details'},{provider:'github26',variant:'failure'},{provider:'google',variant:'success'},{provider:'google',variant:'failure'}];
const rows=[];
try{
 api.listen(0,'127.0.0.1');await once(api,'listening');const port=api.address().port;
 for(const c of design)for(const access of ['full','start'])for(const which of ['ivo','proxy']){
  const id=`${c.provider}-${c.variant}-${access}-${which}`,token=randomBytes(12).toString('hex'),runId=200000+rows.length;
  const startPath=c.provider==='azure'?'/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg/providers/Microsoft.ApiManagement/service/service/apis/example':c.provider.startsWith('github')?'/repos/example/repo/actions/workflows/workflow.yml/dispatches':'/v2/projects/test/locations/us-central1/jobs/example:run';
  const googleName=`projects/test/locations/us-central1/operations/${token}`;
  const monitorPath=c.provider==='azure'?`/subscriptions/00000000-0000-0000-0000-000000000000/providers/Microsoft.ApiManagement/locations/eastus/operationResults/${token}`:c.provider.startsWith('github')?`/repos/example/repo/actions/runs/${runId}`:`/v2/${googleName}`;
  state={...c,id,port,token,runId,googleName,startPath,monitorPath,started:0,reads:0};
  let con=null;const row={id,...c,access,converter:which,realVendorCalled:false,sourceDerivedFixture:true};
  try{
   con=await connect(which,fixture(c.provider,`http://127.0.0.1:${port}`),port,access);row.tools=con.tools;
   const first=await con.call(con.start,{...beginArgs(c),...(c.provider.startsWith('github')?{'X-GitHub-Api-Version':c.provider==='github22'?'2022-11-28':'2026-03-10'}:{})});row.startObservation=first.raw;
   const handle=getHandle(which,first,c);row.handle=handle;
   if(state.started!==1){row.outcome='START_NOT_EXECUTED';}
   else if(handle.initialComplete){row.outcome='SUCCESS';row.successEvidence='Original HTTP 204 preserved';}
   else if(handle.problem){row.outcome='UNKNOWN';row.reason=handle.problem;}
   else{
    row.polls=[];
    for(let i=0;i<3;i++){
     const args={...getArgs(c,handle),...(c.provider.startsWith('github')?{'X-GitHub-Api-Version':c.provider==='github22'?'2022-11-28':'2026-03-10'}:{})};
     const response=await con.call(con.monitor,args);const verdict=judge(which,response,c);row.polls.push({args,result:response.raw,verdict});
     if(verdict.result!=='PENDING')break;
    }
    row.outcome=row.polls.at(-1).verdict.result;
   }
   row.requests=requests.filter(x=>x.case===id);row.reads=state.reads;
   if(row.outcome==='SUCCESS'&&access==='start'&&c.variant!=='complete')throw Error('False success with no read permission');
   if(row.outcome==='SUCCESS'&&['failure','empty'].includes(c.variant))throw Error('False success in failed/ID-less operation');
   console.log('CASE',JSON.stringify({id,outcome:row.outcome,started:state.started,reads:state.reads,reason:row.reason||''}));
  }catch(e){row.outcome='ERROR';row.reason=e.stack||String(e);console.error('CASE_ERROR',id,String(e));}
  finally{try{await con?.close();}catch{}}
  row.requests??=requests.filter(x=>x.case===id);rows.push(row);
 }
 const tally=Object.fromEntries([...new Set(rows.map(r=>r.outcome))].map(outcome=>[outcome,rows.filter(r=>r.outcome===outcome).length]));
 const summary={count:rows.length,tally,originalVendorSources:E.sources,originalConverterCommits:{ivo:'5cc37bc4df8de5bf1d1327a1017dcfd1d2165f3f',proxy:process.env.PROXY_SHA},originalConvertersModified:false,realVendorCalled:false,liveIAMTest:false,actualMCP:true,sourceDerivedSubsetNotOriginalSpec:true};
 fs.writeFileSync('../full_path_matrix_results.json',JSON.stringify({summary,cases:rows,requests},null,2));console.log('SUMMARY',JSON.stringify(summary));
 assert.equal(rows.length,32);assert.equal(tally.ERROR||0,0,'Any converter/harness error is a non-pass');
 assert.equal(rows.filter(r=>r.converter==='proxy'&&r.access==='full'&&r.variant==='details').every(r=>r.outcome==='SUCCESS'),true);
 console.log('REAL_CONVERTER_MATRIX_PASS');
}catch(e){console.error('MATRIX_FAILED',e.stack||e);process.exitCode=1;}
finally{if(api.listening)await new Promise(r=>api.close(r));}
