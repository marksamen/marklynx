/* CHRISTMAS TEST REV41 — isolated elf-peek scheduler. */
(function () {
  'use strict';
  var root = document.documentElement;
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mount = document.getElementById('mainModuleMount');
  var pending = null, finish = null, elf = null, modal = null;
  var printing = false, suspended = false, started = false, lastSide = null;
  function random(min,max) { return min + Math.random()*(max-min); }
  function allowed() {
    var video = document.getElementById('videoModalOverlay');
    return root.getAttribute('data-seasonal-theme') === 'christmas' &&
      !motion.matches && !document.hidden && !printing && !suspended &&
      !(video && video.classList.contains('open'));
  }
  function clearPending() {
    if (pending !== null) { window.clearTimeout(pending); pending = null; }
  }
  function clearElf() {
    if (finish !== null) { window.clearTimeout(finish); finish = null; }
    if (elf) { elf.remove(); elf = null; }
  }
  function schedule() {
    if (!allowed() || pending !== null || elf || !document.body) return;
    pending = window.setTimeout(function () {
      pending = null;
      if (allowed()) peek();
      else reconcile();
    }, Math.round(started ? random(5000,20000) : random(3000,8000)));
  }
  function peek() {
    if (!allowed() || elf) return;
    // CSS fixed viewport coordinates: no dependence on banner or scrollY.
    var vw = root.clientWidth, vh = Math.min(root.clientHeight, window.innerHeight);
    if (vw < 80 || vh < 100) { schedule(); return; }
    var sides = ['left','right','bottom'].filter(function(s){return s !== lastSide;});
    var side = sides[Math.floor(Math.random()*sides.length)];
    var h = Math.floor(Math.min(vw <= 600 ? 118 : vw <= 900 ? 130 : 162, vh*.34));
    var w = Math.round(h*120/206), pad = 10;
    var x, y, dx = 0, dy = 0;
    if (side === 'bottom') {
      x = Math.round(random(pad, Math.max(pad,vw-w-pad)));
      y = vh-h-pad; dy = h+pad+20;
    } else {
      x = side === 'right' ? vw-w-pad : pad;
      y = Math.round(random(Math.min(vh*.48,vh-h-pad), vh-h-pad));
      dx = side === 'right' ? w+pad+20 : -w-pad-20;
    }
    var node = document.createElement('div');
    node.id='ml-christmas-elf'; node.setAttribute('aria-hidden','true');
    node.style.display='none';
    node.setAttribute('data-elf-side',side);
    var values={'--elf-x':x+'px','--elf-y':y+'px','--elf-width':w+'px','--elf-height':h+'px',
      '--elf-hide-x':dx+'px','--elf-hide-y':dy+'px','--elf-mirror':side==='right'?'-1':'1'};
    Object.keys(values).forEach(function(k){node.style.setProperty(k,values[k]);});
    var actor=document.createElement('span');node.appendChild(actor);
    elf=node; started=true; lastSide=side;
    function complete(){if(elf!==node)return;clearElf();schedule();}
    actor.addEventListener('animationend',complete,{once:true});
    document.body.appendChild(node);finish=window.setTimeout(complete,4150);
  }
  function reconcile(){
    if(!allowed()){clearPending();clearElf();return;}
    if(elf&&!elf.isConnected)clearElf();
    schedule();
  }
  var modalObserver=new MutationObserver(reconcile);
  function bindModal(){
    var next=document.getElementById('videoModalOverlay');
    if(next!==modal){modalObserver.disconnect();modal=next;if(modal)modalObserver.observe(modal,{attributes:true,attributeFilter:['class']});}
    reconcile();
  }
  if(mount)new MutationObserver(bindModal).observe(mount,{childList:true});
  new MutationObserver(reconcile).observe(root,{attributes:true,attributeFilter:['data-seasonal-theme']});
  if(motion.addEventListener)motion.addEventListener('change',reconcile);
  else if(motion.addListener)motion.addListener(reconcile);
  document.addEventListener('visibilitychange',reconcile);
  window.addEventListener('resize',function(){if(elf){clearElf();reconcile();}});
  window.addEventListener('beforeprint',function(){printing=true;reconcile();});
  window.addEventListener('afterprint',function(){printing=false;reconcile();});
  window.addEventListener('pagehide',function(){suspended=true;reconcile();});
  window.addEventListener('pageshow',function(){suspended=false;reconcile();});
  bindModal();
})();
