/* CHRISTMAS TEST REV40 — isolated elf-peek scheduler. */
(function () {
  'use strict';
  var root = document.documentElement;
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mount = document.getElementById('mainModuleMount');
  var pending = null, finish = null, elf = null, modal = null;
  var printing = false, suspended = false, started = false;
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
    if (!allowed() || pending !== null || elf || !document.querySelector('.banner-wrap > img')) return;
    pending = window.setTimeout(function () {
      pending = null;
      if (allowed()) peek();
    }, Math.round(started ? random(15000,35000) : random(8000,15000)));
  }
  function peek() {
    var banner = document.querySelector('.banner-wrap');
    var image = banner && banner.querySelector(':scope > img');
    if (!allowed() || elf || !image) return;
    var box = banner.getBoundingClientRect(), art = image.getBoundingClientRect();
    var right = Math.random() >= .5;
    var w, h, x, y, dx = 0, dy = 0;
    // Smaller screens already reserve a 62px strip. Keep clear of the snowman,
    // trees, gifts and the banner itself. On wide screens peek beside the art.
    if (window.matchMedia('(max-width:1439px)').matches) {
      w = Math.min(48, Math.floor(box.width*.14)); h = 54;
      x = box.width*(right ? .70 : .30)-w/2;
      y = banner.clientHeight-h-3; dy = h+4;
    } else {
      var margin = right ? box.right-art.right : art.left-box.left;
      w = Math.min(78,Math.floor(margin-6)); h = Math.round(w*1.2);
      x = right ? art.right-box.left : art.left-box.left-w;
      y = art.top-box.top+Math.max(0,Math.min(art.height-h,art.height*.43));
      dx = right ? -w-4 : w+4;
    }
    // Skip rather than place the elf outside the decorative area or off-screen.
    if (w<26 || h<30 || x<0 || y<0 || x+w>box.width+.5 || y+h>box.height+.5 ||
        box.top+y<0 || box.top+y+h>root.clientHeight) {schedule();return;}
    var node = document.createElement('div');
    node.id='ml-christmas-elf'; node.setAttribute('aria-hidden','true');
    node.style.display='none';
    node.setAttribute('data-elf-side',right?'right':'left');
    var values={'--elf-x':x+'px','--elf-y':y+'px','--elf-width':w+'px','--elf-height':h+'px',
      '--elf-hide-x':dx+'px','--elf-hide-y':dy+'px','--elf-mirror':right?'-1':'1'};
    Object.keys(values).forEach(function(k){node.style.setProperty(k,values[k]);});
    var actor=document.createElement('span');node.appendChild(actor);
    elf=node; started=true;
    function complete(){if(elf!==node)return;clearElf();schedule();}
    actor.addEventListener('animationend',complete,{once:true});
    banner.appendChild(node);finish=window.setTimeout(complete,4150);
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
