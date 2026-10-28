import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, extname, resolve, join, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root=dirname(dirname(fileURLToPath(import.meta.url)));
const publicRoot=resolve(root,'public');
const headerText=await readFile(join(publicRoot,'_headers'),'utf8');
const csp=headerText.match(/^\/tools\/\r?\n  Content-Security-Policy: (.+)$/mu)?.[1];
assert.ok(csp,'production RISU Verify CSP is required');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript','.json':'application/json'};
const server=await new Promise((done,fail)=>{
  const s=createServer(async(req,res)=>{
    try {
      const url=new URL(req.url||'/','http://127.0.0.1');
      const tail=url.pathname.endsWith('/')?'index.html':'';
      const file=resolve(publicRoot,'.'+decodeURIComponent(url.pathname)+tail);
      if(!file.startsWith(publicRoot+sep)){res.writeHead(403).end('forbidden');return;}
      const body=await readFile(file);
      res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');
      if(url.pathname==='/tools/')res.setHeader('Content-Security-Policy',csp);
      res.writeHead(200).end(body);
    }catch(error){res.writeHead(error.code==='ENOENT'?404:500).end(String(error));}
  });
  s.once('error',fail);
  s.listen(0,'127.0.0.1',()=>done(s));
});
const base='http://127.0.0.1:'+server.address().port;
let chrome=null,profile=null,ws=null;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function launch(){
  const candidates=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean);
  let binary=null;
  for(const x of candidates){try{await access(x);binary=x;break;}catch{}}
  assert.ok(binary,'Chromium is required');
  profile=await mkdtemp(join(tmpdir(),'verify-browser-'));
  chrome=spawn(binary,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--hide-scrollbars','--window-size=1280,920','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
  const url=await new Promise((done,fail)=>{
    const timer=setTimeout(()=>fail(new Error('Chromium start timeout')),15000);
    chrome.stderr.setEncoding('utf8');
    chrome.stderr.on('data',chunk=>{const m=chunk.match(/DevTools listening on (ws:\/\/[^\s]+)/u);if(m){clearTimeout(timer);done(m[1]);}});
    chrome.once('error',fail);
    chrome.once('close',code=>fail(new Error('Chromium exited '+code)));
  });
  const address=new URL(url).host;
  let list;
  for(let k=0;k<30;k++){
    try{list=await(await fetch('http://'+address+'/json')).json();if(list.some(t=>t.type==='page'))break;}catch{}
    await sleep(120);
  }
  const page=list?.find(t=>t.type==='page');
  assert.ok(page?.webSocketDebuggerUrl,'Page CDP endpoint required');
  ws=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((done,fail)=>{
    ws.addEventListener('open',done,{once:true});
    ws.addEventListener('error',fail,{once:true});
  });
  const pending=new Map();let id=0;
  ws.addEventListener('message',event=>{
    const m=JSON.parse(String(event.data));
    if(!m.id)return;
    const p=pending.get(m.id);
    if(!p)return;
    pending.delete(m.id);
    if(m.error)p.fail(new Error(p.method+': '+m.error.message));else p.done(m.result||{});
  });
  const send=(method,params={})=>new Promise((done,fail)=>{
    const n=++id;pending.set(n,{done,fail,method});ws.send(JSON.stringify({id:n,method,params}));
  });
  const evaluate=async expr=>{
    const r=await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});
    if(r.exceptionDetails)throw new Error(r.exceptionDetails.text||'JS exception');
    return r.result?.value;
  };
  return {send,evaluate};
}
try {
  const {send,evaluate}=await launch();
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:base+'/tools/#workbench-examples'});
  let state;
  for(let i=0;i<60;i++){
    state=await evaluate("(()=>{const panel=document.querySelector('.rv-example-shell'),caseRow=document.querySelector('.rv-case'),heading=document.querySelector('#example-human');return {app:document.body.classList.contains('rv-appmode'),active:document.querySelector('.rv-pane.active')?.id,layout:panel?getComputedStyle(panel).display:null,rowGrid:caseRow?getComputedStyle(caseRow).display:null,css:[...document.styleSheets].some(x=>x.href?.includes('verify-research-workbench.css')),heading:heading?.textContent||'',broken:document.documentElement.scrollWidth>window.innerWidth+10}})()");
    if(state?.css&&state?.heading&&state?.layout==='flex')break;
    await sleep(150);
  }
  assert.equal(state.app,true);
  assert.equal(state.active,'pane-examples');
  assert.equal(state.layout,'flex','Published records must stack above their result details');
  assert.equal(state.rowGrid,'grid','Cases must render as selectable table rows');
  assert.ok(state.css,'External research instrument CSS must be loaded');
  assert.ok(state.heading,'First public case must render its stored finding');
  assert.equal(state.broken,false,'No desktop horizontal overflow');
  console.log('BROWSER_DESKTOP',JSON.stringify(state));
  const shot=await send('Page.captureScreenshot',{format:'jpeg',quality:58,captureBeyondViewport:false});
  console.log('VERIFY_SCREENSHOT_BEGIN:'+shot.data+':VERIFY_SCREENSHOT_END');
  await evaluate("document.querySelector('.rv-case[data-case=\"github-merge\"]').click()");
  const selected=await evaluate("({pressed:document.querySelector('.rv-case[data-case=\"github-merge\"]').getAttribute('aria-pressed'),finding:document.querySelector('#example-human').textContent,worldCount:document.querySelectorAll('#example-worlds .rv-situation').length})");
  assert.equal(selected.pressed,'true');
  assert.ok(selected.finding);
  assert.ok(selected.worldCount>0);
  await evaluate("document.querySelector('.rv-tab[data-pane=\"check\"]').click()");
  assert.equal(await evaluate("document.querySelector('.rv-pane.active')?.id"),'pane-check');
  assert.ok(await evaluate("!!document.querySelector('#file-input')"));
  await evaluate("document.querySelector('.rv-tab[data-pane=\"compare\"]').click()");
  assert.equal(await evaluate("document.querySelector('.rv-pane.active')?.id"),'pane-compare');
  assert.ok(await evaluate("!!document.querySelector('#compare-file-input')"));
  console.log('BROWSER_INTERACTION_PASS',JSON.stringify(selected));
} finally {
  try{ws?.close();}catch{}
  if(chrome&&!chrome.killed)chrome.kill('SIGTERM');
  await new Promise(r=>server.close(r));
  if(profile)await rm(profile,{recursive:true,force:true,maxRetries:8,retryDelay:120});
}
