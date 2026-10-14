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
  var label=document.createElement('span'); label.textContent='TEST REV35 · COMPLETION TYPES · '+(matchMedia('(orientation: portrait)').matches?'PORTRAIT':'LANDSCAPE');
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
      'REV35 LIST INSPECTOR (manual snapshot)',
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
})();
