import http from 'node:http';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { OpenAPIServer } from './dist/bundle.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

// Runs against the UNMODIFIED upstream OpenAPIServer build, not a reimplementation.
// The only synthetic component is the localhost API fixture, modeling the two
// documented Azure API Management Apis-Delete response branches.
const upstreamSha = process.env.UPSTREAM_SHA;
const spec = {
  openapi: '3.0.3',
  info: {title:'202 versus 204 real-MCP-boundary probe', version:'1.0.0'},
  paths: {'/apis/example': {delete: {
    operationId:'deleteExampleApi', summary:'Delete an API',
    responses: {
      '202': {description:'Deletion scheduled', headers:{'Azure-AsyncOperation':{schema:{type:'string'}},Location:{schema:{type:'string'}}}},
      '204': {description:'Deletion completed'}
    }
  }}}
};
let mode = 'accepted';
const seenRequests = [];
const api = http.createServer((req, res) => {
  seenRequests.push({method:req.method,url:req.url,mode});
  if (req.method === 'DELETE' && req.url === '/apis/example') {
    if (mode === 'accepted') {
      res.writeHead(202, {'Location':`http://127.0.0.1:${api.address().port}/operations/abc`,
        'Azure-AsyncOperation':`http://127.0.0.1:${api.address().port}/operations/abc/status`,
        'Content-Length':'0'});
    } else {
      res.writeHead(204, {'Content-Length':'0'});
    }
    res.end();
    return;
  }
  if (req.method === 'GET' && req.url === '/operations/abc/status') {
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({status:'InProgress'}));
    return;
  }
  res.writeHead(404); res.end();
});

let client;
let serverTransport;
try {
  api.listen(0,'127.0.0.1');
  await once(api,'listening');
  const base = `http://127.0.0.1:${api.address().port}`;
  const upstream = new OpenAPIServer({name:'saner-original-source-probe',version:'1.0.0',
    apiBaseUrl:base,openApiSpec:'inline',specInputMethod:'inline',
    inlineSpecContent:JSON.stringify(spec),transportType:'stdio',toolsMode:'all',verbose:false});
  const [clientTransport, st] = InMemoryTransport.createLinkedPair();
  serverTransport = st;
  await upstream.start(serverTransport);
  client = new Client({name:'saner-probe-client',version:'1.0.0'}, {capabilities:{}});
  await client.connect(clientTransport);
  const toolList = await client.listTools();
  assert.equal(toolList.tools.length,1, 'Exactly one original generated MCP tool expected');
  const toolName=toolList.tools[0].name;

  async function one(which) {
    mode=which;
    const raw=await fetch(`${base}/apis/example`, {method:'DELETE'});
    const body=await raw.text();
    const source={status:raw.status, body,
      asyncOperation:raw.headers.get('azure-asyncoperation'),location:raw.headers.get('location'),
      state: which==='accepted'?'scheduled_not_yet_deleted':'deleted'};
    const mcp=await client.callTool({name:toolName,arguments:{}});
    return {source,mcp};
  }
  const accepted=await one('accepted');
  const completed=await one('completed');
  assert.equal(accepted.source.status,202);
  assert.equal(completed.source.status,204);
  assert.equal(accepted.source.body,'');
  assert.equal(completed.source.body,'');
  assert.ok(accepted.source.asyncOperation);
  assert.equal(completed.source.asyncOperation,null);
  assert.ok(seenRequests.filter(x=>x.method==='DELETE').length>=4);
  const equivalent=JSON.stringify(accepted.mcp)===JSON.stringify(completed.mcp);
  const result={kind:'original-upstream-source-plus-real-MCP-client', upstreamCommit:upstreamSha,
    toolName, accepted, completed, sameMcpResult:equivalent,
    requiredNextAction:{accepted:'poll_azure_async_operation',completed:'report_completed'},
    actualAgentTested:false, microsoftLiveApiTested:false, sourceRequests:seenRequests,
    finding: equivalent ? 'The two distinct documented HTTP responses collapse to one actual MCP tool observation.' : 'The two MCP tool results differ; the previous branch-model collision is not reproduced.'};
  fs.writeFileSync('probe_result.json',JSON.stringify(result,null,2)+'\n');
  console.log('ORIGINAL_UPSTREAM_COMMIT',upstreamSha);
  console.log('TOOL_NAME',toolName);
  console.log('SOURCE_202',JSON.stringify(accepted.source));
  console.log('SOURCE_204',JSON.stringify(completed.source));
  console.log('ACTUAL_MCP_202',JSON.stringify(accepted.mcp));
  console.log('ACTUAL_MCP_204',JSON.stringify(completed.mcp));
  console.log('SAME_ACTUAL_MCP_RESULT',equivalent);
  console.log('MOCK_HTTP_REQUEST_COUNT',seenRequests.length);
} catch(e) {
  console.error('PROBE_FAILED',e?.stack||e);
  process.exitCode=1;
} finally {
  try {await client?.close();} catch(e) {console.error('client.close:',String(e));}
  try {await serverTransport?.close();} catch(e) {console.error('serverTransport.close:',String(e));}
  if (api.listening) await new Promise(resolve=>api.close(resolve));
}
