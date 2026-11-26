/* CHRISTMAS TEST REV60 — coordinated, original canvas New Year golden confetti. */
(function(){
 'use strict';
 const root=document.documentElement, motion=matchMedia('(prefers-reduced-motion: reduce)'),mount=document.getElementById('mainModuleMount');
 const id='ml-christmas-confetti',key='confetti',duration=5800;
 const palette=['#ffe8a0','#d69b29','#fff3c7','#b67c18','#f8c54d'];
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
  const count=Math.round(Math.min(96,Math.max(38,w/13))),scale=Math.min(1.15,Math.max(.7,w/900));
  const particles=Array.from({length:count},(_,i)=>({
   x:(i+rnd())/count*w,start:rnd()*1.65,fall:2.45+rnd()*1.55,
   drift:(rnd()-.5)*Math.min(100,w*.17),phase:rnd()*Math.PI*2,spin:(rnd()<.5?-1:1)*(1.6+rnd()*3.2),
   size:(5+rnd()*5)*scale,color:palette[i%palette.length],ribbon:i%5===0
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
    const u=age/p.fall,x=p.x+p.drift*u+Math.sin(age*3+p.phase)*11*scale,y=-18+(h+38)*u;
    const flip=Math.cos(age*p.spin+p.phase),alpha=Math.min(1,age*8,Math.max(0,(1-u)*8));
    ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(age*2.4+p.phase)*.85+age*p.spin*.38);ctx.globalAlpha=alpha*.9;
    ctx.scale(.22+.78*Math.abs(flip),1);
    if(p.ribbon){ctx.lineWidth=2.7*scale;ctx.strokeStyle=flip>0?p.color:'#bd8a25';ctx.beginPath();ctx.moveTo(0,-p.size*1.6);ctx.bezierCurveTo(p.size*.8,-p.size*.8,-p.size*.9,p.size*.4,0,p.size*1.6);ctx.stroke();ctx.lineWidth=.8*scale;ctx.strokeStyle='#fff1bd';ctx.stroke();}
    else{const g=ctx.createLinearGradient(-p.size/2,0,p.size/2,0);g.addColorStop(0,'#a76d17');g.addColorStop(.45,flip>0?p.color:'#e2ac36');g.addColorStop(.72,'#fff0b3');g.addColorStop(1,p.color);ctx.fillStyle=g;ctx.fillRect(-p.size/2,-p.size*.34,p.size,p.size*.68);}
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
 window.mlChristmasConfettiDiagnostics=()=>({revision:'REV60',blocked:blocked(),active:!!node,launches,completed,cancelled,postponed,last});
 bindModal();
})();
