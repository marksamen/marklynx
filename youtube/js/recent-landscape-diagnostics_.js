/* TEST ONLY - diagnostic overlay, no layout changes. COMPLETION TYPES REV25 */
(function () {
  'use strict';
  if (document.getElementById('ml-recent-diag')) return;
  var panel = document.createElement('div');
  panel.id = 'ml-recent-diag';
  panel.setAttribute('role', 'status');
  panel.style.cssText = 'position:fixed!important;bottom:8px!important;right:8px!important;left:auto!important;top:auto!important;z-index:2147483647!important;width:290px!important;max-width:calc(100vw - 16px)!important;max-height:65vh!important;overflow:auto!important;padding:10px!important;background:rgba(0,0,0,.93)!important;color:#fff!important;border:2px solid #ffcc00!important;border-radius:8px!important;font:12px/1.35 monospace!important;white-space:pre-wrap!important;box-sizing:border-box!important;box-shadow:0 2px 14px #0009!important';
  var head = document.createElement('div');
  head.style.cssText='display:flex;justify-content:space-between;gap:8px;margin-bottom:6px;font-weight:bold';
  var label=document.createElement('span'); label.textContent='TEST SEASONAL YOUTUBE REV40 · '+(matchMedia('(orientation: portrait)').matches?'PORTRAIT':'LANDSCAPE');
  var btn=document.createElement('button'); btn.type='button';btn.textContent='Hide';
  btn.style.cssText='color:#000;background:#ffcc00;border:0;padding:3px 8px;cursor:pointer';
  head.appendChild(label);
  var refreshBtn=document.createElement('button');refreshBtn.type='button';refreshBtn.textContent='Inspect';
  refreshBtn.style.cssText=btn.style.cssText;
  head.appendChild(refreshBtn);head.appendChild(btn);
  var body=document.createElement('div');
  panel.appendChild(head);panel.appendChild(body);
  var minimized=false;
  btn.addEventListener('click',function(){minimized=!minimized;body.hidden=minimized;btn.textContent=minimized?'Show':'Hide';});
  // REV24: compact, read-only mobile filter trace. Copy action is user initiated.
  var ids=['typeFilter','diffFilter','platformFilter','qualityFilter','featuresFilter','sortSelect'];
  var trace=[];var previous='';
  var copyBtn=document.createElement('button');
  copyBtn.type='button';copyBtn.textContent='Copy';copyBtn.style.cssText=btn.style.cssText;
  head.insertBefore(copyBtn,btn);
  function capture(reason){
    var root=document.documentElement;
    var lines=['REV24 FILTER PAINT ('+reason+') t='+Math.round(performance.now())+'ms',
      'viewport='+innerWidth+'x'+innerHeight+' '+(matchMedia('(orientation:portrait)').matches?'P':'L')+
      ' seasonal='+root.getAttribute('data-seasonal-theme')+' theme='+root.getAttribute('data-theme')];
    ids.forEach(function(id){
      var select=document.getElementById(id);
      if(!select){lines.push(id+': MISSING');return;}
      var anchor=select.closest('.ml-filter-popup-anchor');
      var trigger=anchor&&anchor.querySelector('.ml-filter-popup-trigger');
      var el=trigger||select,cs=getComputedStyle(el),r=el.getBoundingClientRect();
      lines.push(id+': '+(trigger?'TRIGGER':'SELECT')+' '+(r.width&&r.height?'shown':'hidden')+
        ' bg='+cs.backgroundColor+' fg='+cs.color+' border='+cs.borderTopColor+
        ' shadow='+cs.boxShadow+' appearance='+cs.appearance+
        ' css='+JSON.stringify(el.getAttribute('style')||''));
    });
    return lines.join('\n');
  }
  function render(reason){
    var report=capture(reason);
    var state=report.split('\n').slice(1).join('\n');
    if(state!==previous){previous=state;trace.push(report);if(trace.length>3)trace.shift();}
    body.textContent=trace.join('\n---\n');
  }
  copyBtn.addEventListener('click',function(){
    var value=trace.join('\n---\n');
    function fallback(){
      var ta=document.createElement('textarea');ta.value=value;
      ta.style.cssText='position:fixed;left:0;top:0;width:1px;height:1px;opacity:.01';
      document.body.appendChild(ta);ta.focus();ta.select();ta.setSelectionRange(0,ta.value.length);
      var ok=false;try{ok=document.execCommand('copy');}catch(e){}
      ta.remove();copyBtn.textContent=ok?'Copied!':'Copy failed';
    }
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(value).then(function(){copyBtn.textContent='Copied!';},fallback);
    }else fallback();
  });
  refreshBtn.addEventListener('click',function(){render('Inspect');});
  function mount(){
    if(!document.body)return;document.body.appendChild(panel);render('initial');
    [100,500,1500,3500].forEach(function(ms){setTimeout(function(){render('+'+ms+'ms');},ms);});
    setInterval(function(){render('poll');},1500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);
  else mount();
  window.addEventListener('resize',function(){render('resize');});
  window.addEventListener('orientationchange',function(){render('orientation');});
})();
