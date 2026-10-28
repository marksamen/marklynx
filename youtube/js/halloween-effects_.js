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
  function flutter(){
    if(!canPlayEffect())return;
    var Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx||!audioContext||audioContext.state!=='running')return;
    lastSound=performance.now();
    // Original, synthesized soft flutter: short filtered noise pulses, no external assets.
    var sampleRate=audioContext.sampleRate,frames=Math.floor(sampleRate*.58);
    var buffer=audioContext.createBuffer(1,frames,sampleRate),data=buffer.getChannelData(0);
    for(var i=0;i<frames;i++)data[i]=(Math.random()*2-1)*.45;
    var noise=audioContext.createBufferSource();noise.buffer=buffer;
    var filter=audioContext.createBiquadFilter();filter.type='lowpass';filter.frequency.value=550;
    var gain=audioContext.createGain();gain.gain.value=0;
    noise.connect(filter);filter.connect(gain);gain.connect(audioContext.destination);
    var start=audioContext.currentTime+.01;
    for(var k=0;k<5;k++){
      var t=start+k*.11;
      gain.gain.setValueAtTime(0,t);
      gain.gain.linearRampToValueAtTime(.035,t+.025);
      gain.gain.exponentialRampToValueAtTime(.001,t+.095);
    }
    noise.start(start);noise.stop(start+.57);
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
  function mount(){
    if(layer||!document.body)return;
    layer=document.createElement('div');layer.id='ml-halloween-fx';layer.setAttribute('aria-hidden','true');
    ['left','right'].forEach(function(side){
      var web=document.createElement('div');web.className='ml-halloween-corner '+side;
      web.innerHTML=webSvg;layer.appendChild(web);
    });
    document.body.appendChild(layer);
    lastScroll=window.scrollY||0;accumulated=0;
  }
  function unmount(){if(layer){layer.remove();layer=null;}accumulated=0;}
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
    if(!layer||delta>innerHeight*2)return;
    accumulated+=delta;
    var now=performance.now();
    if(accumulated>=550&&now-lastFlight>=11000){accumulated=0;lastFlight=now;fly();}
  }
  var observer=new MutationObserver(function(records){
    if(records.some(function(r){return r.attributeName==='data-seasonal-theme';}))sync();
  });
  observer.observe(root,{attributes:true,attributeFilter:['data-seasonal-theme']});
  window.addEventListener('scroll',onScroll,{passive:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});
  else sync();
})();
