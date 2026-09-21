import http from 'node:http';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';

// Existing independent converter, unchanged, pinned in workflow. Synthetic local
// HTTP API; no real Azure resource or LLM is involved in this control.
let mode='202',client,transport;
const requests=[];
const api=http.createServer((req,res)=>{
  requests.push({method:req.method,path:req.url,mode});
  if(req.method==='DELETE'&&req.url==='/apis/example'){
    if(mode==='202')res.writeHead(202,{'Azure-AsyncOperation':`http://127.0.0.1:${api.address().port}/operations/nonsecret/status`,'Location':`http://127.0.0.1:${api.address().port}/operations/nonsecret`,'Content-Length':'0'});
    else res.writeHead(204,{'Content-Length':'0'});
    return res.end();
  }
  res.writeHead(404);res.end();
});
function payload(result){
  if(result.structuredContent && Object.keys(result.structuredContent).length)return result.structuredContent;
  const texts=result.content?.filter(x=>x.type==='text').map(x=>x.text)||[];
  for(const t of texts){try{return JSON.parse(t)}catch{}}
  throw Error(`No readable MCP result: ${JSON.stringify(result).slice(0,1500)}`);
}
try{
  api.listen(0,'127.0.0.1');await once(api,'listening');
  const base=`http://127.0.0.1:${api.address().port}`;
  const spec={openapi:'3.0.3',info:{title:'Original proxy baseline',version:'1.0'},servers:[{url:base}],paths:{'/apis/example':{delete:{operationId:'deleteExample',summary:'Delete resource',responses:{'202':{description:'Scheduled',headers:{'Azure-AsyncOperation':{schema:{type:'string'}}}},'204':{description:'Completed'}}}}}};
  fs.writeFileSync('proxy_fixture.json',JSON.stringify(spec,null,2));
  transport=new StdioClientTransport({command:process.env.PROXY_BINARY,env:{...process.env,MCP_SPEC:`${process.cwd()}/proxy_fixture.json`,MCP_BASE_URL:base,MCP_TOOL_PREFIX:'api'}});
  client=new Client({name:'proxy-response-control',version:'1.0'},{capabilities:{}});
  await client.connect(transport);
  const tools=(await client.listTools()).tools;
  console.log('PROXY_TOOLS',tools.map(x=>x.name).join(','));
  const navigator=tools.find(t=>/list_endpoints$/.test(t.name));const executor=tools.find(t=>/call_endpoint$/.test(t.name));
  assert.ok(navigator&&executor,'Expected original proxy navigation and execution tools');
  const listed=payload(await client.callTool({name:navigator.name,arguments:{limit:100}}));
  console.log('DISCOVERY',JSON.stringify(listed));
  const item=(listed.items||listed.endpoints||[]).find(x=>x.method?.toUpperCase()==='DELETE'&&x.path==='/apis/example');
  assert.ok(item?.toolName,'Could not find exact generated DELETE operation from discovery');
  const results=[];
  for(const arm of ['202','204']){
    mode=arm;
    const raw=await client.callTool({name:executor.name,arguments:{toolName:item.toolName}});
    const out=payload(raw);results.push({arm,raw,parsed:out});
    console.log('REAL_PROXY_RESULT',arm,JSON.stringify(out));
    assert.equal(out.status,Number(arm),`Proxy must preserve HTTP ${arm} status`);
    if(arm==='202')assert.ok(Object.entries(out.headers||{}).some(([k,v])=>k.toLowerCase()==='azure-asyncoperation'&&String(v).includes('/operations/')),'Proxy must preserve monitor URL');
  }
  assert.notDeepEqual(results[0].parsed,results[1].parsed);
  const summary={originalProxyCommit:process.env.PROXY_SHA,unmodified:true,mcpRealClient:true,realAzureCalled:false,realAgentUsed:false,bothStatusesAnd202MonitorPreserved:true,results,requests};
  fs.writeFileSync('../proxy_control_results.json',JSON.stringify(summary,null,2)+'\n');
  console.log('INDEPENDENT_PROXY_BASELINE_PASS true');
}catch(e){console.error('PROXY_BASELINE_FAILED',e.stack||e);process.exitCode=1;}
finally{try{await client?.close()}catch{}try{await transport?.close()}catch{}if(api.listening)await new Promise(r=>api.close(r));}
