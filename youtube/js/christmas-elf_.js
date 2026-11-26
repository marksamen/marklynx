/* CHRISTMAS TEST REV51 — coordinated elf-peek event. */
(function () {
  'use strict';
  var root = document.documentElement;
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mount = document.getElementById('mainModuleMount');
  var finish = null, elf = null, modal = null;
  var releaseBoundary=null;
  var printing = false, suspended = false, lastSide = null;
  function random(min,max) { return min + Math.random()*(max-min); }
  function allowed() {
    var video = document.getElementById('videoModalOverlay');
    return root.getAttribute('data-seasonal-theme') === 'christmas' &&
      !motion.matches && !document.hidden && !printing && !suspended &&
      !(video && video.classList.contains('open'));
  }
  function clearPending() {
    if(window.mlChristmasCoordinator)window.mlChristmasCoordinator.cancel('elf');
  }
  function clearElf() {
    if(releaseBoundary){releaseBoundary();releaseBoundary=null;}
    if (finish !== null) { window.clearTimeout(finish); finish = null; }
    if (elf) { if(window.mlChristmasSounds)window.mlChristmasSounds.cancel(elf); elf.remove(); elf = null; if(window.mlChristmasCoordinator)window.mlChristmasCoordinator.done('elf'); }
  }
  function schedule() {
    if (!allowed() || elf || !document.body) return;
    if(window.mlChristmasCoordinator)window.mlChristmasCoordinator.request('elf','ml-christmas-elf',peek,reconcile);
  }
  function peek() {
    if (!allowed() || elf) return;
    var boundary=window.mlChristmasSafeArea, area=boundary&&boundary.measure();
    if(!area){schedule();return;}
    var vw=area.width,vh=area.height,pad=10, tilt=12;
    var sides = ['left','right','bottom'].filter(function(s){return s !== lastSide;});
    var side = sides[Math.floor(Math.random()*sides.length)];
    var h = Math.floor(Math.min(vw <= 600 ? 118 : vw <= 900 ? 130 : 162, vh*.34,area.available-2*tilt));
    if(h<55){schedule();return;}
    var w = Math.round(h*120/206);
    var x, y, dx = 0, dy = 0;
    var low=area.top+tilt, high=area.bottom-h-tilt;
    if (side === 'bottom') {
      x = Math.round(random(pad, Math.max(pad,vw-w-pad)));
      y = high; dy = vh-y+20;
    } else {
      x = side === 'right' ? vw-w-pad : pad;
      y = Math.round(random(Math.max(low,Math.min(vh*.48,high)),high));
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
    elf=node; lastSide=side;
    function complete(){if(elf!==node)return;clearElf();schedule();}
    actor.addEventListener('animationend',complete,{once:true});
    document.body.appendChild(node);
    releaseBoundary=boundary.watch(node,y-tilt,y+h+tilt,function(){clearElf();schedule();});
    if(elf!==node)return;
    if(window.mlChristmasSounds)window.mlChristmasSounds.event('elf',node);
    finish=window.setTimeout(complete,4150);
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
