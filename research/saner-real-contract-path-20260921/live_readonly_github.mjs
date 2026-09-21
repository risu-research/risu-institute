import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/client/inMemory.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {OpenAPIServer} from './dist/bundle.js';
const token=process.env.GITHUB_TOKEN;
assert.ok(token,'Missing workflow-scoped read-only GITHUB_TOKEN');
const runId='35598196855',base='https://api.github.com',path='/repos/{owner}/{repo}/actions/runs/{run_id}';
const original=JSON.parse(fs.readFileSync('../contract_evidence/github_2026.json'));
assert.ok(original.paths[path].get.responses['200']);
const spec={openapi:'3.0.3',info:{title:'GITHUB ORIGINAL-SOURCE-DERIVED READ-ONLY GET SUBSET',version:'1'},servers:[{url:base}],components:{securitySchemes:{bearerAuth:{type:'http',scheme:'bearer'}}},security:[{bearerAuth:[]}],paths:{[path]:{get:{operationId:'getWorkflowRun',summary:original.paths[path].get.summary,parameters:['owner','repo','run_id'].map(name=>({name,in:'path',required:true,schema:{type:'string'}})).concat({name:'X-GitHub-Api-Version',in:'header',required:false,schema:{type:'string'}}),responses:{'200':{description:'Original GitHub workflow run response',content:{'application/json':{schema:{type:'object',properties:{id:{type:'integer'},status:{type:'string'},conclusion:{type:'string'},html_url:{type:'string'}}}}}}}}}}};
function parse(result){if(result.isError)throw Error('MCP returned isError: '+result.content?.map(x=>x.text||'').join(' ').slice(0,300));if(result.structuredContent&&Object.keys(result.structuredContent).length)return result.structuredContent;const text=(result.content||[]).filter(x=>x.type==='text').map(x=>x.text).join('\n');return JSON.parse(text);}
const outcomes=[];
for(const converter of ['ivo','proxy']){
 let client,st,ct;
 try{
  if(converter==='ivo'){
   const server=new OpenAPIServer({name:'unchanged-live-github-reader',version:'1',apiBaseUrl:base,openApiSpec:'inline',specInputMethod:'inline',inlineSpecContent:JSON.stringify(spec),transportType:'stdio',toolsMode:'all',verbose:false,headers:{Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2026-03-10','User-Agent':'saner-contract-readonly-evaluation'}});
   [ct,st]=InMemoryTransport.createLinkedPair();await server.start(st);client=new Client({name:'live-readonly',version:'1'},{capabilities:{}});await client.connect(ct);
   const tools=(await client.listTools()).tools;const tool=tools.find(x=>x.name.startsWith('get-'));assert.ok(tool);
   const result=parse(await client.callTool({name:tool.name,arguments:{owner:'risu-research',repo:'risu-institute',run_id:runId,'X-GitHub-Api-Version':'2026-03-10'}}));
   assert.equal(String(result.id),runId);assert.equal(result.status,'completed');assert.equal(result.conclusion,'success');
   outcomes.push({converter,tool:tool.name,runId:result.id,status:result.status,conclusion:result.conclusion,html_url:result.html_url,liveRequest:true,readOnly:true});
  }else{
   fs.writeFileSync('live_readonly_github_spec.json',JSON.stringify(spec));
   ct=new StdioClientTransport({command:process.env.PROXY_BINARY,env:{...process.env,MCP_SPEC:`${process.cwd()}/live_readonly_github_spec.json`,MCP_BASE_URL:base,MCP_TOOL_PREFIX:'api',MCP_AUTH_TOKEN:token,MCP_EXTRA_HEADERS:'X-GitHub-Api-Version:2026-03-10'}});
   client=new Client({name:'live-readonly',version:'1'},{capabilities:{}});await client.connect(ct);
   const tools=(await client.listTools()).tools;const list=tools.find(t=>/list_endpoints$/.test(t.name)),call=tools.find(t=>/call_endpoint$/.test(t.name));assert.ok(list&&call);
   const listed=parse(await client.callTool({name:list.name,arguments:{limit:20}}));const tool=(listed.items||listed.endpoints||[]).find(x=>x.method==='GET'&&x.path===path);assert.ok(tool?.toolName);
   const result=parse(await client.callTool({name:call.name,arguments:{toolName:tool.toolName,path:{owner:'risu-research',repo:'risu-institute',run_id:runId},headers:{'X-GitHub-Api-Version':'2026-03-10'}}}));
   assert.equal(result.status,200);const body=result.body;assert.equal(String(body.id),runId);assert.equal(body.status,'completed');assert.equal(body.conclusion,'success');
   outcomes.push({converter,tool:tool.toolName,httpStatus:result.status,runId:body.id,status:body.status,conclusion:body.conclusion,html_url:body.html_url,liveRequest:true,readOnly:true});
  }
  console.log('LIVE_READONLY_PASS',JSON.stringify(outcomes.at(-1)));
 }finally{try{await client?.close();}catch{}try{await st?.close();}catch{}try{await ct?.close();}catch{}}
}
assert.equal(outcomes.length,2);
fs.writeFileSync('../live_readonly_github_results.json',JSON.stringify({source:'Original github/rest-api-description 2026-03-10, pinned 338cb199baa4f326790b0b1c246d8d4f481a82a0',originalConvertersModified:false,realGitHubGetCalled:true,realMutationPerformed:false,liveRoleDenialTest:false,noRealDispatchRun:true,outcomes},null,2));
console.log('LIVE_READONLY_ORIGINAL_CONVERTERS_PASS');
