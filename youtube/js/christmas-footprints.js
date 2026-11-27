/* Christmas — coordinated snowy bootprints. */
(function(){
 'use strict';
 var root=document.documentElement,motion=matchMedia('(prefers-reduced-motion: reduce)'),mount=document.getElementById('mainModuleMount');
 var finish=null,node=null,release=null,modal=null,printing=false,hiddenPage=false,lastDirection=null,completed=0,launches=0,cancelled=0,postponed=0,last=null;
 var ns='http://www.w3.org/2000/svg';
 function random(min,max){return min+Math.random()*(max-min);}
 function blocked(){var v=document.getElementById('videoModalOverlay');return root.getAttribute('data-seasonal-theme')!=='christmas'||['new_year','pending'].includes(root.getAttribute('data-ml-celebration-mode'))||motion.matches||document.hidden||printing||hiddenPage||!!(v&&v.classList.contains('open'));}
 function clearTimer(){if(window.mlChristmasCoordinator)window.mlChristmasCoordinator.cancel('footprints');}
 function clearNode(){if(release){release();release=null;}if(finish!==null){clearTimeout(finish);finish=null;}if(node){node.remove();node=null;if(window.mlChristmasCoordinator)window.mlChristmasCoordinator.done('footprints');}}
 function schedule(){if(blocked()||node)return;if(window.mlChristmasCoordinator)window.mlChristmasCoordinator.request('footprints','ml-christmas-footprints',launch,reconcile);}
 function svg(tag,attrs,parent){var e=document.createElementNS(ns,tag);Object.keys(attrs).forEach(function(k){e.setAttribute(k,attrs[k]);});if(parent)parent.appendChild(e);return e;}
 function boot(parent,i,x,y,size,angle){
  var g=svg('g',{'transform':'translate('+x+' '+y+') rotate('+angle+') scale('+size/48+')'},parent);
  var p=svg('g',{'class':'ml-xmas-bootprint','data-step':i},g);p.style.setProperty('--foot-delay',(i*350)+'ms');
  // Snow pressed into a boot sole: contrasting outline and recessed tread.
  svg('path',{d:'M-9 -21 C-17 -17 -15 -6 -12 1 L-10 8 L-10 18 Q0 23 10 18 L10 8 L12 0 C15 -8 15 -18 6 -22 Q-1 -25 -9 -21Z',fill:'#f0f6f7',stroke:'#849ca7','stroke-width':'1.1'},p);
  svg('path',{d:'M-9 -15 L0 -10 L9 -15 M-10 -7 L0 -2 L10 -7 M-8 1 L0 6 L8 1 M-7 12 H7 M-7 16 H7',fill:'none',stroke:'#9cb2bb','stroke-width':'2.5','stroke-linecap':'round','stroke-linejoin':'round'},p);
  svg('path',{d:'M-10 8 H10',stroke:'#839ca7','stroke-width':'1.4'},p);
  [[-19,-12,1.5],[17,1,1.4],[-15,17,1.1],[13,-19,1]].forEach(function(s){svg('circle',{cx:s[0],cy:s[1],r:s[2],fill:'#fff9e9',opacity:'.65'},p);});
 }
 function launch(){if(blocked()||node){reconcile();return;}var safe=window.mlChristmasSafeArea,a=safe&&safe.measure();if(!a){postponed++;schedule();return;}
  var size=Math.floor(Math.min(48,Math.max(27,a.width*.034), (a.available-8)/2.5));
  if(size<25){postponed++;schedule();return;}
  // Conservative extent covers rotation, tread, snow specks and the alternating stride.
  var extent=Math.ceil(size*1.15), low=a.top+extent,high=a.bottom-extent;
  if(high<low){postponed++;schedule();return;}
  var y=Math.round(random(Math.max(low,high-(high-low)*.35),high));
  var direction=lastDirection==='right'?'left':lastDirection==='left'?'right':Math.random()<.5?'right':'left';
  var count=Math.min(12,Math.max(5,Math.floor((a.width-2*size)/(size*1.4))));
  var distance=Math.min(a.width-2*size,Math.max(size*(count-1)*1.4,a.width*.55));
  var left=Math.round(random(size,Math.max(size,a.width-size-distance)));
  var el=document.createElement('div');el.id='ml-christmas-footprints';el.setAttribute('aria-hidden','true');el.setAttribute('data-foot-direction',direction);el.style.display='none';
  var drawing=svg('svg',{viewBox:'0 0 '+a.width+' '+a.height,preserveAspectRatio:'none',focusable:'false','aria-hidden':'true'},el);
  for(var i=0;i<count;i++){var x=left+distance*(direction==='right'?i:count-1-i)/(count-1);boot(drawing,i,x,y+(i%2===0?-1:1)*size*.40,size,(direction==='right'?90:-90)+(i%2===0?-10:10));}
  node=el;document.body.appendChild(el);release=safe.watch(el,y-extent,y+extent,function(){cancelled++;clearNode();schedule();});if(node!==el)return;
  lastDirection=direction;launches++;var duration=4800+(count-1)*350;last={direction:direction,count:count,size:size,y:y,minY:y-extent,maxY:y+extent,durationMs:duration};
  finish=setTimeout(function(){if(node!==el)return;completed++;clearNode();schedule();},duration+100);
 }
 function reconcile(){if(blocked()){clearTimer();if(node)cancelled++;clearNode();return;}if(node&&!node.isConnected)clearNode();schedule();}
 var observer=new MutationObserver(reconcile);
 function bindModal(){var n=document.getElementById('videoModalOverlay');if(n!==modal){observer.disconnect();modal=n;if(n)observer.observe(n,{attributes:true,attributeFilter:['class']});}reconcile();}
 if(mount)new MutationObserver(bindModal).observe(mount,{childList:true,subtree:true});
 new MutationObserver(reconcile).observe(root,{attributes:true,attributeFilter:['data-seasonal-theme','data-ml-celebration-mode']});
 if(motion.addEventListener)motion.addEventListener('change',reconcile);else if(motion.addListener)motion.addListener(reconcile);
 document.addEventListener('visibilitychange',reconcile);window.addEventListener('beforeprint',function(){printing=true;reconcile();});window.addEventListener('afterprint',function(){printing=false;reconcile();});window.addEventListener('pagehide',function(){hiddenPage=true;reconcile();});window.addEventListener('pageshow',function(){hiddenPage=false;reconcile();});
 window.addEventListener('resize',function(){if(node){cancelled++;clearNode();}reconcile();});

 bindModal();
})();
