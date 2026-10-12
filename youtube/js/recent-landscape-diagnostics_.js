/* TEST ONLY - zoom/scroll diagnostic, no layout or gesture changes. ZOOM REV04 */
(function () {
  'use strict';
  if (document.getElementById('ml-recent-diag')) return;
  var panel = document.createElement('div');
  panel.id = 'ml-recent-diag';
  panel.setAttribute('role', 'status');
  panel.style.cssText = 'position:fixed!important;bottom:8px!important;right:8px!important;left:auto!important;top:auto!important;z-index:2147483647!important;width:290px!important;max-width:calc(100vw - 16px)!important;max-height:65vh!important;overflow:auto!important;padding:10px!important;background:rgba(0,0,0,.93)!important;color:#fff!important;border:2px solid #ffcc00!important;border-radius:8px!important;font:12px/1.35 monospace!important;white-space:pre-wrap!important;box-sizing:border-box!important;box-shadow:0 2px 14px #0009!important';
  var head = document.createElement('div');
  head.style.cssText='display:flex;justify-content:space-between;gap:8px;margin-bottom:6px;font-weight:bold';
  var label=document.createElement('span'); label.textContent='TEST ZOOM REV04 · LIVE';
  var btn=document.createElement('button'); btn.type='button';btn.textContent='Hide';
  btn.style.cssText='color:#000;background:#ffcc00;border:0;padding:3px 8px;cursor:pointer';
  head.appendChild(label);head.appendChild(btn);
  var body=document.createElement('div');
  panel.appendChild(head);panel.appendChild(body);
  var minimized=false;
  btn.addEventListener('click',function(){minimized=!minimized;body.hidden=minimized;btn.textContent=minimized?'Show':'Hide';});
  function width(sel){var el=document.querySelector(sel);if(!el)return 'NOT FOUND';var r=el.getBoundingClientRect();var c=getComputedStyle(el);return Math.round(r.width)+'px / scroll '+el.scrollWidth+' / display '+c.display+' / grid '+c.gridTemplateColumns;}
  var touchCount=0, lastScrollAt=0, lastTouchAt=0, lastGesture='none';
  var lastScrollY=window.scrollY, lastScrollX=window.scrollX;
  var lastVisualEvent='none', lastVisualAt=0;
  var lastScale=window.visualViewport ? window.visualViewport.scale : null;
  var scaleChangedAt=0;
  var rafPending=false;
  function scheduleRender(){
    if(rafPending)return;
    rafPending=true;
    requestAnimationFrame(function(){rafPending=false;render();});
  }
  function onScroll(){
    if(window.scrollY!==lastScrollY||window.scrollX!==lastScrollX){
      lastScrollAt=performance.now();lastScrollY=window.scrollY;lastScrollX=window.scrollX;
    }
    scheduleRender();
  }
  function onTouch(e){
    touchCount=e.touches ? e.touches.length : 0;
    lastTouchAt=performance.now();
    lastGesture=e.type;
    scheduleRender();
  }
  function onVisual(e){lastVisualEvent=e.type;lastVisualAt=performance.now();scheduleRender();}
  function render(){
    var v=window.visualViewport;
    var styles=Array.from(document.styleSheets).filter(function(s){return (s.href||'').indexOf('styles_.css')>=0;});
    var css=styles.map(function(s){return s.href.split('?')[1]||'no query';}).join(', ')||'NOT FOUND';
    var viewport=document.querySelector('meta[name="viewport"]');
    var now=performance.now();
    var moving=(now-lastScrollAt<350);
    var scale=v?v.scale:null;
    if(scale!==lastScale){lastScale=scale;scaleChangedAt=now;}

    var lines=[
      'SNAPBACK: '+(window.__mlZoomSnapRev04 ? 'LOADED REV04' : 'NOT DETECTED'),
      'baseline scale: '+(window.__mlZoomSnapRev04 ? window.__mlZoomSnapRev04.baseline : 'N/A'),
      'pinch observed: '+(window.__mlZoomSnapRev04 ? window.__mlZoomSnapRev04.multiTouchSeen : 'N/A'),
      'restore: '+(window.__mlZoomSnapRev04 ? 'detected '+window.__mlZoomSnapRev04.detected+' / attempted '+window.__mlZoomSnapRev04.attempts : 'N/A'),
      'result: '+(window.__mlZoomSnapRev04 ? 'success '+window.__mlZoomSnapRev04.successes+' / failed '+window.__mlZoomSnapRev04.failures : 'N/A'),
      'scale before/after: '+(window.__mlZoomSnapRev04 ? window.__mlZoomSnapRev04.before+' / '+window.__mlZoomSnapRev04.after : 'N/A'),
      'last reset: '+(window.__mlZoomSnapRev04 ? window.__mlZoomSnapRev04.last : 'N/A'),
      'SCROLL: '+(moving?'MOVING':'STILL')+' | y='+Math.round(window.scrollY)+' x='+Math.round(window.scrollX),
      'TOUCH: '+touchCount+' finger(s) | '+lastGesture+(now-lastTouchAt<1000?' (recent)':''),
      'VISUAL event: '+lastVisualEvent+(now-lastVisualAt<1000?' (recent)':''),
      'SCALE changed: '+(scaleChangedAt?(Math.round((now-scaleChangedAt)/100)/10)+'s ago':'not observed'),
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
      'Recent quality: '+width('.recent-upload-meta.quality')
    ];
    body.textContent=lines.join('\n');
  }
  function mount(){if(!document.body)return;document.body.appendChild(panel);render();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
  window.addEventListener('resize',scheduleRender);
  window.addEventListener('orientationchange',scheduleRender);
  window.addEventListener('scroll',onScroll,{passive:true});
  ['touchstart','touchmove','touchend','touchcancel'].forEach(function(type){
    window.addEventListener(type,onTouch,{passive:true});
  });
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize',onVisual);
    window.visualViewport.addEventListener('scroll',onVisual);
  }
  // Refresh status briefly after a gesture/scroll stops; do not block gestures.
  setInterval(scheduleRender,250);
})();
