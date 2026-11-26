/* CHRISTMAS TEST REV59 — coordinated, original canvas New Year fireworks. */
(function(){
 'use strict';
 const root=document.documentElement, motion=matchMedia('(prefers-reduced-motion: reduce)'),mount=document.getElementById('mainModuleMount');
 const id='ml-christmas-fireworks',key='fireworks',duration=5600;
 const palette=['#ffd36b','#ff777c','#71e7aa','#ffe9b2'];
 let node=null,release=null,frame=null,finish=null,modal=null,printing=false,hiddenPage=false,launches=0,completed=0,cancelled=0,postponed=0,last=null;
 function blocked(){const v=document.getElementById('videoModalOverlay');return root.getAttribute('data-seasonal-theme')!=='christmas'||root.getAttribute('data-ml-celebration-mode')!=='new_year'||motion.matches||document.hidden||printing||hiddenPage||!!(v&&v.classList.contains('open'));}
 function schedule(){if(!blocked()&&!node&&window.mlChristmasCoordinator)window.mlChristmasCoordinator.request(key,id,launch,reconcile);}
 function clear(){if(release){release();release=null;}if(frame!==null){cancelAnimationFrame(frame);frame=null;}if(finish!==null){clearTimeout(finish);finish=null;}if(node){if(window.mlChristmasSounds)window.mlChristmasSounds.cancel(node);node.remove();node=null;if(window.mlChristmasCoordinator)window.mlChristmasCoordinator.done(key);}}
 function cancel(){if(node){cancelled++;clear();}}
 function launch(){
  if(blocked()||node){reconcile();return;}
  const safe=window.mlChristmasSafeArea,a=safe&&safe.measure();
  if(!a||a.available<120||a.width<150){postponed++;schedule();return;}
  // Fixed safe-area canvas. All particles are clipped to the region below the toolbar.
  const w=a.width,h=a.available,ratio=Math.min(2,devicePixelRatio||1),el=document.createElement('canvas');
  el.id=id;el.setAttribute('aria-hidden','true');el.width=Math.round(w*ratio);el.height=Math.round(h*ratio);
  el.style.cssText='display:block;position:fixed;left:0;top:'+a.top+'px;width:'+w+'px;height:'+h+'px;pointer-events:none;z-index:9;contain:layout style paint;';
  const ctx=el.getContext('2d');if(!ctx){postponed++;schedule();return;}ctx.scale(ratio,ratio);
  const radius=Math.min(150,h*.32,w*.22),centres=[.24,.72,.49];
  const bursts=centres.map((f,i)=>{
   const x=Math.max(radius+8,Math.min(w-radius-8,w*(f+(Math.random()-.5)*.08))),y=h*(i===1?.38:.36),start=i*.88;
   const particles=Array.from({length:44},(_,j)=>{const angle=j/44*Math.PI*2+(Math.random()-.5)*.15, speed=radius*(.52+((j*17)%31)/31*.53+Math.random()*.16);return {vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,color:j%4===0?'#fff3d0':palette[(i+j%2)%palette.length],size:1.4+(j%4)*.27+Math.random()*.65};});
   return {x,y,start,particles};
  });
  node=el;document.body.appendChild(el);
  const stop=safe.watch(el,a.top,a.bottom,()=>{cancel();schedule();});if(node!==el){stop();return;}release=stop;
  launches++;last={width:w,height:h,top:a.top,bursts:bursts.length,particles:132,durationMs:duration};
  const origin=performance.now();
  if(window.mlChristmasSounds)window.mlChristmasSounds.event('fireworks',el,duration);
  function complete(){if(node!==el)return;completed++;clear();schedule();}
  function paint(now){
   frame=null;if(node!==el)return;if(blocked()||!el.isConnected){cancel();schedule();return;}
   const t=(now-origin)/1000;ctx.clearRect(0,0,w,h);
   for(const b of bursts){const elapsed=t-b.start;if(elapsed<0)continue;
    if(elapsed<.72){const p=elapsed/.72,y=h-5-(h-5-b.y)*p;ctx.strokeStyle='#ffd36b';ctx.globalAlpha=.65;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(b.x,Math.min(h,y+18));ctx.lineTo(b.x,y);ctx.stroke();ctx.fillStyle='#fff2c2';ctx.beginPath();ctx.arc(b.x,y,2.4,0,Math.PI*2);ctx.fill();continue;}
    const age=elapsed-.72;if(age>2.5)continue;const travel=1-Math.exp(-age*1.45),opacity=Math.min(1,age*12)*Math.pow(1-age/2.5,.65);
    for(const s of b.particles){const x=b.x+s.vx*travel,y=b.y+s.vy*travel+age*age*h*.023;ctx.globalAlpha=opacity*.77;ctx.strokeStyle=s.color;ctx.lineWidth=s.size*.85;ctx.beginPath();ctx.moveTo(x-s.vx*.145,y-s.vy*.145);ctx.lineTo(x,y);ctx.stroke();ctx.globalAlpha=opacity;ctx.fillStyle=s.color;ctx.beginPath();ctx.arc(x,y,s.size,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff3d0';ctx.beginPath();ctx.arc(x,y,s.size*.42,0,Math.PI*2);ctx.fill();}
   }
   ctx.globalAlpha=1;if(t*1000>=duration){complete();return;}frame=requestAnimationFrame(paint);
  }
  frame=requestAnimationFrame(paint);finish=setTimeout(complete,duration+100);
 }
 function reconcile(){if(blocked()){if(window.mlChristmasCoordinator)window.mlChristmasCoordinator.cancel(key);cancel();return;}if(node&&!node.isConnected)cancel();schedule();}
 const observer=new MutationObserver(reconcile);
 function bindModal(){const v=document.getElementById('videoModalOverlay');if(v!==modal){observer.disconnect();modal=v;if(v)observer.observe(v,{attributes:true,attributeFilter:['class']});}reconcile();}
 if(mount)new MutationObserver(bindModal).observe(mount,{childList:true,subtree:true});
 new MutationObserver(reconcile).observe(root,{attributes:true,attributeFilter:['data-seasonal-theme','data-ml-celebration-mode']});
 if(motion.addEventListener)motion.addEventListener('change',reconcile);else if(motion.addListener)motion.addListener(reconcile);
 document.addEventListener('visibilitychange',reconcile);
 window.addEventListener('beforeprint',()=>{printing=true;reconcile();});window.addEventListener('afterprint',()=>{printing=false;reconcile();});
 window.addEventListener('pagehide',()=>{hiddenPage=true;reconcile();});window.addEventListener('pageshow',()=>{hiddenPage=false;reconcile();});
 window.addEventListener('resize',()=>{cancel();reconcile();});
 window.mlChristmasFireworksDiagnostics=()=>({revision:'REV59',blocked:blocked(),active:!!node,launches,completed,cancelled,postponed,last});
 bindModal();
})();
