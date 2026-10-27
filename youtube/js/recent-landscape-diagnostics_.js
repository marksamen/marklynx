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
  var label=document.createElement('span'); label.textContent='TEST SEASONAL YOUTUBE REV22 · '+(matchMedia('(orientation: portrait)').matches?'PORTRAIT':'LANDSCAPE');
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
  function width(sel){var el=document.querySelector(sel);if(!el)return 'NOT FOUND';var r=el.getBoundingClientRect();var c=getComputedStyle(el);return Math.round(r.width)+'px / scroll '+el.scrollWidth+' / display '+c.display+' / grid '+c.gridTemplateColumns;}
  function elementInfo(el){
    if(!el)return 'MISSING';
    var c=getComputedStyle(el),r=el.getBoundingClientRect();
    return 'x='+Math.round(r.x)+' w='+Math.round(r.width)+
      ' display='+c.display+' visibility='+c.visibility+
      ' order='+c.order+' gridCol='+c.gridColumn+
      ' position='+c.position+' margin='+c.marginLeft+'/'+c.marginRight+
      ' text='+JSON.stringify(el.textContent.trim().slice(0,45));
  }
  function inspectRow(row,title){
    if(!row)return [title+': ROW NOT FOUND'];
    var c=getComputedStyle(row),r=row.getBoundingClientRect();
    var lines=[title+' ROW x='+Math.round(r.x)+' w='+Math.round(r.width)+
      ' display='+c.display+' justify='+c.justifyContent+
      ' gap='+c.columnGap+' grid='+c.gridTemplateColumns];
    var selectors=[
      ['Gamerscore','.list-col.gs'],
      ['Completion','.completion-type-list-desktop'],
      ['Genre','.list-col.type'],
      ['Time','.list-col.time'],
      ['Difficulty','.list-col.diff'],
      ['Quality','.list-col.quality']
    ];
    selectors.forEach(function(entry){lines.push('  '+entry[0]+': '+elementInfo(row.querySelector(entry[1])));});
    return lines;
  }
  function render(){
    var rows=Array.from(document.querySelectorAll('#resultsList .list-row'));
    var mario=rows.find(function(r){return /New Super Mario Bros/i.test(r.textContent);});
    var test=rows.find(function(r){return /TEST VIDEO 1080p/i.test(r.textContent);});
    var xbox=rows.find(function(r){return r.querySelector('.list-col.gs');});
    var lines=[
      'REV41 LIST INSPECTOR (manual snapshot)',
      'width='+innerWidth+' fine='+matchMedia('(pointer:fine)').matches+
      ' hover='+matchMedia('(hover:hover)').matches,
      'rows currently rendered='+rows.length,
      'Normal LIST display='+getComputedStyle(document.querySelector('#resultsList')||document.body).display
    ];
    lines=lines.concat(inspectRow(mario,'MARIO'),inspectRow(test,'TEST VIDEO 1080p'),inspectRow(xbox,'XBOX SAMPLE'));
    if(!mario&&!test)lines.push('Search for Mario or TEST VIDEO 1080p, then click Inspect.');
    body.textContent=lines.join('\n');
  }
  refreshBtn.addEventListener('click',render);
  function mount(){if(!document.body)return;document.body.appendChild(panel);render();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
  window.addEventListener('resize',render);
  window.addEventListener('orientationchange',render);
  if(window.visualViewport)window.visualViewport.addEventListener('resize',render);
  // No timer or mutation observer: diagnostic runs only on load, resize or Inspect.

  // REV22: READ-ONLY computed paint trace. No application styles or state modified.
  var trace=[],previous='';
  var targets=['.youtube-subscribe-btn','#suggestGameBtn','.developer-showcase-btn','#whatsNewPublicBtn','#whatsNewMobileBtn','.wn-button'];
  var traceBox=document.createElement('div');
  traceBox.style.cssText='border-top:1px solid #ffcc00;margin-top:8px;padding-top:6px;white-space:pre-wrap;overflow-wrap:anywhere';
  var traceTitle=document.createElement('div');traceTitle.textContent='REV22 BUTTON PAINT TRACE (read-only)';traceBox.appendChild(traceTitle);
  var copyButton=document.createElement('button');copyButton.type='button';copyButton.textContent='Copy trace';
  copyButton.style.cssText='color:#000;background:#ffcc00;border:0;padding:3px 8px;margin:5px 0;cursor:pointer';
  traceBox.appendChild(copyButton);
  var traceOutput=document.createElement('div');traceBox.appendChild(traceOutput);
  function snapshot(reason){
    var root=document.documentElement;
    var lines=['season='+root.getAttribute('data-seasonal-theme')+' theme='+root.getAttribute('data-theme')+' width='+innerWidth];
    targets.forEach(function(selector){document.querySelectorAll(selector).forEach(function(el,i){
      var c=getComputedStyle(el),r=el.getBoundingClientRect();
      lines.push(selector+'['+i+'] '+(r.width&&r.height?'visible':'hidden')+' bg='+c.backgroundColor+' fg='+c.color+' border='+c.borderTopColor+' class='+JSON.stringify(el.className)+' inline='+JSON.stringify(el.getAttribute('style')||''));
    });});
    var state=lines.join('\n');
    if(state!==previous){previous=state;trace.push('['+Math.round(performance.now())+'ms '+reason+']\n'+state);if(trace.length>8)trace.shift();}
    traceOutput.textContent=trace.join('\n---\n');
  }
  copyButton.addEventListener('click',function(){
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(trace.join('\n---\n')).catch(function(){copyButton.textContent='Copy blocked: screenshot instead';});}
    else copyButton.textContent='Copy unavailable: screenshot instead';
  });
  function startTrace(){body.appendChild(traceBox);snapshot('initial');
    var observer=new MutationObserver(function(records){
      if(records.some(function(r){return !panel.contains(r.target)&&r.target!==panel;}))snapshot('DOM mutation');
    });
    observer.observe(document.documentElement,{subtree:true,attributes:true,childList:true,attributeFilter:['class','style','data-theme','data-seasonal-theme']});
    [100,500,1500,3500].forEach(function(t){setTimeout(function(){snapshot('+'+t+'ms');},t);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startTrace);else startTrace();
})();
