/* Christmas — single foreground event scheduler. */
(function(){
 'use strict';
 var root=document.documentElement,motion=matchMedia('(prefers-reduced-motion: reduce)'),mount=document.getElementById('mainModuleMount');
 var waiting=new Map(),served=new Set(),active=null,launching=false,last=null,timer=null,due=null,printing=false,hiddenPage=false,modal=null;
 var counts={attempts:0,launches:0,ended:0,skips:0,errors:0},lastError=null;
 function blocked(){
  var v=document.getElementById('videoModalOverlay');
  return root.getAttribute('data-seasonal-theme')!=='christmas'||motion.matches||document.hidden||printing||hiddenPage||!document.body||!!(v&&v.classList.contains('open'));
 }
 function stopTimer(){if(timer!==null)clearTimeout(timer);timer=null;due=null;}
 function arm(){
  if(blocked()||!waiting.size){stopTimer();return;}
  if(active||launching||timer!==null)return;
  var delay=Math.round(3000+Math.random()*5000);
  due=Date.now()+delay;timer=setTimeout(function(){timer=null;due=null;pick();},delay);
 }
 function pick(){
  if(blocked()||active||launching||!waiting.size){arm();return;}
  var candidates=Array.from(waiting.keys()).filter(function(k){return !served.has(k);});
  if(!candidates.length){served.clear();candidates=Array.from(waiting.keys());}
  if(candidates.length>1)candidates=candidates.filter(function(k){return k!==last;});
  // At the boundary of a round, avoid repeating the previous event even if a
  // newly available candidate is the only unserved one.
  if(candidates.length===1&&candidates[0]===last&&waiting.size>1){
   served.clear();candidates=Array.from(waiting.keys()).filter(function(k){return k!==last;});
  }
  var key=candidates[Math.floor(Math.random()*candidates.length)],entry=waiting.get(key);
  waiting.delete(key);served.add(key);last=key;active=entry;launching=true;counts.attempts++;
  try{entry.launch();}catch(e){counts.errors++;lastError=String(e&&e.message||e);}
  launching=false;
  // Launches are synchronous. A geometry skip must not reserve the screen.
  // An existing node retains the lock even if its launch threw an exception.
  if(document.getElementById(entry.id)){counts.launches++;}
  else{active=null;counts.skips++;}
  arm();
 }
 function request(key,id,launch,recover){
  if(blocked()||typeof launch!=='function')return;
  if(!waiting.has(key))waiting.set(key,{key:key,id:id,launch:launch,recover:recover});
  arm();
 }
 function cancel(key){waiting.delete(key);arm();}
 function done(key){
  if(!active||active.key!==key||document.getElementById(active.id)||launching)return;
  active=null;counts.ended++;arm();
 }
 // Recover from unexpected removal (e.g. an application DOM rebuild). Normal
 // completion calls done() synchronously after cancelling sound and removing DOM.
 if(document.body)new MutationObserver(function(){
  if(active&&!launching&&!document.getElementById(active.id)){
   var old=active;done(old.key);if(typeof old.recover==='function')old.recover();
  }
 }).observe(document.body,{childList:true});
 function reconcile(){if(blocked())stopTimer();else arm();}
 var modalObserver=new MutationObserver(reconcile);
 function bindModal(){var n=document.getElementById('videoModalOverlay');if(n!==modal){modalObserver.disconnect();modal=n;if(n)modalObserver.observe(n,{attributes:true,attributeFilter:['class']});}reconcile();}
 if(mount)new MutationObserver(bindModal).observe(mount,{childList:true,subtree:true});
 new MutationObserver(reconcile).observe(root,{attributes:true,attributeFilter:['data-seasonal-theme']});
 if(motion.addEventListener)motion.addEventListener('change',reconcile);else if(motion.addListener)motion.addListener(reconcile);
 document.addEventListener('visibilitychange',reconcile);
 window.addEventListener('beforeprint',function(){printing=true;reconcile();});window.addEventListener('afterprint',function(){printing=false;reconcile();});
 window.addEventListener('pagehide',function(){hiddenPage=true;reconcile();});window.addEventListener('pageshow',function(){hiddenPage=false;reconcile();});
 window.mlChristmasCoordinator=Object.freeze({request:request,cancel:cancel,done:done});

 bindModal();
})();
