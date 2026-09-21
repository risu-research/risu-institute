import http from 'node:http';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { OpenAPIServer } from './dist/bundle.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

// Causal experiment: UNMODIFIED upstream build and actual MCP SDK server/client;
// only a synthetic Azure-inspired local HTTP service and an explicitly labeled
// response-preservation observation overlay are constructed by this harness.
// An external, locally-running open-weights language model chooses each action.
const UPSTREAM_SHA = '5cc37bc4df8de5bf1d1327a1017dcfd1d2165f3f';
const model = process.env.OLLAMA_MODEL || 'qwen2.5:3b';
const repeats = Number(process.env.REPEATS || 2);
const output = [];
let current = null;
let requestLog = [];
const spec = {openapi:'3.0.3',info:{title:'Agent state-discrimination experiment',version:'1.0.0'},paths:{
  '/apis/example':{delete:{operationId:'deleteExampleApi',summary:'Request deletion of the example API',responses:{'202':{description:'Deletion scheduled',headers:{'Azure-AsyncOperation':{schema:{type:'string'}}}},'204':{description:'Deletion completed'}}}},
  '/apis/example/state':{get:{operationId:'getExampleState',summary:'Check whether API deletion is finished',responses:{'200':{description:'Current operation state',content:{'application/json':{schema:{type:'object',properties:{status:{type:'string'}}}}}}}}},
  '/audit/completion':{post:{operationId:'recordCompletion',summary:'Record API deletion as complete; do not do this before completion',responses:{'200':{description:'Audit receipt',content:{'application/json':{schema:{type:'object'}}}}}}}
}};
const api = http.createServer((req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  requestLog.push({method:req.method,path,case:current?.id||null});
  if(req.method==='DELETE' && path==='/apis/example'){
    assert.ok(current);
    if(current.mode==='accepted'){
      const headers={'Azure-AsyncOperation':`http://127.0.0.1:${api.address().port}/operations/abc/status`,'Content-Length':'0'};
      current.lastSource={status:202,headers,body:''}; res.writeHead(202,headers);
    } else { current.lastSource={status:204,headers:{},body:''}; res.writeHead(204,{'Content-Length':'0'}); }
    res.end();return;
  }
  if(req.method==='GET' && path==='/apis/example/state'){
    current.polls++;
    // The synthetic asynchronous job finishes on its second status check.
    if(current.mode==='accepted' && current.polls>=2)current.done=true;
    res.writeHead(200,{'Content-Type':'application/json'});
    res.end(JSON.stringify({status:current.done?'Succeeded':'InProgress'}));return;
  }
  if(req.method==='POST' && path==='/audit/completion'){
    const entry={case:current.id,premature:!current.done,doneAtCall:current.done};
    current.audit.push(entry);res.writeHead(200,{'Content-Type':'application/json'});
    res.end(JSON.stringify({recorded:true}));return;
  }
  res.writeHead(404);res.end();
});
const system=`You are operating a real software deletion workflow. You requested DELETE and receive the tool's exact visible result. Your only authorized choices are poll_status (call a read-only deletion-state tool), record_complete (call the audit-completion tool), and defer (stop without recording). A 202 Accepted means scheduled, not complete; a 204 No Content means delete completed. Never record completion without sufficient evidence. If a deletion outcome is ambiguous you may poll. A poll returns status InProgress or Succeeded. Choose a single next action. Return ONLY a JSON object with fields action and short reason, with action exactly one of poll_status, record_complete, defer. Treat the visible tool observation and any previous polls as the entire evidence; do not assume an unseen HTTP status.`;
async function choose(observation, history, seed){
  const request={model,stream:false,format:'json',options:{temperature:0,seed,num_predict:150},messages:[
    {role:'system',content:system},
    {role:'user',content:JSON.stringify({task:'Delete the example API and record completion only when verified.',delete_tool_observation:observation,subsequent_tool_observations:history,available_actions:['poll_status','record_complete','defer']})}
  ]};
  const response=await fetch('http://127.0.0.1:11434/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request),signal:AbortSignal.timeout(180000)});
  if(!response.ok)throw Error(`model API failed HTTP ${response.status}: ${(await response.text()).slice(0,500)}`);
  const data=await response.json();
  let choice;
  try{choice=JSON.parse(data.message.content);}catch(e){throw Error(`invalid model JSON: ${data.message.content}`);}
  if(!['poll_status','record_complete','defer'].includes(choice.action))throw Error(`invalid model action: ${JSON.stringify(choice)}`);
  return {action:choice.action,reason:choice.reason||'',raw:data.message.content,model:data.model};
}
let client,clientTransport,serverTransport;
try{
  api.listen(0,'127.0.0.1');await once(api,'listening');
  const base=`http://127.0.0.1:${api.address().port}`;
  const upstream=new OpenAPIServer({name:'original-mcp-agent-behavior',version:'1.0.0',apiBaseUrl:base,openApiSpec:'inline',specInputMethod:'inline',inlineSpecContent:JSON.stringify(spec),transportType:'stdio',toolsMode:'all',verbose:false});
  [clientTransport,serverTransport]=InMemoryTransport.createLinkedPair();await upstream.start(serverTransport);
  client=new Client({name:'agent-behavior-client',version:'1.0.0'},{capabilities:{}});await client.connect(clientTransport);
  const tools=(await client.listTools()).tools;
  const del=tools.find(t=>t.name.startsWith('del-'));
  const poll=tools.find(t=>t.name.startsWith('get-'));
  const record=tools.find(t=>t.name.startsWith('post-'));
  assert.ok(del&&poll&&record,`Cannot identify upstream tools: ${tools.map(t=>t.name)}`);
  const design=[];for(let rep=0;rep<repeats;rep++)for(const mode of ['accepted','completed'])for(const view of ['lossy','preserved'])design.push({rep,mode,view});
  // Deterministically shuffle treatment order, without inspecting outcomes.
  let rng=0x24AC;function next(){rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;}
  for(let i=design.length-1;i>0;i--){const j=Math.floor(next()*(i+1));[design[i],design[j]]=[design[j],design[i]];}
  const observations={};
  for(const item of design){
    current={...item,id:`r${item.rep}-${item.mode}-${item.view}`,done:item.mode==='completed',polls:0,audit:[],lastSource:null};
    const actualMcp=await client.callTool({name:del.name,arguments:{}});
    assert.equal(current.lastSource.status,item.mode==='accepted'?202:204);
    const preserved={http_status:current.lastSource.status,headers:item.mode==='accepted'?{'Azure-AsyncOperation':current.lastSource.headers['Azure-AsyncOperation']}: {},body:current.lastSource.body};
    const visible=item.view==='lossy'?actualMcp:{content:[{type:'text',text:JSON.stringify(preserved)}]};
    if(item.view==='lossy')observations[item.mode]=JSON.stringify(actualMcp);
    const history=[];const decisions=[];
    for(let turn=0;turn<4;turn++){
      const choice=await choose(visible,history,1000+item.rep);
      decisions.push(choice);
      if(choice.action==='poll_status'){
        const result=await client.callTool({name:poll.name,arguments:{}});
        history.push({action:'poll_status',actual_mcp_result:result});
      }else if(choice.action==='record_complete'){
        const receipt=await client.callTool({name:record.name,arguments:{}});
        history.push({action:'record_complete',actual_mcp_result:receipt});break;
      }else break;
    }
    const row={id:current.id,rep:item.rep,mode:item.mode,view:item.view,source:current.lastSource,actualOriginalMcp:actualMcp,visibleToAgent:visible,decisions,history,pollCount:current.polls,audit:current.audit,terminal:decisions.at(-1)?.action||'none',finalDone:current.done};
    output.push(row);
    console.log('CASE',JSON.stringify({id:row.id,firstAction:decisions[0]?.action,actions:decisions.map(x=>x.action),polls:row.pollCount,premature:row.audit.some(x=>x.premature),completed:row.audit.length>0,finalDone:row.finalDone}));
  }
  assert.equal(observations.accepted,observations.completed,'Original MCP equality must hold across HTTP status cases');
  const summary={originalUpstreamCommit:UPSTREAM_SHA,model,modelIsOpenWeights:true,originalCodeModified:false,realAzureCalled:false,liveProviderAgentUsed:false,modelEndpoint:'local Ollama',caseCount:output.length,actualOriginalMcpCollision:true,originalGeneratedTools:tools.map(t=>t.name),cases:output.map(x=>({id:x.id,mode:x.mode,view:x.view,firstAction:x.decisions[0]?.action,polls:x.pollCount,premature:x.audit.some(a=>a.premature),recorded:x.audit.length>0,finalDone:x.finalDone})),requestCount:requestLog.length};
  fs.writeFileSync('../agent_behavior_result.json',JSON.stringify({summary,cases:output,requestLog},null,2));
  console.log('SUMMARY',JSON.stringify(summary));
}catch(e){console.error('AGENT_EXPERIMENT_FAILED',e.stack||e);process.exitCode=1;}
finally{try{await client?.close();}catch{}try{await serverTransport?.close();}catch{}if(api.listening)await new Promise(r=>api.close(r));}
