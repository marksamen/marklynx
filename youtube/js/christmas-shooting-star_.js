/* CHRISTMAS TEST REV45 — isolated shooting-star scheduler. */
(function () {
  'use strict';
  var root = document.documentElement;
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mount = document.getElementById('mainModuleMount');
  var pending = null, finish = null, layer = null, modal = null;
  var releaseBoundary = null;
  var printing = false, suspended = false, started = false;
  function random(min, max) { return min + Math.random() * (max - min); }
  function allowed() {
    var video = document.getElementById('videoModalOverlay');
    return root.getAttribute('data-seasonal-theme') === 'christmas' &&
      !motion.matches && !document.hidden && !printing && !suspended &&
      !(video && video.classList.contains('open'));
  }
  function clearPending() {
    if (pending !== null) { window.clearTimeout(pending); pending = null; }
  }
  function clearStar() {
    if(releaseBoundary){releaseBoundary();releaseBoundary=null;}
    if (finish !== null) { window.clearTimeout(finish); finish = null; }
    if (layer) { layer.remove(); layer = null; }
  }
  function schedule() {
    if (!allowed() || pending !== null || layer) return;
    pending = window.setTimeout(function () {
      pending = null;
      if (allowed()) fly();
    }, Math.round(started ? random(5000,20000) : random(3000,8000)));
  }
  function fly() {
    if (!allowed() || layer) return;
    var boundary=window.mlChristmasSafeArea, area=boundary&&boundary.measure();
    if(!area){schedule();return;}
    var w=area.width,h=area.height;
    var direction = Math.random() < .5 ? 1 : -1;
    var x = w * (direction === 1 ? random(.08,.26) : random(.74,.92));
    var dx = direction * w * random(.36,.57);
    var dy = Math.min(150,h * random(.10,.18),area.available*.28);
    // The rotated trailing streak points upward. Reserve its full vertical projection,
    // the core radius and a conservative 22px for both drop shadows.
    var trail=Math.max(80,Math.min(240,w*.15)), thick=Math.max(8,Math.min(13,w*.01));
    var core=Math.max(22,Math.min(42,w*.026));
    var upper=Math.ceil(Math.max(core/2,trail*dy/Math.hypot(dx,dy)+thick/2)+22);
    var lower=Math.ceil(Math.max(core/2,thick/2)+22);
    if(area.available<upper+lower+dy){schedule();return;}
    var y=random(area.top+upper,area.bottom-lower-dy);
    var duration = Math.round(random(1400,2100));
    var node = document.createElement('div');
    node.id = 'ml-christmas-shooting-star';
    node.setAttribute('aria-hidden','true');
    var flight = document.createElement('span');
    flight.className = 'ml-xmas-star-flight';
    var art = document.createElement('span');
    art.className = 'ml-xmas-star-art';
    flight.appendChild(art); node.appendChild(flight);
    flight.style.setProperty('--star-x',x+'px');
    flight.style.setProperty('--star-y',y+'px');
    flight.style.setProperty('--star-dx',dx+'px');
    flight.style.setProperty('--star-dy',dy+'px');
    flight.style.setProperty('--star-angle',(Math.atan2(dy,dx)*180/Math.PI)+'deg');
    flight.style.setProperty('--star-duration',duration+'ms');
    layer = node; started = true;
    function complete() {
      if (layer !== node) return;
      clearStar(); schedule();
    }
    flight.addEventListener('animationend',complete,{once:true});
    document.body.appendChild(node);
    releaseBoundary=boundary.watch(node,y-upper,y+dy+lower,function(){clearStar();schedule();});
    if(layer!==node)return;
    finish = window.setTimeout(complete,duration+150);
  }
  function reconcile() {
    if (!allowed()) { clearPending(); clearStar(); return; }
    schedule();
  }
  var modalObserver = new MutationObserver(reconcile);
  function bindModal() {
    var next = document.getElementById('videoModalOverlay');
    if (next !== modal) {
      modalObserver.disconnect(); modal = next;
      if (modal) modalObserver.observe(modal,{attributes:true,attributeFilter:['class']});
    }
    reconcile();
  }
  // Loader inserts the main module asynchronously. Only watch its direct children;
  // the existing modal is inserted with the main module, not with guide rows.
  if (mount) new MutationObserver(bindModal).observe(mount,{childList:true});
  new MutationObserver(reconcile).observe(root,{attributes:true,attributeFilter:['data-seasonal-theme']});
  if (motion.addEventListener) motion.addEventListener('change',reconcile);
  else if (motion.addListener) motion.addListener(reconcile);
  document.addEventListener('visibilitychange',reconcile);
  window.addEventListener('resize',function () { if (layer) {clearStar();reconcile();} });
  window.addEventListener('beforeprint',function () { printing=true;reconcile(); });
  window.addEventListener('afterprint',function () { printing=false;reconcile(); });
  window.addEventListener('pagehide',function () { suspended=true;reconcile(); });
  window.addEventListener('pageshow',function () { suspended=false;reconcile(); });
  bindModal();
})();
