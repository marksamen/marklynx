/* CHRISTMAS TEST REV52 — silent runaway gingerbread man, coordinated foreground event. */
(function(){
 'use strict';
 var root=document.documentElement,motion=matchMedia('(prefers-reduced-motion: reduce)'),mount=document.getElementById('mainModuleMount');
 var id='ml-christmas-gingerbread',key='gingerbread',finish=null,node=null,release=null,modal=null,printing=false,hiddenPage=false,lastDirection=null,launches=0,completed=0,cancelled=0,postponed=0,last=null;
 // Local original vector artwork; no asset fetch or sound. Separate limb groups
 // pivot around the shoulders and hips. The full pose stays inside the SVG viewport.
 var artwork=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 200" focusable="false" aria-hidden="true">
 <defs>
  <linearGradient id="ml-ginger-cookie" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e5aa65"/><stop offset=".48" stop-color="#c37b38"/><stop offset="1" stop-color="#914719"/></linearGradient>
  <linearGradient id="ml-ginger-bow" x2="0" y2="1"><stop stop-color="#f85b58"/><stop offset="1" stop-color="#a91b2a"/></linearGradient>
 </defs>
 <g class="ml-ginger-body" stroke-linecap="round" stroke-linejoin="round">
  <g class="ml-ginger-limb ml-ginger-leg-left"><path d="M57 125 Q68 119 79 131 L73 174 Q72 187 59 189 Q45 190 45 178 L50 139Z" fill="url(#ml-ginger-cookie)" stroke="#753b20" stroke-width="3"/><path d="M49 171 Q55 164 60 173 T71 173" stroke="#fff5db" stroke-width="3.8" fill="none"/></g>
  <g class="ml-ginger-limb ml-ginger-leg-right"><path d="M81 131 Q92 119 103 125 L110 139 L115 178 Q115 190 101 189 Q88 187 87 174Z" fill="url(#ml-ginger-cookie)" stroke="#753b20" stroke-width="3"/><path d="M89 173 Q95 164 100 173 T111 171" stroke="#fff5db" stroke-width="3.8" fill="none"/></g>
  <g class="ml-ginger-limb ml-ginger-arm-left"><path d="M47 76 Q34 79 25 96 L16 113 Q10 124 21 131 Q32 137 40 125 L57 94 Q64 79 47 76Z" fill="url(#ml-ginger-cookie)" stroke="#753b20" stroke-width="3"/><path d="M20 111 Q27 110 27 117 T38 120" stroke="#fff5db" stroke-width="3.8" fill="none"/></g>
  <g class="ml-ginger-limb ml-ginger-arm-right"><path d="M113 76 Q126 79 135 96 L144 113 Q150 124 139 131 Q128 137 120 125 L103 94 Q96 79 113 76Z" fill="url(#ml-ginger-cookie)" stroke="#753b20" stroke-width="3"/><path d="M140 111 Q133 110 133 117 T122 120" stroke="#fff5db" stroke-width="3.8" fill="none"/></g>
  <path d="M48 81 Q53 69 65 66 H95 Q107 69 112 81 L117 120 Q120 137 107 143 Q80 151 53 143 Q40 137 43 120Z" fill="url(#ml-ginger-cookie)" stroke="#753b20" stroke-width="3"/>
  <path d="M49 133 Q55 128 61 134 T73 134 T85 134 T97 134 T110 133" stroke="#fff5db" stroke-width="3.3" fill="none"/>
  <path d="M80 9 C55 9 37 24 37 48 C37 70 54 85 80 85 C106 85 123 70 123 48 C123 24 105 9 80 9Z" fill="url(#ml-ginger-cookie)" stroke="#753b20" stroke-width="3"/>
  <path d="M46 43 Q46 21 67 17 Q86 12 101 23 Q112 31 114 43" stroke="#f5c993" stroke-width="3" opacity=".8" fill="none"/>
  <path d="M52 31 Q58 23 64 29 T77 27 T90 27 T103 31" fill="none" stroke="#fff5db" stroke-width="3.4"/>
  <ellipse cx="65" cy="45" rx="4.3" ry="6.2" fill="#3f2118"/><ellipse cx="95" cy="45" rx="4.3" ry="6.2" fill="#3f2118"/>
  <circle cx="66" cy="43" r="1.3" fill="#fff"/><circle cx="96" cy="43" r="1.3" fill="#fff"/>
  <ellipse cx="54" cy="58" rx="6" ry="3.3" fill="#eb7770" opacity=".85"/><ellipse cx="106" cy="58" rx="6" ry="3.3" fill="#eb7770" opacity=".85"/>
  <path d="M65 60 Q80 76 95 60" fill="none" stroke="#fff5db" stroke-width="4.5"/>
  <path d="M76 91 L60 83 Q56 81 56 86 L56 98 Q56 102 61 100 L76 94 M84 91 L100 83 Q104 81 104 86 L104 98 Q104 102 99 100 L84 94" fill="url(#ml-ginger-bow)" stroke="#831d24" stroke-width="1.5"/><rect x="75" y="87" width="10" height="11" rx="3" fill="#ee454a" stroke="#831d24" stroke-width="1.5"/>
  <circle cx="80" cy="111" r="5.7" fill="#229b56" stroke="#fff5db" stroke-width="1.8"/><circle cx="78.5" cy="109.5" r="1.6" fill="#a3edaa"/>
  <circle cx="80" cy="125" r="5.7" fill="#e74946" stroke="#fff5db" stroke-width="1.8"/><circle cx="78.5" cy="123.5" r="1.6" fill="#ffc2a4"/>
 </g></svg>`;
 function blocked(){var v=document.getElementById('videoModalOverlay');return root.getAttribute('data-seasonal-theme')!=='christmas'||motion.matches||document.hidden||printing||hiddenPage||!!(v&&v.classList.contains('open'));}
 function cancelRequest(){if(window.mlChristmasCoordinator)window.mlChristmasCoordinator.cancel(key);}
 function clearNode(){if(release){release();release=null;}if(finish!==null){clearTimeout(finish);finish=null;}if(node){node.remove();node=null;if(window.mlChristmasCoordinator)window.mlChristmasCoordinator.done(key);}}
 function cancelActive(){if(node){cancelled++;clearNode();}}
 function schedule(){if(blocked()||node||!window.mlChristmasCoordinator)return;window.mlChristmasCoordinator.request(key,id,launch,reconcile);}
 function launch(){
  if(blocked()||node){reconcile();return;}
  var safe=window.mlChristmasSafeArea,a=safe&&safe.measure();if(!a){postponed++;schedule();return;}
  var h=Math.floor(Math.min(156,Math.max(80,a.width*.14),a.available-8)),w=h*.8;
  if(h<72||w>a.width-24){postponed++;schedule();return;}
  var y=Math.floor(a.bottom-h-4),direction=lastDirection==='right'?'left':lastDirection==='left'?'right':Math.random()<.5?'right':'left';
  var x=direction==='right'?-w-12:a.width+12,dx=direction==='right'?a.width+w+24:-(a.width+w+24);
  var el=document.createElement('div');el.id=id;el.setAttribute('aria-hidden','true');el.setAttribute('data-ginger-direction',direction);el.style.display='none';
  var actor=document.createElement('span');actor.innerHTML=artwork;el.appendChild(actor);
  var vals={'--ginger-x':x+'px','--ginger-y':y+'px','--ginger-w':w+'px','--ginger-h':h+'px','--ginger-mid':dx/2+'px','--ginger-dx':dx+'px','--ginger-mirror':direction==='right'?'1':'-1'};
  Object.keys(vals).forEach(function(k){el.style.setProperty(k,vals[k]);});
  node=el;document.body.appendChild(el);
  var stop=safe.watch(el,y,y+h,function(){cancelActive();schedule();});if(node!==el){stop();return;}release=stop;
  lastDirection=direction;launches++;last={direction:direction,width:w,height:h,y:y,durationMs:6000,waveStartMs:2280,waveEndMs:3720};
  function complete(){if(node!==el)return;completed++;clearNode();schedule();}
  // Child limb animationend events bubble; only the travel animation ends the event.
  actor.addEventListener('animationend',function(e){if(e.target===actor&&e.animationName==='ml-xmas-ginger-cross')complete();});
  finish=setTimeout(complete,6180);
 }
 function reconcile(){if(blocked()){cancelRequest();cancelActive();return;}if(node&&!node.isConnected)cancelActive();schedule();}
 var observer=new MutationObserver(reconcile);
 function bindModal(){var n=document.getElementById('videoModalOverlay');if(n!==modal){observer.disconnect();modal=n;if(n)observer.observe(n,{attributes:true,attributeFilter:['class']});}reconcile();}
 if(mount)new MutationObserver(bindModal).observe(mount,{childList:true,subtree:true});
 new MutationObserver(reconcile).observe(root,{attributes:true,attributeFilter:['data-seasonal-theme']});
 if(motion.addEventListener)motion.addEventListener('change',reconcile);else if(motion.addListener)motion.addListener(reconcile);
 document.addEventListener('visibilitychange',reconcile);
 window.addEventListener('beforeprint',function(){printing=true;reconcile();});window.addEventListener('afterprint',function(){printing=false;reconcile();});
 window.addEventListener('pagehide',function(){hiddenPage=true;reconcile();});window.addEventListener('pageshow',function(){hiddenPage=false;reconcile();});
 window.addEventListener('resize',function(){cancelActive();reconcile();});
 window.mlChristmasGingerbreadDiagnostics=function(){return {revision:'REV52',blocked:blocked(),active:!!node,launches:launches,completed:completed,cancelled:cancelled,postponed:postponed,lastFlight:last};};
 bindModal();
})();
