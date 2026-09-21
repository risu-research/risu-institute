import http from 'node:http';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { OpenAPIServer } from './dist/bundle.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

// Isolated fixture inspired by Azure API Management's documented 202/204 contract.
// Upstream source is the exact unmodified commit in the GitHub Actions workflow.
// Stable status, audit, and resource read are SYNTHETIC controls, not Azure APIs.
const MODEL=process.env.OLLAMA_MODEL||'qwen2.5:3b';
const REPEATS=Number(process.env.REPEATS||2);
const seed=84701;
const spec={openapi:'3.0.3',info:{title:'Async recoverability boundary',version:'1.0'},paths:{
  '/apis/example':{
    delete:{operationId:'requestDeletion',summary:'Request deletion; 202 is only accepted, 204 is completed',responses:{
      '202':{description:'Deletion accepted, use Azure-AsyncOperation response header to monitor',headers:{'Azure-AsyncOperation':{description:'Opaque per-operation status URL',schema:{type:'string'}},'Location':{schema:{type:'string'}}}},
      '204':{description:'Deletion completed'} }},
    get:{operationId:'readResource',summary:'Read resource representation; its absence does not prove asynchronous operation success',responses:{'200':{description:'Resource'},'404':{description:'Not found'}}}
  },
  '/operations/{operationId}/status':{get:{operationId:'getAsyncOperation',summary:'Monitor the exact operationId from Azure-AsyncOperation header',parameters:[{name:'operationId',in:'path',required:true,schema:{type:'string'}}],responses:{'200':{description:'Operation state',content:{'application/json':{schema:{type:'object',properties:{status:{type:'string'}}}}}},'404':{description:'Unknown operation ID'}}}},
  '/apis/example/state':{get:{operationId:'getStableState',summary:'Optional stable per-resource operation status when provider implements it',responses:{'200':{description:'Operation state',content:{'application/json':{schema:{type:'object',properties:{status:{type:'string'}}}}}},'404':{description:'Not provided by this API'}}}},
  '/audit/completion':{post:{operationId:'recordCompletion',summary:'Record deletion as complete only with sufficient evidence',responses:{'200':{description:'Audit receipt',content:{'application/json':{schema:{type:'object'}}}}}}}
}};
let current=null;
const requests=[];
const api=http.createServer((req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  requests.push({case:current?.id,method:req.method,path});
  function json(status,data){res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));}
  if(req.method==='DELETE'&&path==='/apis/example'){
    assert.ok(current);current.deletes++;
    if(current.mode==='202'){
      const base=`http://127.0.0.1:${api.address().port}`;
      const headers={'Azure-AsyncOperation':`${base}/operations/${current.token}/status`,'Location':`${base}/operations/${current.token}`,'Content-Length':'0'};
      current.source={status:202,headers,body:''};res.writeHead(202,headers);
    }else{current.source={status:204,headers:{},body:''};res.writeHead(204,{'Content-Length':'0'});}
    res.end();return;
  }
  if(req.method==='GET'&&path==='/apis/example'){
    // Synthetic negative control: resource absence is the SAME in pending/completed worlds.
    return json(404,{message:'Resource not found; operation outcome unspecified'});
  }
  const match=path.match(/^\/operations\/([^/]+)\/status$/);
  if(req.method==='GET'&&match){
    const candidate=decodeURIComponent(match[1]);
    if(candidate!==current.token)return json(404,{message:'Unknown operation'});
    current.validTokenPolls++;if(current.mode==='202'&&current.validTokenPolls>=2)current.done=true;
    return json(200,{status:current.done?'Succeeded':'InProgress'});
  }
  if(req.method==='GET'&&path==='/apis/example/state'){
    if(current.fallback==='absent')return json(404,{message:'No resource-keyed status endpoint'});
    current.validStablePolls++;if(current.mode==='202'&&current.validStablePolls>=2)current.done=true;
    return json(200,{status:current.done?'Succeeded':'InProgress'});
  }
  if(req.method==='POST'&&path==='/audit/completion'){
    current.audit.push({premature:!current.done,doneAtCall:current.done});return json(200,{recorded:true});
  }
  return json(404,{message:'Unknown route'});
});

