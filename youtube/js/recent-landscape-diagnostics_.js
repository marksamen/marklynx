/* TEST ONLY - diagnostic overlay, no layout changes. SEASONAL-CHRISTMAS-REFINEMENT TEST REV02 (Christmas REV62 diagnostics preserved) */
(function () {
  'use strict';
  if (document.getElementById('ml-recent-diag')) return;
  var panel = document.createElement('div');
  panel.id = 'ml-recent-diag';
  panel.setAttribute('role', 'status');
  panel.style.cssText = 'position:fixed!important;bottom:8px!important;right:8px!important;left:auto!important;top:auto!important;z-index:2147483647!important;width:290px!important;max-width:calc(100vw - 16px)!important;max-height:65vh!important;overflow:auto!important;padding:10px!important;background:rgba(0,0,0,.93)!important;color:#fff!important;border:2px solid #ffcc00!important;border-radius:8px!important;font:12px/1.35 monospace!important;white-space:pre-wrap!important;box-sizing:border-box!important;box-shadow:0 2px 14px #0009!important';
  var head = document.createElement('div');
  head.style.cssText='display:flex;justify-content:space-between;gap:8px;margin-bottom:6px;font-weight:bold';
  var label=document.createElement('span'); label.textContent='SEASONAL-CHRISTMAS-REFINEMENT TEST REV02 · '+(matchMedia('(orientation: portrait)').matches?'PORTRAIT':'LANDSCAPE');
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
  // REV51: compact, read-only mobile filter trace. Copy action is user initiated.
  var ids=['typeFilter','diffFilter','platformFilter','qualityFilter','featuresFilter','sortSelect'];
  var trace=[];var previous='';
  var copyBtn=document.createElement('button');
  copyBtn.type='button';copyBtn.textContent='Copy';copyBtn.style.cssText=btn.style.cssText;
  head.insertBefore(copyBtn,btn);
  function capture(reason){
    var root=document.documentElement; label.textContent='SEASONAL-CHRISTMAS-REFINEMENT TEST REV02 · '+(matchMedia('(orientation: portrait)').matches?'PORTRAIT':'LANDSCAPE');
    var lines=['SEASONAL-CHRISTMAS-REFINEMENT REV02 GRID OVERLAYS ('+reason+') t='+Math.round(performance.now())+'ms',
      'viewport='+innerWidth+'x'+innerHeight+' '+(matchMedia('(orientation:portrait)').matches?'P':'L')+
      ' seasonal='+root.getAttribute('data-seasonal-theme')+' theme='+root.getAttribute('data-theme')];

    lines.push('CHRISTMAS SCRIPT REV62; CSS fingerprint='+getComputedStyle(root).getPropertyValue('--ml-christmas-test-revision').trim());
    lines.push('SANTA REV58: '+(typeof window.mlChristmasSantaDiagnostics==='function'?JSON.stringify(window.mlChristmasSantaDiagnostics()):'scheduler not loaded'));
    lines.push('TRAIN REV58: '+(typeof window.mlChristmasTrainDiagnostics==='function'?JSON.stringify(window.mlChristmasTrainDiagnostics()):'not loaded'));
    lines.push('COORDINATOR REV51: '+(typeof window.mlChristmasCoordinatorDiagnostics==='function'?JSON.stringify(window.mlChristmasCoordinatorDiagnostics()):'not loaded'));
    lines.push('FOOTPRINTS REV58: '+(typeof window.mlChristmasFootprintsDiagnostics==='function'?JSON.stringify(window.mlChristmasFootprintsDiagnostics()):'not loaded'));
    lines.push('GINGERBREAD REV54: '+(typeof window.mlChristmasGingerbreadDiagnostics==='function'?JSON.stringify(window.mlChristmasGingerbreadDiagnostics()):'not loaded'));
    lines.push('CELEBRATION REV58: '+(typeof window.mlChristmasCelebrationDiagnostics==='function'?JSON.stringify(window.mlChristmasCelebrationDiagnostics()):'not loaded'));
    lines.push('FIREWORKS REV59: '+(typeof window.mlChristmasFireworksDiagnostics==='function'?JSON.stringify(window.mlChristmasFireworksDiagnostics()):'not loaded'));
    lines.push('CONFETTI REV60B: '+(typeof window.mlChristmasConfettiDiagnostics==='function'?JSON.stringify(window.mlChristmasConfettiDiagnostics()):'not loaded'));
    lines.push('TOAST REV61: '+(typeof window.mlChristmasToastDiagnostics==='function'?JSON.stringify(window.mlChristmasToastDiagnostics()):'not loaded'));
    lines.push('CHRISTMAS AUDIO: '+(typeof window.mlChristmasSoundDiagnostics==='function'?JSON.stringify(window.mlChristmasSoundDiagnostics()):'not loaded'));
    lines.push('Preserved TP CSS fingerprint='+getComputedStyle(root).getPropertyValue('--ml-tp-test-revision').trim());
    lines.push('stylesheet='+Array.from(document.querySelectorAll('link[rel=stylesheet]')).filter(function(l){return l.href.indexOf('/styles_.css?')!==-1;}).map(function(l){return l.href+' loaded='+!!l.sheet;}).join(' '));
    ['(orientation:landscape)','(max-width:900px)','(max-height:500px)','(hover:none)','(pointer:coarse)'].forEach(function(q){lines.push(q+'='+matchMedia(q).matches);});
    function describe(el){if(!el)return 'none';var c=getComputedStyle(el),r=el.getBoundingClientRect();return el.className+' display='+c.display+' marginTop='+c.marginTop+' marginBottom='+c.marginBottom+' rowGap='+c.rowGap+' columnGap='+c.columnGap+' order='+c.order+' rect='+[r.x,r.y,r.width,r.height].map(function(n){return n.toFixed(1);}).join(',');}
    lines.push('HTML revision='+((document.querySelector('meta[name="ml-test-revision"]')||{}).content||'missing')+' URL='+location.href);
    function visible(el){if(!el)return false;var c=getComputedStyle(el),r=el.getBoundingClientRect();return c.display!=='none'&&c.visibility!=='hidden'&&r.width>0&&r.height>0;}
    function preceding(el){var p=el.previousElementSibling;while(p&&!visible(p))p=p.previousElementSibling;return p;}
    function gap(a,b){return (b.getBoundingClientRect().top-a.getBoundingClientRect().bottom).toFixed(1);}
    document.querySelectorAll('#recentUploadsSection .recent-upload-card').forEach(function(card,i){
      if(!visible(card))return;
      var metric=Array.from(card.querySelectorAll('.recent-upload-meta.gs')).find(function(el){return visible(el)&&(!el.parentElement.closest('.recent-points-stack'));});
      if(!metric)return;
      var stack=metric.classList.contains('recent-points-stack'), first=stack?metric.firstElementChild:metric, last=stack?metric.lastElementChild:metric;
      var prev=preceding(metric);
      lines.push('CARD '+i+' '+(stack?'DUAL':'SINGLE')+' '+describe(card));
      lines.push('METRIC '+describe(metric));lines.push('PREV VISIBLE '+describe(prev));lines.push('FIRST '+describe(first));
      if(prev&&first){lines.push('visible sibling-to-first vertical gap='+gap(prev,first)); var badges=Array.from(prev.querySelectorAll('.text-guide-badge,.kinect-badge,.developer-provided-badge,.recent-upload-platform,.recent-upload-title,.ml-recent-episode-details')).filter(visible); badges.sort(function(a,b){return b.getBoundingClientRect().bottom-a.getBoundingClientRect().bottom;}); if(badges.length){lines.push('LAST TITLE BADGE '+describe(badges[0]));lines.push('last title badge-to-first gap='+gap(badges[0],first));}}
      if(stack&&first&&last&&first!==last)lines.push('internal vertical gap='+gap(first,last));
      Array.from(card.children).filter(visible).forEach(function(child,j){lines.push('VISIBLE CHILD '+j+' '+describe(child));});
    });
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
    var msg=document.getElementById('markLynxMessagePublicBtn');
    lines.push('MESSAGE FROM MARK LYNX REV18: '+(msg?(msg.dataset.messageDiagnostic||'loading'):'not mounted'));
    return lines.join('\n');
  }
  function render(reason){
    var report=capture(reason);
    var state=report.split('\n').slice(1).join('\n');
    if(state!==previous){previous=state;trace.push(report);if(trace.length>3)trace.shift();}
    body.textContent=trace.join('\n---\n');
  }
  copyBtn.addEventListener('click',function(){
    render('Copy'); var value=capture('Copy snapshot');
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
  // TEST-only collision avoidance. Never promote this diagnostic adjustment.
  function positionBackToTop(){
    var control=document.getElementById('mlBackToTop');
    if(!control || !panel.isConnected)return;
    var rect=panel.getBoundingClientRect();
    if(rect.left >= 72){
      control.style.right=Math.ceil(window.innerWidth-rect.left+8)+'px';
      control.style.bottom='';
    }else{
      control.style.right='';
      control.style.bottom=Math.ceil(window.innerHeight-rect.top+8)+'px';
    }
  }
  function mount(){
    if(!document.body)return;document.body.appendChild(panel);render('initial');
    positionBackToTop();
    if(typeof ResizeObserver==='function')new ResizeObserver(positionBackToTop).observe(panel);
    window.addEventListener('resize',positionBackToTop);
    [100,500,1500,3500].forEach(function(ms){setTimeout(function(){render('+'+ms+'ms');},ms);});
    setInterval(function(){render('poll');},1500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);
  else mount();
  window.addEventListener('resize',function(){render('resize');});
  window.addEventListener('orientationchange',function(){render('orientation');});
})();
