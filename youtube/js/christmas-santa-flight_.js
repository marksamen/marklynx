/* CHRISTMAS TEST REV43 — preload artwork, shorter intervals, read-only diagnostics. */
(function () {
  'use strict';
  var root = document.documentElement;
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mount = document.getElementById('mainModuleMount');
  var pending = null, finish = null, santa = null, modal = null;
  var artwork = null, loadTimer = null, loadAttempt = 0;
  var printing = false, suspended = false, started = false;
  var assetURL = 'images/christmas-santa-flight_.svg?v=CHRISTMAS-TEST-REV43';
  var assetState = 'not requested', status = 'initializing', lastError = '', nextAt = null;
  var counts = {requests:0,loads:0,errors:0,flights:0,completed:0,cancelled:0,geometrySkips:0};
  var lastFlight = null;
  function random(min,max) { return min + Math.random()*(max-min); }
  function blocked() {
    var video = document.getElementById('videoModalOverlay');
    if (root.getAttribute('data-seasonal-theme') !== 'christmas') return 'not Christmas';
    if (motion.matches) return 'reduced motion';
    if (document.hidden) return 'hidden tab';
    if (printing) return 'printing';
    if (suspended) return 'page hidden';
    if (video && video.classList.contains('open')) return 'video open';
    if (!document.body) return 'body unavailable';
    return '';
  }
  function allowed() { return !blocked(); }
  // TEST-only, read-only snapshot. No global controls and no polling timers.
  window.mlChristmasSantaDiagnostics = function () {
    var actor=santa&&santa.firstElementChild, r=actor&&actor.getBoundingClientRect();
    return {revision:'REV43',state:status,blocked:blocked()||null,asset:assetState,
      assetURL:assetURL,assetWidth:artwork?artwork.naturalWidth:0,lastError:lastError||null,
      nextInMs:nextAt===null?null:Math.max(0,nextAt-Date.now()),counts:Object.assign({},counts),
      lastFlight:lastFlight?Object.assign({},lastFlight):null,
      actorRect:r?[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]:null,
      actorDisplay:santa?getComputedStyle(santa).display:null};
  };
  function clearPending() {
    if (pending !== null) { window.clearTimeout(pending); pending = null; }
    nextAt=null;
  }
  function clearSanta(completed) {
    if (finish !== null) { window.clearTimeout(finish); finish = null; }
    if (santa) {
      if(completed)counts.completed++;else counts.cancelled++;
      santa.remove(); santa = null;
    }
  }
  function later(delay,fn,state) {
    if(pending!==null)return;
    status=state;nextAt=Date.now()+delay;
    pending=window.setTimeout(function(){pending=null;nextAt=null;fn();},delay);
  }
  function loadArtwork() {
    if(!allowed() || assetState==='loading' || assetState==='ready')return;
    var attempt=++loadAttempt, img=new Image();
    artwork=img;assetState='loading';status='loading artwork';counts.requests++;
    img.alt='';img.draggable=false;
    function settle(ok,error) {
      if(attempt!==loadAttempt || assetState!=='loading')return;
      if(loadTimer!==null){window.clearTimeout(loadTimer);loadTimer=null;}
      img.onload=null;img.onerror=null;
      if(ok && img.complete && img.naturalWidth>0 && img.naturalHeight>0){
        assetState='ready';counts.loads++;lastError='';reconcile();
      }else{
        // Abort timed-out requests; use a fresh URL on retry to avoid a cached failure.
        assetState='error';counts.errors++;lastError=error||'empty image';artwork=null;
        img.removeAttribute('src');reconcile();
      }
    }
    img.onload=function(){settle(true);};img.onerror=function(){settle(false,'image load failed');};
    loadTimer=window.setTimeout(function(){settle(false,'image load timed out');},12000);
    img.src=assetURL+(attempt>1?'&retry='+attempt:'');
  }
  function schedule() {
    if (!allowed() || pending !== null || santa) return;
    if(assetState==='loading'){status='loading artwork';return;}
    if(assetState==='error'){later(5000,loadArtwork,'artwork retry scheduled');return;}
    if(assetState!=='ready'){loadArtwork();return;}
    later(Math.round(started ? random(10000,25000) : random(3000,8000)),function(){
      if (allowed()) fly(); else reconcile();
    },'flight scheduled');
  }
  function fly() {
    if (!allowed() || santa) {reconcile();return;}
    if(assetState!=='ready'||!artwork||!artwork.complete||!artwork.naturalWidth){
      assetState='error';artwork=null;lastError='artwork not ready at launch';counts.errors++;reconcile();return;
    }
    var vw=root.clientWidth, vh=Math.min(root.clientHeight,window.innerHeight);
    if(vw<80 || vh<100){counts.geometrySkips++;schedule();return;}
    var direction=Math.random()<.5?1:-1;
    // Preserve REV42 flight geometry and clearance below the sticky toolbar.
    var pad=12, rise=Math.min(24,vh*.04);
    var toolbar=document.querySelector('.toolbar');
    var toolbarH=toolbar?Math.ceil(toolbar.getBoundingClientRect().height):0;
    var minY=Math.ceil(Math.max(vh*.10,toolbarH+pad+rise));
    var maxHeight=Math.min(vh*.72,vh-minY-pad);
    if(maxHeight<20){counts.geometrySkips++;schedule();return;}
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
    var actor=document.createElement('span');
    // Move the already loaded image itself into the scene, avoiding a second fetch.
    actor.appendChild(artwork);node.appendChild(actor);
    santa=node;started=true;counts.flights++;status='flying';
    lastFlight={direction:node.dataset.santaDirection,startedAt:new Date().toISOString(),durationMs:duration,y:y,width:w,height:h};
    function complete(){if(santa!==node)return;clearSanta(true);schedule();}
    actor.addEventListener('animationend',complete,{once:true});
    document.body.appendChild(node);finish=window.setTimeout(complete,duration+250);
  }
  function reconcile(){
    if(!allowed()){clearPending();clearSanta(false);status='paused: '+blocked();return;}
    if(santa&&!santa.isConnected)clearSanta(false);
    schedule();
  }
  var modalObserver=new MutationObserver(reconcile);
  function bindModal(){
    var next=document.getElementById('videoModalOverlay');
    if(next!==modal){modalObserver.disconnect();modal=next;if(modal)modalObserver.observe(modal,{attributes:true,attributeFilter:['class']});}
    reconcile();
  }
  if(mount)new MutationObserver(bindModal).observe(mount,{childList:true,subtree:true});
  new MutationObserver(reconcile).observe(root,{attributes:true,attributeFilter:['data-seasonal-theme']});
  if(motion.addEventListener)motion.addEventListener('change',reconcile);
  else if(motion.addListener)motion.addListener(reconcile);
  document.addEventListener('visibilitychange',reconcile);
  window.addEventListener('resize',function(){if(santa){clearSanta(false);reconcile();}});
  window.addEventListener('beforeprint',function(){printing=true;reconcile();});
  window.addEventListener('afterprint',function(){printing=false;reconcile();});
  window.addEventListener('pagehide',function(){suspended=true;reconcile();});
  window.addEventListener('pageshow',function(){suspended=false;reconcile();});
  bindModal();
})();
