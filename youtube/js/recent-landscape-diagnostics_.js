/* TEST ONLY - diagnostic overlay, no layout changes. DESKTOP RECENT GRID REV04 */
(function () {
  'use strict';
  if (document.getElementById('ml-recent-diag')) return;
  var panel = document.createElement('div');
  panel.id = 'ml-recent-diag';
  panel.setAttribute('role', 'status');
  panel.style.cssText = 'position:fixed!important;bottom:8px!important;right:8px!important;left:auto!important;top:auto!important;z-index:2147483647!important;width:290px!important;max-width:calc(100vw - 16px)!important;max-height:65vh!important;overflow:auto!important;padding:10px!important;background:rgba(0,0,0,.93)!important;color:#fff!important;border:2px solid #ffcc00!important;border-radius:8px!important;font:12px/1.35 monospace!important;white-space:pre-wrap!important;box-sizing:border-box!important;box-shadow:0 2px 14px #0009!important';
  var head = document.createElement('div');
  head.style.cssText='display:flex;justify-content:space-between;gap:8px;margin-bottom:6px;font-weight:bold';
  var label=document.createElement('span'); label.textContent='TEST REV01 · COMPLETION TYPES';
  var btn=document.createElement('button'); btn.type='button';btn.textContent='Hide';
  btn.style.cssText='color:#000;background:#ffcc00;border:0;padding:3px 8px;cursor:pointer';
  head.appendChild(label);head.appendChild(btn);
  var body=document.createElement('div');
  panel.appendChild(head);panel.appendChild(body);
  var minimized=false;
  btn.addEventListener('click',function(){minimized=!minimized;body.hidden=minimized;btn.textContent=minimized?'Show':'Hide';});
  function width(sel){var el=document.querySelector(sel);if(!el)return 'NOT FOUND';var r=el.getBoundingClientRect();var c=getComputedStyle(el);return Math.round(r.width)+'px / scroll '+el.scrollWidth+' / display '+c.display+' / grid '+c.gridTemplateColumns;}
  function render(){
    var v=window.visualViewport;
    var styles=Array.from(document.styleSheets).filter(function(s){return (s.href||'').indexOf('styles_.css')>=0;});
    var css=styles.map(function(s){return s.href.split('?')[1]||'no query';}).join(', ')||'NOT FOUND';
    var viewport=document.querySelector('meta[name="viewport"]');
    var normalPlatform=document.querySelector('#resultsList .list-row .list-sub');
    var np=normalPlatform?getComputedStyle(normalPlatform):null;
    var nr=normalPlatform?normalPlatform.getBoundingClientRect():null;
    var kinect=document.querySelector('#resultsGrid .card .kinect-badge');
    var lines=[
      'innerWidth: '+innerWidth+' / innerHeight: '+innerHeight,
      'html.clientWidth: '+document.documentElement.clientWidth,
      'visual: '+(v?Math.round(v.width*10)/10+' x '+Math.round(v.height*10)/10+' scale '+v.scale:'N/A'),
      'screen: '+screen.width+' x '+screen.height+' DPR '+devicePixelRatio,
      'landscape: '+matchMedia('(orientation: landscape)').matches,
      '>=901px: '+matchMedia('(min-width:901px)').matches,
      '<=900px: '+matchMedia('(max-width:900px)').matches,
      'document.scrollWidth: '+document.documentElement.scrollWidth,
      'body.scrollWidth: '+document.body.scrollWidth,
      'viewport meta: '+(viewport?viewport.content:'MISSING'),
      'styles CSS: '+css,
      'Recent section: '+width('.recent-uploads'),
      'Recent inner: '+width('.recent-uploads-inner'),
      'Recent grid: '+width('.recent-uploads-grid'),
      'Recent card: '+width('.recent-upload-card'),
      'Recent title: '+width('.recent-upload-title'),
      'Recent GS: '+width('.recent-upload-meta.gs'),
      'Recent quality: '+width('.recent-upload-meta.quality'),
      'Normal LIST: '+width('#resultsList'),
      'Normal LIST row: '+width('#resultsList .list-row'),
      'Normal platform found: '+!!normalPlatform,
      'Normal platform classes: '+(normalPlatform?normalPlatform.className:'N/A'),
      'Normal platform CSS: '+(np?('display='+np.display+' border='+np.borderTopWidth+'/'+np.borderTopStyle+' padding='+np.padding+' font='+np.fontSize+' whiteSpace='+np.whiteSpace+' wrap='+np.overflowWrap+' width='+Math.round(nr.width)):'N/A'),
      'Normal platform text: '+(normalPlatform?normalPlatform.textContent.trim().slice(0,90):'N/A'),
      'Normal GRID Kinect: '+(kinect?('radius='+getComputedStyle(kinect).borderRadius+' / text='+kinect.textContent.trim()):'NOT FOUND'),
      'Normal grid: '+width('#resultsGrid'),
      'Normal card: '+width('#resultsGrid .card'),
      'Normal thumb: '+width('#resultsGrid .thumb-wrap')
    ];
    body.textContent=lines.join('\n');
  }
  function mount(){if(!document.body)return;document.body.appendChild(panel);render();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
  window.addEventListener('resize',render);
  window.addEventListener('orientationchange',render);
  if(window.visualViewport)window.visualViewport.addEventListener('resize',render);
  setInterval(render,1500);
})();
