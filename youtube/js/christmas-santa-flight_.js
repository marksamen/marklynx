/* CHRISTMAS TEST REV42 — isolated Santa flyby scheduler. */
(function () {
  'use strict';
  var root = document.documentElement;
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mount = document.getElementById('mainModuleMount');
  var pending = null, finish = null, santa = null, modal = null;
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
  function clearSanta() {
    if (finish !== null) { window.clearTimeout(finish); finish = null; }
    if (santa) { santa.remove(); santa = null; }
  }
  function schedule() {
    if (!allowed() || pending !== null || santa || !document.body) return;
    pending = window.setTimeout(function () {
      pending = null;
      if (allowed()) fly();
      else reconcile();
    }, Math.round(started ? random(35000,70000) : random(6000,12000)));
  }
  function fly() {
    if (!allowed() || santa) return;
    var vw=root.clientWidth, vh=Math.min(root.clientHeight,window.innerHeight);
    if(vw<80 || vh<100){schedule();return;}
    var direction=Math.random()<.5?1:-1;
    // Reserve room below the sticky toolbar at every scroll position.
    // Keep the actor below the toolbar stacking layer, never above controls.
    var pad=12, rise=Math.min(24,vh*.04);
    var toolbar=document.querySelector('.toolbar');
    var toolbarH=toolbar?Math.ceil(toolbar.getBoundingClientRect().height):0;
    var minY=Math.ceil(Math.max(vh*.10,toolbarH+pad+rise));
    var maxHeight=Math.min(vh*.72,vh-minY-pad);
    if(maxHeight<20){schedule();return;}
    var w=Math.floor(Math.min(vw*.90,940,maxHeight*940/200));
    var h=w*200/940;
    var x=direction===1?-w-pad:vw+pad;
    var dx=direction*(vw+w+2*pad);
    var maxY=Math.max(minY,Math.min(Math.floor(vh-h-pad),Math.floor(vh*.60-h)));
    var y=Math.round(random(minY,maxY));
    var duration=Math.round(random(10000,14000));
    var node=document.createElement('div');node.id='ml-christmas-santa';
    node.setAttribute('aria-hidden','true');node.style.display='none';
    node.dataset.santaDirection=direction===1?'right':'left';
    var vals={'--santa-x':x+'px','--santa-y':y+'px','--santa-width':w+'px','--santa-height':h+'px',
      '--santa-dx':dx+'px','--santa-dy':(-rise)+'px','--santa-dx25':dx*.25+'px','--santa-dx50':dx*.5+'px',
      '--santa-dx75':dx*.75+'px','--santa-dy25':(-rise*.6)+'px','--santa-dy50':(-rise*.3)+'px',
      '--santa-dy75':(-rise*.85)+'px','--santa-duration':duration+'ms','--santa-mirror':String(direction)};
    Object.keys(vals).forEach(function(k){node.style.setProperty(k,vals[k]);});
    var actor=document.createElement('span'), img=document.createElement('img');
    img.alt='';img.draggable=false;
    img.src='images/christmas-santa-flight_.svg?v=CHRISTMAS-TEST-REV42';
    actor.appendChild(img);node.appendChild(actor);
    santa=node;started=true;
    function complete(){if(santa!==node)return;clearSanta();schedule();}
    actor.addEventListener('animationend',complete,{once:true});
    document.body.appendChild(node);finish=window.setTimeout(complete,duration+250);
  }
  function reconcile(){
    if(!allowed()){clearPending();clearSanta();return;}
    if(santa&&!santa.isConnected)clearSanta();
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
  window.addEventListener('resize',function(){if(santa){clearSanta();reconcile();}});
  window.addEventListener('beforeprint',function(){printing=true;reconcile();});
  window.addEventListener('afterprint',function(){printing=false;reconcile();});
  window.addEventListener('pagehide',function(){suspended=true;reconcile();});
  window.addEventListener('pageshow',function(){suspended=false;reconcile();});
  bindModal();
})();
