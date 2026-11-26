/* CHRISTMAS TEST REV51 — coordinated Christmas train. */
(function(){
 'use strict';
 var root=document.documentElement,motion=matchMedia('(prefers-reduced-motion: reduce)'),mount=document.getElementById('mainModuleMount');
 var url='images/christmas-train_.svg?v=CHRISTMAS-TEST-REV49',image=null,asset='idle',timer=null,finish=null,node=null,release=null,modal=null,printing=false,hiddenPage=false,lastDirection=null,due=null,completed=0,launches=0,cancelled=0,postponed=0,last=null;
 function random(min,max){return min+Math.random()*(max-min);}
 function blocked(){var v=document.getElementById('videoModalOverlay');return root.getAttribute('data-seasonal-theme')!=='christmas'||motion.matches||document.hidden||printing||hiddenPage||!!(v&&v.classList.contains('open'));}
 function clearTimer(){if(timer!==null)clearTimeout(timer);timer=null;due=null;if(window.mlChristmasCoordinator)window.mlChristmasCoordinator.cancel('train');}
 function clearNode(){if(release){release();release=null;}if(finish!==null){clearTimeout(finish);finish=null;}if(node){if(window.mlChristmasSounds)window.mlChristmasSounds.cancel(node);node.remove();node=null;if(window.mlChristmasCoordinator)window.mlChristmasCoordinator.done('train');}}
 function later(ms,fn){if(timer!==null)return;due=Date.now()+ms;timer=setTimeout(function(){timer=null;due=null;fn();},ms);}
 function preload(){if(blocked()||asset==='loading'||asset==='ready')return;asset='loading';var a=new Image();image=a;
  a.onload=function(){if(image!==a)return;asset=a.naturalWidth>0?'ready':'failed';reconcile();};
  a.onerror=function(){if(image!==a)return;asset='failed';if(!blocked())later(5000,preload);};a.src=url;
 }
 function schedule(){if(blocked()||node||timer!==null)return;if(asset!=='ready'){if(asset==='failed')later(5000,preload);else preload();return;}if(window.mlChristmasCoordinator)window.mlChristmasCoordinator.request('train','ml-christmas-train',launch,reconcile);}
 function launch(){if(blocked()||node){reconcile();return;}var safe=window.mlChristmasSafeArea,a=safe&&safe.measure();if(!a){postponed++;schedule();return;}
  var w=Math.floor(Math.min(850,a.width*.76,(a.available-8)*1000/230)),h=w*230/1000;
  if(w<190||h<43){postponed++;schedule();return;}
  var y=Math.floor(a.bottom-h-3),direction=lastDirection==='right'?'left':lastDirection==='left'?'right':Math.random()<.5?'right':'left';
  var x=direction==='right'?-w-12:a.width+12,dx=direction==='right'?a.width+w+24:-(a.width+w+24),duration=Math.round(random(9000,12000));
  var el=document.createElement('div');el.id='ml-christmas-train';el.setAttribute('aria-hidden','true');el.setAttribute('data-train-direction',direction);el.style.display='none';
  var actor=document.createElement('span'),img=document.createElement('img');img.alt='';img.src=url;img.draggable=false;actor.appendChild(img);el.appendChild(actor);
  var vals={'--train-x':x+'px','--train-y':y+'px','--train-width':w+'px','--train-height':h+'px','--train-dx':dx+'px','--train-duration':duration+'ms','--train-mirror':direction==='right'?'1':'-1'};Object.keys(vals).forEach(function(k){el.style.setProperty(k,vals[k]);});
  node=el;document.body.appendChild(el);
  release=safe.watch(el,y,y+h,function(){cancelled++;clearNode();schedule();});if(node!==el)return;
  lastDirection=direction;launches++;last={direction:direction,width:w,height:h,y:y,durationMs:duration};
  function complete(){if(node!==el)return;completed++;clearNode();schedule();}
  actor.addEventListener('animationend',complete,{once:true});finish=setTimeout(complete,duration+180);
  if(window.mlChristmasSounds)window.mlChristmasSounds.event('train',el,duration);
 }
 function reconcile(){if(blocked()){clearTimer();if(node)cancelled++;clearNode();return;}if(node&&!node.isConnected)clearNode();schedule();}
 var observer=new MutationObserver(reconcile);
 function bindModal(){var n=document.getElementById('videoModalOverlay');if(n!==modal){observer.disconnect();modal=n;if(n)observer.observe(n,{attributes:true,attributeFilter:['class']});}reconcile();}
 if(mount)new MutationObserver(bindModal).observe(mount,{childList:true,subtree:true});
 new MutationObserver(reconcile).observe(root,{attributes:true,attributeFilter:['data-seasonal-theme']});
 if(motion.addEventListener)motion.addEventListener('change',reconcile);else if(motion.addListener)motion.addListener(reconcile);
 document.addEventListener('visibilitychange',reconcile);window.addEventListener('beforeprint',function(){printing=true;reconcile();});window.addEventListener('afterprint',function(){printing=false;reconcile();});window.addEventListener('pagehide',function(){hiddenPage=true;reconcile();});window.addEventListener('pageshow',function(){hiddenPage=false;reconcile();});
 window.addEventListener('resize',function(){if(node){cancelled++;clearNode();}reconcile();});
 window.mlChristmasTrainDiagnostics=function(){return {revision:'REV51',asset:asset,blocked:blocked(),active:!!node,nextInMs:due===null?null:Math.max(0,due-Date.now()),launches:launches,completed:completed,cancelled:cancelled,postponed:postponed,lastFlight:last};};
 bindModal();
})();
