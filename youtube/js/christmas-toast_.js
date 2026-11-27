/* CHRISTMAS TEST REV61 — coordinated, original canvas New Year champagne toast. */
(function(){
 'use strict';
 const root=document.documentElement, motion=matchMedia('(prefers-reduced-motion: reduce)'),mount=document.getElementById('mainModuleMount');
 const id='ml-christmas-toast',key='toast',duration=4800;
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
  // Original vector artwork drawn at a responsive size, centered in the safe region.
  const scale=Math.min(1.35,(w-20)/300,(h-12)/190), cx=w/2,cy=h/2;
  const bubbles=Array.from({length:12},(_,i)=>({x:(i%4-1.5)*6,y:(i*13)%62,r:1.1+(i%3)*.45}));
  function glass(x,angle,t){
   ctx.save();ctx.translate(x,0);ctx.rotate(angle);
   // Flute bowl, filled with translucent sparkling wine; slender stem and foot.
   const bowl=()=>{ctx.beginPath();ctx.moveTo(-20,-75);ctx.bezierCurveTo(-23,-39,-17,-12,0,-8);ctx.bezierCurveTo(17,-12,23,-39,20,-75);ctx.closePath();};
   ctx.save();bowl();ctx.clip();const wine=ctx.createLinearGradient(-20,0,20,0);wine.addColorStop(0,'rgba(176,103,15,.91)');wine.addColorStop(.48,'rgba(255,217,106,.95)');wine.addColorStop(1,'rgba(218,151,34,.9)');ctx.fillStyle=wine;ctx.fillRect(-24,-55,48,48);ctx.strokeStyle='#fff1b4';ctx.lineWidth=1.7;ctx.beginPath();ctx.ellipse(0,-55,20,2.7,0,0,Math.PI*2);ctx.stroke();
   for(const b of bubbles){const by=-12-((b.y+t*18)%42);ctx.beginPath();ctx.arc(b.x,by,b.r,0,Math.PI*2);ctx.fillStyle='rgba(255,250,204,.9)';ctx.fill();}ctx.restore();
   bowl();ctx.fillStyle='rgba(215,240,255,.11)';ctx.fill();ctx.strokeStyle='#e9f6ff';ctx.lineWidth=2;ctx.stroke();
   ctx.beginPath();ctx.ellipse(0,-75,20,3.5,0,0,Math.PI*2);ctx.stroke();
   ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(0,42);ctx.lineWidth=3;ctx.stroke();ctx.beginPath();ctx.ellipse(0,45,23,4.5,0,0,Math.PI*2);ctx.fillStyle='rgba(210,235,250,.28)';ctx.fill();ctx.lineWidth=2;ctx.stroke();
   ctx.beginPath();ctx.moveTo(-15,-68);ctx.quadraticCurveTo(-16,-43,-10,-28);ctx.strokeStyle='rgba(255,255,255,.76)';ctx.lineWidth=2.1;ctx.lineCap='round';ctx.stroke();ctx.restore();
  }
  function smooth(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);}
  node=el;document.body.appendChild(el);
  const stop=safe.watch(el,a.top,a.bottom,()=>{cancel();schedule();});if(node!==el){stop();return;}release=stop;
  launches++;last={width:w,height:h,top:a.top,scale,durationMs:duration,clinkMs:1800};
  const origin=performance.now();
  if(window.mlChristmasSounds)window.mlChristmasSounds.event('toast',el,duration);
  function complete(){if(node!==el)return;completed++;clear();schedule();}
  function paint(now){
   frame=null;if(node!==el)return;if(blocked()||!el.isConnected){cancel();schedule();return;}
   const t=(now-origin)/1000;ctx.clearRect(0,0,w,h);
   // Meet once at 1.8 seconds, pause briefly, separate and fade.
   const approach=t<1.8?smooth((t-.35)/1.45):1-smooth((t-2.15)/1.35);
   const fade=smooth(t/.45)*(1-smooth((t-3.8)/.95));
   const separation=78-39*approach,angle=.255*approach;
   ctx.save();ctx.translate(cx,cy+12*(1-smooth(t/.6)));ctx.scale(scale,scale);ctx.globalAlpha=fade;
   glass(-separation,angle,t);glass(separation,-angle,t);
   const sparkAge=t-1.8;if(sparkAge>=0&&sparkAge<.85){ctx.globalAlpha=fade*(1-sparkAge/.85);ctx.strokeStyle='#ffe7a0';ctx.lineWidth=2.4;ctx.lineCap='round';for(let i=0;i<9;i++){const a=i*Math.PI*2/9,r=9+sparkAge*38;ctx.beginPath();ctx.moveTo(Math.cos(a)*r,-69+Math.sin(a)*r);ctx.lineTo(Math.cos(a)*(r+9),-69+Math.sin(a)*(r+9));ctx.stroke();}}ctx.restore();
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
 window.mlChristmasToastDiagnostics=()=>({revision:'REV61',blocked:blocked(),active:!!node,launches,completed,cancelled,postponed,last});
 bindModal();
})();
