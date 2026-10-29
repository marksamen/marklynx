/* TEST ONLY — Admin diagnostics extracted from copyright/index_.html.
 * MESSAGE FROM MARK LYNX TEST REV04. Never load from production index.html.
 * Original diagnostics observers and behavior retained.
 */
(function(){
  const css = document.createElement('style');
  css.textContent = '\n#wnDiag{position:fixed;bottom:10px;right:10px;z-index:2147483647;width:min(380px,calc(100vw - 20px));max-height:45vh;overflow:auto;background:#111827;color:#e5e7eb;border:2px solid #facc15;border-radius:9px;padding:9px;font:11px/1.45 Consolas,monospace;box-shadow:0 5px 24px #000a}\n#wnDiag button{background:#facc15;color:#111;border:0;border-radius:4px;padding:3px 7px;cursor:pointer;font-weight:bold}\n#wnDiag pre{white-space:pre-wrap;overflow-wrap:anywhere;margin:6px 0 0;font:inherit}\n#wnDiag .head{position:sticky;top:0;background:#111827;z-index:1;display:flex;justify-content:space-between;gap:8px;align-items:center}\n';
  document.head.appendChild(css);
  const host = document.createElement('div');
  host.innerHTML = '<div id="wnDiag" aria-label="MESSAGE FROM MARK LYNX TEST REV04 diagnostics"><div class="head"><strong>MESSAGE FROM MARK LYNX TEST REV04 — WHAT\'S NEW DIAGNOSTICS</strong><span><button id="wnDiagHide" type="button" aria-expanded="true">HIDE</button> <button id="wnDiagCopy" type="button">Copy log</button></span></div><pre id="wnDiagText">Starting…</pre></div>';
  document.body.appendChild(host.firstElementChild);
})();
(function(){
 const panel=document.getElementById('wnDiagText'), logs=[];
 const $=id=>document.getElementById(id);
 const visible=id=>{const el=$(id);return el?getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden':'missing';};
 const state=()=>({loginVisible:visible('login'),adminVisible:visible('admin'),modalOpen:$('adminPageModal')?.classList.contains('open'),iframeSrc:$('adminPageModalFrame')?.getAttribute('src'),viewport:innerWidth+'x'+innerHeight,visualViewport:window.visualViewport?Math.round(visualViewport.width)+'x'+Math.round(visualViewport.height)+' @'+visualViewport.scale:'n/a',devicePixelRatio:devicePixelRatio,visibility:document.visibilityState});
 const log=(event)=>{const line=new Date().toLocaleTimeString('en-US',{hour12:true})+'.'+String(new Date().getMilliseconds()).padStart(3,'0')+' '+event+' '+JSON.stringify(state());logs.push(line);if(logs.length>500)logs.shift();const scroller=panel.parentElement;const atBottom=scroller.scrollHeight-scroller.scrollTop-scroller.clientHeight<25;panel.textContent=logs.join('\n');if(atBottom)scroller.scrollTop=scroller.scrollHeight;};
 $('wnDiagHide').addEventListener('click',()=>{const pre=$('wnDiagText'),hide=pre.style.display!=='none';pre.style.display=hide?'none':'';$('wnDiagHide').textContent=hide?'SHOW':'HIDE';$('wnDiagHide').setAttribute('aria-expanded',String(!hide));$('wnDiag').style.maxHeight=hide?'none':'45vh';});
 $('wnDiagCopy').addEventListener('click',()=>navigator.clipboard?.writeText(logs.join('\n')).catch(()=>{}));
 const observe=()=>{for(const id of ['login','admin','adminPageModal','adminPageModalFrame']){const el=$(id);if(el)new MutationObserver(()=>log('DOM change '+id)).observe(el,{attributes:true,attributeFilter:['style','class','src','aria-hidden']});}}
 observe();log('MESSAGE FROM MARK LYNX TEST REV04 — diagnostics initialized');
 $('adminPageModalFrame')?.addEventListener('load',()=>log('iframe loaded'));
 $('adminPageModalClose')?.addEventListener('click',()=>log('modal close clicked'));
 $('whatsNewProbe')?.addEventListener('click',()=>log('probe clicked'));
 window.addEventListener('storage',e=>log('storage event key='+String(e.key).slice(0,45)));
 document.addEventListener('visibilitychange',()=>log('visibility change'));
 window.addEventListener('resize',()=>log('resize'));
  // TEST REV03: passive publication audit. Never log payload bodies, tokens or personal data.
  // This listener observes messages; it does not dispatch requests or change announcement state.
  window.addEventListener('message',e=>{
    if(e.origin!==location.origin)return;
    const d=e.data;if(!d||typeof d!=='object')return;
    if(d.wnProbeEvent)log('probe: '+String(d.wnProbeEvent).slice(0,600));
    // Observe only messages from the known TEST What's New iframe or parent responses.
    const frame=$('adminPageModalFrame');
    if(e.source!==frame?.contentWindow)return;
    if(d.type==='wn-admin-action-request'){
      const p=d.payload||{};
      log('PUBLICATION ACTION REQUEST '+JSON.stringify({action:String(p.action||''),id:p.id??null,language:p.language_code??null,requestId:String(d.requestId||'')}));
    }else if(d.type==='wn-probe-readonly-request')log('PUBLICATION LIST REQUEST');
  });
  // Existing iframe REV16 diagnostics report action responses and list counts.

 window.addEventListener('pagehide',()=>log('pagehide'));
})();
