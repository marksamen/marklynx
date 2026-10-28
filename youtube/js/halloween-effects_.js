/* REV26: Halloween-only decorative layer. No writes to site controls, layout or app state. */
(function(){
  'use strict';
  var root=document.documentElement,layer=null,lastScroll=0,accumulated=0,lastFlight=0;
  // REV31: Sound is desired ON, but browser requires real user activation. Never alter players.
  // Fail closed: suppress sounds if any visible iframe/video is present.
  var audioContext=null,lastSound=0;
  function playerPotentiallyVisible(){
    return Array.prototype.some.call(document.querySelectorAll('iframe,video,audio'),function(el){
      if(el.closest('#ml-halloween-fx'))return false;
      var r=el.getBoundingClientRect(),cs=getComputedStyle(el);
      return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&
        cs.display!=='none'&&cs.visibility!=='hidden';
    });
  }
  function canPlayEffect(){
    return active()&&!document.hidden&&
      !matchMedia('(prefers-reduced-motion: reduce)').matches&&
      !playerPotentiallyVisible()&&performance.now()-lastSound>10000;
  }
  // REV33: full-length, controlled bat flutter. Keep audio independent of visuals.
  // 5.8s matches CSS flyby duration. A single shared sound, not one per bat.
  function flutter(){
    if(!canPlayEffect())return;
    if(!audioContext||audioContext.state!=='running')return;
    lastSound=performance.now();
    var duration=5.8,rate=audioContext.sampleRate;
    var frames=Math.ceil(rate*duration);
    var buffer=audioContext.createBuffer(1,frames,rate);
    var data=buffer.getChannelData(0);
    // Soft, band-limited air movement; slow noise modulation avoids harsh static.
    var smooth=0;
    for(var i=0;i<frames;i++){
      smooth=smooth*.92+(Math.random()*2-1)*.08;
      data[i]=smooth;
    }
    var noise=audioContext.createBufferSource();noise.buffer=buffer;
    var filter=audioContext.createBiquadFilter();filter.type='lowpass';filter.frequency.value=950;
    var gain=audioContext.createGain();gain.gain.value=0;
    noise.connect(filter);filter.connect(gain);gain.connect(audioContext.destination);
    var start=audioContext.currentTime+.015;
    // Fade in/out, with 0.32-second wingbeats throughout the entire flyby.
    // Peak gain ~0.13, intentionally bounded to avoid startling visitors.
    gain.gain.setValueAtTime(0,start);
    for(var k=0;k<18;k++){
      var t=start+k*.32;
      var envelope=Math.min(1,(k+.5)/3,(18-k)/3);
      var peak=.13*Math.max(.15,envelope);
      gain.gain.linearRampToValueAtTime(peak,t+.105);
      gain.gain.linearRampToValueAtTime(peak*.25,t+.285);
    }
    gain.gain.linearRampToValueAtTime(0,start+duration);
    noise.start(start);noise.stop(start+duration);
    noise.onended=function(){noise.disconnect();filter.disconnect();gain.disconnect();};
  }
  // First ordinary trusted pointer/keyboard interaction unlocks Web Audio.
  // A simulated click cannot unlock it; no sound is played on activation itself.
  function unlockSound(event){
    if(!event.isTrusted||!active())return;
    var Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)return;
    try{
      if(!audioContext)audioContext=new Ctx();
      if(audioContext.state==='running')return;
      var pending=audioContext.resume();
      if(pending&&typeof pending.catch==='function')pending.catch(function(){});
    }catch(e){/* Silent fail: visuals remain usable without audio. */}
  }
  document.addEventListener('pointerdown',unlockSound,{passive:true});
  document.addEventListener('keydown',unlockSound);
  document.addEventListener('touchend',unlockSound,{passive:true});
  var webSvg='<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M0 0H100 M0 0V100 M0 0Q50 0 100 100 M0 0Q0 50 100 100 M0 0Q65 15 85 85 M0 0Q15 65 85 85"/><path d="M25 0Q25 25 0 25 M50 0Q50 50 0 50 M75 0Q75 75 0 75"/></svg>';
  function active(){return root.getAttribute('data-seasonal-theme')==='halloween';}
  function svgBat(){
    var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 48 22');svg.setAttribute('aria-hidden','true');
    svg.style.cssText='width:100%;height:100%;fill:currentColor';
    // REV28: independent wings; retain the same flyby container and trigger logic.
    // The left/right wings flap around their shoulder joints; body stays centered.
    var ns='http://www.w3.org/2000/svg';
    function part(cls,path){
      var p=document.createElementNS(ns,'path');p.setAttribute('class',cls);
      p.setAttribute('d',path);svg.appendChild(p);
    }
    part('ml-bat-wing-left','M23 9 Q17 2 13 7 Q7 1 1 11 L7 12 L10 18 L16 14 L20 17 Z');
    part('ml-bat-wing-right','M25 9 Q31 2 35 7 Q41 1 47 11 L41 12 L38 18 L32 14 L28 17 Z');
    part('ml-bat-body','M22 8 L21 5 L23 6 L24 8 L25 6 L27 5 L26 8 L28 12 L25 18 L24 16 L23 18 L20 12 Z');
    return svg;
  }
  // REV34: Silent, decorative ghosts and spiders. Independent of REV33 bat/audio logic.
  function ghostSvg(){
    return '<svg viewBox="0 0 100 116" aria-hidden="true"><path d="M12 105 V47 C12 19 30 7 50 7 S88 19 88 47 V105 L74 95 L61 108 L49 96 L36 108 L24 96 Z" fill="currentColor" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><ellipse cx="37" cy="54" rx="6" ry="10" fill="#25102d"/><ellipse cx="63" cy="54" rx="6" ry="10" fill="#25102d"/><ellipse cx="50" cy="79" rx="7" ry="10" fill="#25102d"/></svg>';
  }
  function spiderSvg(){
    return '<svg viewBox="0 0 80 80" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><path d="M30 38 L15 26 L5 29 M28 44 L13 41 L3 48 M30 50 L15 60 L10 71 M50 38 L65 26 L75 29 M52 44 L67 41 L77 48 M50 50 L65 60 L70 71"/></g><ellipse cx="40" cy="44" rx="16" ry="20" fill="currentColor"/><circle cx="35" cy="39" r="2.5" fill="#ffbe65"/><circle cx="45" cy="39" r="2.5" fill="#ffbe65"/></svg>';
  }
  // REV35: Use the actual sticky toolbar bottom/divider geometry, not viewport percentages.
  // The toolbar is loaded asynchronously by the existing main module.
  function decorationBoundary(){
    var toolbar=document.querySelector('.toolbar');
    if(!toolbar)return {bottom:0,left:0,right:innerWidth};
    var r=toolbar.getBoundingClientRect();
    // styles_.css: toolbar::after is centered, width:min(100%-56px,1400px).
    var width=Math.min(Math.max(0,r.width-56),1400);
    return {bottom:Math.max(0,Math.min(innerHeight,r.bottom)),
      left:r.left+(r.width-width)/2,right:r.left+(r.width+width)/2};
  }
  // REV36: independent scroll-responsive and idle climbing; the web always joins the body.
  // Movement is confined to the viewport space below the real toolbar divider.
  var spiderStates=[],spiderFrame=0,spiderLastTick=0;
  function spiderRange(){
    var boundary=decorationBoundary().bottom;
    var mobile=matchMedia('(max-width: 700px)').matches;
    var bodySize=mobile?40:64;
    return {min:mobile?25:38,max:Math.max(mobile?25:38,
      Math.min(mobile?160:260,innerHeight-boundary-bodySize-22))};
  }
  function animateSpiders(time){
    spiderFrame=0;
    if(!layer||!active())return;
    var dt=spiderLastTick?Math.min(0.06,(time-spiderLastTick)/1000):0;
    spiderLastTick=time;
    var range=spiderRange();
    var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    spiderStates.forEach(function(st){
      if(!st.hang.isConnected)return;
      st.target=Math.max(range.min,Math.min(range.max,st.target));
      if(reduce){st.current=range.min;}
      else{
        // Scroll steers the spider; when idle, each spider wanders independently.
        // Pauses at different phases prevent synchronized yo-yo motion.
        var idle=Math.sin(time*(st.side==='left'?.00038:.00031)+st.phase);
        var rest=Math.abs(idle)<.20;
        var idleTarget=st.base+idle*(st.side==='left'?42:55);
        idleTarget=Math.max(range.min,Math.min(range.max,idleTarget));
        if(time-st.lastScrollTime>1250&&!rest){
          st.target+=(idleTarget-st.target)*Math.min(1,dt*.62);
        }
        st.current+=(st.target-st.current)*Math.min(1,dt*5.8);
      }
      var thread=st.hang.querySelector('.ml-halloween-spider-thread');
      if(thread)thread.style.height=Math.round(st.current)+'px';
    });
    if(!document.hidden)spiderFrame=requestAnimationFrame(animateSpiders);
  }
  function resumeSpiders(){
    if(!layer||spiderFrame||document.hidden)return;
    spiderLastTick=0;spiderFrame=requestAnimationFrame(animateSpiders);
  }
  function steerSpiders(delta){
    if(!layer||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    var now=performance.now(),range=spiderRange();
    spiderStates.forEach(function(st){
      st.lastScrollTime=now;
      // Down scroll = descend; up scroll = ascend. Slightly different reactions.
      st.target=Math.max(range.min,Math.min(range.max,
        st.target+delta*(st.side==='left'?.28:.23)));
      st.base=st.target;
    });
    resumeSpiders();
  }
  function positionSpiders(){
    if(!layer)return;
    var b=decorationBoundary();
    Array.prototype.forEach.call(layer.querySelectorAll('.ml-halloween-spider-hang'),function(el){
      var w=el.getBoundingClientRect().width;
      el.style.top=Math.round(b.bottom+2)+'px';
      el.style.left=Math.round((el.classList.contains('left')?b.left:b.right)-w/2)+'px';
      el.style.right='auto';
    });
    // When toolbar height changes, keep existing ghosts below its lower edge too.
    Array.prototype.forEach.call(layer.querySelectorAll('.ml-halloween-ghost'),function(el){
      var minTop=b.bottom+8;
      if(parseFloat(el.style.top)<minTop)el.style.top=Math.round(minTop)+'px';
    });
  }
  var ghostTimer=null,lastGhost=0,ghostCount=0;
  function spawnGhost(force){
    if(!layer||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    var now=performance.now();
    if(now-lastGhost<(force?12000:17000))return;
    lastGhost=now;ghostCount++;
    var ghost=document.createElement('div');
    var side=ghostCount%2?'left':'right';
    ghost.className='ml-halloween-ghost '+side;
    var boundary=decorationBoundary().bottom+8;
    var ghostHeight=matchMedia('(max-width: 700px)').matches?68:Math.min(135,Math.max(72,innerWidth*.065))*1.16;
    var available=Math.max(0,innerHeight-boundary-ghostHeight-8);
    ghost.style.top=Math.round(boundary+available*(.18+(ghostCount%3)*.28))+'px';
    ghost.innerHTML=ghostSvg();layer.appendChild(ghost);
    ghost.addEventListener('animationend',function(){ghost.remove();},{once:true});
    setTimeout(function(){ghost.remove();},7200);
  }
  function scheduleGhost(){
    if(ghostTimer!==null)clearTimeout(ghostTimer);
    ghostTimer=setTimeout(function(){ghostTimer=null;if(layer)spawnGhost(false);scheduleGhost();},24000);
  }
  function addSpiders(){
    ['left','right'].forEach(function(side){
      var hang=document.createElement('div');hang.className='ml-halloween-spider-hang '+side;
      hang.innerHTML='<div class="ml-halloween-spider-thread"></div><div class="ml-halloween-spider-body">'+spiderSvg()+'</div>';
      layer.appendChild(hang);
      var min=matchMedia('(max-width: 700px)').matches?25:38;
      spiderStates.push({hang:hang,side:side,base:min+ (side==='left'?50:85),
        current:min+ (side==='left'?50:85),target:min+(side==='left'?50:85),
        phase:side==='left'?.4:2.1,lastScrollTime:0});
    });
    resumeSpiders();
  }
  function mount(){
    if(layer||!document.body)return;
    layer=document.createElement('div');layer.id='ml-halloween-fx';layer.setAttribute('aria-hidden','true');
    ['left','right'].forEach(function(side){
      var web=document.createElement('div');web.className='ml-halloween-corner '+side;
      web.innerHTML=webSvg;layer.appendChild(web);
    });
    document.body.appendChild(layer);
    addSpiders();positionSpiders();scheduleGhost();
    lastScroll=window.scrollY||0;previousSpiderScrollY=lastScroll;accumulated=0;
  }
  function unmount(){if(spiderFrame)cancelAnimationFrame(spiderFrame);spiderFrame=0;spiderLastTick=0;spiderStates=[];if(ghostTimer!==null){clearTimeout(ghostTimer);ghostTimer=null;}if(layer){layer.remove();layer=null;}accumulated=0;lastGhost=0;}
  function sync(){if(active())mount();else unmount();}
  function fly(){
    if(!layer||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    flutter();
    var n=matchMedia('(max-width: 700px)').matches?2:5;
    var y=Math.round(Math.min(innerHeight*.72,Math.max(90,innerHeight*.49)));
    for(var i=0;i<n;i++){
      (function(index){
        var bat=document.createElement('div');bat.className='ml-halloween-bat';
        bat.style.top=(y+index*(matchMedia('(max-width: 700px)').matches?28:46))+'px';bat.style.color=root.getAttribute('data-theme')==='bright'?'#30143f':'#d7a0e8';
        bat.style.animationDelay=(index*.16)+'s';bat.appendChild(svgBat());layer.appendChild(bat);
        bat.classList.add('fly');
        bat.addEventListener('animationend',function(){bat.remove();},{once:true});
        setTimeout(function(){bat.remove();},8500);
      })(i);
    }
  }
  function onScroll(){
    var y=window.scrollY||0,delta=Math.abs(y-lastScroll);lastScroll=y;
    if(!layer)return;
    positionSpiders();
    if(delta>innerHeight*2)return;
    steerSpiders(y-previousSpiderScrollY);
    previousSpiderScrollY=y;
    accumulated+=delta;
    if(y>lastScrollDirectionY&&delta>0)downwardAccumulated+=delta;else if(y<lastScrollDirectionY)downwardAccumulated=0;
    lastScrollDirectionY=y;
    if(downwardAccumulated>=380){downwardAccumulated=0;spawnGhost(true);}
    var now=performance.now();
    if(accumulated>=550&&now-lastFlight>=11000){accumulated=0;lastFlight=now;fly();}
  }
  var downwardAccumulated=0,lastScrollDirectionY=window.scrollY||0,previousSpiderScrollY=window.scrollY||0;
  var observer=new MutationObserver(function(records){
    if(records.some(function(r){return r.attributeName==='data-seasonal-theme';}))sync();
  });
  observer.observe(root,{attributes:true,attributeFilter:['data-seasonal-theme']});
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',positionSpiders,{passive:true});
  document.addEventListener('visibilitychange',function(){if(document.hidden){if(spiderFrame)cancelAnimationFrame(spiderFrame);spiderFrame=0;}else resumeSpiders();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});
  else sync();
})();
