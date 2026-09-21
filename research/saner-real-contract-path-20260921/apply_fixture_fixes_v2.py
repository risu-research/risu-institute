from pathlib import Path
p=Path('full_path_matrix.mjs');s=p.read_text()
def replace(old,new):
 global s
 assert s.count(old)==1,(old[:90],s.count(old))
 s=s.replace(old,new)
replace("spec.paths[gh]={post:{operationId:'githubDispatch',summary:op.summary||'Dispatch workflow',parameters:['owner','repo','workflow_id'].map(x=>param(x)),requestBody:structuredClone(op.requestBody),responses:structuredClone(op.responses)}};", """const schema=structuredClone(op.requestBody.content['application/json'].schema);
    const output={};for(const [code,reply] of Object.entries(op.responses)){
      output[code]={description:reply.description};
      if(code==='200')output[code].content={'application/json':{schema:{type:'object',properties:{workflow_run_id:{type:'integer'},run_url:{type:'string'},html_url:{type:'string'}},required:['workflow_run_id','run_url','html_url']}}};
    }
    spec.paths[gh]={post:{operationId:'githubDispatch',summary:op.summary||'Dispatch workflow',parameters:['owner','repo','workflow_id'].map(x=>param(x)).concat(param('X-GitHub-Api-Version','header')),requestBody:{required:true,content:{'application/json':{schema}}},responses:output}};""")
replace("parameters:['owner','repo','run_id'].map(x=>param(x)),responses:","parameters:['owner','repo','run_id'].map(x=>param(x)).concat(param('X-GitHub-Api-Version','header')),responses:")
replace("start=tools.find(t=>/^(del|post)-/.test(t.name));", "start=tools.find(t=>/del|dispatch|run-job/.test(t.name)&&!/get/.test(t.name));")
replace("monitor=tools.find(t=>t.name.startsWith('get-'));", "monitor=tools.find(t=>/get-result|get-run|google-get/.test(t.name));")
replace("return {tools:tools.map(t=>({name:t.name,inputSchema:t.inputSchema})),call:async(t,args)=>unpack(await client.callTool({name:t.name,arguments:which==='ivo'?args:{toolName:t.toolName,...args}})),start,monitor,close:", """return {tools:tools.map(t=>({name:t.name,inputSchema:t.inputSchema})),call:async(t,args)=>{
   if(which==='ivo')return unpack(await client.callTool({name:t.name,arguments:args}));
   const paths=Object.values(spec.paths),item=t===start?paths[0]:paths[1];
   const def=t===start?(item.delete||item.post):item.get;
   const grouped={path:{},query:{},headers:{},body:{}};
   for(const [key,value]of Object.entries(args)){
     const loc=def.parameters?.find(x=>x.name===key)?.in;
     if(loc==='path')grouped.path[key]=value;
     else if(loc==='query')grouped.query[key]=value;
     else if(loc==='header')grouped.headers[key]=value;
     else grouped.body[key]=value;
   }
   return unpack(await client.callTool({name:t.name,arguments:{toolName:t.toolName,...grouped}}));
  },start,monitor,close:""")
p.write_text(s)
print('FIXED_REAL_TOOL_NAMES_PROXY_SCHEMA_ARGUMENTS_AND_UNRESOLVED_REFS')
