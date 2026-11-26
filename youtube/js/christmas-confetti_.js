/* CHRISTMAS TEST REV60B — coordinated, original canvas New Year paper confetti. */
(function(){
 'use strict';
 const root=document.documentElement, motion=matchMedia('(prefers-reduced-motion: reduce)'),mount=document.getElementById('mainModuleMount');
 const id='ml-christmas-confetti',key='confetti',duration=5800;
 const palette=['#ffd34d','#ff5258','#e8e9ef','#56d477','#ffb93e','#e84952','#f8f4e8','#33b96a'];
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
  // Seed a local generator so each shower has varied pieces even with a fixed scheduler RNG.
  let seed=(Math.floor(Math.random()*4294967295)||1)>>>0;
  function rnd(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;}
  const count=Math.round(Math.min(96,Math.max(38,w/13))),scale=Math.min(1.15,Math.max(.8,w/900));
  const particles=Array.from({length:count},(_,i)=>({
   x:(i+rnd())/count*w,start:rnd()*1.65,fall:2.45+rnd()*1.55,
   drift:(rnd()-.5)*Math.min(100,w*.17),phase:rnd()*Math.PI*2,spin:(rnd()<.5?-1:1)*(1.1+rnd()*2.1),
   size:(10+rnd()*8)*scale,color:palette[i%palette.length],ribbon:i%5===0
  }));
  node=el;document.body.appendChild(el);
  const stop=safe.watch(el,a.top,a.bottom,()=>{cancel();schedule();});if(node!==el){stop();return;}release=stop;
  launches++;last={width:w,height:h,top:a.top,particles:count,ribbons:particles.filter(p=>p.ribbon).length,durationMs:duration};
  const origin=performance.now();
  if(window.mlChristmasSounds)window.mlChristmasSounds.event('confetti',el,duration);
  function complete(){if(node!==el)return;completed++;clear();schedule();}
  function paint(now){
   frame=null;if(node!==el)return;if(blocked()||!el.isConnected){cancel();schedule();return;}
   const t=(now-origin)/1000;ctx.clearRect(0,0,w,h);
   for(const p of particles){const age=t-p.start;if(age<0||age>p.fall)continue;
    const u=age/p.fall,x=p.x+p.drift*u+Math.sin(age*2.5+p.phase)*18*scale,y=-18+(h+38)*u;
    const flip=Math.cos(age*p.spin+p.phase),alpha=Math.min(1,age*8,Math.max(0,(1-u)*8));
    ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(age*1.9+p.phase)*.70+age*p.spin*.28);ctx.globalAlpha=alpha*.96;
    ctx.scale(.38+.62*Math.abs(flip),1);
    // Matte coloured paper, no metallic gradients, reflective outlines or glints.
    if(p.ribbon){ctx.lineWidth=3.8*scale;ctx.lineCap='round';ctx.strokeStyle=p.color;ctx.beginPath();ctx.moveTo(0,-p.size*1.55);ctx.bezierCurveTo(p.size*.95,-p.size*1.15,p.size*.95,-p.size*.45,0,0);ctx.bezierCurveTo(-p.size*.95,p.size*.45,-p.size*.95,p.size*1.15,0,p.size*1.55);ctx.stroke();}
    else{ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size*.36,p.size,p.size*.72);}
    ctx.restore();
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
 window.mlChristmasConfettiDiagnostics=()=>({revision:'REV60B',blocked:blocked(),active:!!node,launches,completed,cancelled,postponed,last});
 bindModal();
})();