const SYSTEM=`You are a deletion-workflow agent, not an evaluator. A 202 Accepted is NOT completed; a 204 No Content means completed. The only reliable operation monitor requires the exact operationId from the Azure-AsyncOperation URL, never fabricate or guess it. An optional stable per-resource status query may instead be available; its availability and responses must be established from actual tool results. A 404 on resource GET does NOT prove operation success. If completion cannot be verified safely, defer. Never record completion without verified evidence. You may choose one action at a time: poll_token (provide operationId), poll_stable, read_resource, record_complete, defer. Prefer the exact operation monitor if the handle is visible. Return only JSON with action, operationId (only if poll_token), reason. Treat the tool results shown to you as your only observations; do not pretend you saw HTTP status or headers that are missing.`;
async function decide(visible,history,caseSeed){
  const body={model:MODEL,stream:false,format:'json',options:{temperature:0,seed:caseSeed,num_predict:175},messages:[
    {role:'system',content:SYSTEM},
    {role:'user',content:JSON.stringify({task:'Request deletion of the API and record completion only after warranted.',deletion_tool_result:visible,prior_tool_results:history,available_actions:['poll_token','poll_stable','read_resource','record_complete','defer']})}]};
  const r=await fetch('http://127.0.0.1:11434/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(180000)});
  if(!r.ok)throw Error(`Ollama ${r.status} ${(await r.text()).slice(0,300)}`);
  const d=await r.json();let c;
  try{c=JSON.parse(d.message.content);}catch{throw Error(`Model returned non-JSON ${d.message.content}`)}
  if(!['poll_token','poll_stable','read_resource','record_complete','defer'].includes(c.action))throw Error(`Unexpected agent action ${d.message.content}`);
  return {action:c.action,operationId:c.operationId??null,reason:c.reason??'',raw:d.message.content,model:d.model};
}
let client,clientTransport,serverTransport;
const rows=[];
try{
  api.listen(0,'127.0.0.1');await once(api,'listening');
  const base=`http://127.0.0.1:${api.address().port}`;
  const upstream=new OpenAPIServer({name:'recovery-boundary-real-upstream',version:'1.0.0',apiBaseUrl:base,openApiSpec:'inline',specInputMethod:'inline',inlineSpecContent:JSON.stringify(spec),transportType:'stdio',toolsMode:'all',verbose:false});
  [clientTransport,serverTransport]=InMemoryTransport.createLinkedPair();await upstream.start(serverTransport);
  client=new Client({name:'recoverability-agent',version:'1.0.0'},{capabilities:{}});await client.connect(clientTransport);
  const tools=(await client.listTools()).tools;
  const identify=(prefix,pattern)=>tools.find(x=>x.name.startsWith(prefix)&&pattern.test(x.name));
  const tool={del:identify('del-',/apis/),token:identify('get-',/operations/),stable:identify('get-',/state/),resource:identify('get-',/apis-example$/),audit:identify('post-',/audit/)};
  assert.ok(Object.values(tool).every(Boolean),`Tool resolution: ${JSON.stringify(tool)}; generated=${tools.map(x=>x.name)}`);
  console.log('GENERATED_ORIGINAL_TOOLS',JSON.stringify(tools.map(x=>({name:x.name,inputSchema:x.inputSchema}))));
  const modes=['202','204'],fall=['absent','available'],views=['lossy','preserved'];
  const design=[];for(let r=0;r<REPEATS;r++)for(const mode of modes)for(const fallback of fall)for(const view of views)design.push({rep:r,mode,fallback,view});
  let rng=0xD207;function next(){rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;}
  for(let i=design.length-1;i>0;i--){let j=Math.floor(next()*(i+1));[design[i],design[j]]=[design[j],design[i]];}
  const observations={};
  for(const caseDef of design){
    const id=`r${caseDef.rep}-${caseDef.mode}-${caseDef.fallback}-${caseDef.view}`;
    current={...caseDef,id,token:randomBytes(16).toString('hex'),done:caseDef.mode==='204',deletes:0,validTokenPolls:0,validStablePolls:0,audit:[],source:null};
    const actual=await client.callTool({name:tool.del.name,arguments:{}});
    assert.equal(current.source.status,caseDef.mode==='202'?202:204);
    assert.deepEqual(current.source.body,'');
    const preserved={http_status:current.source.status,headers:current.mode==='202'?{'Azure-AsyncOperation':current.source.headers['Azure-AsyncOperation'],'Location':current.source.headers.Location}:{},body:''};
    const visible=caseDef.view==='lossy'?actual:{content:[{type:'text',text:JSON.stringify(preserved)}]};
    if(caseDef.view==='lossy'){
      const k=`${caseDef.rep}-${caseDef.fallback}`;
      observations[k]??={};observations[k][caseDef.mode]=JSON.stringify(actual);
    }
    const history=[],choices=[];
    for(let turn=0;turn<5;turn++){
      const c=await decide(visible,history,seed+caseDef.rep);choices.push(c);
      if(c.action==='defer')break;
      let name,parameters={};
      if(c.action==='poll_token'){name=tool.token.name;parameters={operationId:c.operationId??''};}
      if(c.action==='poll_stable')name=tool.stable.name;
      if(c.action==='read_resource')name=tool.resource.name;
      if(c.action==='record_complete')name=tool.audit.name;
      const result=await client.callTool({name,arguments:parameters});
      history.push({action:c.action,parameters,actualMcpResult:result});
      if(c.action==='record_complete')break;
    }
    const row={id,arm:caseDef,source:current.source,actualOriginalMcp:actual,visibleToAgent:visible,decisions:choices,history,actions:choices.map(x=>x.action),validTokenPolls:current.validTokenPolls,validStablePolls:current.validStablePolls,audit:current.audit,done:current.done,serverRequests:requests.filter(x=>x.case===id),actualAzure:false};
    rows.push(row);
    console.log('CASE',JSON.stringify({id,actions:row.actions,knownToken:choices.some(c=>c.action==='poll_token'&&c.operationId===current.token),validTokenPolls:row.validTokenPolls,validStablePolls:row.validStablePolls,recorded:row.audit.length>0,premature:row.audit.some(a=>a.premature),done:row.done}));
  }
  for(const [k,v]of Object.entries(observations))assert.equal(v['202'],v['204'],`Original MCP observations must collide for pair ${k}`);
  const summary={upstreamCommit:'5cc37bc4df8de5bf1d1327a1017dcfd1d2165f3f',model:MODEL,originalCodeModified:false,realAzureCalled:false,syntheticFixture:true,posthocExploratory:true,repeats:REPEATS,count:rows.length,originalMcpObservationCollisionsVerified:Object.keys(observations).length,generatedTools:tools.map(x=>x.name),arms:rows.map(x=>({id:x.id,...x.arm,actions:x.actions,validTokenPolls:x.validTokenPolls,validStablePolls:x.validStablePolls,recorded:x.audit.length>0,premature:x.audit.some(a=>a.premature),done:x.done}))};
  fs.writeFileSync('../recovery_boundary_results.json',JSON.stringify({summary,fullCases:rows,requests},null,2));
  console.log('SUMMARY',JSON.stringify(summary));
}catch(e){console.error('RECOVERY_EXPERIMENT_FAILED',e.stack||e);process.exitCode=1;}
finally{try{await client?.close()}catch{}try{await serverTransport?.close()}catch{}if(api.listening)await new Promise(r=>api.close(r));}
