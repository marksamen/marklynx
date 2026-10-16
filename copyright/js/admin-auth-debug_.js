/* TEST REV07: diagnostics only. No Firebase access or authentication mutations. */
(()=>{
 'use strict';
 const key='ML_AUTH_REV07_LOG',limit=180;
 const clean=v=>{
  if(!v||typeof v!=='object')return {};
  const out={};
  // Only approved diagnostic fields; never record tokens, emails, credentials, or arbitrary objects.
  for(const k of ['signedIn','code'])if(Object.prototype.hasOwnProperty.call(v,k)){
   if(k==='signedIn'&&typeof v[k]==='boolean')out[k]=v[k];
   if(k==='code'&&typeof v[k]==='string')out[k]=v[k].slice(0,80);
  }
  return out;
 };
 const read=()=>{try{const a=JSON.parse(sessionStorage.getItem(key)||'[]');return Array.isArray(a)?a:[];}catch(_){return [];}};
 let entries=read();
 function draw(){
  const area=document.getElementById('mlAuthLogText');
  if(area)area.value=entries.map(x=>`${x.time} [${x.source}] ${x.event} ${JSON.stringify(x.detail)}`).join('\n');
  const count=document.getElementById('mlAuthLogCount');if(count)count.textContent=`${entries.length} entries`;
 }
 function add(source,event,detail){
  const safeSource=source==='LANGUAGE IFRAME'?'LANGUAGE IFRAME':'PARENT';
  const safeEvent=String(event||'event').slice(0,100);
  entries.push({time:new Date().toISOString(),source:safeSource,event:safeEvent,detail:clean(detail)});
  entries=entries.slice(-limit);
  try{sessionStorage.setItem(key,JSON.stringify(entries));}catch(_e){}
  draw();
 }
 window.mlDebugAdd=add;
 window.addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==document.getElementById('adminPageModalFrame')?.contentWindow)return;
  if(e.data?.type==='ML_AUTH_REV07_EVENT')add('LANGUAGE IFRAME',e.data.event,e.data.detail);
 });
 const style=document.createElement('style');style.textContent=`
 #mlAuthLogToggle{position:fixed;right:14px;bottom:14px;z-index:2147483646;background:#174d80;color:white;border:1px solid #9cc2e7;border-radius:8px;padding:10px 14px;font:bold 13px system-ui;cursor:pointer;box-shadow:0 2px 10px #0008}
 #mlAuthLogPanel{position:fixed;right:14px;bottom:58px;z-index:2147483647;width:min(680px,calc(100vw - 28px));height:min(450px,calc(100vh - 85px));background:#171a20;color:#eee;border:2px solid #7aa6d8;border-radius:9px;box-shadow:0 5px 24px #000b;display:none;flex-direction:column;font:13px system-ui;padding:12px;box-sizing:border-box}
 #mlAuthLogPanel textarea{flex:1;min-height:0;width:100%;resize:none;box-sizing:border-box;background:#080b0f;color:#d7e8ff;font:12px/1.5 Consolas,monospace;padding:8px;border:1px solid #657180}
 #mlAuthLogPanel button{background:#244b71;color:white;border:1px solid #7aa6d8;border-radius:5px;padding:7px 10px;cursor:pointer}
 #mlAuthLogPanel .mlAuthButtons{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px}
 `;document.head.appendChild(style);
 const toggle=document.createElement('button');toggle.id='mlAuthLogToggle';toggle.type='button';toggle.textContent='View Debug Log (TEST)';
 const panel=document.createElement('section');panel.id='mlAuthLogPanel';panel.setAttribute('aria-label','TEST authentication debug log');
 panel.innerHTML='<div class="mlAuthButtons"><strong>TEST Authentication Diagnostics — REV07</strong><span id="mlAuthLogCount"></span><button id="mlAuthLogCopy" type="button">Copy Log</button><button id="mlAuthLogClear" type="button">Clear</button><button id="mlAuthLogClose" type="button">Close</button></div><textarea id="mlAuthLogText" readonly spellcheck="false" aria-label="Authentication event log"></textarea><small>Stored in this tab only. No credentials or tokens recorded. Survives page reloads.</small>';
 document.body.append(toggle,panel);
 toggle.addEventListener('click',()=>{panel.style.display=panel.style.display==='flex'?'none':'flex';draw();});
 panel.querySelector('#mlAuthLogClose').addEventListener('click',()=>panel.style.display='none');
 panel.querySelector('#mlAuthLogClear').addEventListener('click',()=>{entries=[];try{sessionStorage.removeItem(key);}catch(_e){}draw();});
 panel.querySelector('#mlAuthLogCopy').addEventListener('click',async()=>{const text=panel.querySelector('textarea').value;try{await navigator.clipboard.writeText(text);}catch(_e){const a=panel.querySelector('textarea');a.focus();a.select();document.execCommand('copy');}});
 add('PARENT','REV07 debug log initialized',{signedIn:false});
 draw();
})();
