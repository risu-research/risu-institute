from pathlib import Path
p=Path('upstream/recovery_boundary.mjs')
s=p.read_text()
needle='async function decide(visible,history,caseSeed){'
patch=r'''async function decide(visible,history,caseSeed){
  if(process.env.REFERENCE_POLICY==='1'){
    let observed=null;
    try{observed=JSON.parse(visible?.content?.find(x=>x.type==='text')?.text??'null');}catch{}
    let action='defer', operationId=null;
    const last=history.at(-1);
    if(last){
      if(['poll_token','poll_stable'].includes(last.action)){
        let status=null;
        try{status=JSON.parse(last.actualMcpResult.content.find(x=>x.type==='text').text).status;}catch{}
        if(status==='Succeeded')action='record_complete';
        else if(status==='InProgress'){action=last.action;operationId=last.parameters?.operationId??null;}
      }
    }else if(observed?.http_status===204)action='record_complete';
    else if(observed?.http_status===202){
      const link=observed?.headers?.['Azure-AsyncOperation']??'';
      const match=link.match(/\/operations\/([^/]+)\/status(?:\?|$)/);
      if(match){action='poll_token';operationId=decodeURIComponent(match[1]);}
      else action='poll_stable';
    }else action='poll_stable';
    return {action,operationId,reason:'deterministic fixture reference policy; not an LLM observation',raw:'deterministic reference',model:'none'};
  }
'''
assert needle in s
p.write_text(s.replace(needle,patch))
print('DETERMINISTIC_REFERENCE_PATCHED_ONLY_IN_TEST_HARNESS')
