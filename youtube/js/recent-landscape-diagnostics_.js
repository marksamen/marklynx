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
  var label=document.createElement('span'); label.textContent='TEST SEASONAL YOUTUBE REV23 · '+(matchMedia('(orientation: portrait)').matches?'PORTRAIT':'LANDSCAPE');
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
  // REV23: replace REV41 row snapshot with read-only button paint inspector.
  // This diagnostic reads computed styles only. It never modifies site controls.
  var trace=[];
  var previous='';
  var selectors=[
    '#whatsNewMobileBtn','#whatsNewPublicBtn','.wn-button',
    '.youtube-subscribe-btn','#suggestGameBtn','.developer-showcase-btn'
  ];
  function snapshot(reason){
    var root=document.documentElement;
    var lines=[
      'REV23 BUTTON PAINT INSPECTOR ('+reason+')',
      't='+Math.round(performance.now())+'ms width='+innerWidth+
      ' orientation='+(matchMedia('(orientation:portrait)').matches?'portrait':'landscape'),
      'html: data-seasonal-theme='+JSON.stringify(root.getAttribute('data-seasonal-theme'))+
      ' data-theme='+JSON.stringify(root.getAttribute('data-theme'))+
      ' class='+JSON.stringify(root.className),
      'body: class='+JSON.stringify(document.body.className)
    ];
    selectors.forEach(function(selector){
      var nodes=document.querySelectorAll(selector);
      if(!nodes.length){lines.push(selector+': NOT FOUND');return;}
      nodes.forEach(function(el,i){
        var cs=getComputedStyle(el),rect=el.getBoundingClientRect();
        lines.push(selector+'['+i+'] '+(rect.width&&rect.height?'VISIBLE':'hidden')+
          ' bg='+cs.backgroundColor+' text='+cs.color+' display='+cs.display+
          ' class='+JSON.stringify(el.className)+
          ' inline='+JSON.stringify(el.getAttribute('style')||''));
      });
    });
    return lines.join('\n');
  }
  function render(reason){
    var result=snapshot(reason||'Inspect');
    // Ignore timestamp and reason when deciding whether visual state changed.
    var state=result.split('\n').slice(2).join('\n');
    if(state!==previous){
      previous=state;
      trace.push(result);
      if(trace.length>6)trace.shift();
    }
    body.textContent=trace.join('\n\n---- CHANGE ----\n\n');
  }
  refreshBtn.addEventListener('click',function(){render('manual');});
  function mount(){
    if(!document.body)return;
    document.body.appendChild(panel);
    render('initial');
    [100,400,1000,2500,5000].forEach(function(ms){
      setTimeout(function(){render('+'+ms+'ms');},ms);
    });
    // Low-frequency observation; no mutation observer and no writes to site DOM.
    setInterval(function(){render('poll');},1500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);
  else mount();
  window.addEventListener('resize',function(){render('resize');});
  window.addEventListener('orientationchange',function(){render('orientation');});
  if(window.visualViewport)window.visualViewport.addEventListener('resize',function(){render('viewport');});

})();
