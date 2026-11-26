/* CHRISTMAS TEST REV45 — illustrated flight and occasional rooftop delivery, preserving REV43 scheduler safeguards. */
(function () {
  'use strict';
  var root = document.documentElement;
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mount = document.getElementById('mainModuleMount');
  var pending = null, finish = null, santa = null, modal = null;
  var releaseBoundary=null;
  var artwork = null, loadTimer = null, loadAttempt = 0;
  var printing = false, suspended = false, started = false;
  var assetURL = 'images/christmas-santa-flight_.svg?v=CHRISTMAS-TEST-REV44';
  var deliveryURL='images/christmas-santa-delivery_.svg?v=CHRISTMAS-TEST-REV44';
  var deliveryState='not requested', deliveryDoc=null, deliveryError='', deliveryNextAttempt=0, ordinarySinceDelivery=0;
  var assetState = 'not requested', status = 'initializing', lastError = '', nextAt = null;
  var counts = {requests:0,loads:0,errors:0,flights:0,completed:0,cancelled:0,geometrySkips:0,deliveries:0,deliveriesCompleted:0,deliveryErrors:0};
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
    return {revision:'REV45',state:status,blocked:blocked()||null,asset:assetState,
      deliveryAsset:deliveryState,deliveryError:deliveryError||null,assetURL:assetURL,assetWidth:artwork?artwork.naturalWidth:0,lastError:lastError||null,
      nextInMs:nextAt===null?null:Math.max(0,nextAt-Date.now()),counts:Object.assign({},counts),
      safeArea:window.mlChristmasSafeArea?window.mlChristmasSafeArea.measure():null,
      lastFlight:lastFlight?Object.assign({},lastFlight):null,
      actorRect:r?[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]:null,
      actorDisplay:santa?getComputedStyle(santa).display:null};
  };
  function clearPending() {
    if (pending !== null) { window.clearTimeout(pending); pending = null; }
    nextAt=null;
  }
  function clearSanta(completed) {
    if(releaseBoundary){releaseBoundary();releaseBoundary=null;}
    if (finish !== null) { window.clearTimeout(finish); finish = null; }
    if (santa) {
      if(completed){counts.completed++;if(santa.dataset.santaMode==='delivery')counts.deliveriesCompleted++;}else counts.cancelled++;
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
        assetState='ready';counts.loads++;lastError='';loadDelivery();reconcile();
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
  function loadDelivery(){
    if(!allowed()||deliveryState==='ready'||deliveryState==='loading'||Date.now()<deliveryNextAttempt)return;
    deliveryState='loading';var controller=new AbortController();
    var timeout=window.setTimeout(function(){controller.abort();},12000);
    fetch(deliveryURL,{signal:controller.signal,credentials:'same-origin'}).then(function(response){
      if(!response.ok)throw new Error('HTTP '+response.status);return response.text();
    }).then(function(text){
      var doc=new DOMParser().parseFromString(text,'image/svg+xml'),el=doc.documentElement;
      if(el.namespaceURI!=='http://www.w3.org/2000/svg'||el.localName!=='svg'||!el.classList.contains('mlr-stage')||doc.querySelector('parsererror,script,foreignObject')||!el.querySelector('.mlr-walker'))throw new Error('invalid delivery artwork');
      deliveryDoc=el;deliveryState='ready';deliveryError='';
    }).catch(function(error){deliveryState='error';deliveryError=String(error.message||error);counts.deliveryErrors++;deliveryNextAttempt=Date.now()+5000;}).finally(function(){window.clearTimeout(timeout);});
  }
  function delivery(vw,vh,minY,pad){
    if(deliveryState!=='ready'||!deliveryDoc)return false;
    var available=vh-minY-pad,w=Math.floor(Math.min(vw*.96,940,available*940/520)),h=w*520/940;
    if(w<180||h<90)return false;
    var node=document.createElement('div');node.id='ml-christmas-santa';node.dataset.santaMode='delivery';node.dataset.santaDirection='right';node.setAttribute('aria-hidden','true');node.style.display='none';
    var actor=document.createElement('span');actor.className='ml-xmas-delivery';
    var vals={'--santa-x':Math.round((vw-w)/2)+'px','--santa-y':Math.floor(vh-h-pad)+'px','--santa-width':w+'px','--santa-height':h+'px','--santa-duration':'24000ms'};
    Object.keys(vals).forEach(function(k){node.style.setProperty(k,vals[k]);});
    actor.appendChild(document.importNode(deliveryDoc,true));node.appendChild(actor);
    santa=node;started=true;counts.flights++;counts.deliveries++;ordinarySinceDelivery=0;status='delivering';
    lastFlight={mode:'delivery',direction:'right',startedAt:new Date().toISOString(),durationMs:24000,y:vh-h-pad,width:w,height:h};
    function complete(){if(santa!==node)return;clearSanta(true);schedule();}
    document.body.appendChild(node);
    releaseBoundary=window.mlChristmasSafeArea.watch(node,Math.floor(vh-h-pad),Math.floor(vh-h-pad)+h,function(){clearSanta(false);schedule();});
    if(santa===node)finish=window.setTimeout(complete,24250);return true;
  }
  function schedule() {
    if (!allowed() || pending !== null || santa) return;
    if(assetState==='loading'){status='loading artwork';return;}
    if(assetState==='error'){later(5000,loadArtwork,'artwork retry scheduled');return;}
    if(assetState!=='ready'){loadArtwork();return;}
    loadDelivery();
    later(Math.round(started ? random(10000,25000) : random(3000,8000)),function(){
      if (allowed()) fly(); else reconcile();
    },'flight scheduled');
  }
  function fly() {
    if (!allowed() || santa) {reconcile();return;}
    if(assetState!=='ready'||!artwork||!artwork.complete||!artwork.naturalWidth){
      assetState='error';artwork=null;lastError='artwork not ready at launch';counts.errors++;reconcile();return;
    }
    var boundary=window.mlChristmasSafeArea,area=boundary&&boundary.measure();
    if(!area){counts.geometrySkips++;schedule();return;}
    var vw=area.width,vh=area.height;
    var direction=Math.random()<.5?1:-1;
    var pad=12, rise=Math.min(24,vh*.04);
    var minY=Math.ceil(Math.max(vh*.10,area.top+rise));
    var maxHeight=Math.min(vh*.72,area.bottom-minY);
    if(maxHeight<24){counts.geometrySkips++;schedule();return;}
    // First event is an ordinary flyby. Ensure a delivery after at most two ordinary flights when artwork and geometry permit it.
    if(started && ordinarySinceDelivery>0 && (ordinarySinceDelivery>=2 || Math.random()<.5) && delivery(vw,vh,minY,pad))return;
    var w=Math.floor(Math.min(vw*.90,940,maxHeight*940/260));
    var h=w*260/940;
    if(w<100||h<24){counts.geometrySkips++;schedule();return;}
    var x=direction===1?-w-pad:vw+pad;
    var dx=direction*(vw+w+2*pad);
    var maxY=Math.max(minY,Math.min(Math.floor(area.bottom-h),Math.floor(vh*.60-h)));
    var y=Math.round(random(minY,maxY));
    var duration=Math.round(random(10000,14000));
    var node=document.createElement('div');node.id='ml-christmas-santa';
    node.setAttribute('aria-hidden','true');node.style.display='none';
    node.dataset.santaDirection=direction===1?'right':'left';node.dataset.santaMode='flyby';
    var vals={'--santa-x':x+'px','--santa-y':y+'px','--santa-width':w+'px','--santa-height':h+'px',
      '--santa-dx':dx+'px','--santa-dy':(-rise)+'px','--santa-dx25':dx*.25+'px','--santa-dx50':dx*.5+'px',
      '--santa-dx75':dx*.75+'px','--santa-dy25':(-rise*.6)+'px','--santa-dy50':(-rise*.3)+'px',
      '--santa-dy75':(-rise*.85)+'px','--santa-duration':duration+'ms','--santa-mirror':String(direction)};
    Object.keys(vals).forEach(function(k){node.style.setProperty(k,vals[k]);});
    var actor=document.createElement('span');
    // Move the already loaded image itself into the scene, avoiding a second fetch.
    actor.appendChild(artwork);node.appendChild(actor);
    santa=node;started=true;counts.flights++;ordinarySinceDelivery++;status='flying';
    lastFlight={mode:'flyby',direction:node.dataset.santaDirection,startedAt:new Date().toISOString(),durationMs:duration,y:y,width:w,height:h};
    function complete(){if(santa!==node)return;clearSanta(true);schedule();}
    actor.addEventListener('animationend',complete,{once:true});
    document.body.appendChild(node);
    releaseBoundary=boundary.watch(node,y-rise,y+h,function(){clearSanta(false);schedule();});
    if(santa===node)finish=window.setTimeout(complete,duration+250);
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
